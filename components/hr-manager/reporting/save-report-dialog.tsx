"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { HrSavedReport } from "./report-types";

interface SaveReportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (name: string, description: string) => void;
    existingReport?: HrSavedReport | null;
}

export function SaveReportDialog({
    open,
    onOpenChange,
    onSave,
    existingReport,
}: SaveReportDialogProps) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");

    useEffect(() => {
        if (existingReport) {
            setName(existingReport.name);
            setDescription(existingReport.description);
        } else if (open) {
            setName("");
            setDescription("");
        }
    }, [existingReport, open]);

    const handleSave = () => {
        if (!name.trim()) return;
        onSave(name.trim(), description.trim());
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {existingReport ? "Update HR Report" : "Save HR Report"}
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div className="space-y-1">
                        <Label htmlFor="report-name">Name</Label>
                        <Input
                            id="report-name"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g. Objective Compliance by Department"
                        />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="report-description">Description</Label>
                        <Input
                            id="report-description"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Optional description for this report"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={!name.trim()}>
                        {existingReport ? "Update" : "Save"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
