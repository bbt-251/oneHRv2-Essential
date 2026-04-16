import { weaviateService } from "@/lib/backend/weaviate/weaviate-service";
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/backend/firebase/admin-collections";

// Helper to resolve IDs from hrSettings subcollections
async function resolveHrSettingValue(collectionName: string, id: string): Promise<string> {
    if (!id) return "";
    try {
        const docRef = adminDb
            .collection("hrSettings")
            .doc("main")
            .collection(collectionName)
            .doc(id);
        const docSnap = await docRef.get();
        if (docSnap.exists) {
            return docSnap.data()?.name || id;
        }
        return id;
    } catch (error) {
        console.error(`Error resolving hrSetting ${collectionName} with ID ${id}:`, error);
        return id;
    }
}

// Helper to resolve IDs from root collections
async function resolveValue(
    collectionName: string,
    id: string,
    field: string = "name",
): Promise<string> {
    if (!id) return "";
    try {
        const docRef = adminDb.collection(collectionName).doc(id);
        const docSnap = await docRef.get();
        if (docSnap.exists) {
            return docSnap.data()?.[field] || id;
        }
        return id;
    } catch (error) {
        console.error(`Error resolving ${collectionName} with ID ${id}:`, error);
        return id;
    }
}

// Helper to resolve an array of IDs from root collections
async function resolveMultipleRootValues(collectionName: string, ids: string[]): Promise<string[]> {
    if (!ids || ids.length === 0) return [];
    try {
        const resolvedValues = await Promise.all(ids.map(id => resolveValue(collectionName, id)));
        return resolvedValues;
    } catch (error) {
        console.error(`Error resolving multiple values from ${collectionName}:`, error);
        return ids;
    }
}

export async function POST(req: NextRequest) {
    try {
        const { applicant, useEnhancedPipeline = true } = await req.json();

        if (useEnhancedPipeline) {
            // Use new enhanced ingestion pipeline
            const { ingestionService } = await import("@/lib/backend/weaviate/ingestion-service");
            const result = await ingestionService.syncApplicant(applicant.id, "create", {
                skipEnrichment: false,
                skipChunking: false,
                skipMatchingScores: false,
            });

            if (!result.success) {
                return NextResponse.json(
                    { error: result.error || "Failed to sync applicant" },
                    { status: 500 },
                );
            }

            return NextResponse.json({ success: true, weaviateId: result.weaviateId });
        }

        // Legacy pipeline (for backward compatibility)
        console.log("Received applicant data:", JSON.stringify(applicant, null, 2));

        const resolvedApplicant = { ...applicant };

        if (applicant.levelOfEducation) {
            resolvedApplicant.levelOfEducation = await resolveHrSettingValue(
                "levelOfEducations",
                applicant.levelOfEducation,
            );
        }
        if (applicant.yearsOfExperience) {
            resolvedApplicant.yearsOfExperience = await resolveHrSettingValue(
                "yearsOfExperiences",
                applicant.yearsOfExperience,
            );
        }
        // Resolve industries/categories regardless of plural/singular field name and store back to the fields used by Weaviate mapping
        const industryIds: string[] = Array.isArray(applicant.industry)
            ? applicant.industry
            : Array.isArray(applicant.industries)
                ? applicant.industries
                : [];
        const categoryIds: string[] = Array.isArray(applicant.category)
            ? applicant.category
            : Array.isArray(applicant.categories)
                ? applicant.categories
                : [];
        if (industryIds.length) {
            const industryNames = await resolveMultipleRootValues("industries", industryIds);
            resolvedApplicant.industry = industryNames;
            resolvedApplicant.industries = industryNames;
        }
        if (categoryIds.length) {
            const categoryNames = await resolveMultipleRootValues("categories", categoryIds);
            resolvedApplicant.category = categoryNames;
            resolvedApplicant.categories = categoryNames;
        }

        console.log("Resolved applicant data:", JSON.stringify(resolvedApplicant, null, 2));

        console.log("Calling weaviateService.createApplicant...");
        const jobPostId = applicant.jobPostId || resolvedApplicant.jobPostId || "";
        await weaviateService.createApplicant(resolvedApplicant as any, jobPostId);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to sync applicant to Weaviate:", error);
        return NextResponse.json({ error: "Failed to sync applicant" }, { status: 500 });
    }
}
