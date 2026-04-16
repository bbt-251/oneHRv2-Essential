"use client";

import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";
import RichTextEditor from "../rich-text-editor";
import { KeywordEditor } from "./key-word-editor";
import { CompetencySelector } from "./competency-selector";
import { HrSettingsByType } from "@/context/firestore-context";
import { cn } from "@/lib/utils";

interface PositionDialogProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    mode: "add" | "edit";
    steps: string[];
    step: number;
    setStep: (step: number) => void;
    progress: number;
    form: any;
    setForm: (form: any) => void;
    hrSettings: HrSettingsByType;
    availableCompetencies: any[];
    workflowStepOptions: string[];
    stepSelectValue: string;
    handleSave: () => void;
    saveLoading: boolean;
}

const PositionDialog: React.FC<PositionDialogProps> = ({
    open,
    setOpen,
    mode,
    steps,
    step,
    setStep,
    progress,
    form,
    setForm,
    hrSettings,
    availableCompetencies,
    workflowStepOptions,
    stepSelectValue,
    handleSave,
    saveLoading,
}) => {
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-4xl rounded-2xl overflow-y-auto max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>{mode === "add" ? "Add Position" : "Edit Position"}</DialogTitle>
                </DialogHeader>

                {/* Stepper */}
                <div className="space-y-3">
                    <div className="flex items-center gap-4">
                        {steps.map((label, idx) => {
                            const completed = idx < step;
                            const active = idx === step;
                            return (
                                <button
                                    key={label}
                                    type="button"
                                    onClick={() => setStep(idx)}
                                    className={cn(
                                        "flex items-center gap-2",
                                        active
                                            ? "text-amber-700"
                                            : completed
                                                ? "text-emerald-600"
                                                : "text-slate-500",
                                    )}
                                    aria-current={active ? "step" : undefined}
                                >
                                    <span
                                        className={cn(
                                            "h-7 w-7 rounded-full grid place-items-center border text-sm",
                                            active &&
                                                "bg-amber-100 border-amber-600 text-amber-700",
                                            completed &&
                                                "bg-emerald-100 border-emerald-600 text-emerald-700",
                                            !active &&
                                                !completed &&
                                                "bg-slate-100 border-slate-300",
                                        )}
                                    >
                                        {idx + 1}
                                    </span>
                                    <span className="text-sm font-medium">{label}</span>
                                </button>
                            );
                        })}
                    </div>
                    <Progress value={progress} className="h-2" />
                </div>

                {/* Form Content */}
                {form && (
                    <div className="space-y-4">
                        {/* Step 0 */}
                        {step === 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Position Name</Label>
                                    <Input
                                        id="name"
                                        value={form.name}
                                        onChange={e => setForm({ ...form, name: e.target.value })}
                                        placeholder="e.g., Senior Developer"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="grade">Grade</Label>
                                    <Select
                                        value={form.grade}
                                        onValueChange={v => setForm({ ...form, grade: v })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select grade" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {hrSettings.grades
                                                ?.filter(g => g.active === "Yes")
                                                ?.map(grade => (
                                                    <SelectItem key={grade.id} value={grade.id}>
                                                        {grade.grade}
                                                    </SelectItem>
                                                ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="band">Band</Label>
                                    <Input
                                        id="band"
                                        value={form.band || ""}
                                        onChange={e => setForm({ ...form, band: e.target.value })}
                                        placeholder="e.g., B3"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="startDate">Start Date</Label>
                                    <Input
                                        id="startDate"
                                        type="date"
                                        value={form.startDate}
                                        onChange={e =>
                                            setForm({ ...form, startDate: e.target.value })
                                        }
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="endDate">End Date</Label>
                                    <Input
                                        id="endDate"
                                        type="date"
                                        value={form.endDate}
                                        onChange={e =>
                                            setForm({ ...form, endDate: e.target.value })
                                        }
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="active">Active</Label>
                                    <Select
                                        value={form.active}
                                        onValueChange={v =>
                                            setForm({ ...form, active: v as "Yes" | "No" })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Yes">Yes</SelectItem>
                                            <SelectItem value="No">No</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="critical">Critical</Label>
                                    <Select
                                        value={form.critical}
                                        onValueChange={v =>
                                            setForm({ ...form, critical: v as "Yes" | "No" })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Yes">Yes</SelectItem>
                                            <SelectItem value="No">No</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}

                        {/* Step 1 */}
                        {step === 1 && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="positionDescription">
                                        Position Description
                                    </Label>
                                    <RichTextEditor
                                        value={form.positionDescription}
                                        onChange={value =>
                                            setForm({ ...form, positionDescription: value })
                                        }
                                        placeholder="Enter detailed position description..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="keys">Keywords</Label>
                                    <KeywordEditor
                                        values={form.keys}
                                        onChange={keys => setForm({ ...form, keys })}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Step 2 */}
                        {step === 2 && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Associated Competencies</Label>
                                    <CompetencySelector
                                        selectedCompetencies={form.competencies}
                                        availableCompetencies={availableCompetencies}
                                        onCompetenciesChange={competencies =>
                                            setForm({ ...form, competencies })
                                        }
                                        positionName={form.name}
                                        hrSettings={hrSettings}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Step 3 */}
                        {step === 3 && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="additionalInformation">
                                        Additional Information
                                    </Label>
                                    <Textarea
                                        id="additionalInformation"
                                        value={form.additionalInformation || ""}
                                        onChange={e =>
                                            setForm({
                                                ...form,
                                                additionalInformation: e.target.value,
                                            })
                                        }
                                        placeholder="Any additional information..."
                                        rows={4}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="companyProfile">Company Profile</Label>
                                    <Textarea
                                        id="companyProfile"
                                        value={form.companyProfile || ""}
                                        onChange={e =>
                                            setForm({ ...form, companyProfile: e.target.value })
                                        }
                                        placeholder="Company profile information"
                                        disabled={form.companyProfileUsed || false}
                                        rows={4}
                                    />
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="companyProfileUsed"
                                        checked={form.companyProfileUsed || false}
                                        onCheckedChange={checked =>
                                            setForm({
                                                ...form,
                                                companyProfileUsed: checked as boolean,
                                            })
                                        }
                                    />
                                    <Label htmlFor="companyProfileUsed">Use Company Profile</Label>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="step">Workflow Step</Label>
                                    <Select
                                        value={stepSelectValue}
                                        onValueChange={v =>
                                            setForm({ ...form, step: v === "none" ? null : v })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select workflow step" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">None</SelectItem>
                                            {workflowStepOptions.map(option => (
                                                <SelectItem key={option} value={option}>
                                                    {option}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between pt-4">
                    <Button
                        variant="outline"
                        onClick={() => setStep(Math.max(0, step - 1))}
                        disabled={step === 0}
                    >
                        Previous
                    </Button>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        {step === steps.length - 1 ? (
                            <Button
                                className="bg-amber-600 hover:bg-amber-700 text-white"
                                onClick={handleSave}
                            >
                                {saveLoading ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <Loader2 className="animate-spin h-4 w-4" />
                                        {mode === "add" ? "Adding..." : "Saving..."}
                                    </div>
                                ) : mode === "add" ? (
                                    "Add"
                                ) : (
                                    "Save"
                                )}
                            </Button>
                        ) : (
                            <Button
                                className="bg-amber-600 hover:bg-amber-700 text-white"
                                onClick={() => setStep(Math.min(steps.length - 1, step + 1))}
                            >
                                Next
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default PositionDialog;
