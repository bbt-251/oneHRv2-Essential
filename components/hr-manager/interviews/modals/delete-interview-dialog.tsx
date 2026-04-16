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
import { InterviewModel } from "@/lib/models/interview";

interface DeleteInterviewDialogProps {
    isOpen: boolean;
    onClose: () => void;
    interview: InterviewModel;
    onConfirm: () => void;
}

export default function DeleteInterviewDialog({
    isOpen,
    onClose,
    interview,
    onConfirm,
}: DeleteInterviewDialogProps) {
    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    if (!interview) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle className="text-gray-900 dark:text-gray-100">
                        Delete Interview
                    </DialogTitle>
                    <DialogDescription className="text-gray-600 dark:text-gray-400">
                        Are you sure you want to delete the interview "{interview.name}"? This
                        action cannot be undone.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md p-4">
                        <p className="text-sm text-red-800 dark:text-red-200">
                            <strong>Warning:</strong> This will permanently delete this interview
                            and all associated data.
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="dark:border-gray-700 dark:text-gray-100"
                    >
                        Cancel
                    </Button>
                    <Button variant="destructive" onClick={handleConfirm}>
                        Delete Interview
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
