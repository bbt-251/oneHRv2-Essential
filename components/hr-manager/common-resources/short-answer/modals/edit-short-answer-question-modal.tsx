"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/context/toastContext";
import { updateShortAnswer } from "@/lib/backend/api/talent-acquisition/short-answer-service";
import ShortAnswerModel, { ShortAnswerQuestion } from "@/lib/models/short-answer";
import { AlertCircle, Plus, Sparkles, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import ShortAnswerAIModal from "./short-answer-ai-modal";

interface EditShortAnswerQuestionModalProps {
    isOpen: boolean;
    onClose: () => void;
    question: ShortAnswerModel | null;
}

export default function EditShortAnswerQuestionModal({
    isOpen,
    onClose,
    question,
}: EditShortAnswerQuestionModalProps) {
    const { showToast } = useToast();
    const [loading, setLoading] = useState<boolean>(false);
    const [showAIModal, setShowAIModal] = useState<boolean>(false);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);

    const [formData, setFormData] = useState({
        name: "",
        questions: [] as ShortAnswerQuestion[],
        active: true,
    });

    // Populate form when editing an existing question
    useEffect(() => {
        if (question && isOpen) {
            setFormData({
                name: question.name,
                questions: question.questions,
                active: question.active,
            });
        }
    }, [question, isOpen]);

    const resetFields = (): void => {
        setFormData({
            name: "",
            questions: [],
            active: true,
        });
        setValidationErrors([]);
    };

    // Clear form when modal closes (but not when opening with existing data)
    useEffect(() => {
        if (!isOpen && !question) {
            resetFields();
        }
    }, [isOpen, question]);

    const handleSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();

        if (!question) return;

        // Validation
        const errors: string[] = [];
        setValidationErrors([]);

        if (!formData.name.trim()) {
            errors.push("The name field is required.");
        }

        if (formData.questions.length === 0) {
            errors.push("At least one question is required.");
        }

        // Validate each question
        formData.questions.forEach((q, index) => {
            if (!q.question.trim()) {
                errors.push(`Question ${index + 1} text is required.`);
            }
            if (q.wordLimit < 20) {
                errors.push(`Question ${index + 1} word limit must be at least 20.`);
            }
        });

        if (errors.length > 0) {
            setValidationErrors(errors);
            return;
        }

        setLoading(true);

        try {
            const updatedQuestion: Partial<ShortAnswerModel> = {
                id: question.id,
                name: formData.name,
                active: formData.active,
                questions: formData.questions,
                timestamp: question.timestamp, // Keep original timestamp
            };

            const result = await updateShortAnswer(updatedQuestion);
            if (result) {
                showToast(
                    `Short answer ${updatedQuestion.name} has been updated successfully`,
                    "Success",
                    "success",
                );
                resetFields();
                onClose();
            } else {
                showToast("Error updating short answer. Please try again.", "Error", "error");
            }
        } catch (error) {
            showToast("Failed to update question. Please try again.", "Error", "error");
        }

        setLoading(false);
    };

    const handleInputChange = (field: string, value: any): void => {
        setFormData(prev => ({
            ...prev,
            [field]: value,
        }));
    };

    const addQuestion = (): void => {
        const newQuestion: ShortAnswerQuestion = {
            id: `temp-${Date.now()}`,
            question: "",
            wordLimit: 250,
        };
        setFormData(prev => ({
            ...prev,
            questions: [...prev.questions, newQuestion],
        }));
    };

    const removeQuestion = (index: number): void => {
        setFormData(prev => ({
            ...prev,
            questions: prev.questions.filter((_, i) => i !== index),
        }));
    };

    const updateQuestion = (index: number, field: keyof ShortAnswerQuestion, value: any): void => {
        setFormData(prev => ({
            ...prev,
            questions: prev.questions.map((q, i) => (i === index ? { ...q, [field]: value } : q)),
        }));
    };

    const handleAIGenerate = (questions: ShortAnswerQuestion[]): void => {
        setFormData(prev => ({
            ...prev,
            questions: questions,
        }));
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Edit Short Answer Question</DialogTitle>
                    </DialogHeader>

                    {validationErrors.length > 0 && (
                        <div className="max-w p-3">
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
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                        {/* Basic Info */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={e => handleInputChange("name", e.target.value)}
                                    placeholder="Enter question name"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="active">Active</Label>
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="active"
                                        checked={formData.active}
                                        onCheckedChange={checked =>
                                            handleInputChange("active", checked)
                                        }
                                        className={
                                            formData.active
                                                ? "data-[state=checked]:bg-green-400"
                                                : ""
                                        }
                                    />
                                    <span
                                        className={`text-sm ${formData.active ? "text-green-600" : "text-red-600"}`}
                                    >
                                        {formData.active ? "Active" : "Inactive"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Questions */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <Label>Questions</Label>
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowAIModal(true)}
                                    >
                                        <Sparkles className="w-4 h-4 mr-2" />
                                        Generate with AI
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={addQuestion}
                                    >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add Question
                                    </Button>
                                </div>
                            </div>

                            {formData.questions.length === 0 ? (
                                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                                    <p className="text-gray-500 mb-4">No questions added yet</p>
                                    <Button type="button" variant="outline" onClick={addQuestion}>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add First Question
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {formData.questions.map((question, index) => (
                                        <div
                                            key={question.id}
                                            className="border rounded-lg p-4 space-y-3"
                                        >
                                            <div className="flex justify-between items-center">
                                                <h4 className="font-medium">
                                                    Question {index + 1}
                                                </h4>
                                                {formData.questions.length > 1 && (
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => removeQuestion(index)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Question Text</Label>
                                                <Textarea
                                                    value={question.question}
                                                    onChange={e =>
                                                        updateQuestion(
                                                            index,
                                                            "question",
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="Enter your question"
                                                    rows={3}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Word Limit</Label>
                                                <Input
                                                    type="number"
                                                    value={question.wordLimit}
                                                    onChange={e =>
                                                        updateQuestion(
                                                            index,
                                                            "wordLimit",
                                                            parseInt(e.target.value) || 250,
                                                        )
                                                    }
                                                    min="20"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={
                                    !formData.name.trim() ||
                                    formData.questions.length === 0 ||
                                    loading
                                }
                            >
                                {loading ? "Updating..." : "Update Question"}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            <ShortAnswerAIModal
                isOpen={showAIModal}
                onClose={() => setShowAIModal(false)}
                onGenerate={handleAIGenerate}
            />
        </>
    );
}
