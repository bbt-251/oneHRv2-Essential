"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ShortAnswerModel from "@/lib/models/short-answer";

interface ViewShortAnswerQuestionModalProps {
    isOpen: boolean;
    onClose: () => void;
    question: ShortAnswerModel | null;
}

export default function ViewShortAnswerQuestionModal({
    isOpen,
    onClose,
    question,
}: ViewShortAnswerQuestionModalProps) {
    if (!question) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>View Short Answer Question</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-lg">{question.name}</CardTitle>
                                <Badge variant={question.active ? "default" : "secondary"}>
                                    {question.active ? "Active" : "Inactive"}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h4 className="font-medium text-brand-800 dark:text-white mb-2">
                                    Questions ({question.questions.length}):
                                </h4>
                                <div className="space-y-3">
                                    {question.questions.map((q, index) => (
                                        <div
                                            key={q.id}
                                            className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <h5 className="font-medium text-sm">
                                                    Question {index + 1}
                                                </h5>
                                                <Badge
                                                    variant="outline"
                                                    className="text-blue-600 border-blue-600 text-xs"
                                                >
                                                    {q.wordLimit} words
                                                </Badge>
                                            </div>
                                            <p className="text-brand-600 dark:text-gray-300">
                                                {q.question}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h4 className="font-medium text-brand-800 dark:text-white mb-2">
                                        Total Questions:
                                    </h4>
                                    <Badge
                                        variant="outline"
                                        className="text-blue-600 border-blue-600"
                                    >
                                        {question.questions.length} question
                                        {question.questions.length !== 1 ? "s" : ""}
                                    </Badge>
                                </div>
                                <div>
                                    <h4 className="font-medium text-brand-800 dark:text-white mb-2">
                                        Status:
                                    </h4>
                                    <Badge
                                        variant={question.active ? "default" : "secondary"}
                                        className={
                                            question.active
                                                ? "bg-green-400 hover:bg-green-500"
                                                : "bg-red-400 hover:bg-red-500"
                                        }
                                    >
                                        {question.active ? "Active" : "Inactive"}
                                    </Badge>
                                </div>
                            </div>

                            <div>
                                <h4 className="font-medium text-brand-800 dark:text-white mb-2">
                                    Created:
                                </h4>
                                <p className="text-sm text-gray-500">{question.timestamp}</p>
                            </div>

                            {/* Preview of how the questions would appear to candidates */}
                            <div className="border-t pt-4">
                                <h4 className="font-medium text-brand-800 dark:text-white mb-3">
                                    Candidate Preview:
                                </h4>
                                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border">
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2">
                                            <h5 className="font-medium">{question.name}</h5>
                                            {question.active && (
                                                <Badge
                                                    variant="outline"
                                                    className="text-red-600 border-red-600 text-xs"
                                                >
                                                    Required
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                                            Please answer all {question.questions.length} questions
                                            below:
                                        </p>
                                        {question.questions.map((q, index) => (
                                            <div
                                                key={q.id}
                                                className="space-y-2 border-l-2 border-blue-200 pl-4"
                                            >
                                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    {index + 1}. {q.question}
                                                </p>
                                                <textarea
                                                    className="w-full p-3 border rounded-lg resize-none bg-white dark:bg-gray-700"
                                                    rows={3}
                                                    placeholder="Type your answer here..."
                                                    disabled
                                                />
                                                <p className="text-xs text-gray-500 text-right">
                                                    Word limit: {q.wordLimit} words
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="flex justify-end mt-6">
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
