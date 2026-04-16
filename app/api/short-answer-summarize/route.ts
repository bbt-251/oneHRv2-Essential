import { gptModel } from "@/lib/util/gptModel";
import OpenAI from "openai";

export async function POST(req: Request) {
    try {
        const { shortAnswers } = await req.json();

        // Initialize OpenAI with API key
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY!,
        });

        // Collect all user answers into a single string
        const allAnswers = shortAnswers;

        // Create prompt
        const prompt = `Summarize the following surveys into a single paragraph of 5 to 10 sentences, ensuring all core ideas are preserved and accurately represented. Source:\n${allAnswers}`;

        // Generate completion
        const response = await openai.chat.completions.create({
            model: gptModel,
            messages: [{ role: "user", content: prompt }],
        });

        const result = response.choices[0].message?.content;

        return Response.json({ result });
    } catch (error) {
        console.error("Error:", error);
        return Response.json({ error: "Internal server error" }, { status: 500 });
    }
}
