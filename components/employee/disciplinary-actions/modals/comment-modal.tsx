"use client";

import type React from "react";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { DisciplinaryActionModel } from "@/lib/models/disciplinary-action";
import { useFirestore } from "@/context/firestore-context";
import getFullName from "@/lib/util/getEmployeeFullName";
import { EmployeeModel } from "@/lib/models/employee";
import { dateFormat, timestampFormat } from "@/lib/util/dayjs_format";
import dayjs from "dayjs";

interface CommentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (comment: string) => void;
    action: DisciplinaryActionModel | null;
}

export function CommentModal({ isOpen, onClose, onSubmit, action }: CommentModalProps) {
    const { employees, hrSettings } = useFirestore();
    const [comment, setComment] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (comment.trim()) {
            onSubmit(comment.trim());
            setComment("");
        }
    };

    const handleClose = () => {
        setComment("");
        onClose();
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "Waiting HR Approval":
                return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
            case "Raised":
                return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
            case "Accepted By Employee":
                return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
            case "Appealed":
                return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
            case "Appeal Approved":
                return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
            case "Appeal Refused":
                return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
            case "Under Review":
                return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300";
            case "Approved":
                return "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300";
            case "Rejected":
                return "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300";
            default:
                return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
        }
    };

    const getOccurrenceLevelColor = (level: string) => {
        switch (level) {
            case "Minor":
                return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
            case "Major":
                return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
            case "Critical":
                return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
            default:
                return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add Comment to Disciplinary Action</DialogTitle>
                </DialogHeader>

                {action && (
                    <div className="space-y-6">
                        {/* Action Details */}
                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-gray-900 dark:text-foreground">
                                    Action Details
                                </h3>
                                <div className="flex items-center gap-2">
                                    <Badge className={getStatusColor(action.status)}>
                                        {action.status}
                                    </Badge>
                                    <Badge
                                        className={getOccurrenceLevelColor(action.occurrenceLevel)}
                                    >
                                        {action.occurrenceLevel}
                                    </Badge>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="font-medium text-gray-700 dark:text-gray-300">
                                        ID:
                                    </span>
                                    <span className="ml-2 text-gray-600 dark:text-muted-foreground">
                                        {action.actionID}
                                    </span>
                                </div>
                                <div>
                                    <span className="font-medium text-gray-700 dark:text-gray-300">
                                        Reported By:
                                    </span>
                                    <span className="ml-2 text-gray-600 dark:text-muted-foreground">
                                        {getFullName(
                                            employees.find(e => e.uid == action.createdBy) ??
                                                ({} as EmployeeModel),
                                        )}
                                    </span>
                                </div>
                                <div>
                                    <span className="font-medium text-gray-700 dark:text-gray-300">
                                        Violation Type:
                                    </span>
                                    <span className="ml-2 text-gray-600 dark:text-muted-foreground">
                                        {(() => {
                                            const violationType = hrSettings.violationTypes.find(
                                                type =>
                                                    type.id ===
                                                    action.violations[0]?.violationTypeId,
                                            );
                                            return violationType
                                                ? violationType.name
                                                : action.violations[0]?.violationTypeId;
                                        })()}
                                    </span>
                                </div>
                                <div>
                                    <span className="font-medium text-gray-700 dark:text-gray-300">
                                        Date:
                                    </span>
                                    <span className="ml-2 text-gray-600 dark:text-muted-foreground">
                                        {dayjs(action.violationDateAndTime).format(timestampFormat)}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <span className="font-medium text-gray-700 dark:text-gray-300">
                                    Details:
                                </span>
                                <p className="mt-1 text-gray-600 dark:text-muted-foreground">
                                    {action.violations[0]?.details}
                                </p>
                            </div>
                        </div>

                        {/* Existing Comments */}
                        {action.employeeComments.length > 0 && (
                            <div className="space-y-3">
                                <h4 className="font-semibold text-gray-900 dark:text-foreground">
                                    Previous Comments
                                </h4>
                                <div className="space-y-3 max-h-40 overflow-y-auto">
                                    {action.employeeComments.map(comment => (
                                        <div
                                            key={comment.id}
                                            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-medium text-sm text-gray-900 dark:text-foreground">
                                                    {comment.author}
                                                </span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    {comment.timestamp}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-muted-foreground">
                                                {comment.content}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Add Comment Form */}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label htmlFor="comment">Your Comment</Label>
                                <Textarea
                                    id="comment"
                                    placeholder="Enter your comment or response..."
                                    value={comment}
                                    onChange={e => setComment(e.target.value)}
                                    rows={4}
                                    className="mt-1"
                                    required
                                />
                            </div>

                            <div className="flex justify-end gap-3">
                                <Button type="button" variant="outline" onClick={handleClose}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={!comment.trim()}>
                                    Add Comment
                                </Button>
                            </div>
                        </form>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
