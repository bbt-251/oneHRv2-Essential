"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { DisciplinaryActionModel } from "@/lib/models/disciplinary-action";
import { useFirestore } from "@/context/firestore-context";

interface AppealApprovalModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApprove: () => void;
    onReject: () => void;
    action: DisciplinaryActionModel | null;
    mode: "approve" | "reject";
}

interface DisciplinaryEntry {
    id: string;
    disciplinaryType: string;
    comments: string;
}

const disciplinaryTypes = [
    "Verbal Warning",
    "Written Warning",
    "Final Written Warning",
    "Suspension without Pay",
    "Demotion",
    "Termination",
    "Performance Improvement Plan",
    "Training Required",
    "Counseling Session",
    "Probation Extension",
];

export function AppealApprovalModal({
    isOpen,
    onClose,
    onApprove,
    onReject,
    action,
    mode,
}: AppealApprovalModalProps) {
    const { employees } = useFirestore();

    const handleApprove = () => {
        onApprove();
        onClose();
    };

    const handleReject = () => {
        onReject();
        onClose();
    };

    const handleClose = () => {
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Review Employee Appeal</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {action && (
                        <>
                            {/* Action Details */}
                            <div className="bg-gray-50 p-4 rounded-lg dark:bg-accent">
                                <h4 className="font-medium text-gray-900 dark:text-foreground mb-2">
                                    Appeal Details
                                </h4>
                                <p className="text-sm text-gray-600 dark:text-muted-foreground">
                                    <strong>Employee:</strong>{" "}
                                    {(() => {
                                        const employee = employees.find(
                                            emp => emp.uid === action.employeeUid,
                                        );
                                        return employee
                                            ? `${employee.firstName} ${employee.surname}`
                                            : "Unknown Employee";
                                    })()}{" "}
                                    (
                                    {(() => {
                                        const employee = employees.find(
                                            emp => emp.uid === action.employeeUid,
                                        );
                                        return employee?.employeeID || "Unknown ID";
                                    })()}
                                    )
                                </p>
                                <p className="text-sm text-gray-600 dark:text-muted-foreground">
                                    <strong>Original Violation:</strong>{" "}
                                    {action.violations[0]?.violationType}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-muted-foreground">
                                    <strong>Appeal Reason:</strong> Employee has appealed this
                                    disciplinary action
                                </p>
                            </div>

                            {/* Employee Comments */}
                            <div className="space-y-3">
                                <h4 className="font-semibold text-gray-900 dark:text-foreground">
                                    Employee Comments
                                </h4>
                                {action.employeeComments && action.employeeComments.length > 0 ? (
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
                                                        {new Date(
                                                            comment.timestamp,
                                                        ).toLocaleString()}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600 dark:text-muted-foreground">
                                                    {comment.content}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 dark:text-muted-foreground italic">
                                        No comments from employee.
                                    </p>
                                )}
                            </div>
                        </>
                    )}
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button variant="outline" onClick={handleClose}>
                        Cancel
                    </Button>
                    {mode === "approve" && (
                        <Button
                            onClick={handleApprove}
                            className="bg-green-600 hover:bg-green-700 text-white"
                        >
                            Approve Appeal
                        </Button>
                    )}
                    {mode === "reject" && (
                        <Button
                            variant="destructive"
                            onClick={handleReject}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            Reject Appeal
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
