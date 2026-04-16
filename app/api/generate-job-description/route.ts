import { gptModel } from "@/lib/util/gptModel";
import { NextResponse } from "next/server";
import OpenAI from "openai";

// Request interface
interface JobDescriptionRequest {
    jobTitle: string;
    levelOfEducation: string;
    yearsOfExperience: string;
    jobLevel: string;
    department: string;
}

// Response interface
interface JobDescriptionResponse {
    success: boolean;
    jobDescription?: string;
    requirements?: string[];
    responsibilities?: string[];
    benefits?: string[];
    error?: string;
}

export async function POST(req: Request) {
    try {
        const body: JobDescriptionRequest = await req.json();
        const { jobTitle, levelOfEducation, yearsOfExperience, jobLevel, department } = body;

        // Validate required fields
        const missingFields: string[] = [];
        if (!jobTitle?.trim()) missingFields.push("Job Title");
        if (!levelOfEducation?.trim()) missingFields.push("Level of Education");
        if (!yearsOfExperience?.trim()) missingFields.push("Years of Experience");
        if (!jobLevel?.trim()) missingFields.push("Job Level");
        if (!department?.trim()) missingFields.push("Department");

        if (missingFields.length > 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: `Missing required fields: ${missingFields.join(", ")}`,
                } as JobDescriptionResponse,
                { status: 400 },
            );
        }

        // Initialize OpenAI
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        // Create comprehensive prompt for job description generation
        const prompt = `Generate a comprehensive and professional job description for the following position:

**Position Details:**
- Job Title: ${jobTitle}
- Department: ${department}
- Seniority Level: ${jobLevel}
- Required Education: ${levelOfEducation}
- Required Experience: ${yearsOfExperience} years

**Requirements:**
Please return the response as a JSON object with the following structure:
{
  "jobDescription": "HTML formatted job summary and overview",
  "responsibilities": ["responsibility 1", "responsibility 2", "responsibility 3", ...],
  "requirements": ["requirement 1", "requirement 2", "requirement 3", ...],
  "benefits": ["benefit 1", "benefit 2", "benefit 3", ...]
}

**Content Guidelines:**
1. **Job Description**: Write a compelling overview in HTML format using <p> tags
2. **Responsibilities**: Generate 6-8 key responsibilities as plain text strings (no HTML)
3. **Requirements**: Generate 5-7 requirements including education, experience, and skills as plain text strings
4. **Benefits**: Generate 4-6 attractive benefits/perks as plain text strings

**Content Requirements:**
- Make content specific to the ${jobLevel} level
- Appropriate for the ${department} department  
- Tailored to require ${levelOfEducation} and ${yearsOfExperience} years of experience
- Professional, engaging, and industry-standard
- Avoid discriminatory language
- Use modern, competitive language that attracts top talent

**Important**: Return ONLY the JSON object, no additional text or formatting.`;

        // Generate job description using OpenAI
        const response = await openai.chat.completions.create({
            model: gptModel,
            messages: [
                {
                    role: "system",
                    content:
                        "You are an expert HR professional and job description writer. Generate comprehensive, professional job descriptions in HTML format.",
                },
                {
                    role: "user",
                    content: prompt,
                },
            ],
            max_tokens: 1500,
            temperature: 0.7,
        });

        const generatedContent = response.choices[0].message?.content;

        if (!generatedContent) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Failed to generate job description. Please try again.",
                } as JobDescriptionResponse,
                { status: 500 },
            );
        }

        try {
            // Clean up the generated content (remove any markdown code blocks if present)
            let cleanedContent = generatedContent
                .replace(/```json\n?/g, "")
                .replace(/```\n?/g, "")
                .trim();

            // Parse the JSON response
            const parsedData = JSON.parse(cleanedContent);

            // Validate the structure
            if (
                !parsedData.jobDescription ||
                !Array.isArray(parsedData.responsibilities) ||
                !Array.isArray(parsedData.requirements)
            ) {
                throw new Error("Invalid response structure from AI");
            }

            return NextResponse.json({
                success: true,
                jobDescription: parsedData.jobDescription,
                responsibilities: parsedData.responsibilities || [],
                requirements: parsedData.requirements || [],
                benefits: parsedData.benefits || [],
            } as JobDescriptionResponse);
        } catch (parseError) {
            console.error("Error parsing AI response:", parseError);

            // Fallback: treat as plain text job description
            let fallbackContent = generatedContent.trim();
            if (!fallbackContent.startsWith("<")) {
                fallbackContent = `<p>${fallbackContent}</p>`;
            }

            return NextResponse.json({
                success: true,
                jobDescription: fallbackContent,
                responsibilities: [],
                requirements: [],
                benefits: [],
            } as JobDescriptionResponse);
        }
    } catch (error) {
        console.error("Error generating job description:", error);

        // Handle specific OpenAI errors
        if (error instanceof Error) {
            if (error.message.includes("API key")) {
                return NextResponse.json(
                    {
                        success: false,
                        error: "AI service configuration error. Please contact support.",
                    } as JobDescriptionResponse,
                    { status: 500 },
                );
            }

            if (error.message.includes("rate limit")) {
                return NextResponse.json(
                    {
                        success: false,
                        error: "AI service is temporarily busy. Please try again in a moment.",
                    } as JobDescriptionResponse,
                    { status: 429 },
                );
            }
        }

        return NextResponse.json(
            {
                success: false,
                error: "Failed to generate job description. Please try again.",
            } as JobDescriptionResponse,
            { status: 500 },
        );
    }
}
