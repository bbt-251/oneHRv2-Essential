"use client";

import { useState } from "react";
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
import { getTimestamp } from "@/lib/util/dayjs_format";

interface AddInterviewDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (interview: Omit<InterviewModel, "id">) => void;
}

export default function AddInterviewDialog({ isOpen, onClose, onSubmit }: AddInterviewDialogProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        type: "Transfer" as InterviewType,
        evaluators: "",
        processStarted: false,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            return;
        }

        setLoading(true);

        const evaluatorList = formData.evaluators
            .split(",")
            .map(e => e.trim())
            .filter(e => e.length > 0);

        const interviewData: Omit<InterviewModel, "id"> = {
            name: formData.name,
            type: formData.type,
            evaluators: evaluatorList,
            processStarted: formData.processStarted,
            creationDate: getTimestamp(),
            interviewID: `INT-${Date.now()}`,
        };

        onSubmit(interviewData);
        setLoading(false);

        // Reset form
        setFormData({
            name: "",
            type: "Transfer",
            evaluators: "",
            processStarted: false,
        });
    };

    const handleClose = () => {
        setFormData({
            name: "",
            type: "Transfer",
            evaluators: "",
            processStarted: false,
        });
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="text-gray-900 dark:text-gray-100">
                        Add Interview
                    </DialogTitle>
                    <DialogDescription className="text-gray-600 dark:text-gray-400">
                        Create a new interview for transfer or promotion process.
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
                            {loading ? "Creating..." : "Create Interview"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
