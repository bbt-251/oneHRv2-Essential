"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { InterviewModel, InterviewType } from "@/lib/models/interview";

interface EditInterviewDialogProps {
    isOpen: boolean;
    onClose: () => void;
    interview: InterviewModel;
    onSubmit: (id: string, updates: Partial<InterviewModel>) => void;
}

export default function EditInterviewDialog({
    isOpen,
    onClose,
    interview,
    onSubmit,
}: EditInterviewDialogProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: interview?.name || "",
        type: interview?.type || ("Transfer" as InterviewType),
        evaluators: interview?.evaluators?.join(", ") || "",
        processStarted: interview?.processStarted || false,
    });

    // Update form when interview changes
    useEffect(() => {
        if (interview) {
            setFormData({
                name: interview.name,
                type: interview.type,
                evaluators: interview.evaluators?.join(", ") || "",
                processStarted: interview.processStarted,
            });
        }
    }, [interview]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim() || !interview?.id) {
            return;
        }

        setLoading(true);

        const evaluatorList = formData.evaluators
            .split(",")
            .map(e => e.trim())
            .filter(e => e.length > 0);

        const updates: Partial<InterviewModel> = {
            name: formData.name,
            type: formData.type,
            evaluators: evaluatorList,
            processStarted: formData.processStarted,
        };

        onSubmit(interview.id!, updates);
        setLoading(false);
    };

    const handleClose = () => {
        setFormData({
            name: interview?.name || "",
            type: interview?.type || "Transfer",
            evaluators: interview?.evaluators?.join(", ") || "",
            processStarted: interview?.processStarted || false,
        });
        onClose();
    };

    if (!interview) return null;

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="text-gray-900 dark:text-gray-100">
                        Edit Interview
                    </DialogTitle>
                    <DialogDescription className="text-gray-600 dark:text-gray-400">
                        Update interview details.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name" className="text-gray-700 dark:text-gray-300">
                                Interview Name *
                            </Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g., Transfer Interview - John Doe"
                                required
                                className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="type" className="text-gray-700 dark:text-gray-300">
                                Type *
                            </Label>
                            <Select
                                value={formData.type}
                                onValueChange={(value: InterviewType) =>
                                    setFormData({ ...formData, type: value })
                                }
                            >
                                <SelectTrigger className="dark:bg-gray-800 dark:border-gray-700">
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                                    <SelectItem value="Transfer" className="dark:text-gray-100">
                                        Transfer
                                    </SelectItem>
                                    <SelectItem value="Promotion" className="dark:text-gray-100">
                                        Promotion
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-2">
                            <Label
                                htmlFor="evaluators"
                                className="text-gray-700 dark:text-gray-300"
                            >
                                Evaluators (comma-separated IDs)
                            </Label>
                            <Textarea
                                id="evaluators"
                                value={formData.evaluators}
                                onChange={e =>
                                    setFormData({ ...formData, evaluators: e.target.value })
                                }
                                placeholder="e.g., emp-001, emp-002, emp-003"
                                rows={3}
                                className="dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100"
                            />
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                Enter employee IDs separated by commas
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="processStarted"
                                checked={formData.processStarted}
                                onChange={e =>
                                    setFormData({ ...formData, processStarted: e.target.checked })
                                }
                                className="w-4 h-4"
                            />
                            <Label
                                htmlFor="processStarted"
                                className="text-sm font-normal text-gray-700 dark:text-gray-300"
                            >
                                Interview process started
                            </Label>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            className="dark:border-gray-700 dark:text-gray-100"
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading || !formData.name.trim()}>
                            {loading ? "Saving..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
