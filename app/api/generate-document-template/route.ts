import { gptModel } from "@/lib/util/gptModel";
import { NextResponse } from "next/server";
import OpenAI from "openai";

// Request interface
interface DocumentTemplateRequest {
    templateType:
        | "promotion"
        | "exit"
        | "talent_acquisition_interview"
        | "talent_acquisition_offer";
}

// Response interface
interface DocumentTemplateResponse {
    success: boolean;
    templateContent?: string;
    error?: string;
}

// Dynamic fields for each template type
const templateFields: Record<string, string[]> = {
    promotion: [
        "{promotionID}",
        "{promotionName}",
        "{employeeName}",
        "{employeeID}",
        "{currentPosition}",
        "{newPosition}",
        "{currentGrade}",
        "{newGrade}",
        "{currentStep}",
        "{newStep}",
        "{currentSalary}",
        "{newSalary}",
        "{currentEntitlementDays}",
        "{newEntitlementDays}",
        "{period}",
        "{evaluationCycle}",
        "{promotionReason}",
        "{applicationDate}",
        "{department}",
        "{companyName}",
    ],
    exit: [
        "{exitID}",
        "{employeeName}",
        "{employeeID}",
        "{exitType}",
        "{exitReason}",
        "{exitReasonDescription}",
        "{exitLastDate}",
        "{exitEffectiveDate}",
        "{eligibleToRehire}",
        "{remarks}",
        "{department}",
        "{position}",
        "{companyName}",
    ],
    talent_acquisition_interview: [
        "{applicantName}",
        "{applicantID}",
        "{jobTitle}",
        "{department}",
        "{interviewDate}",
        "{interviewTime}",
        "{interviewLocation}",
        "{interviewerName}",
        "{companyName}",
    ],
    talent_acquisition_offer: [
        "{applicantName}",
        "{applicantID}",
        "{jobTitle}",
        "{department}",
        "{offeredSalary}",
        "{startDate}",
        "{benefits}",
        "{companyName}",
        "{hrContactName}",
        "{hrContactEmail}",
    ],
};

