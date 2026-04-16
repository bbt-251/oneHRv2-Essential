"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Circle, Sparkles } from "lucide-react";
// import ShortAnswerAIModal from "./short-answer-ai-modal"
import dayjs from "dayjs";
import { useAuth } from "@/context/authContext";
import { useToast } from "@/context/toastContext";
import ShortAnswerModel from "@/lib/models/short-answer";
import { timestampFormat } from "@/lib/util/dayjs_format";
import { createShortAnswer, updateShortAnswer } from "@/lib/backend/api/quiz/short-answer-service";

interface CreateShortAnswerFormProps {
    isOpen: boolean;
    onClose: () => void;
    editingQuestion: ShortAnswerModel | null;
}

export default function CreateShortAnswerForm({
    isOpen,
    onClose,
    editingQuestion,
}: CreateShortAnswerFormProps) {
    const [name, setName] = useState<string>("");
    const [active, setActive] = useState<boolean>(true);
    const [question, setQuestion] = useState<string>("");
    const [wordLimit, setWordLimit] = useState<string>("250");
    const [showAIModal, setShowAIModal] = useState<boolean>(false);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const { user } = useAuth();
    const { showToast } = useToast();

    const [loadingType, setLoadingType] = useState<"ai" | "save" | null>(null);

    // Populate form when editing an existing question
    useEffect(() => {
        if (editingQuestion && isOpen) {
            setName(editingQuestion.name);
            setActive(editingQuestion.active);
            setQuestion(editingQuestion.question);
            setWordLimit(editingQuestion.wordLimit.toString());
        } else {
            resetFields();
        }
    }, [editingQuestion]);

    const resetFields = () => {
        setName("");
        setActive(true);
        setQuestion("");
        setWordLimit("250");
    };

    const handleSave = async () => {
        // validation
        const errors: string[] = [];

        setValidationErrors([]); // Clear previous errors

        // 1. Validate Name
        if (!name.trim()) {
            errors.push("The name field is required.");
        }

        // 2. Validate Question
        if (!question.trim()) {
            errors.push("The question field is required.");
        }

        // 3. Validate Word Limit
        const wordLimitNumber = Number(wordLimit);
        if (isNaN(wordLimitNumber) || wordLimitNumber < 20) {
            errors.push("The word limit must be a valid number and at least 20.");
        }

        // If there are validation errors, set them and stop execution
        if (errors.length > 0) {
            setValidationErrors(errors);
            return;
        }

        // If validation passes, create the short answer object
        const shortAnswer: Omit<ShortAnswerModel, "id"> = {
            uid: user?.uid ?? "",
            timestamp: dayjs().format(timestampFormat),
            name,
            active,
            question,
            wordLimit: wordLimitNumber,
        };

        setLoading(true);
        setLoadingType("save");

        if (editingQuestion !== null) {
            shortAnswer.timestamp = editingQuestion.timestamp;
            const res = await updateShortAnswer({ ...shortAnswer, id: editingQuestion.id });
            if (res !== null) {
                showToast(
                    `Short answer ${shortAnswer.name} has been updated successfully`,
                    "Success",
                    "success",
                );
                resetFields();
                onClose();
            } else showToast("Error updating short answer. Please try again.", "Error", "error");
        } else {
            const res = await createShortAnswer(shortAnswer);
            if (res !== null) {
                showToast(
                    `Short answer ${shortAnswer.name} has been created successfully`,
                    "Success",
                    "success",
                );
                resetFields();
                onClose();
            } else showToast("Error creating short answer. Please try again.", "Error", "error");
        }

        setLoading(false);
        setLoadingType(null);
    };

    const handleAIGenerate = async (params: any) => {
        setLoading(true);
        setLoadingType("ai");
        setShowAIModal(false);
        try {
            const res = await fetch("/api/generate-short-answer", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    domain: params.knowledgeArea,
                    wordLimit: params.wordLimit,
                    levelOfComplexity: params.complexityLevel,
                    numberOfQuestions: params.numberOfQuestions,
                }),
            });
            const data = await res.json();
            if (data.questions && data.questions.length > 0) {
                setQuestion(data.questions[0]);
                setWordLimit(params.wordLimit.toString());
            } else {
                showToast("AI did not return any questions", "Error", "error");
            }
        } catch (e) {
            showToast("Failed to generate question with AI", "Error", "error");
        }
        setLoading(false);
        setLoadingType(null);
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editingQuestion ? "Edit" : "Create New"} Short Answer Question
                        </DialogTitle>
                    </DialogHeader>

                    {validationErrors.length > 0 && (
                        <div className="max-w p-3">
                            {/* Validation Errors */}
                            {validationErrors.length > 0 && (
                                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                                    <h4 className="text-sm font-medium text-red-800 mb-2 flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4" />
                                        Please fix the following errors:
                                    </h4>
                                    <ul className="text-sm text-red-700 space-y-1">
                                        {validationErrors.map((error, index) => (
                                            <li key={index} className="flex items-center gap-2">
                                                <div className="w-1 h-1 bg-red-500 rounded-full flex-shrink-0" />
                                                {error}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="space-y-6 mt-4">
                        {/* Basic Info */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="Enter question name"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="active">Active</Label>
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="active"
                                        checked={active}
                                        onCheckedChange={setActive}
                                    />
                                    <span className="text-sm">
                                        {active ? "Active" : "Inactive"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Question */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label htmlFor="question">Question</Label>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setShowAIModal(true);
                                    }}
                                >
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    Generate with AI
                                </Button>
                            </div>
                            <Textarea
                                id="question"
                                value={question}
                                onChange={e => setQuestion(e.target.value)}
                                placeholder="Enter your short answer question"
                                rows={4}
                            />
                        </div>

                        {/* Word Limit */}
                        <div className="space-y-2">
                            <Label htmlFor="wordLimit">Word Limit</Label>
                            <Input
                                id="wordLimit"
                                type="number"
                                value={wordLimit}
                                onChange={e => setWordLimit(e.target.value)}
                                min="50"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 mt-6">
                        <Button variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={!name.trim() || !question.trim() || !wordLimit || loading}
                        >
                            {loading ? "Saving ..." : "Save Question"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* <ShortAnswerAIModal isOpen={showAIModal} onClose={() => setShowAIModal(false)} onGenerate={handleAIGenerate} /> */}

            {/* Built-in loading modal */}
            {loading && (
                <Dialog open={true}>
                    <DialogContent
                        className="flex flex-col items-center justify-center max-w-xs bg-gradient-to-br from-lime-200 to-lime-100 text-black shadow-lg border-0"
                        style={{ pointerEvents: "none" }}
                    >
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
                                {loadingType === "ai"
                                    ? "Generating questions with AI..."
                                    : "Saving question..."}
                            </div>
                            <div className="text-gray-700 text-sm mb-2 text-center">
                                {loadingType === "ai"
                                    ? "This may take a few seconds. Please wait."
                                    : "Please wait while your question is being saved."}
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
        </>
    );
}
