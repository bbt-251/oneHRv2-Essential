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
        const { jobApplication } = await req.json();
        console.log("Received job application data:", JSON.stringify(jobApplication, null, 2));

        const resolvedJobApplication: any = { ...jobApplication };

        // Fetch related docs up-front using raw IDs before we replace any labels
        const applicantDoc = jobApplication.applicantId
            ? await adminDb.collection("applicant").doc(jobApplication.applicantId).get()
            : null;
        const jobPostDoc = jobApplication.jobPostId
            ? await adminDb.collection("jobPost").doc(jobApplication.jobPostId).get()
            : null;

        // Keep IDs as IDs; expose human labels in separate fields
        if (jobApplication.applicantId) {
            const applicantFirst = await resolveValue(
                "applicant",
                jobApplication.applicantId,
                "firstName",
            );
            const applicantSurname = await resolveValue(
                "applicant",
                jobApplication.applicantId,
                "surname",
            );
            resolvedJobApplication.applicantFirstName = applicantFirst;
            resolvedJobApplication.applicantSurname = applicantSurname;
        }
        if (jobApplication.jobPostId) {
            resolvedJobApplication.jobTitle = await resolveValue(
                "jobPost",
                jobApplication.jobPostId,
                "title",
            );
        }
        // Enrich screening data (title + full + summary) for better LLM analysis
        if (jobApplication.screeningQuestionId) {
            // add a readable title (keep ID as-is)
            resolvedJobApplication.screeningQuestionTitle = await resolveValue(
                "screeningQuestions",
                jobApplication.screeningQuestionId,
                "name",
            );

            // attach full object & summary
            try {
                // Prefer embedded object if present
                let screeningFull = jobApplication.screeningQuestion;
                if (!screeningFull) {
                    const doc = await adminDb
                        .collection("screeningQuestions")
                        .doc(jobApplication.screeningQuestionId)
                        .get();
                    if (doc.exists) screeningFull = { id: doc.id, ...doc.data() } as any;
                }
                if (screeningFull) {
                    resolvedJobApplication.screeningQuestionFull = screeningFull;
                    const mc = (screeningFull.multipleChoiceQuestions || []).map(
                        (q: any) => `${q.title} (MC, weight ${q.weight}%)`,
                    );
                    const sa = (screeningFull.shortAnswerQuestions || []).map(
                        (q: any) =>
                            `${q.title} (SA, weight ${q.weight}%, severity ${q.gradingSeverity})`,
                    );
                    resolvedJobApplication.screeningQuestionSummary =
                        `Passing Score: ${screeningFull.passingScore}%. Timer: ${screeningFull.timerEnabled ? screeningFull.timer + " mins" : "none"}. Questions: ` +
                        [...mc, ...sa].join("; ");
                }
            } catch (e) {
                console.error("Failed to enrich screening question for application:", e);
            }
        }

        // Enrich custom criteria (title + full + summary)
        if (jobApplication.customCriteriaId) {
            resolvedJobApplication.customCriteriaTitle = await resolveValue(
                "customCriteria",
                jobApplication.customCriteriaId,
                "name",
            );
            try {
                let customCriteriaFull = jobApplication.customCriteria;
                if (!customCriteriaFull) {
                    const doc = await adminDb
                        .collection("customCriteria")
                        .doc(jobApplication.customCriteriaId)
                        .get();
                    if (doc.exists) customCriteriaFull = { id: doc.id, ...doc.data() } as any;
                }
                if (customCriteriaFull) {
                    resolvedJobApplication.customCriteriaFull = customCriteriaFull;
                    const items = (customCriteriaFull.criteria || []).map((c: any) => {
                        const base = `${c.name} (${c.type}${c.required ? ", required" : ""}`;
                        if (c.type === "select" && Array.isArray(c.options))
                            return `${base}, options ${c.options.length})`;
                        return base + ")";
                    });
                    resolvedJobApplication.customCriteriaSummary = `Custom criteria: ${items.join("; ")}`;
                }
            } catch (e) {
                console.error("Failed to enrich custom criteria for application:", e);
            }
        }

        // Build applicant answers summaries for LLM
        try {
            const sections = jobApplication.sections;
            if (sections) {
                const mcQs = sections.multipleChoice?.questions || [];
                const saQs = sections.shortAnswer?.questions || [];
                const mcSummary = mcQs
                    .map(
                        (q: any) =>
                            `MC: ${q.questionText} | selected=${q.selectedOptionIndex} | correct=${q.correctOptionIndex} | ${q.isCorrect ? "✓" : "✗"}`,
                    )
                    .join(" ; ");
                const saSummary = saQs
                    .map(
                        (q: any) =>
                            `SA: ${q.questionText} | score=${q.pointsAwarded} | limit=${q.wordLimit}`,
                    )
                    .join(" ; ");
                const scoreSummary = `MC score=${sections.multipleChoice?.score ?? 0} (weighted ${sections.multipleChoice?.weightedScore ?? 0}), SA score=${sections.shortAnswer?.score ?? 0} (weighted ${sections.shortAnswer?.weightedScore ?? 0}), final=${jobApplication.finalScore ?? 0}, passed=${jobApplication.passed ? "yes" : "no"}`;
                resolvedJobApplication.screeningAnswersSummary = `${scoreSummary}. ${mcSummary}${mcSummary && saSummary ? " ; " : ""}${saSummary}`;
                // preserve raw answers for indexing
                resolvedJobApplication.rawAnswers = jobApplication.rawAnswers ?? null;
            }
        } catch (e) {
            console.error("Failed to create screeningAnswersSummary:", e);
        }

        try {
            const critObj = jobApplication.customCriteria as any;
            const critAnswers = jobApplication.customCriteriaAnswers || {};
            if (critObj?.criteria?.length) {
                const nameById = new Map<string, string>(
                    critObj.criteria.map((c: any) => [c.id, c.name]),
                );
                const pairs = Object.entries(critAnswers).map(
                    ([id, value]) =>
                        `${nameById.get(id) || id}: ${Array.isArray(value) ? value.join(", ") : value}`,
                );
                resolvedJobApplication.customCriteriaAnswersSummary = pairs.join(" ; ");
            }
            // also preserve raw answers
            resolvedJobApplication.customCriteriaRawAnswers =
                jobApplication.customCriteriaRawAnswers ?? null;
        } catch (e) {
            console.error("Failed to create customCriteriaAnswersSummary:", e);
        }

        // Attach applicant snapshot (skills, certifications, languages, experiences, etc.)
        try {
            if (applicantDoc?.exists) {
                const a = applicantDoc.data() as any;
                resolvedJobApplication.applicantEmail = a.email || "";
                // Resolve level of education and years of experience from hrSettings
                resolvedJobApplication.applicantLevelOfEducation = a.levelOfEducation
                    ? await resolveHrSettingValue("levelOfEducations", a.levelOfEducation)
                    : "";
                resolvedJobApplication.applicantYearsOfExperience = a.yearsOfExperience
                    ? await resolveHrSettingValue("yearsOfExperiences", a.yearsOfExperience)
                    : "";
                resolvedJobApplication.applicantWorkExperienceSummary =
                    a.workExperienceSummary || "";
                resolvedJobApplication.applicantDesiredPosition = a.desiredPosition || "";
                resolvedJobApplication.applicantExpectedSalary = a.expectedSalary || "";
                resolvedJobApplication.applicantSkills = a.skills || [];
                resolvedJobApplication.applicantCertifications = a.certifications || [];
                // Resolve industries/categories from root collections; accept both singular/plural field names
                const industryIds: string[] = Array.isArray(a.industry)
                    ? a.industry
                    : Array.isArray(a.industries)
                        ? a.industries
                        : [];
                const categoryIds: string[] = Array.isArray(a.category)
                    ? a.category
                    : Array.isArray(a.categories)
                        ? a.categories
                        : [];
                resolvedJobApplication.applicantIndustries = await resolveMultipleRootValues(
                    "industries",
                    industryIds,
                );
                resolvedJobApplication.applicantCategories = await resolveMultipleRootValues(
                    "categories",
                    categoryIds,
                );
                resolvedJobApplication.applicantLanguages = Array.isArray(a.languages)
                    ? a.languages.map((l: any) => `${l.language} (${l.proficiency})`)
                    : [];
                // Format experiences similar to createApplicant
                resolvedJobApplication.applicantProfessionalExperiences = Array.isArray(
                    a.professionalExperiences,
                )
                    ? a.professionalExperiences.map(
                        (e: any) =>
                            `${e.title} at ${e.companyName}. ${e.mainActivities}. ${e.currentlyWorking ? "Currently working" : ""}`,
                    )
                    : [];
                resolvedJobApplication.applicantEducationExperiences = Array.isArray(
                    a.educationExperiences,
                )
                    ? a.educationExperiences.map(
                        (e: any) =>
                            `${e.title} from ${e.school}. Level: ${e.educationLevel}. ${e.currentlyStudying ? "Currently studying" : ""}`,
                    )
                    : [];
            }
        } catch (e) {
            console.error("Failed to attach applicant snapshot:", e);
        }

        // Attach job post snapshot for convenient analysis
        try {
            if (jobPostDoc?.exists) {
                const j = jobPostDoc.data() as any;
                // Flatten HTML description to plain text
                let jobDesc = "";
                try {
                    const parsed =
                        typeof j.jobDescription === "string"
                            ? JSON.parse(j.jobDescription)
                            : j.jobDescription;
                    jobDesc = parsed && parsed.html ? parsed.html : j.jobDescription || "";
                } catch {
                    jobDesc = j.jobDescription || "";
                }
                const plain = String(jobDesc)
                    .replace(/<[^>]*>/g, " ")
                    .replace(/\s+/g, " ")
                    .trim();
                resolvedJobApplication.jobTitle =
                    j.jobTitle || resolvedJobApplication.jobTitle || "";
                resolvedJobApplication.jobDepartment = j.department || "";
                resolvedJobApplication.jobLocation = j.location || "";
                resolvedJobApplication.jobLevelOfEducation = j.levelOfEducation || "";
                resolvedJobApplication.jobYearsOfExperience = j.yearsOfExperience || "";
                resolvedJobApplication.jobRequirements = j.requirements || [];
                resolvedJobApplication.jobResponsibilities = j.responsibilities || [];
                resolvedJobApplication.jobBenefits = j.benefits || [];
                resolvedJobApplication.jobWorkMode = j.workMode || "";
                resolvedJobApplication.jobEmploymentType = j.employmentType || "";
                resolvedJobApplication.jobCurrency = j.currency || "";
                resolvedJobApplication.jobMinSalary = j.minSalary || "";
                resolvedJobApplication.jobMaxSalary = j.maxSalary || "";
                resolvedJobApplication.jobSalaryType = j.salaryType || "";
                resolvedJobApplication.jobDescription = plain;
            }
        } catch (e) {
            console.error("Failed to attach job post snapshot:", e);
        }

        console.log(
            "Resolved job application data:",
            JSON.stringify(resolvedJobApplication, null, 2),
        );

        console.log("Calling weaviateService.createJobApplication...");
        await weaviateService.createJobApplication(resolvedJobApplication);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to sync job application to Weaviate:", error);
        return NextResponse.json({ error: "Failed to sync job application" }, { status: 500 });
    }
}
