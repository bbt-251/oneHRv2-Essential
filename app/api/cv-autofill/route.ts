import { NextResponse } from "next/server";
import pdfParse from "pdf-parse-debugging-disabled";
import { OpenAI } from "openai";
import { gptModel } from "@/lib/util/gptModel";

export const runtime = "nodejs";

export async function POST(request: Request) {
    try {
        const formData = await request.formData();

        // Get yearsOfExperience and parse
        const yearsOfExperienceRaw = formData.get("yearsOfExperience")?.toString() || "[]";
        const yearsOfExperience: string[] = JSON.parse(yearsOfExperienceRaw);

        // Get levelOfEducations and parse
        const levelOfEducationsRaw = formData.get("levelOfEducations")?.toString() || "[]";
        const levelOfEducations: { id: string; name: string }[] = JSON.parse(levelOfEducationsRaw);

        // Get industries and parse
        const industriesRaw = formData.get("industries")?.toString() || "[]";
        const industries: { id: string; name: string }[] = JSON.parse(industriesRaw);

        // Get jobPost data and parse
        const jobPostRaw = formData.get("jobPost")?.toString() || "{}";
        const jobPost = JSON.parse(jobPostRaw);

        // Get the uploaded file
        const file = formData.get("file") as File | null;
        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        // Convert File to Buffer
        const arrayBuffer = await file.arrayBuffer();
        const fileBuffer = Buffer.from(arrayBuffer);
        // Parse PDF
        const pdfData = await pdfParse(fileBuffer);
        const cvText = pdfData.text;

        // Prepare GPT prompt
        const prompt = `
interface ProfessionalExperienceModel {
  companyName: string;
  title: string;
  startDate: string; // Must be MMMM DD, YYYY
  endDate: string; // Must be MMMM DD, YYYY
  currentlyWorking: boolean;
  mainActivities: string;
  reference: string | null;
}

interface EducationalExperienceModel {
  startDate: string; // Must be MMMM DD, YYYY
  endDate: string; // Must be MMMM DD, YYYY
  currentlyStudying: boolean;
  educationLevel: string; // ID from levelOfEducations
  title: string;
  school: string;
}

NB: if the endDate is not specified or it is an empty string or matches the value "present" or "Present", the endDate field must be set to null and currentlyWorking/currentlyStudying must be true. otherwise currentlyWorking/currentlyStudying field is false and the endDate is formatted as MMMM DD, YYYY

From the CV content below I want you to give me:
{
  professionalExperience: ProfessionalExperienceModel[],
  educationalExperience: EducationalExperienceModel[],
  yearsOfExperience: string,
  workExperienceSummary: string, // Generate a brief summary of the candidate's work experience as if you are the candidate
  industries: string[], // Select IDs from: ${JSON.stringify(industries)} based on experience mentioned
  skills: string[], // Extract all relevant skills mentioned in the CV
  certifications: string[], // Extract all certifications mentioned in the CV
  cvRating: {
    overallScore: number, // 0-10 score based on how well the CV matches the job requirements
    reasoning: string, // Brief explanation of the rating
    strengths: string[], // Key strengths that match the job
    weaknesses: string[] // Areas that could be improved for this job
  }
}

Include all that's written as it is.
(i.e. Choose years of experience from ${yearsOfExperience}, if it's clearly stated in the CV use that, otherwise infer it).
For educationLevel in educationalExperience, choose the ID from this list: ${JSON.stringify(levelOfEducations)} based on the education level mentioned.
For industries, only include IDs from the provided list where the candidate has experience.
For skills, extract all technical and soft skills mentioned.
For cvRating, evaluate the CV against this job posting:
- Job Title: ${jobPost.jobTitle || "Not specified"}
- Job Description: ${jobPost.jobDescription || "Not specified"}
- Requirements: ${jobPost.requirements ? jobPost.requirements.join(", ") : "Not specified"}
- Responsibilities: ${jobPost.responsibilities ? jobPost.responsibilities.join(", ") : "Not specified"}
- Required Experience: ${jobPost.yearsOfExperience || "Not specified"}
- Required Education: ${levelOfEducations.find(l => l.id == jobPost.levelOfEducation)?.name || "Not specified"}

Rate the CV, be very strict, on a scale of 0-10 based on how well it matches these job requirements. You must be very strict and consider experience relevance, skills match, education level, and overall fit.
If none is found you can return an empty array.
Return only the JSON object — no formatting and no explanation!

If any of the above models couldn't be satisfied do not include it in professionalExperience or educationalExperience!

CV Content: ${cvText}
    `.trim();

        // Call OpenAI
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        const response = await openai.chat.completions.create({
            model: gptModel,
            messages: [{ role: "user", content: prompt }],
        });

        const result = response.choices[0].message.content;

        return NextResponse.json({ result });
    } catch (error) {
        console.error("Error parsing CV:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function GET() {
    return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
