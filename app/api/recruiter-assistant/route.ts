import { NextRequest, NextResponse } from "next/server";
import { weaviateService } from "@/lib/backend/weaviate/weaviate-service";

export async function POST(req: NextRequest) {
    const { query, jobTitle } = await req.json();
    const prompt = `You are a recruiter assistant. Answer the following query related to job title ${jobTitle}: "${query}"`;
    console.log("Received prompt:", prompt);
    const response = await weaviateService.queryAgent(prompt);
    console.log("Weaviate response:", response);
    return NextResponse.json({ response });
}
