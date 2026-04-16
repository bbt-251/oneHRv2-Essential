"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/context/toastContext";
import {
    JobDescriptionGenerationRequest,
    JobDescriptionGenerationResponse,
    REQUIRED_FIELDS_FOR_AI_GENERATION,
    FIELD_LABELS,
    RequiredFieldForAI,
} from "@/lib/types/ai-job-description";
import { htmlToString } from "@/lib/util/html-content";
import { Sparkles, Loader2 } from "lucide-react";

interface GeneratedJobData {
    jobDescription: string;
    requirements: string[];
    responsibilities: string[];
    benefits: string[];
}

interface AIJobDescriptionGeneratorProps {
    /**
     * Form data containing the job posting information
     */
    formData: {
        jobTitle: string;
        levelOfEducation: string;
        yearsOfExperience: string;
        jobLevel: string;
        department: string;
    };
    /**
     * Callback function to update the job description and related fields
     * @param data - The generated job data including description, requirements, responsibilities, and benefits
     */
    onJobDataGenerated: (data: GeneratedJobData) => void;
    /**
     * Whether the generator is disabled
     */
    disabled?: boolean;
    /**
     * Custom className for styling
     */
    className?: string;
}

export function AIJobDescriptionGenerator({
    formData,
    onJobDataGenerated,
    disabled = false,
    className = "",
}: AIJobDescriptionGeneratorProps) {
    const [isLoading, setIsLoading] = useState(false);
    const { showToast } = useToast();

    /**
     * Validate that all required fields are filled
     */
    const validateRequiredFields = (): { isValid: boolean; missingFields: string[] } => {
        const missingFields: string[] = [];

        REQUIRED_FIELDS_FOR_AI_GENERATION.forEach((field: RequiredFieldForAI) => {
            const value = formData[field];
            if (!value || value.toString().trim() === "") {
                missingFields.push(FIELD_LABELS[field]);
            }
        });

        return {
            isValid: missingFields.length === 0,
            missingFields,
        };
    };

    /**
     * Generate job description using AI
     */
    const handleGenerateJobDescription = async () => {
        // Validate required fields
        const validation = validateRequiredFields();
        if (!validation.isValid) {
            showToast(
                `Please fill in the following fields before generating: ${validation.missingFields.join(", ")}`,
                "Missing Required Fields",
                "error",
            );
            return;
        }

        setIsLoading(true);

        try {
            // Prepare request data
            const requestData: JobDescriptionGenerationRequest = {
                jobTitle: formData.jobTitle.trim(),
                levelOfEducation: formData.levelOfEducation.trim(),
                yearsOfExperience: formData.yearsOfExperience.trim(),
                jobLevel: formData.jobLevel.trim(),
                department: formData.department.trim(),
            };

            // Make API call
            const response = await fetch("/api/generate-job-description", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(requestData),
            });

            const data: JobDescriptionGenerationResponse = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `HTTP error! status: ${response.status}`);
            }

            if (!data.success || !data.jobDescription) {
                throw new Error(data.error || "Failed to generate job description");
            }

            // Prepare the generated data
            const generatedData: GeneratedJobData = {
                jobDescription: data.jobDescription,
                requirements: data.requirements || [],
                responsibilities: data.responsibilities || [],
                benefits: data.benefits || [],
            };

            // Update the form with all generated data
            onJobDataGenerated(generatedData);

            // Show success message
            const itemsGenerated = [];
            if (data.jobDescription) itemsGenerated.push("job description");
            if (data.requirements && data.requirements.length > 0)
                itemsGenerated.push(`${data.requirements.length} requirements`);
            if (data.responsibilities && data.responsibilities.length > 0)
                itemsGenerated.push(`${data.responsibilities.length} responsibilities`);
            if (data.benefits && data.benefits.length > 0)
                itemsGenerated.push(`${data.benefits.length} benefits`);

            showToast(
                `AI has successfully generated: ${itemsGenerated.join(", ")}.`,
                "Job Content Generated!",
                "success",
            );
        } catch (error) {
            console.error("Error generating job description:", error);

            let errorMessage = "Failed to generate job description. Please try again.";

            if (error instanceof Error) {
                if (error.message.includes("fetch")) {
                    errorMessage =
                        "Connection error. Please check your internet connection and try again.";
                } else if (error.message.includes("rate limit")) {
                    errorMessage = "AI service is temporarily busy. Please try again in a moment.";
                } else if (error.message.includes("API key")) {
                    errorMessage = "AI service configuration error. Please contact support.";
                } else if (error.message.includes("Missing required fields")) {
                    errorMessage = error.message;
                }
            }

            showToast(errorMessage, "Generation Failed", "error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleGenerateJobDescription}
            disabled={disabled || isLoading}
            className={`${className} ${isLoading ? "cursor-not-allowed" : ""}`}
        >
            {isLoading ? (
                <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                </>
            ) : (
                <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate with AI
                </>
            )}
        </Button>
    );
}

/**
 * Hook for managing AI job description generation state
 */
export function useAIJobDescriptionGenerator() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastGenerated, setLastGenerated] = useState<string | null>(null);

    const generateJobDescription = async (
        formData: JobDescriptionGenerationRequest,
        onSuccess: (data: GeneratedJobData) => void,
    ) => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch("/api/generate-job-description", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            const data: JobDescriptionGenerationResponse = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || "Failed to generate job description");
            }

            if (data.jobDescription) {
                const generatedData: GeneratedJobData = {
                    jobDescription: data.jobDescription,
                    requirements: data.requirements || [],
                    responsibilities: data.responsibilities || [],
                    benefits: data.benefits || [],
                };
                setLastGenerated(data.jobDescription);
                onSuccess(generatedData);
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
            setError(errorMessage);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        isLoading,
        error,
        lastGenerated,
        generateJobDescription,
        clearError: () => setError(null),
    };
}
