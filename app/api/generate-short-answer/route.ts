import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const { domain, wordLimit, levelOfComplexity, numberOfQuestions } = await request.json();
        const numQuestions = numberOfQuestions || 5;

        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        const prompt = `Generate exactly ${numQuestions} short-answer questions about ${domain} with complexity level ${levelOfComplexity} (on a 1-5 scale). Each question should be answerable within ${wordLimit} words or less. Return ONLY a JSON array of strings, where each string is a complete question. Do not include question numbers, bullet points, or any other formatting. Example format: ["What is...?", "How does...?", "Explain the...?"]`;

        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
        });

        const result = response.choices[0].message.content;

        // Try to parse as array, fallback to splitting by newlines
        let questions;
        try {
            questions = result ? JSON.parse(result) : [];
            // Ensure we have an array
            if (!Array.isArray(questions)) {
                throw new Error("Not an array");
            }
        } catch {
            // Fallback parsing
            questions = result
                ? result
                    .split("\n")
                    .map(q => q.trim())
                    .filter(Boolean)
                    .map(q => q.replace(/^\d+\.\s*/, "").replace(/^[-*]\s*/, ""))
                : [];
        }

        // Ensure we have the right number of questions
        questions = questions.slice(0, numQuestions);

        return NextResponse.json({ questions });
    } catch (error) {
        console.error("Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
