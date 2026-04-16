// /app/api/evaluate-short-answers/route.ts

import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { adminDb } from "@/lib/backend/firebase/admin-collections";
import { weaviateService } from "@/lib/backend/weaviate/weaviate-service";

dayjs.extend(utc);

const gptModel = "gpt-4o-mini";

// Input body can be either the legacy array of short-answer questions OR
// an extended object containing full exam context to update the job application.
interface LegacyShortAnswerItem {
    id: string;
    question: string;
    answer: string;
    gradingSeverity: number;
}

interface ExtendedRequestBody {
    jobApplicationId: string;
    applicantId: string;
    jobPostId: string;
    screeningQuestion: {
        id: string;
        passingScore: number;
        multipleChoiceQuestions: {
            id: string;
            weight: number;
            question: string;
            choices: string[];
            correctAnswerIndex: number;
        }[];
        shortAnswerQuestions: {
            id: string;
            weight: number;
            question: string;
            gradingSeverity: number;
            wordLimit: number;
        }[];
        timerEnabled?: boolean;
        timer?: number;
    } | null;
    answers: Record<string, number | string>; // composite keys modelId--questionId or plain question id for short answers
    startTime?: string; // formatted string
    timeLeftSeconds?: number;
    customCriteriaAnswers?: Record<string, string> | null;
    customCriteriaRawAnswers?: Record<string, any> | null;
    syncToWeaviate?: boolean;
}

function buildAIPrompt(items: LegacyShortAnswerItem[]): string {
    return `You are an expert grader. For each question and answer below, grade the answer out of 100 (integer only, no feedback) based on correctness, completeness, and the grading severity (1=easy, 5=very strict). Return a JSON array of objects with id, score, and gradingSeverity.\n\n${items.map((q, i) => `Q${i + 1} (Severity ${q.gradingSeverity}): ${q.question}\nA${i + 1}: ${q.answer}`).join("\n\n")}\n\nReturn format: [{"id": "q1", "score": 85, "gradingSeverity": 2}, ...]`;
}

async function gradeShortAnswers(
    items: LegacyShortAnswerItem[],
): Promise<{ id: string; score: number; gradingSeverity: number }[]> {
    if (!items.length) return [];
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const prompt = buildAIPrompt(items);
    const response = await openai.chat.completions.create({
        model: gptModel,
        messages: [
            { role: "system", content: "You are a grading assistant." },
            { role: "user", content: prompt },
        ],
        temperature: 0,
        max_tokens: 500,
    });
    const responseText = response.choices[0].message.content || "";
    const match = responseText.match(/\[[\s\S]*\]/);
    if (!match) throw new Error("Failed to parse AI response");
    let scores: any[] = [];
    try {
        scores = JSON.parse(match[0]);
    } catch {
        throw new Error("Invalid JSON from AI");
    }
    return items.map(q => {
        const found = scores.find(s => s.id === q.id);
        return { id: q.id, score: found ? found.score : 0, gradingSeverity: q.gradingSeverity };
    });
}

