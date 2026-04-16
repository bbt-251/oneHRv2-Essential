"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/context/toastContext";

interface Question {
    id: string;
    question: string;
    choices: string[];
    correctAnswerIndex: number | null;
}

interface MultipleChoiceAIModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (questions: Question[]) => void;
}

interface GeneratedQuestion {
    question: string;
    choices: string[];
    correctAnswerIndex: number;
}

export default function MultipleChoiceAIModal({
    isOpen,
    onClose,
    onGenerate,
}: MultipleChoiceAIModalProps) {
    const { showToast } = useToast();
    const [loading, setLoading] = useState<boolean>(false);
    const [knowledgeArea, setKnowledgeArea] = useState<string>("");
    const [complexityLevel, setComplexityLevel] = useState<number>(1);
    const [numberOfChoices, setNumberOfChoices] = useState<number>(4);
    const [numberOfQuestions, setNumberOfQuestions] = useState<number>(5);

    // Clear form when modal closes
    useEffect(() => {
        if (!isOpen) {
            setKnowledgeArea("");
            setComplexityLevel(1);
            setNumberOfChoices(4);
            setNumberOfQuestions(5);
            setLoading(false);
        }
    }, [isOpen]);

    const handleGenerate = async (): Promise<void> => {
        setLoading(true);

        try {
            const res = await fetch("/api/generate-multiple-choice", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    domain: knowledgeArea,
                    numberOfChoices: numberOfChoices,
                    levelOfComplexity: complexityLevel,
                    numberOfQuestions: numberOfQuestions,
                }),
            });

            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }

            const data: { questions: GeneratedQuestion[] } = await res.json();
            if (data.questions && data.questions.length > 0) {
                const generatedQuestions: Question[] = data.questions.map(
                    (q: GeneratedQuestion, index: number) => ({
                        id: `temp-${Date.now()}-${index}`,
                        question: q.question,
                        choices: q.choices,
                        correctAnswerIndex: q.correctAnswerIndex ?? null,
                    }),
                );
                onGenerate(generatedQuestions);
                showToast(
                    `Generated ${generatedQuestions.length} questions successfully!`,
                    "Success",
                    "success",
                );
                onClose();
            } else {
                showToast("AI did not return any questions", "Error", "error");
            }
        } catch (e) {
            showToast("Failed to generate questions with AI. Please try again.", "Error", "error");
        }

        setLoading(false);
    };

    const handleDone = (): void => {
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader className="flex flex-row items-center justify-between">
                    <DialogTitle>Generate AI Multiple Choice Questions</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                    <div className="space-y-2">
                        <Label htmlFor="knowledgeArea">
                            <span className="text-red-500">*</span> What specific Area of knowledge
                            do you want to assess in the applicant?
                        </Label>
                        <Textarea
                            id="knowledgeArea"
                            value={knowledgeArea}
                            onChange={e => setKnowledgeArea(e.target.value)}
                            placeholder="Be Specific"
                            rows={4}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="complexity">
                            <span className="text-red-500">*</span> Level of Complexity (From scale
                            of 1 to 5 - 1 is simple and 5 is very hard)
                        </Label>
                        <Input
                            id="complexity"
                            value={complexityLevel}
                            onChange={e => setComplexityLevel(parseInt(e.target.value) || 1)}
                            type="number"
                            min="1"
                            max="5"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="numberOfChoices">
                            <span className="text-red-500">*</span> Number of Choices per Question
                        </Label>
                        <Input
                            id="numberOfChoices"
                            value={numberOfChoices}
                            onChange={e => setNumberOfChoices(parseInt(e.target.value) || 4)}
                            type="number"
                            min="2"
                            max="6"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="numberOfQuestions">
                            <span className="text-red-500">*</span> Number of Questions
                        </Label>
                        <Input
                            id="numberOfQuestions"
                            value={numberOfQuestions}
                            onChange={e => setNumberOfQuestions(parseInt(e.target.value) || 5)}
                            type="number"
                            min="1"
                            max="10"
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-2 mt-8">
                    <Button
                        onClick={handleGenerate}
                        disabled={
                            !knowledgeArea ||
                            !complexityLevel ||
                            !numberOfChoices ||
                            !numberOfQuestions ||
                            loading
                        }
                    >
                        {loading ? "Generating..." : "Generate"}
                    </Button>
                    <Button variant="outline" onClick={handleDone} disabled={loading}>
                        Done
                    </Button>
                </div>
            </DialogContent>

            {/* Loading Modal */}
            {loading && (
                <Dialog open={true}>
                    <DialogContent
                        className="flex flex-col items-center justify-center max-w-xs bg-gradient-to-br from-lime-200 to-lime-100 text-black shadow-lg border-0"
                        style={{ pointerEvents: "none" }}
                    >
                        <DialogTitle className="sr-only">Generating Questions</DialogTitle>
                        <div className="flex flex-col items-center w-full">
                            <div className="mb-3">
                                <svg
                                    className="animate-spin h-7 w-7 text-lime-600"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    />
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                                    />
                                </svg>
                            </div>
                            <div className="text-md font-semibold mb-1 text-center">
                                Generating questions with AI...
                            </div>
                            <div className="text-gray-700 text-sm mb-2 text-center">
                                This may take a few seconds. Please wait.
                            </div>
                            <div className="w-full h-1 bg-lime-300 rounded overflow-hidden mt-2">
                                <div
                                    className="h-full bg-lime-500 animate-pulse"
                                    style={{ width: "100%" }}
                                ></div>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </Dialog>
    );
}
