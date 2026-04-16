import { NextRequest, NextResponse } from "next/server";
import { getJobPostById } from "@/lib/backend/api/talent-acquisition/job-post-service";
import { hrSettingsService } from "@/lib/backend/firebase/hrSettingsService";
import { CompanyInfoModel } from "@/lib/models/companyInfo";

interface JobMetadataResponse {
    jobTitle: string;
    department: string;
    location: string;
    employmentType: string;
    jobLevel: string;
    workMode: string;
    salaryRange: string;
    levelOfEducation: string;
    yearsOfExperience: string;
    applicationDeadline: string;
    applicants: number;
    status: string;
    companyName: string;
    companyUrl: string | null;
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const jobId = searchParams.get("id");

        if (!jobId) {
            return NextResponse.json({ error: "Job ID is required" }, { status: 400 });
        }

        // Fetch job post
        const jobPost = await getJobPostById(jobId);

        if (!jobPost) {
            return NextResponse.json({ error: "Job not found" }, { status: 404 });
        }

        // Fetch company info
        let companyName = "oneHR";
        let companyUrl: string | null = null;

        try {
            const companyInfos = await hrSettingsService.getAll("companyInfo");
            if (companyInfos && companyInfos.length > 0) {
                const companyInfo = companyInfos[0] as CompanyInfoModel & { id: string };
                companyName = companyInfo.companyName || "oneHR";
                companyUrl = companyInfo.companyUrl || null;
            }
        } catch (companyError) {
            console.warn("Failed to fetch company info:", companyError);
            // Use default company name if fetch fails
        }

        // Format salary range
        let salaryRange = "";
        if (jobPost.minSalary && jobPost.maxSalary) {
            const currency = jobPost.currency || "";
            salaryRange = `${currency}${jobPost.minSalary} - ${currency}${jobPost.maxSalary} ${jobPost.salaryType || ""}`;
        }

        // Build metadata response
        const metadata: JobMetadataResponse = {
            jobTitle: jobPost.jobTitle,
            department: jobPost.department,
            location: jobPost.location,
            employmentType: jobPost.employmentType,
            jobLevel: jobPost.jobLevel || "",
            workMode: jobPost.workMode || "",
            salaryRange: salaryRange,
            levelOfEducation: jobPost.levelOfEducation,
            yearsOfExperience: jobPost.yearsOfExperience,
            applicationDeadline: jobPost.applicationDeadline,
            applicants: jobPost.applicants || 0,
            status: jobPost.status,
            companyName: companyName,
            companyUrl: companyUrl,
        };

        return NextResponse.json(metadata);
    } catch (error) {
        console.error("Error fetching job metadata:", error);
        return NextResponse.json({ error: "Failed to fetch job metadata" }, { status: 500 });
    }
}
