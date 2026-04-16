/**
 * Types for AI Job Description Generation API
 */

export interface JobDescriptionGenerationRequest {
    jobTitle: string;
    levelOfEducation: string;
    yearsOfExperience: string;
    jobLevel: string;
    department: string;
}

export interface JobDescriptionGenerationResponse {
    success: boolean;
    jobDescription?: string;
    requirements?: string[];
    responsibilities?: string[];
    benefits?: string[];
    error?: string;
}

export interface JobDescriptionValidationError {
    field: string;
    message: string;
}

export interface JobDescriptionGenerationState {
    isLoading: boolean;
    error: string | null;
    lastGenerated: string | null;
}

/**
 * Required fields for job description generation
 * These must be filled before the AI generation can be triggered
 */
export const REQUIRED_FIELDS_FOR_AI_GENERATION = [
    "jobTitle",
    "levelOfEducation",
    "yearsOfExperience",
    "jobLevel",
    "department",
] as const;

export type RequiredFieldForAI = (typeof REQUIRED_FIELDS_FOR_AI_GENERATION)[number];

/**
 * Field labels for user-friendly error messages
 */
export const FIELD_LABELS: Record<RequiredFieldForAI, string> = {
    jobTitle: "Job Title",
    levelOfEducation: "Level of Education",
    yearsOfExperience: "Years of Experience",
    jobLevel: "Job Level",
    department: "Department",
};
