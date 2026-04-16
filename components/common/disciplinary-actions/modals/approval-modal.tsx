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
import type { DisciplinaryActionModel } from "@/lib/models/disciplinary-action";
import { useFirestore } from "@/context/firestore-context";

interface DisciplinaryApprovalModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApprove: (disciplinaryActions: DisciplinaryEntry[]) => void;
    action: DisciplinaryActionModel | null;
}

interface DisciplinaryEntry {
    id: string;
    disciplinaryTypeId: string;
    comments: string;
}

export function DisciplinaryApprovalModal({
    isOpen,
    onClose,
    onApprove,
    action,
}: DisciplinaryApprovalModalProps) {
    const { employees, hrSettings } = useFirestore();
    const [disciplinaryEntries, setDisciplinaryEntries] = useState<DisciplinaryEntry[]>([
        { id: "1", disciplinaryTypeId: "", comments: "" },
    ]);

    const addDisciplinaryEntry = () => {
        const newEntry: DisciplinaryEntry = {
            id: Date.now().toString(),
            disciplinaryTypeId: "",
            comments: "",
        };
        setDisciplinaryEntries([...disciplinaryEntries, newEntry]);
    };

    const removeDisciplinaryEntry = (id: string) => {
        if (disciplinaryEntries.length > 1) {
            setDisciplinaryEntries(disciplinaryEntries.filter(entry => entry.id !== id));
        }
    };

    const updateDisciplinaryEntry = (id: string, field: keyof DisciplinaryEntry, value: string) => {
        setDisciplinaryEntries(
            disciplinaryEntries.map(entry =>
                entry.id === id ? { ...entry, [field]: value } : entry,
            ),
        );
    };

    const handleApprove = () => {
        const validEntries = disciplinaryEntries.filter(
            entry => entry.disciplinaryTypeId && entry.comments.trim(),
        );

        if (validEntries.length > 0) {
            onApprove(validEntries);
            resetForm();
            onClose();
        }
    };

    const resetForm = () => {
        setDisciplinaryEntries([{ id: "1", disciplinaryTypeId: "", comments: "" }]);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const isFormValid = disciplinaryEntries.some(
        entry => entry.disciplinaryTypeId && entry.comments.trim(),
    );

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Approve Disciplinary Action</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {action && (
                        <div className="bg-gray-50 p-4 rounded-lg dark:bg-accent">
                            <h4 className="font-medium text-gray-900 dark:text-foreground mb-2">
                                Action Details
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
                                <strong>Violation:</strong>{" "}
                                {(() => {
                                    const violationType = hrSettings.violationTypes.find(
                                        type => type.id === action.violations[0]?.violationTypeId,
                                    );
                                    return violationType
                                        ? violationType.name
                                        : action.violations[0]?.violationTypeId;
                                })()}
                            </p>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium">Disciplinary Actions</Label>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={addDisciplinaryEntry}
                                className="flex items-center gap-2 bg-transparent"
                            >
                                <Plus className="h-4 w-4" />
                                Add Action
                            </Button>
                        </div>

                        {disciplinaryEntries.map((entry, index) => (
                            <div
                                key={entry.id}
                                className="border rounded-lg p-4 space-y-4 bg-gray-50 dark:bg-accent/50"
                            >
                                <div className="flex items-center justify-between">
                                    <h5 className="font-medium text-sm">Action {index + 1}</h5>
                                    {disciplinaryEntries.length > 1 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeDisciplinaryEntry(entry.id)}
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label
                                            htmlFor={`disciplinary-type-${entry.id}`}
                                            className="text-sm font-medium"
                                        >
                                            Disciplinary Type{" "}
                                            <span className="text-red-500">*</span>
                                        </Label>
                                        <Select
                                            value={entry.disciplinaryTypeId}
                                            onValueChange={value =>
                                                updateDisciplinaryEntry(
                                                    entry.id,
                                                    "disciplinaryTypeId",
                                                    value,
                                                )
                                            }
                                        >
                                            <SelectTrigger className="w-full mt-1">
                                                <SelectValue placeholder="Select disciplinary type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {hrSettings.disciplinaryTypes.map(type => (
                                                    <SelectItem key={type.id} value={type.id}>
                                                        {type.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <Label
                                            htmlFor={`comments-${entry.id}`}
                                            className="text-sm font-medium"
                                        >
                                            Comments <span className="text-red-500">*</span>
                                        </Label>
                                        <Textarea
                                            id={`comments-${entry.id}`}
                                            placeholder="Enter comments for this disciplinary action..."
                                            value={entry.comments}
                                            onChange={e =>
                                                updateDisciplinaryEntry(
                                                    entry.id,
                                                    "comments",
                                                    e.target.value,
                                                )
                                            }
                                            className="mt-1 min-h-[80px]"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button variant="outline" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleApprove}
                        disabled={!isFormValid}
                        className="bg-green-600 hover:bg-green-700 text-white"
                    >
                        Approve Action
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
