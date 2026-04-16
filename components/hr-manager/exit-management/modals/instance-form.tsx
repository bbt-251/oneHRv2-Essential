"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    Command,
    CommandInput,
    CommandList,
    CommandEmpty,
    CommandGroup,
    CommandItem,
} from "@/components/ui/command";
import { ChevronsUpDown, Check, Settings, Plus, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFirestore } from "@/context/firestore-context";
import getFullName from "@/lib/util/getEmployeeFullName";
import { ExitInstanceModel } from "@/lib/models/exit-instance";

export interface ExtendedExitInstance extends ExitInstanceModel {
    exitEmployeePosition: string;
    exitEmployeeName: string;
}

interface ExitInstanceFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (instance: Omit<ExtendedExitInstance, "id">) => void;
    editingInstance: ExtendedExitInstance | null;
}

const DEFAULT_EXIT_REASONS = [
    "Career Growth",
    "Relocation",
    "Better Compensation",
    "Performance Issues",
    "Personal Reasons",
    "Health Issues",
    "Retirement",
];

export function ExitInstanceFormModal({
    isOpen,
    onClose,
    onSave,
    editingInstance,
}: ExitInstanceFormModalProps) {
    const { activeEmployees, hrSettings, exitChecklists, exitInterviewQuestions, documents } =
        useFirestore();
    const positions = hrSettings.positions;
    const [formData, setFormData] = useState<Omit<ExtendedExitInstance, "id">>({
        timestamp: new Date().toISOString(),
        exitID: "",
        exitEmployeeUID: "",
        exitEmployeeName: "",
        exitEmployeePosition: "",
        exitType: "",
        exitReason: "",
        exitReasonDescription: "",
        exitChecklist: {
            checklistId: "",
            items: [],
        },
        exitInterview: "",
        exitDocument: "",
        exitDocumentTemplateId: null,
        eligibleToRehire: true,
        remarks: "",
        exitLastDate: "",
        exitEffectiveDate: "",
        effectiveDateAccepted: false,
    });

    const [employeeSearchOpen, setEmployeeSearchOpen] = useState(false);
    const [customExitReasons, setCustomExitReasons] = useState<string[]>([]);
    const [reasonManagementOpen, setReasonManagementOpen] = useState(false);
    const [newReason, setNewReason] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (editingInstance) {
            setFormData(editingInstance);
        } else {
            setFormData({
                timestamp: new Date().toISOString(),
                exitID: `EXIT-${Date.now().toString().slice(-6)}`,
                exitEmployeeUID: "",
                exitEmployeeName: "",
                exitEmployeePosition: "",
                exitType: "",
                exitReason: "",
                exitReasonDescription: "",
                exitChecklist: {
                    checklistId: "",
                    items: [],
                },
                exitInterview: "",
                exitDocument: "",
                exitDocumentTemplateId: null,
                eligibleToRehire: true,
                remarks: "",
                exitLastDate: "",
                exitEffectiveDate: "",
                effectiveDateAccepted: false,
            });
        }
    }, [editingInstance, isOpen]);

    const handleChange = (field: keyof ExtendedExitInstance, value: any) => {
        if (field == "exitChecklist") {
            setFormData({ ...formData, [field]: { checklistId: value, items: [] } });
        } else {
            setFormData({ ...formData, [field]: value });
        }
    };

    const handleEmployeeSelect = (employeeId: string) => {
        const employee = activeEmployees.find(emp => emp.uid === employeeId);
        if (employee) {
            setFormData({
                ...formData,
                exitEmployeeUID: employeeId,
                exitEmployeePosition:
                    positions.find(p => p.id == employee.employmentPosition)?.name ?? "",
            });
        }
        setEmployeeSearchOpen(false);
    };

    const handleAddReason = () => {
        if (newReason.trim() && !customExitReasons.includes(newReason.trim())) {
            setCustomExitReasons([...customExitReasons, newReason.trim()]);
            setNewReason("");
        }
    };

    const handleRemoveReason = (reason: string) => {
        setCustomExitReasons(customExitReasons.filter(r => r !== reason));
    };

    const allExitReasons = [...DEFAULT_EXIT_REASONS, ...customExitReasons];

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            await onSave(formData);
        } finally {
            setIsSubmitting(false);
        }
    };

    const selectedEmployee = activeEmployees.find(emp => emp.uid === formData.exitEmployeeUID);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 z-[100]">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-semibold text-brand-800 dark:text-foreground">
                        {editingInstance ? "Edit Exit Instance" : "Create New Exit Instance"}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 mt-6">
                    {/* Read-only fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div>
                            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Timestamp
                            </Label>
                            <Input
                                value={new Date(formData.timestamp).toLocaleString()}
                                disabled
                                className="mt-1 bg-gray-100 dark:bg-gray-700"
                            />
                        </div>
                        <div>
                            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Exit ID
                            </Label>
                            <Input
                                value={formData.exitID}
                                disabled
                                className="mt-1 bg-gray-100 dark:bg-gray-700"
                            />
                        </div>
                    </div>

                    {/* Employee Information */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-brand-800 dark:text-foreground">
                            Employee Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label>
                                    Employee <span className="text-red-500">*</span>
                                </Label>
                                <Popover
                                    open={employeeSearchOpen}
                                    onOpenChange={setEmployeeSearchOpen}
                                >
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={employeeSearchOpen}
                                            className="w-full justify-between border-gray-400 dark:border-gray-500 mt-1 bg-transparent"
                                        >
                                            {selectedEmployee ? (
                                                <span className="flex items-center gap-2">
                                                    <span className="font-medium">
                                                        {selectedEmployee.employeeID}
                                                    </span>
                                                    <span className="text-gray-500">
                                                        - {getFullName(selectedEmployee)}
                                                    </span>
                                                </span>
                                            ) : (
                                                <span className="text-gray-500">
                                                    Search employee...
                                                </span>
                                            )}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent
                                        className="p-0 bg-white dark:bg-gray-800 border-gray-400 dark:border-gray-500 z-[150]"
                                        align="start"
                                        style={{ width: "var(--radix-popover-trigger-width)" }}
                                    >
                                        <Command className="bg-white dark:bg-gray-800">
                                            <CommandInput
                                                placeholder="Search employees..."
                                                className="h-9 focus:ring-0 focus:outline-none"
                                            />
                                            <CommandList>
                                                <CommandEmpty>No employee found.</CommandEmpty>
                                                <CommandGroup>
                                                    {activeEmployees.map(employee => (
                                                        <CommandItem
                                                            key={employee.uid}
                                                            value={employee.uid}
                                                            onSelect={() =>
                                                                handleEmployeeSelect(employee.uid)
                                                            }
                                                            className="cursor-pointer"
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    formData.exitEmployeeUID ===
                                                                        employee.uid
                                                                        ? "opacity-100"
                                                                        : "opacity-0",
                                                                )}
                                                            />
                                                            <div className="flex flex-col">
                                                                <span className="font-medium">
                                                                    {employee.employeeID} -{" "}
                                                                    {getFullName(employee)}
                                                                </span>
                                                            </div>
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div>
                                <Label>Employee Position</Label>
                                <Input
                                    value={formData.exitEmployeePosition ?? ""}
                                    disabled
                                    placeholder="Auto-populated from employee"
                                    className="border-gray-400 dark:border-gray-500 bg-gray-100 dark:bg-gray-700 mt-1"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Exit Details */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-brand-800 dark:text-foreground">
                            Exit Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label>
                                    Exit Type <span className="text-red-500">*</span>
                                </Label>
                                <Select
                                    value={formData.exitType}
                                    onValueChange={value => handleChange("exitType", value)}
                                >
                                    <SelectTrigger className="border-gray-400 dark:border-gray-500">
                                        <SelectValue placeholder="Select exit type" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white dark:bg-gray-800 border-gray-400 dark:border-gray-500 z-[150]">
                                        <SelectItem value="Voluntary">Voluntary</SelectItem>
                                        <SelectItem value="Involuntary">Involuntary</SelectItem>
                                        <SelectItem value="Retirement">Retirement</SelectItem>
                                        <SelectItem value="End of Contract">
                                            End of Contract
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <Label>
                                        Exit Reason <span className="text-red-500">*</span>
                                    </Label>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setReasonManagementOpen(true)}
                                        className="h-7 px-2 text-xs text-brand-600 hover:text-brand-700 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-900/20"
                                    >
                                        <Settings className="h-3 w-3 mr-1" />
                                        Manage Reasons
                                    </Button>
                                </div>
                                <Select
                                    value={formData.exitReason}
                                    onValueChange={value => handleChange("exitReason", value)}
                                >
                                    <SelectTrigger className="border-gray-400 dark:border-gray-500">
                                        <SelectValue placeholder="Select exit reason" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white dark:bg-gray-800 border-gray-400 dark:border-gray-500 z-[150]">
                                        {allExitReasons.map(reason => (
                                            <SelectItem key={reason} value={reason}>
                                                {reason}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div>
                            <Label>Exit Reason Description</Label>
                            <Textarea
                                value={formData.exitReasonDescription ?? ""}
                                onChange={e =>
                                    handleChange("exitReasonDescription", e.target.value)
                                }
                                placeholder="Provide detailed description of exit reason"
                                rows={3}
                                className="border-gray-400 dark:border-gray-500"
                            />
                        </div>
                    </div>

                    {/* Dates */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-brand-800 dark:text-foreground">
                            Important Dates
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label>
                                    Exit Last Date <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    type="date"
                                    value={formData.exitLastDate}
                                    onChange={e => handleChange("exitLastDate", e.target.value)}
                                    className="border-gray-400 dark:border-gray-500"
                                />
                            </div>
                            <div>
                                <Label>
                                    Exit Effective Date <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    type="date"
                                    value={formData.exitEffectiveDate}
                                    onChange={e =>
                                        handleChange("exitEffectiveDate", e.target.value)
                                    }
                                    className="border-gray-400 dark:border-gray-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Exit Process */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-brand-800 dark:text-foreground">
                            Exit Process
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <Label>Exit Checklist</Label>
                                <Select
                                    value={formData.exitChecklist.checklistId}
                                    onValueChange={value => handleChange("exitChecklist", value)}
                                >
                                    <SelectTrigger className="border-gray-400 dark:border-gray-500">
                                        <SelectValue placeholder="Select checklist" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white dark:bg-gray-800 border-gray-400 dark:border-gray-500 z-[150]">
                                        {exitChecklists.map(checklist => (
                                            <SelectItem key={checklist.id} value={checklist.id!}>
                                                {checklist.checklistName}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Exit Interview</Label>
                                <Select
                                    value={formData.exitInterview ?? ""}
                                    onValueChange={value => handleChange("exitInterview", value)}
                                >
                                    <SelectTrigger className="border-gray-400 dark:border-gray-500">
                                        <SelectValue placeholder="Select exit interview" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white dark:bg-gray-800 border-gray-400 dark:border-gray-500 z-[150]">
                                        {exitInterviewQuestions
                                            .filter(q => q.active)
                                            .map(question => (
                                                <SelectItem key={question.id} value={question.id}>
                                                    {question.name}
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Exit Document Status</Label>
                                <Select
                                    value={formData.exitDocument}
                                    onValueChange={value => handleChange("exitDocument", value)}
                                >
                                    <SelectTrigger className="border-gray-400 dark:border-gray-500">
                                        <SelectValue placeholder="Select document status" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white dark:bg-gray-800 border-gray-400 dark:border-gray-500 z-[150]">
                                        <SelectItem value="Pending">Pending</SelectItem>
                                        <SelectItem value="Submitted">Submitted</SelectItem>
                                        <SelectItem value="Approved">Approved</SelectItem>
                                        <SelectItem value="Rejected">Rejected</SelectItem>
                                        <SelectItem value="Not Required">Not Required</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Exit Document Template</Label>
                                <Select
                                    value={formData.exitDocumentTemplateId || ""}
                                    onValueChange={value =>
                                        handleChange("exitDocumentTemplateId", value || null)
                                    }
                                >
                                    <SelectTrigger className="border-gray-400 dark:border-gray-500">
                                        <SelectValue placeholder="Select document template" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white dark:bg-gray-800 border-gray-400 dark:border-gray-500 z-[150]">
                                        <SelectItem value="-">None</SelectItem>
                                        {documents
                                            .filter(d => d.status === "Published")
                                            .map(doc => (
                                                <SelectItem key={doc.id} value={doc.id!}>
                                                    {doc.name}
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Additional Information */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-brand-800 dark:text-foreground">
                            Additional Information
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                <div className="flex-1">
                                    <Label className="text-base font-medium text-gray-900 dark:text-gray-100">
                                        Eligible to Rehire
                                    </Label>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        Can this employee be rehired in the future?
                                    </p>
                                </div>
                                <Switch
                                    checked={formData.eligibleToRehire}
                                    onCheckedChange={checked =>
                                        handleChange("eligibleToRehire", checked)
                                    }
                                    className="data-[state=checked]:bg-brand-600 data-[state=unchecked]:bg-gray-300 dark:data-[state=unchecked]:bg-gray-600"
                                />
                            </div>

                            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                <div className="flex-1">
                                    <Label className="text-base font-medium text-gray-900 dark:text-gray-100">
                                        Effective Date Accepted
                                    </Label>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        Has the employee accepted the effective date?
                                    </p>
                                </div>
                                <Switch
                                    checked={formData.effectiveDateAccepted}
                                    onCheckedChange={checked =>
                                        handleChange("effectiveDateAccepted", checked)
                                    }
                                    className="data-[state=checked]:bg-brand-600 data-[state=unchecked]:bg-gray-300 dark:data-[state=unchecked]:bg-gray-600"
                                />
                            </div>

                            <div>
                                <Label>Remarks</Label>
                                <Textarea
                                    value={formData.remarks ?? ""}
                                    onChange={e => handleChange("remarks", e.target.value)}
                                    placeholder="Additional remarks or notes"
                                    rows={3}
                                    className="border-gray-400 dark:border-gray-500"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="bg-brand-600 hover:bg-brand-700 text-white disabled:opacity-50"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {editingInstance ? "Updating..." : "Creating..."}
                            </>
                        ) : (
                            <>{editingInstance ? "Update" : "Create"} Exit Instance</>
                        )}
                    </Button>
                </div>
            </DialogContent>

            {/* Reason Management Dialog */}
            <Dialog open={reasonManagementOpen} onOpenChange={setReasonManagementOpen}>
                <DialogContent className="max-w-md bg-white dark:bg-gray-900 z-[150]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-semibold text-brand-800 dark:text-foreground">
                            Manage Exit Reasons
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 mt-4">
                        {/* Add new reason */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Add New Reason</Label>
                            <div className="flex gap-2">
                                <Input
                                    value={newReason}
                                    onChange={e => setNewReason(e.target.value)}
                                    placeholder="Enter new exit reason"
                                    className="border-gray-400 dark:border-gray-500"
                                    onKeyDown={e => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            handleAddReason();
                                        }
                                    }}
                                />
                                <Button
                                    onClick={handleAddReason}
                                    size="sm"
                                    className="bg-brand-600 hover:bg-brand-700 text-white shrink-0"
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Default reasons (read-only) */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Default Reasons
                            </Label>
                            <div className="space-y-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg max-h-32 overflow-y-auto">
                                {DEFAULT_EXIT_REASONS.map(reason => (
                                    <div
                                        key={reason}
                                        className="flex items-center justify-between py-1.5 px-2 text-sm text-gray-600 dark:text-gray-400"
                                    >
                                        <span>{reason}</span>
                                        <span className="text-xs text-gray-400 dark:text-gray-500">
                                            Default
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Custom reasons (removable) */}
                        {customExitReasons.length > 0 && (
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-brand-700 dark:text-brand-400">
                                    Custom Reasons
                                </Label>
                                <div className="space-y-1 p-3 bg-brand-50 dark:bg-brand-900/20 rounded-lg max-h-40 overflow-y-auto">
                                    {customExitReasons.map(reason => (
                                        <div
                                            key={reason}
                                            className="flex items-center justify-between py-1.5 px-2 bg-white dark:bg-gray-800 rounded border border-brand-200 dark:border-brand-800"
                                        >
                                            <span className="text-sm text-gray-700 dark:text-gray-300">
                                                {reason}
                                            </span>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleRemoveReason(reason)}
                                                className="h-6 w-6 p-0 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                        <Button variant="outline" onClick={() => setReasonManagementOpen(false)}>
                            Close
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </Dialog>
    );
}
