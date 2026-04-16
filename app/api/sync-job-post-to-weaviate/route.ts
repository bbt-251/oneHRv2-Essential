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
            console.log(`Resolved ${collectionName} ID ${id} to value:`, docSnap.data());
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
        console.log(`Fetching ${collectionName} ID ${id}: `, docSnap.data);
        if (docSnap.exists) {
            console.log(`Resolved ${collectionName} ID ${id} to value:`, docSnap.data());
            return docSnap.data()?.[field] || id;
        }
        return id;
    } catch (error) {
        console.error(`Error resolving ${collectionName} with ID ${id}:`, error);
        return id;
    }
}

export async function POST(req: NextRequest) {
    try {
        const { jobPost } = await req.json();
        console.log("Received job post data (raw):", JSON.stringify(jobPost, null, 2));

        // Resolve IDs to their human-readable values for certain hrSettings
        const resolvedJobPost: any = { ...jobPost };

        const idResolutions: Array<[string, string, string?]> = [
            ["levelOfEducation", "levelOfEducations"],
            ["yearsOfExperience", "yearsOfExperiences"],
            ["department", "departmentSettings"],
            ["currency", "currencies"],
        ];

        for (const [field, collection] of idResolutions) {
            if (jobPost[field]) {
                resolvedJobPost[field] = await resolveHrSettingValue(collection, jobPost[field]);
            }
        }

        // Screening question full resolution
        if (jobPost.useScreeningQuestions && jobPost.selectedScreeningQuestion) {
            try {
                const screeningDoc = await adminDb
                    .collection("screeningQuestions")
                    .doc(jobPost.selectedScreeningQuestion)
                    .get();
                if (screeningDoc.exists) {
                    const screeningData = screeningDoc.data();
                    resolvedJobPost.selectedScreeningQuestion =
                        screeningData?.name || jobPost.selectedScreeningQuestion;
                    // Attach the full object for downstream (Weaviate) ingestion
                    resolvedJobPost.screeningQuestionFull = {
                        id: screeningDoc.id,
                        ...screeningData,
                    };
                    // Provide a summarized, LLM friendly textual form (weights + question titles)
                    const mc = (screeningData?.multipleChoiceQuestions || []).map(
                        (q: any) => `${q.title} (MC, weight ${q.weight}%)`,
                    );
                    const sa = (screeningData?.shortAnswerQuestions || []).map(
                        (q: any) =>
                            `${q.title} (SA, weight ${q.weight}%, severity ${q.gradingSeverity})`,
                    );
                    resolvedJobPost.screeningQuestionSummary =
                        `Passing Score: ${screeningData?.passingScore}%. Timer: ${screeningData?.timerEnabled ? screeningData?.timer + " mins" : "none"}. Questions: ` +
                        [...mc, ...sa].join("; ");
                }
            } catch (e) {
                console.error("Error resolving full screening question object:", e);
            }
        }

        // Custom criteria full resolution (root collection: customCriteria)
        if (jobPost.useCustomCriteria && jobPost.selectedCriteriaSet) {
            try {
                const critDoc = await adminDb
                    .collection("customCriteria")
                    .doc(jobPost.selectedCriteriaSet)
                    .get();
                if (critDoc.exists) {
                    const critData = critDoc.data();
                    // Keep a user-friendly name in selectedCriteriaSet
                    resolvedJobPost.selectedCriteriaSet =
                        critData?.name || jobPost.selectedCriteriaSet;
                    // Attach id and full object for Weaviate ingestion
                    resolvedJobPost.customCriteriaId = critDoc.id;
                    resolvedJobPost.customCriteriaFull = { id: critDoc.id, ...critData };
                    const items = (critData?.criteria || []).map((c: any) => {
                        const base = `${c.name} (${c.type}${c.required ? ", required" : ""}`;
                        if (c.type === "select" && Array.isArray(c.options))
                            return `${base}, options ${c.options.length})`;
                        return base + ")";
                    });
                    resolvedJobPost.customCriteriaSummary = `Custom criteria: ${items.join("; ")}`;
                }
            } catch (e) {
                console.error("Error resolving full custom criteria object:", e);
            }
        }

        console.log(
            "Resolved job post data (with screening enrichment):",
            JSON.stringify(resolvedJobPost, null, 2),
        );
        await weaviateService.createJobPost(resolvedJobPost);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to sync job post to Weaviate:", error);
        return NextResponse.json({ error: "Failed to sync job post" }, { status: 500 });
    }
}

// export async function PUT(req: NextRequest) {
//     const { jobPostId, applicants } = await req.json();

//     try {
//         console.log(`Updating job post ${jobPostId} with applicants: ${applicants}`);
//         await weaviateService.updateJobPostApplicants(jobPostId, applicants);
//         return NextResponse.json({ success: true });
//     } catch (error) {
//         console.error('Failed to update job post applicants in Weaviate:', error);
//         return NextResponse.json({ error: 'Failed to update job post applicants' }, { status: 500 });
//     }
// }
