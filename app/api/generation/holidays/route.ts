// app/api/holidays/route.ts
import OpenAI from "openai";
import { gptModel } from "@/lib/util/gptModel";

export interface HolidayModel {
    name: string;
    date: string;
}

export async function POST(req: Request) {
    try {
        const { year, country } = await req.json();

        if (!year || !country) {
            return new Response(JSON.stringify({ error: "Year and country are required" }), {
                status: 400,
            });
        }

        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        const prompt = `Generate a list of all public holidays for ${country} in the year ${year}. Format the response as an array of objects with the following structure: { "name": "Holiday Name", "date": "YYYY-MM-DD" }. Don't return JSON, just the list of objects. No extra text!`;

        const response = await openai.chat.completions.create({
            model: gptModel,
            messages: [{ role: "user", content: prompt }],
        });
        const gptOutput = response.choices[0].message?.content;

        let holidays: HolidayModel[] = [];
        try {
            holidays = JSON.parse(gptOutput || "[]");
        } catch (err) {
            console.error("Failed to parse GPT response:", err);
            return new Response(JSON.stringify({ error: "Failed to parse GPT response" }), {
                status: 500,
            });
        }

        return new Response(JSON.stringify(holidays), { status: 200 });
    } catch (error) {
        console.error("Error:", error);
        return new Response(JSON.stringify({ error: "Internal server error" }), {
            status: 500,
        });
    }
}
