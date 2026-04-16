// /app/api/evaluate-quiz/route.ts

import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";

const gptModel = "gpt-4o-mini";

export async function POST(req: NextRequest) {
    try {
        const questions: { id: string; question: string; answer: string }[] = await req.json();

        if (!Array.isArray(questions)) {
            return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
        }

        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const prompt = `You are an expert grader. For each question and answer below, grade the answer out of 100 (integer only, no feedback) based on correctness and completeness. Return a JSON array of objects with id and score.\n\n${questions
            .map(q => `Q (${q.id}): ${q.question}\nA: ${q.answer}`)
            .join(
                "\n\n",
            )}\n\nReturn format: [{\"id\": \"${questions[0]?.id}\", \"score\": 85}, ...]`;

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
        // Try to extract the JSON array from the response
        const match = responseText.match(/\[[\s\S]*\]/);
        if (!match) {
            return NextResponse.json(
                { error: "Failed to parse AI response", raw: responseText },
                { status: 500 },
            );
        }
        const scores = JSON.parse(match[0]);
        // Ensure id matches
        const result = questions.map(q => {
            const found = scores.find((s: any) => s.id === q.id);
            return {
                id: q.id,
                score: found ? found.score : 0,
            };
        });
        return NextResponse.json(result, { status: 200 });
    } catch (error) {
        console.error("Error evaluating quiz short answers:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
