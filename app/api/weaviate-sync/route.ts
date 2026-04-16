/**
 * Weaviate Sync API Route
 *
 * Manual/scheduled sync endpoint for syncing Firebase data to Weaviate.
 * Can sync individual documents or entire collections.
 */

import { NextRequest, NextResponse } from "next/server";
import { ingestionService } from "@/lib/backend/weaviate/ingestion-service";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            collection,
            operation = "create",
            documentIds,
            syncAll = false,
            options = {},
        } = body;

        if (!collection || !["applicant", "jobPost", "jobApplication"].includes(collection)) {
            return NextResponse.json(
                { error: "Invalid collection. Must be: applicant, jobPost, or jobApplication" },
                { status: 400 },
            );
        }

        // Sync all documents in collection
        if (syncAll) {
            const result = await ingestionService.syncAll(collection as any, options);
            return NextResponse.json({
                success: true,
                collection,
                operation,
                ...result,
            });
        }

        // Sync specific documents
        if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
            return NextResponse.json(
                { error: "documentIds array is required when syncAll is false" },
                { status: 400 },
            );
        }

        const results = await ingestionService.batchSync(
            collection as any,
            documentIds,
            operation as "create" | "update",
            options,
        );

        const succeeded = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;

        return NextResponse.json({
            success: true,
            collection,
            operation,
            total: documentIds.length,
            succeeded,
            failed,
            results,
        });
    } catch (error: any) {
        console.error("Weaviate sync error:", error);
        return NextResponse.json(
            {
                error: error.message || "Failed to sync to Weaviate",
                details: process.env.NODE_ENV === "development" ? error.stack : undefined,
            },
            { status: 500 },
        );
    }
}

/**
 * GET endpoint for health check and status
 */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const collection = searchParams.get("collection");

    return NextResponse.json({
        service: "Weaviate Sync API",
        status: "active",
        endpoints: {
            POST: "/api/weaviate-sync",
            description: "Sync Firebase data to Weaviate",
            body: {
                collection: "applicant | jobPost | jobApplication",
                operation: "create | update",
                documentIds: "string[] (optional if syncAll=true)",
                syncAll: "boolean",
                options: {
                    skipEnrichment: "boolean",
                    skipChunking: "boolean",
                    skipMatchingScores: "boolean",
                    batchSize: "number",
                },
            },
            examples: {
                syncAll: {
                    collection: "applicant",
                    syncAll: true,
                },
                syncSpecific: {
                    collection: "applicant",
                    documentIds: ["id1", "id2"],
                    operation: "update",
                },
            },
        },
        collection: collection || "none specified",
    });
}
