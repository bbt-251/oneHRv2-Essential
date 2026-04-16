"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Sparkles, AlertCircle, Circle } from "lucide-react";
import { useToast } from "@/context/toastContext";
import MultipleChoiceModel from "@/lib/models/multiple-choice";
import { getTimestamp } from "@/lib/util/dayjs_format";
import { createMultipleChoice } from "@/lib/backend/api/talent-acquisition/multiple-choice-service";
import MultipleChoiceAIModal from "./multiple-choice-ai-modal";

interface AddMultipleChoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface Question {
    id: string;
    question: string;
    choices: string[];
    correctAnswerIndex: number | null;
}

interface MultipleChoiceSet {
    name: string;
    description: string;
    active: boolean;
    questions: Question[];
}

export default function AddMultipleChoiceModal({ isOpen, onClose }: AddMultipleChoiceModalProps) {
    const [name, setName] = useState<string>("");
    const [active, setActive] = useState<boolean>(true);
    const [questions, setQuestions] = useState<Question[]>([
        { id: "1", question: "", choices: ["", ""], correctAnswerIndex: null },
    ]);
    const [description, setDescription] = useState<string>("");
    const [showAIModal, setShowAIModal] = useState<boolean>(false);
    const [validationErrors, setValidationErrors] = useState<string[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const { showToast } = useToast();

    const addQuestion = () => {
        const newQuestion: Question = {
            id: Date.now().toString(),
            question: "",
            choices: ["", ""],
            correctAnswerIndex: null,
        };
        setQuestions([...questions, newQuestion]);
    };

    const removeQuestion = (questionId: string) => {
        setQuestions(questions.filter(q => q.id !== questionId));
    };

    const updateQuestion = (questionId: string, field: string, value: string) => {
        setQuestions(questions.map(q => (q.id === questionId ? { ...q, [field]: value } : q)));
    };

    const addChoice = (questionId: string) => {
        setQuestions(
            questions.map(q => (q.id === questionId ? { ...q, choices: [...q.choices, ""] } : q)),
        );
    };

    const removeChoice = (questionId: string, choiceIndex: number) => {
        setQuestions(
            questions.map(q =>
                q.id === questionId
                    ? {
                        ...q,
                        choices: q.choices.filter((_, index) => index !== choiceIndex),
                    }
                    : q,
            ),
        );
    };

    const updateChoice = (questionId: string, choiceIndex: number, value: string) => {
        setQuestions(
            questions.map(q =>
                q.id === questionId
                    ? {
                        ...q,
                        choices: q.choices.map((choice, index) =>
                            index === choiceIndex ? value : choice,
                        ),
                    }
                    : q,
            ),
        );
    };

    const updateCorrectAnswer = (questionId: string, choiceIndex: number) => {
        setQuestions(
            questions.map(q =>
                q.id === questionId ? { ...q, correctAnswerIndex: choiceIndex } : q,
            ),
        );
    };

    const resetFields = () => {
        setName("");
        setQuestions([{ id: "1", question: "", choices: ["", ""], correctAnswerIndex: null }]);
        setDescription("");
        setActive(true);
        setValidationErrors([]);
    };

    const handleSave = async () => {
        const errors: string[] = [];
        setValidationErrors([]);

        // Validation
        if (!name.trim()) {
            errors.push("Name is required.");
        }

        if (questions.length === 0) {
            errors.push("At least one question must be created.");
        }

        questions.forEach((question, index) => {
            if (!question.question.trim()) {
                errors.push(`Question ${index + 1} must have a title.`);
            }

            if (question.choices.length < 2) {
                errors.push(`Question ${index + 1} must have at least 2 choices.`);
            }

            if (
                question.correctAnswerIndex === null ||
                question.correctAnswerIndex < 0 ||
                question.correctAnswerIndex >= question.choices.length
            ) {
                errors.push(`Question ${index + 1} must have exactly 1 correct answer.`);
            }
        });

        if (errors.length > 0) {
            setValidationErrors(errors);
            return;
        }

        const multipleChoiceSet: MultipleChoiceSet = {
            name,
            description,
            active,
            questions: questions.filter(q => q.question.trim() !== ""),
        };

        setLoading(true);

        const multipleChoice: Omit<MultipleChoiceModel, "id"> = {
            timestamp: getTimestamp(),
            ...multipleChoiceSet,
        };

        const res = await createMultipleChoice(multipleChoice);
        if (res !== null) {
            showToast(
                `Multiple choice ${multipleChoice.name} has been created successfully`,
                "Success",
                "success",
            );
            resetFields();
            onClose();
        } else {
            showToast("Error creating multiple choice. Please try again.", "Error", "error");
        }

        setLoading(false);
    };

    const handleAIGenerate = (generatedQuestions: Question[]) => {
        if (
            questions.length === 1 &&
            !questions[0].question &&
            questions[0].choices.every(c => !c)
        ) {
            setQuestions(generatedQuestions);
        } else {
            setQuestions([...questions, ...generatedQuestions]);
        }
    };

    const handleClose = () => {
        resetFields();
        onClose();
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={open => !open && handleClose()}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Create New Multiple Choice Set</DialogTitle>
                    </DialogHeader>

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

                    <div className="space-y-6 mt-4">
                        {/* Basic Info */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="Enter set name"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="active">Active</Label>
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="active"
                                        checked={active}
                                        onCheckedChange={setActive}
                                        className={
                                            active ? "data-[state=checked]:bg-green-400" : ""
                                        }
                                    />
                                    <span
                                        className={`text-sm ${active ? "text-green-600" : "text-red-600"}`}
                                    >
                                        {active ? "Active" : "Inactive"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Input
                                id="description"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Enter description"
                            />
                        </div>

                        {/* AI Generation Button */}
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-medium">Questions</h3>
                            <Button variant="outline" onClick={() => setShowAIModal(true)}>
                                <Sparkles className="w-4 h-4 mr-2" />
                                Generate with AI
                            </Button>
                        </div>

                        {/* Questions */}
                        <div className="space-y-4">
                            {questions.map((question, questionIndex) => (
                                <Card key={question.id}>
                                    <CardHeader className="pb-3">
                                        <div className="flex justify-between items-center">
                                            <CardTitle className="text-base">
                                                Question {questionIndex + 1}
                                            </CardTitle>
                                            {questions.length > 1 && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => removeQuestion(question.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Question</Label>
                                            <Input
                                                value={question.question}
                                                onChange={e =>
                                                    updateQuestion(
                                                        question.id,
                                                        "question",
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="Enter your question"
                                            />
                                        </div>

                                        <div className="space-y-3">
                                            <Label>Choices</Label>
                                            {question.choices.map((choice, choiceIndex) => (
                                                <div
                                                    key={choiceIndex}
                                                    className="flex items-center gap-2"
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            updateCorrectAnswer(
                                                                question.id,
                                                                choiceIndex,
                                                            )
                                                        }
                                                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                                            question.correctAnswerIndex ===
                                                            choiceIndex
                                                                ? "border-green-500 bg-green-500"
                                                                : "border-gray-300"
                                                        }`}
                                                    >
                                                        {question.correctAnswerIndex ===
                                                            choiceIndex && (
                                                            <Circle className="w-2 h-2 fill-white text-white" />
                                                        )}
                                                    </button>
                                                    <Input
                                                        value={choice}
                                                        onChange={e =>
                                                            updateChoice(
                                                                question.id,
                                                                choiceIndex,
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder={`Choice ${choiceIndex + 1}`}
                                                        className="flex-1"
                                                    />
                                                    {question.choices.length > 2 && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() =>
                                                                removeChoice(
                                                                    question.id,
                                                                    choiceIndex,
                                                                )
                                                            }
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            ))}
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => addChoice(question.id)}
                                                className="w-full"
                                            >
                                                <Plus className="h-4 w-4 mr-2" />
                                                Add Choice
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        <div className="flex justify-center">
                            <Button variant="outline" onClick={addQuestion}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Question
                            </Button>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 mt-6">
                        <Button variant="outline" onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={!name.trim() || loading}>
                            {loading ? "Creating..." : "Create"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <MultipleChoiceAIModal
                isOpen={showAIModal}
                onClose={() => setShowAIModal(false)}
                onGenerate={handleAIGenerate}
            />
        </>
    );
}
