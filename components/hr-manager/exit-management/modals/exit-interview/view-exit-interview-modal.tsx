"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ExitInterviewQuestionModel from "@/lib/models/exit-interview-questions";
import { Clock } from "lucide-react";

interface ViewExitInterviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    exitInterview: ExitInterviewQuestionModel | null;
}

export default function ViewExitInterviewModal({
    isOpen,
    onClose,
    exitInterview,
}: ViewExitInterviewModalProps) {
    if (!exitInterview) return null;

    const totalQuestions =
        exitInterview.multipleChoiceQuestions.length + exitInterview.shortAnswerQuestions.length;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>View Exit Interview Question Set</DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Basic Info */}
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-lg font-semibold text-brand-800 dark:text-white mb-2">
                                {exitInterview.name}
                            </h3>
                            <div className="flex items-center gap-4">
                                <Badge variant={exitInterview.active ? "default" : "secondary"}>
                                    {exitInterview.active ? "Active" : "Inactive"}
                                </Badge>
                                <span className="text-sm text-brand-600 dark:text-gray-300">
                                    Passing Score: {exitInterview.passingScore}%
                                </span>
                                {exitInterview.timerEnabled && (
                                    <div className="flex items-center gap-1 text-sm text-brand-600 dark:text-gray-300">
                                        <Clock className="w-4 h-4" />
                                        Timer: {exitInterview.timer} mins
                                    </div>
                                )}
                                <span className="text-sm text-brand-600 dark:text-gray-300">
                                    Created: {exitInterview.timestamp}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Multiple Choice Questions */}
                    {exitInterview.multipleChoiceQuestions.length > 0 && (
                        <div className="space-y-4">
                            <h4 className="font-medium text-brand-800 dark:text-white">
                                Multiple Choice Questions (
                                {exitInterview.multipleChoiceQuestions.length})
                            </h4>
                            <div className="space-y-3">
                                {exitInterview.multipleChoiceQuestions.map((question, index) => (
                                    <div
                                        key={question.id}
                                        className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <h5 className="font-medium text-brand-800 dark:text-white mb-1">
                                                    {index + 1}. {question.title}
                                                </h5>
                                                <div className="text-sm text-brand-600 dark:text-gray-300">
                                                    Weight: {question.weight}%
                                                </div>
                                            </div>
                                            <div className="flex gap-2 ml-4">
                                                <Badge variant="outline">
                                                    {question.weight}% weight
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Short Answer Questions */}
                    {exitInterview.shortAnswerQuestions.length > 0 && (
                        <div className="space-y-4">
                            <h4 className="font-medium text-brand-800 dark:text-white">
                                Short Answer Questions ({exitInterview.shortAnswerQuestions.length})
                            </h4>
                            <div className="space-y-3">
                                {exitInterview.shortAnswerQuestions.map((question, index) => (
                                    <div
                                        key={question.id}
                                        className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <h5 className="font-medium text-brand-800 dark:text-white mb-1">
                                                    {index + 1}. {question.title}
                                                </h5>
                                                <div className="text-sm text-brand-600 dark:text-gray-300">
                                                    Weight: {question.weight}% • Grading Severity:{" "}
                                                    {question.gradingSeverity}%
                                                </div>
                                            </div>
                                            <div className="flex gap-2 ml-4">
                                                <Badge variant="outline">
                                                    {question.weight}% weight
                                                </Badge>
                                                <Badge variant="outline">
                                                    Severity: {question.gradingSeverity}%
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Summary */}
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                            Exit Interview Summary
                        </h4>
                        <div className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                            <p>• Total questions: {totalQuestions}</p>
                            <p>• Multiple choice: {exitInterview.multipleChoiceQuestions.length}</p>
                            <p>• Short answer: {exitInterview.shortAnswerQuestions.length}</p>
                            <p>• Passing score required: {exitInterview.passingScore}%</p>
                            <p>• Timer enabled: {exitInterview.timerEnabled ? "Yes" : "No"}</p>
                            {exitInterview.timerEnabled && (
                                <p>• Timer duration: {exitInterview.timer} minutes</p>
                            )}
                            <p>• Status: {exitInterview.active ? "Active" : "Inactive"}</p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end pt-4 border-t">
                        <Button variant="outline" onClick={onClose}>
                            Close
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