export async function POST(req: Request) {
    try {
        const body: DocumentTemplateRequest = await req.json();
        const { templateType } = body;

        // Validate required fields
        if (!templateType) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Template type is required",
                } as DocumentTemplateResponse,
                { status: 400 },
            );
        }

        // Validate template type
        const validTypes = [
            "promotion",
            "exit",
            "talent_acquisition_interview",
            "talent_acquisition_offer",
        ];
        if (!validTypes.includes(templateType)) {
            return NextResponse.json(
                {
                    success: false,
                    error: `Invalid template type. Must be one of: ${validTypes.join(", ")}`,
                } as DocumentTemplateResponse,
                { status: 400 },
            );
        }

        // Get the dynamic fields for this template type
        const fields = templateFields[templateType] || [];

        // Initialize OpenAI
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        // Create prompt based on template type
        let prompt = "";

        switch (templateType) {
            case "promotion":
                prompt = `Generate a professional promotion letter template in HTML format using <p> tags for paragraphs.

**Template Type:** Promotion Letter

**Dynamic Fields (must include these placeholders in the template):**
${fields.map(f => `- ${f}`).join("\n")}

**Requirements:**
1. The template should be formal and professional
2. Include placeholders for employee name, promotion details, new position, salary, etc.
3. Use proper business letter formatting
4. The template should be in HTML format using <p> tags
5. Include sections for: introduction, promotion details, benefits, closing
6. Write the content so it sounds natural when the placeholders are replaced

**Example Structure:**
- Opening paragraph announcing the promotion
- Details of the promotion (new position, effective date, etc.)
- Updated compensation and benefits
- Congratulations and closing

**Important:** Return ONLY the HTML content, no additional text or explanations. Use <p> tags for paragraphs.`;
                break;

            case "exit":
                prompt = `Generate a professional exit/termination letter template in HTML format using <p> tags for paragraphs.

**Template Type:** Exit Letter

**Dynamic Fields (must include these placeholders in the template):**
${fields.map(f => `- ${f}`).join("\n")}

**Requirements:**
1. The template should be formal and professional
2. Include placeholders for employee name, exit details, reason, last working date, etc.
3. Use proper business letter formatting
4. The template should be in HTML format using <p> tags
5. Include sections for: notice of termination, reason (if applicable), final details, rehire eligibility, closing
6. Write the content so it sounds professional and respectful

**Example Structure:**
- Opening paragraph announcing the exit
- Reason for exit (if applicable)
- Important dates (last working day, etc.)
- Information about final paycheck, benefits
- Rehire eligibility status
- Thank you and closing

**Important:** Return ONLY the HTML content, no additional text or explanations. Use <p> tags for paragraphs.`;
                break;

            case "talent_acquisition_interview":
                prompt = `Generate a professional interview invitation letter template in HTML format using <p> tags for paragraphs.

**Template Type:** Interview Invitation Letter

**Dynamic Fields (must include these placeholders in the template):**
${fields.map(f => `- ${f}`).join("\n")}

**Requirements:**
1. The template should be welcoming and professional
2. Include placeholders for applicant name, job title, interview details, etc.
3. Use proper business letter formatting
4. The template should be in HTML format using <p> tags
5. Include sections for: congratulation on being shortlisted, interview details (date, time, location), what to bring, dress code, contact information, closing
6. Write the content so it sounds encouraging and professional

**Example Structure:**
- Congratulations message
- Interview date, time, and location
- Interview format/instructions
- What the candidate should bring/prepare
- Contact information for questions
- Encouraging closing

**Important:** Return ONLY the HTML content, no additional text or explanations. Use <p> tags for paragraphs.`;
                break;

            case "talent_acquisition_offer":
                prompt = `Generate a professional job offer letter template in HTML format using <p> tags for paragraphs.

**Template Type:** Job Offer Letter

**Dynamic Fields (must include these placeholders in the template):**
${fields.map(f => `- ${f}`).join("\n")}

**Requirements:**
1. The template should be welcoming and professional
2. Include placeholders for applicant name, job title, salary, start date, benefits, etc.
3. Use proper business letter formatting
4. The template should be in HTML format using <p> tags
5. Include sections for: job offer announcement, position details, compensation, benefits, start date, acceptance instructions, closing
6. Write the content so it sounds enthusiastic yet professional

**Example Structure:**
- Excitement about the offer
- Position and department
- Compensation package (salary, bonuses, benefits)
- Start date
- Acceptance deadline and instructions
- Contact for questions
- Warm closing

**Important:** Return ONLY the HTML content, no additional text or explanations. Use <p> tags for paragraphs.`;
                break;
        }

        // Generate document template using OpenAI
        const response = await openai.chat.completions.create({
            model: gptModel,
            messages: [
                {
                    role: "system",
                    content:
                        "You are an expert HR professional and document writer. Generate professional, well-structured document templates in HTML format.",
                },
                {
                    role: "user",
                    content: prompt,
                },
            ],
            max_tokens: 2000,
            temperature: 0.7,
        });

        const generatedContent = response.choices[0]?.message?.content;

        if (!generatedContent) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Failed to generate document template. Please try again.",
                } as DocumentTemplateResponse,
                { status: 500 },
            );
        }

        // Clean up the generated content (remove any markdown code blocks if present)
        let cleanedContent = generatedContent
            .replace(/```html\n?/g, "")
            .replace(/```\n?/g, "")
            .trim();

        return NextResponse.json({
            success: true,
            templateContent: cleanedContent,
        } as DocumentTemplateResponse);
    } catch (error) {
        console.error("Error generating document template:", error);

        // Handle specific OpenAI errors
        if (error instanceof Error) {
            if (error.message.includes("API key")) {
                return NextResponse.json(
                    {
                        success: false,
                        error: "AI service configuration error. Please contact support.",
                    } as DocumentTemplateResponse,
                    { status: 500 },
                );
            }

            if (error.message.includes("rate limit")) {
                return NextResponse.json(
                    {
                        success: false,
                        error: "AI service is temporarily busy. Please try again in a moment.",
                    } as DocumentTemplateResponse,
                    { status: 429 },
                );
            }
        }

        return NextResponse.json(
            {
                success: false,
                error: "Failed to generate document template. Please try again.",
            } as DocumentTemplateResponse,
            { status: 500 },
        );
    }
}
