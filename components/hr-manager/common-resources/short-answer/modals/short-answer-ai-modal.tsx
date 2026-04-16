"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/context/toastContext";
import { ShortAnswerQuestion } from "@/lib/models/short-answer";
import { useEffect, useState } from "react";

interface ShortAnswerAIModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: (questions: ShortAnswerQuestion[]) => void;
}

export default function ShortAnswerAIModal({
    isOpen,
    onClose,
    onGenerate,
}: ShortAnswerAIModalProps) {
    const { showToast } = useToast();
    const [loading, setLoading] = useState<boolean>(false);
    const [knowledgeArea, setKnowledgeArea] = useState<string>("");
    const [complexityLevel, setComplexityLevel] = useState<number>(1);
    const [wordLimit, setWordLimit] = useState<number>(250);
    const [numberOfQuestions, setNumberOfQuestions] = useState<number>(5);

    // Clear form when modal closes
    useEffect(() => {
        if (!isOpen) {
            setKnowledgeArea("");
            setComplexityLevel(1);
            setWordLimit(250);
            setNumberOfQuestions(5);
            setLoading(false);
        }
    }, [isOpen]);

    const handleGenerate = async (): Promise<void> => {
        setLoading(true);

        try {
            const res = await fetch("/api/generate-short-answer", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    domain: knowledgeArea,
                    wordLimit: wordLimit,
                    levelOfComplexity: complexityLevel,
                    numberOfQuestions: numberOfQuestions,
                }),
            });
            const data = await res.json();
            if (data.questions && data.questions.length > 0) {
                const generatedQuestions: ShortAnswerQuestion[] = data.questions.map(
                    (q: string, index: number) => ({
                        id: `temp-${Date.now()}-${index}`,
                        question: q,
                        wordLimit: wordLimit,
                    }),
                );
                onGenerate(generatedQuestions);
                onClose();
            } else {
                showToast("AI did not return any questions", "Error", "error");
            }
        } catch (e) {
            showToast("Failed to generate question with AI", "Error", "error");
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
                    <DialogTitle>Generate AI Short Answer Question</DialogTitle>
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
                        <Label htmlFor="wordLimit">
                            <span className="text-red-500">*</span> Word Limit
                        </Label>
                        <Input
                            id="wordLimit"
                            value={wordLimit}
                            onChange={e => setWordLimit(parseInt(e.target.value) || 250)}
                            type="number"
                            min="20"
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
                            !wordLimit ||
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
