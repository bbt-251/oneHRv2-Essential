import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const { domain, numberOfChoices, levelOfComplexity, numberOfQuestions } =
            await request.json();
        const numQuestions = numberOfQuestions || 6;

        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        const prompt = `Generate exactly ${numQuestions} multiple-choice questions about ${domain} with complexity level ${levelOfComplexity} (on a 1-5 scale). Each question should have exactly ${numberOfChoices} answer choices. Return ONLY a JSON array of objects with the following structure: [{"question": "Question text?", "choices": ["Choice 1", "Choice 2", "Choice 3", "Choice 4"], "correctAnswerIndex": 0}]. The correctAnswerIndex should be a 0-based number indicating which choice is correct. Do not include any other text or formatting.`;

        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
        });

        const result = response.choices[0].message.content;

        // Try to parse as JSON array, fallback to empty array
        let questions;
        try {
            questions = result ? JSON.parse(result) : [];
            // Ensure we have an array
            if (!Array.isArray(questions)) {
                throw new Error("Not an array");
            }
            // Validate question structure
            questions = questions.filter(
                q =>
                    q &&
                    typeof q.question === "string" &&
                    Array.isArray(q.choices) &&
                    q.choices.length >= 2 &&
                    typeof q.correctAnswerIndex === "number" &&
                    q.correctAnswerIndex >= 0 &&
                    q.correctAnswerIndex < q.choices.length,
            );
        } catch {
            // Fallback: return empty array if parsing fails
            questions = [];
        }

        // Ensure we have the right number of questions
        questions = questions.slice(0, numQuestions);

        return NextResponse.json({ questions });
    } catch (error) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