function calculateUpdatedSections(
    screeningQuestion: ExtendedRequestBody["screeningQuestion"],
    answers: Record<string, number | string>,
    aiScores: { id: string; score: number; gradingSeverity: number }[],
) {
    if (!screeningQuestion)
        return { sections: null, finalScore: null, passed: null, passingScore: null };
    // Multiple choice section
    const mcQuestions: any[] = [];
    let mcCorrectCount = 0;
    let mcTotalCount = 0;
    screeningQuestion.multipleChoiceQuestions.forEach(q => {
        mcTotalCount++;
        // MC answers stored with composite key modelId--questionId OR plain id fallback
        const userAnswer = answers[q.id] as number | undefined; // assume plain id mapping
        const isCorrect = userAnswer !== undefined && userAnswer === q.correctAnswerIndex;
        if (isCorrect) mcCorrectCount++;
        mcQuestions.push({
            id: q.id,
            modelId: "mc",
            questionText: q.question,
            selectedOptionIndex: userAnswer ?? -1,
            correctOptionIndex: q.correctAnswerIndex ?? -1,
            options: q.choices,
            isCorrect,
            pointsAwarded: isCorrect ? 1 : 0,
        });
    });
    const mcWeight = screeningQuestion.multipleChoiceQuestions.reduce(
        (sum, q) => sum + (q.weight || 0),
        0,
    );
    const mcScore = mcTotalCount > 0 ? (mcCorrectCount / mcTotalCount) * 100 : 0;
    const mcWeightedScore = (mcScore * mcWeight) / 100;

    // Short answer section
    const saQuestions: any[] = [];
    let saTotalCount = 0;
    let saScoreSum = 0;
    screeningQuestion.shortAnswerQuestions.forEach(q => {
        saTotalCount++;
        const found = aiScores.find(s => s.id === q.id);
        const aiScore = found ? found.score : 0;
        saScoreSum += aiScore;
        const answerText = (answers[q.id] as string | undefined) || "";
        saQuestions.push({
            id: q.id,
            modelId: "sa",
            questionText: q.question,
            answerText,
            wordLimit: q.wordLimit,
            gradingSeverity: q.gradingSeverity,
            pointsAwarded: aiScore,
        });
    });
    const saWeight = screeningQuestion.shortAnswerQuestions.reduce(
        (sum, q) => sum + (q.weight || 0),
        0,
    );
    const saScore = saTotalCount > 0 ? saScoreSum / saTotalCount : 0;
    const saWeightedScore = (saScore * saWeight) / 100;

    const finalScore = mcWeightedScore + saWeightedScore;
    const passingScore = screeningQuestion.passingScore;
    return {
        sections: {
            multipleChoice: {
                score: mcScore,
                weightedScore: mcWeightedScore,
                maxPossible: mcTotalCount,
                weight: mcWeight,
                questions: mcQuestions,
            },
            shortAnswer: {
                score: saScore,
                weightedScore: saWeightedScore,
                maxPossible: saTotalCount,
                weight: saWeight,
                questions: saQuestions,
            },
        },
        finalScore,
        passingScore,
        passed: finalScore >= passingScore,
    };
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Legacy mode: body is an array of short-answer items; just grade and return scores
        if (Array.isArray(body)) {
            const legacyItems: LegacyShortAnswerItem[] = body;
            const graded = await gradeShortAnswers(legacyItems);
            return NextResponse.json(graded, { status: 200 });
        }

        const extended = body as ExtendedRequestBody;
        if (!extended.jobApplicationId || !extended.applicantId) {
            return NextResponse.json(
                { error: "Missing jobApplicationId or applicantId" },
                { status: 400 },
            );
        }

        const shortAnswerItems: LegacyShortAnswerItem[] = (
            extended.screeningQuestion?.shortAnswerQuestions || []
        ).map(q => ({
            id: q.id,
            question: q.question,
            answer: String(extended.answers[q.id] || ""),
            gradingSeverity: q.gradingSeverity || 1,
        }));

        let aiScores: { id: string; score: number; gradingSeverity: number }[] = [];
        try {
            aiScores = await gradeShortAnswers(shortAnswerItems);
        } catch (e) {
            console.error("AI grading failed, defaulting scores to 0:", e);
            aiScores = shortAnswerItems.map(q => ({
                id: q.id,
                score: 0,
                gradingSeverity: q.gradingSeverity,
            }));
        }

        const { sections, finalScore, passed, passingScore } = calculateUpdatedSections(
            extended.screeningQuestion,
            extended.answers,
            aiScores,
        );

        const endTime = dayjs().utc().toISOString();
        const startTime = extended.startTime || endTime;
        const totalDurationMs = dayjs(endTime).diff(dayjs(startTime));
        const totalDuration = dayjs.utc(totalDurationMs).format("HH:mm:ss");

        // Build update payload
        const updatePayload: any = {
            id: extended.jobApplicationId,
            applicantId: extended.applicantId,
            jobPostId: extended.jobPostId,
            screeningQuestionId: extended.screeningQuestion?.id || null,
            sections,
            finalScore,
            passingScore,
            passed,
            rawAnswers: extended.answers,
            timeLeftSeconds: extended.timeLeftSeconds ?? null,
            timerEnabled: extended.screeningQuestion?.timerEnabled || false,
            totalDuration,
            submittedAt: endTime,
            startedAt: startTime,
            customCriteriaAnswers: extended.customCriteriaAnswers || null,
            customCriteriaRawAnswers: extended.customCriteriaRawAnswers || null,
        };

        // Update Firestore job application document
        try {
            await adminDb
                .collection("jobApplication")
                .doc(extended.jobApplicationId)
                .update(updatePayload);
        } catch (e) {
            console.error("Failed to update job application:", e);
            return NextResponse.json(
                { error: "Failed to update job application" },
                { status: 500 },
            );
        }

        // Fetch enriched job application for optional sync
        let synced = false;
        if (extended.syncToWeaviate) {
            try {
                const docSnap = await adminDb
                    .collection("jobApplication")
                    .doc(extended.jobApplicationId)
                    .get();
                if (docSnap.exists) {
                    const jobApplicationData = { id: extended.jobApplicationId, ...docSnap.data() };
                    // Reuse existing sync route for full enrichment (applicant + job snapshots)
                    await fetch(
                        `${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/sync-job-application-to-weaviate`,
                        {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ jobApplication: jobApplicationData }),
                        },
                    );
                    synced = true;
                }
            } catch (e) {
                console.error("Weaviate sync failed:", e);
            }
        }

        return NextResponse.json({
            success: true,
            updated: updatePayload,
            aiScores,
            synced,
        });
    } catch (error) {
        console.error("Error evaluating and updating short answers:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
