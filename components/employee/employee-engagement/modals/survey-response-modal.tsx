"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Clock, Loader2 } from "lucide-react";
import { useAuth } from "@/context/authContext";
import { submitSurveyResponse } from "@/lib/backend/api/employee-engagement/survey/survey-service";
import { useToast } from "@/context/toastContext";

interface Survey {
    id: string;
    title: string;
    description: string;
    duration: number;
    questions: Array<{
        id: string;
        question: string;
        type: "Multiple Choice" | "Short Answer" | "Common Answer";
        options?: string[];
    }>;
    responses?: Array<{
        questionId: string;
        answer: string;
        id: string;
        type: "Multiple Choice" | "Short Answer" | "Common Answer";
    }>;
}

interface SurveyResponseModalProps {
    isOpen: boolean;
    onClose: () => void;
    survey: Survey;
    mode: "respond" | "view";
    onSubmit?: (responses: Record<string, string>) => void;
}

export function SurveyResponseModal({
    isOpen,
    onClose,
    survey,
    mode,
    onSubmit,
}: SurveyResponseModalProps) {
    const { userData } = useAuth();
    const { showToast } = useToast();

    const [responses, setResponses] = useState<Record<string, string>>(() => {
        if (mode === "view" && survey.responses) {
            return survey.responses.reduce(
                (acc, response) => {
                    acc[response.questionId] = response.answer;
                    return acc;
                },
                {} as Record<string, string>,
            );
        }
        return {};
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleResponseChange = (questionId: string, value: string) => {
        if (mode === "respond") {
            setResponses(prev => ({ ...prev, [questionId]: value }));
        }
    };

    const handleSubmit = async () => {
        if (mode === "respond") {
            setIsSubmitting(true);
            try {
                // Transform responses to match service expected format
                const answers = Object.entries(responses).map(([questionId, answer]) => {
                    const question = survey.questions.find(q => q.id === questionId);
                    return {
                        questionId,
                        answer,
                        id: crypto.randomUUID(), // Generate unique ID for the answer
                        type: question?.type || "Short Answer",
                    };
                });

                // Submit the survey response
                const success = await submitSurveyResponse(survey.id, userData?.uid || "", answers);

                if (success) {
                    showToast("Survey submitted successfully", "success", "success");
                    onClose();
                    // Call onSubmit if provided for additional handling
                    if (onSubmit) {
                        await onSubmit(responses);
                    }
                } else {
                    showToast("Failed to submit survey", "error", "error");
                }
            } catch (error) {
                console.error("Error submitting survey:", error);
                showToast("An error occurred while submitting the survey", "error", "error");
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    const isViewMode = mode === "view";
    const allQuestionsAnswered = survey.questions.every(q => responses[q.id]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {isViewMode ? (
                            <>
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                Survey Response - {survey.title}
                            </>
                        ) : (
                            <>
                                <Clock className="h-5 w-5 text-blue-600" />
                                {survey.title}
                            </>
                        )}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Survey Info */}
                    <Card>
                        <CardContent className="p-4">
                            <div className="space-y-2">
                                <p className="text-sm text-gray-600 dark:text-muted-foreground">
                                    {survey.description}
                                </p>
                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                    <span>Duration: {survey.duration} minutes</span>
                                    {isViewMode && (
                                        <span className="text-green-600 font-medium">
                                            ✓ Completed
                                        </span>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Questions */}
                    <div className="space-y-6">
                        {isViewMode
                            ? // Group responses by type and source for view mode
                            (() => {
                                const groupedResponses = survey.responses?.reduce(
                                    (acc, response) => {
                                        const sourceId = response.id.split(":")[0]; // Get the listOfQuestions id
                                        const key = `${response.type}:${sourceId}`;
                                        if (!acc[key]) acc[key] = [];
                                        acc[key].push(response);
                                        return acc;
                                    },
                                      {} as Record<string, typeof survey.responses>,
                                );

                                return Object.entries(groupedResponses || {}).map(
                                    ([key, responses]) => {
                                        const [type, sourceId] = key.split(":");
                                        return (
                                            <Card key={key}>
                                                <CardContent className="p-6">
                                                    <div className="space-y-4">
                                                        <div>
                                                            <Label className="text-base font-medium text-blue-600">
                                                                {type} Questions
                                                            </Label>
                                                        </div>
                                                        {responses?.map((response, idx) => {
                                                            const question =
                                                                  survey.questions.find(
                                                                      q =>
                                                                          q.id ===
                                                                          response.questionId,
                                                                  );
                                                            return (
                                                                <div
                                                                    key={response.questionId}
                                                                    className="space-y-2"
                                                                >
                                                                    <Label className="text-sm font-medium">
                                                                        {idx + 1}.{" "}
                                                                        {question?.question ||
                                                                              response.questionId}
                                                                    </Label>
                                                                    {[
                                                                        "Multiple Choice",
                                                                        "Common Answer",
                                                                    ].includes(response.type) &&
                                                                      question?.options ? (
                                                                            <RadioGroup
                                                                                value={
                                                                                    response.answer
                                                                                }
                                                                                disabled={true}
                                                                            >
                                                                                {question.options.map(
                                                                                    option => (
                                                                                        <div
                                                                                            key={
                                                                                                option
                                                                                            }
                                                                                            className="flex items-center space-x-2"
                                                                                        >
                                                                                            <RadioGroupItem
                                                                                                value={
                                                                                                    option
                                                                                                }
                                                                                                id={`${response.questionId}-${option}`}
                                                                                                disabled
                                                                                            />
                                                                                            <Label
                                                                                                htmlFor={`${response.questionId}-${option}`}
                                                                                                className={
                                                                                                    response.answer ===
                                                                                                  option
                                                                                                        ? "font-medium text-blue-600"
                                                                                                        : ""
                                                                                                }
                                                                                            >
                                                                                                {
                                                                                                    option
                                                                                                }
                                                                                            </Label>
                                                                                        </div>
                                                                                    ),
                                                                                )}
                                                                            </RadioGroup>
                                                                        ) : (
                                                                            <Textarea
                                                                                value={
                                                                                    response.answer
                                                                                }
                                                                                readOnly
                                                                                className="bg-gray-50 dark:bg-muted text-sm"
                                                                                rows={2}
                                                                            />
                                                                        )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        );
                                    },
                                );
                            })()
                            : // Normal question display for respond mode
                            survey.questions.map((question, index) => (
                                <Card key={question.id}>
                                    <CardContent className="p-6">
                                        <div className="space-y-4">
                                            <div>
                                                <Label className="text-base font-medium">
                                                    {index + 1}. {question.question}
                                                    {!isViewMode && (
                                                        <span className="text-red-500 ml-1">
                                                              *
                                                        </span>
                                                    )}
                                                </Label>
                                            </div>

                                            {["Multiple Choice", "Common Answer"].includes(
                                                question.type,
                                            ) && question.options ? (
                                                    <RadioGroup
                                                        value={responses[question.id] || ""}
                                                        onValueChange={value =>
                                                            handleResponseChange(question.id, value)
                                                        }
                                                        disabled={isViewMode}
                                                    >
                                                        {question.options.map(option => (
                                                            <div
                                                                key={option}
                                                                className="flex items-center space-x-2"
                                                            >
                                                                <RadioGroupItem
                                                                    value={option}
                                                                    id={`${question.id}-${option}`}
                                                                />
                                                                <Label
                                                                    htmlFor={`${question.id}-${option}`}
                                                                    className={
                                                                        isViewMode &&
                                                                      responses[question.id] ===
                                                                          option
                                                                            ? "font-medium text-blue-600"
                                                                            : ""
                                                                    }
                                                                >
                                                                    {option}
                                                                </Label>
                                                            </div>
                                                        ))}
                                                    </RadioGroup>
                                                ) : (
                                                    <Textarea
                                                        placeholder={
                                                            isViewMode
                                                                ? "No response provided"
                                                                : "Enter your answer..."
                                                        }
                                                        value={responses[question.id] || ""}
                                                        onChange={e =>
                                                            handleResponseChange(
                                                                question.id,
                                                                e.target.value,
                                                            )
                                                        }
                                                        readOnly={isViewMode}
                                                        className={
                                                            isViewMode
                                                                ? "bg-gray-50 dark:bg-muted"
                                                                : ""
                                                        }
                                                        rows={3}
                                                    />
                                                )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button variant="outline" onClick={onClose}>
                            {isViewMode ? "Close" : "Cancel"}
                        </Button>
                        {!isViewMode && (
                            <Button
                                onClick={handleSubmit}
                                disabled={!allQuestionsAnswered || isSubmitting}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    "Submit Survey"
                                )}
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
