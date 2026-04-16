import { weaviateService } from "@/lib/backend/weaviate/weaviate-service";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { jobApplication } = await req.json();
        console.log("Received job application data:", JSON.stringify(jobApplication, null, 2));

        console.log("Calling weaviateService.createJobApplication...");
        await weaviateService.createJobApplication(jobApplication);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to sync job application to Weaviate:", error);
        return NextResponse.json({ error: "Failed to sync job application" }, { status: 500 });
    }
}
