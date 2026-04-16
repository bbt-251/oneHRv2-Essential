// app/api/objective/route.ts
import { gptModel } from "@/lib/util/gptModel";
import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: Request) {
    try {
        const { objectiveTitle } = await req.json();

        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        const prompt = `For the objective title '${objectiveTitle}', generate SMART (Specific, Measurable, Achievable, Relevant, Time-bound) texts in a text format! Do not have numbers in-front of the answers. Separate each by new line.`;

        const response = await openai.chat.completions.create({
            model: gptModel,
            messages: [{ role: "user", content: prompt }],
        });

        const result = response.choices[0].message?.content;

        return NextResponse.json({ result });
    } catch (error) {
        console.error("Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
