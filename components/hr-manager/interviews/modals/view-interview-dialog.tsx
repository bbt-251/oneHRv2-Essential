"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { InterviewModel } from "@/lib/models/interview";
import { Calendar, Users, FileText } from "lucide-react";

interface ViewInterviewDialogProps {
    isOpen: boolean;
    onClose: () => void;
    interview: InterviewModel;
}

export default function ViewInterviewDialog({
    isOpen,
    onClose,
    interview,
}: ViewInterviewDialogProps) {
    if (!interview) return null;

    const getTypeBadgeColor = (type: string) => {
        switch (type) {
            case "Transfer":
                return "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200";
            case "Promotion":
                return "bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200";
            default:
                return "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200";
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3 text-gray-900 dark:text-gray-100">
                        {interview.name}
                        <Badge className={getTypeBadgeColor(interview.type)}>
                            {interview.type}
                        </Badge>
                    </DialogTitle>
                    <DialogDescription className="text-gray-600 dark:text-gray-400">
                        Interview Details
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    {/* Interview ID */}
                    <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            ID:
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            {interview.interviewID}
                        </span>
                    </div>

                    {/* Creation Date */}
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Created:
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            {interview.creationDate}
                        </span>
                    </div>

                    {/* Evaluators */}
                    <div className="flex items-start gap-2">
                        <Users className="w-4 h-4 text-gray-500 dark:text-gray-400 mt-1" />
                        <div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Evaluators:
                            </span>
                            <div className="mt-1">
                                {interview.evaluators && interview.evaluators.length > 0 ? (
                                    <div className="flex flex-wrap gap-1">
                                        {interview.evaluators.map((evaluator, index) => (
                                            <Badge
                                                key={index}
                                                variant="outline"
                                                className="dark:border-gray-600 dark:text-gray-300"
                                            >
                                                {evaluator}
                                            </Badge>
                                        ))}
                                    </div>
                                ) : (
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                        No evaluators assigned
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Process Status */}
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Status:
                        </span>
                        {interview.processStarted ? (
                            <Badge className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                                In Progress
                            </Badge>
                        ) : (
                            <Badge
                                variant="outline"
                                className="dark:border-gray-600 dark:text-gray-300"
                            >
                                Not Started
                            </Badge>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="dark:border-gray-700 dark:text-gray-100"
                    >
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
