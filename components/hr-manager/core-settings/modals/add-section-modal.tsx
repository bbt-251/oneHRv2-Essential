"use client";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

import { SectionSettingsModel } from "@/lib/repository/hr-settings";
import { CoreSettingsRepository as settingsService } from "@/lib/repository/hr-settings";
import { useToast } from "@/context/toastContext";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import { useData } from "@/context/app-data-context";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/authContext";
import { SECTION_LOG_MESSAGES } from "@/lib/log-descriptions/department-section";

interface AddSectionProps {
    showAddModal: boolean;
    setShowAddModal: (show: boolean) => void;
    editingSection: SectionSettingsModel | null;
    sections: SectionSettingsModel[];
}

export function AddSection({
    showAddModal,
    setShowAddModal,
    editingSection,
    sections,
}: AddSectionProps) {
    const { showToast } = useToast();
    const { theme } = useTheme();
    const { employees, departmentSettings: departments } = useData();
    const { userData } = useAuth();
    const supervisors = employees.filter(e => e.managerPosition === true);

    // Helper: given a stored department value (could be id or name), return the department id
    const normalizeDepartmentId = useCallback(
        (val?: string) => {
            if (!val) return "";
            if (departments.find(d => d.id === val)) return val;
            const byName = departments.find(d => d.name === val);
            return byName ? byName.id : "";
        },
        [departments],
    );

    const resetForm = () =>
        setFormData({
            name: editingSection?.name || "",
            code: editingSection?.code || "",
            department: normalizeDepartmentId(editingSection?.department),
            supervisor: editingSection?.supervisor || null,
            active: editingSection?.active || false,
        });

    const [formData, setFormData] = useState<{
        name: string;
        code: string;
        department: string;
        supervisor: string | null;
        active: boolean;
    }>({
        name: editingSection?.name || "",
        code: editingSection?.code || "",
        department: normalizeDepartmentId(editingSection?.department),
        supervisor: editingSection?.supervisor || null,
        active: editingSection?.active || false,
    });
    // Inside the AddSection component
    useEffect(() => {
        if (editingSection) {
            setFormData({
                name: editingSection.name || "",
                code: editingSection.code || "",
                // Normalize the stored value to an id so the Select can show the correct value
                department: normalizeDepartmentId(editingSection.department),
                supervisor: editingSection.supervisor || null,
                active: editingSection.active || false,
            });
        } else {
            // Reset form when not editing
            setFormData({
                name: "",
                code: "",
                department: "",
                supervisor: null,
                active: true,
            });
        }
    }, [editingSection, normalizeDepartmentId]);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const handleSubmit = async () => {
        if (isSubmitting) return;
        // Validate required fields
        if (!formData.name.trim()) {
            showToast("Section name is required", "error", "error");
            return;
        }
        if (!formData.code.trim()) {
            showToast("Section code is required", "error", "error");
            return;
        }
        if (!formData.department.trim()) {
            showToast("Section department is required", "error", "error");
            return;
        }
        const existingSection = sections.find(
            section =>
                section.name === formData.name &&
                (!editingSection || section.id !== editingSection.id),
        );

        if (existingSection) {
            showToast("Section name must be unique", "error", "error");
            return;
        }
        setIsSubmitting(true);

        try {
            if (editingSection) {
                await settingsService.update(
                    "sectionSettings",
                    editingSection.id,
                    formData,
                    userData?.uid ?? "",
                    SECTION_LOG_MESSAGES.UPDATED({
                        id: editingSection.id,
                        name: formData.name,
                        code: formData.code,
                        department: formData.department,
                        supervisor: formData.supervisor,
                        active: formData.active,
                    }),
                );
                showToast("Section updated successfully", "success", "success");
            } else {
                await settingsService.create(
                    "sectionSettings",
                    formData,
                    userData?.uid ?? "",
                    SECTION_LOG_MESSAGES.CREATED({
                        name: formData.name,
                        code: formData.code,
                        department: formData.department,
                        supervisor: formData.supervisor,
                        active: formData.active,
                    }),
                );
                showToast("Section created successfully", "success", "success");
            }
            setShowAddModal(false);
            resetForm();
        } catch (error) {
            console.error("Failed to save section:", error);
            showToast("Failed to save section", "error", "error");
        } finally {
            setIsSubmitting(false);
        }
    };
    return (
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
            <DialogContent
                className={`max-w-md rounded-2xl shadow-2xl ${theme === "dark" ? "bg-black text-white border border-gray-800" : "bg-white"}`}
            >
                <DialogHeader className="pb-6">
                    <DialogTitle
                        className={`text-2xl font-bold ${theme === "dark" ? "text-white" : "text-slate-900"}`}
                    >
                        {editingSection ? "Edit Section" : "Add New Section"}
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label className="text-sm font-semibold text-slate-700">Section Name</Label>
                        <Input
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Enter section name"
                            className={
                                theme === "dark"
                                    ? "bg-black text-white border-gray-600 placeholder:text-gray-500"
                                    : ""
                            }
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-semibold text-slate-700">Section Code</Label>
                        <Input
                            value={formData.code}
                            onChange={e => setFormData({ ...formData, code: e.target.value })}
                            placeholder="Enter section code"
                            className={
                                theme === "dark"
                                    ? "bg-black text-white border-gray-600 placeholder:text-gray-500"
                                    : ""
                            }
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-semibold text-slate-700">Department</Label>
                        <Select
                            value={formData.department}
                            onValueChange={v => setFormData({ ...formData, department: v })}
                        >
                            <SelectTrigger
                                className={
                                    theme === "dark" ? "bg-black text-white border-gray-600" : ""
                                }
                            >
                                <SelectValue placeholder="Select department" />
                            </SelectTrigger>
                            <SelectContent
                                className={cn(
                                    theme === "dark"
                                        ? "bg-black border-gray-600"
                                        : "bg-white border-y border-amber-300",
                                )}
                            >
                                {departments.map(dept => (
                                    <SelectItem key={dept.id} value={dept.id}>
                                        {dept.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-semibold text-slate-700">Supervisor</Label>
                        <Select
                            value={formData.supervisor ?? ""}
                            onValueChange={v => setFormData({ ...formData, supervisor: v })}
                        >
                            <SelectTrigger
                                className={
                                    theme === "dark" ? "bg-black text-white border-gray-600" : ""
                                }
                            >
                                <SelectValue placeholder="Select supervisor" />
                            </SelectTrigger>
                            <SelectContent
                                className={cn(
                                    theme === "dark"
                                        ? "bg-black border-gray-600"
                                        : "bg-white border-y border-amber-300",
                                    "w-[var(--radix-select-trigger-width)] min-w-[8rem]",
                                )}
                            >
                                {supervisors.map(supervisor => (
                                    <SelectItem key={supervisor.id} value={supervisor.uid}>
                                        {supervisor.firstName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-center space-x-3">
                        <Checkbox
                            id="active"
                            checked={formData.active}
                            onCheckedChange={checked =>
                                setFormData({ ...formData, active: checked as boolean })
                            }
                        />
                        <Label htmlFor="active" className="text-sm font-semibold text-slate-700">
                            Active
                        </Label>
                    </div>
                    <div className="flex justify-end gap-3 pt-6">
                        <Button
                            variant="outline"
                            onClick={() => setShowAddModal(false)}
                            className={`rounded-lg ${theme === "dark" ? "text-white border-gray-600 hover:bg-gray-800 hover:text-white" : ""}`}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className={`rounded-lg ${theme === "dark" ? "bg-white hover:bg-gray-300 text-black" : "bg-amber-600 hover:bg-amber-700 text-white"}`}
                        >
                            {isSubmitting ? (
                                <div className="flex items-center justify-center gap-2">
                                    <Loader2 className="animate-spin h-4 w-4" />
                                    {editingSection ? "Updating..." : "Adding..."}
                                </div>
                            ) : (
                                `${editingSection ? "Update" : "Add"}`
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
