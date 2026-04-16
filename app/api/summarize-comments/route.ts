import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
    try {
        const { orderGuide } = await req.json();

        if (!orderGuide) {
            return NextResponse.json({ error: "Order guide data is required" }, { status: 400 });
        }

        const employeeFeedback = orderGuide.associatedEmployees
            .map((emp: { uid: string; rating: number | null; comment: string | null }) => {
                let feedback = `Employee UID: ${emp.uid}`;
                if (emp.rating) {
                    feedback += `, Rating: ${emp.rating}/5`;
                }
                if (emp.comment) {
                    feedback += `, Comment: "${emp.comment}"`;
                }
                return feedback;
            })
            .join("\n");

        const hasFeedback = orderGuide.associatedEmployees.some(
            (emp: { rating: number | null; comment: string | null }) => emp.rating || emp.comment,
        );

        const guideContent = `
            Guide Name: ${orderGuide.orderGuideName}
            Description: ${orderGuide.description}
            Employee Feedback:
            ${hasFeedback ? employeeFeedback : "No feedback was provided for this guide."}
        `;

        const prompt = `Summarize the following order guide and its employee feedback in a few sentences. Identify the key themes and overall sentiment. If no feedback is available, summarize the guide's content and state that no employee feedback has been submitted yet:\n\n${guideContent}`;

        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 150,
        });

        const summary = response.choices[0]?.message?.content?.trim();

        if (!summary) {
            return NextResponse.json({ error: "Failed to generate summary" }, { status: 500 });
        }

        return NextResponse.json({ summary });
    } catch (error) {
        console.error("Error generating summary:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
