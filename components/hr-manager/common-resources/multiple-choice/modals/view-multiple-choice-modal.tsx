"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Circle } from "lucide-react";
import MultipleChoiceModel from "@/lib/models/multiple-choice";

interface ViewMultipleChoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    multipleChoice: MultipleChoiceModel | null;
}

export default function ViewMultipleChoiceModal({
    isOpen,
    onClose,
    multipleChoice,
}: ViewMultipleChoiceModalProps) {
    if (!multipleChoice) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3">
                        {multipleChoice.name}
                        <Badge variant={multipleChoice.active ? "default" : "secondary"}>
                            {multipleChoice.active ? "Active" : "Inactive"}
                        </Badge>
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                    {/* Basic Info */}
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Description
                            </h3>
                            <p className="text-sm text-gray-900 dark:text-white">
                                {multipleChoice.description || "No description provided"}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Created
                                </h3>
                                <p className="text-sm text-gray-900 dark:text-white">
                                    {multipleChoice.timestamp}
                                </p>
                            </div>
                            <div>
                                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Total Questions
                                </h3>
                                <p className="text-sm text-gray-900 dark:text-white">
                                    {multipleChoice.questions.length} question
                                    {multipleChoice.questions.length !== 1 ? "s" : ""}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Questions */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">Questions</h3>
                        {multipleChoice.questions.map((question, questionIndex) => (
                            <Card key={question.id}>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base">
                                        Question {questionIndex + 1}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Question
                                        </h4>
                                        <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 p-3 rounded">
                                            {question.question}
                                        </p>
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Choices
                                        </h4>
                                        <div className="space-y-2">
                                            {question.choices.map((choice, choiceIndex) => (
                                                <div
                                                    key={choiceIndex}
                                                    className={`flex items-center gap-3 p-3 rounded border ${
                                                        question.correctAnswerIndex === choiceIndex
                                                            ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20"
                                                            : "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-center w-6 h-6">
                                                        {question.correctAnswerIndex ===
                                                        choiceIndex ? (
                                                                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                                                            ) : (
                                                                <Circle className="w-5 h-5 text-gray-400" />
                                                            )}
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400 min-w-[20px]">
                                                        {String.fromCharCode(65 + choiceIndex)}.
                                                    </span>
                                                    <span
                                                        className={`text-sm flex-1 ${
                                                            question.correctAnswerIndex ===
                                                            choiceIndex
                                                                ? "text-green-800 dark:text-green-200 font-medium"
                                                                : "text-gray-900 dark:text-white"
                                                        }`}
                                                    >
                                                        {choice}
                                                    </span>
                                                    {question.correctAnswerIndex ===
                                                        choiceIndex && (
                                                        <Badge
                                                            variant="outline"
                                                            className="text-green-600 border-green-600 dark:text-green-400 dark:border-green-400"
                                                        >
                                                            Correct Answer
                                                        </Badge>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end mt-6">
                    <Button onClick={onClose}>Close</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
