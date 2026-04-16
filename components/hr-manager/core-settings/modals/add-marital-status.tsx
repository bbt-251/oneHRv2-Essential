"use client";

import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/authContext";
import { useToast } from "@/context/toastContext";
import { hrSettingsService, MaritalStatusModel } from "@/lib/backend/firebase/hrSettingsService";
import { MARITAL_STATUS_LOG_MESSAGES } from "@/lib/log-descriptions/marital-document";
import { useEffect, useState } from "react";

export function AddMaritalStatusModal({
    showAddModal,
    setShowAddModal,
    editingStatus,
    maritalStatuses,
}: {
    showAddModal: boolean;
    setShowAddModal: (val: boolean) => void;
    editingStatus: MaritalStatusModel | null;
    maritalStatuses: MaritalStatusModel[];
}) {
    const { showToast } = useToast();
    const { theme } = useTheme();
    const { userData } = useAuth();
    const [formData, setFormData] = useState({ name: "", active: true });
    const resetForm = () => setFormData({ name: "", active: true });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (editingStatus) {
            setFormData({ name: editingStatus.name, active: editingStatus.active });
        } else {
            resetForm();
        }
    }, [editingStatus]);

    const handleSubmit = async () => {
        if (isSubmitting) return;

        const existingStatus = maritalStatuses.find(
            status =>
                status.name === formData.name && (!editingStatus || status.id !== editingStatus.id),
        );

        if (existingStatus) {
            showToast("Marital status name must be unique", "error", "error");
            return;
        }
        setIsSubmitting(true);

        try {
            if (editingStatus) {
                await hrSettingsService.update(
                    "maritalStatuses",
                    editingStatus.id,
                    formData,
                    userData?.uid ?? "",
                    MARITAL_STATUS_LOG_MESSAGES.UPDATED({
                        id: editingStatus.id,
                        name: formData.name,
                        active: formData.active,
                    }),
                );
            } else {
                await hrSettingsService.create(
                    "maritalStatuses",
                    formData,
                    userData?.uid ?? "",
                    MARITAL_STATUS_LOG_MESSAGES.CREATED({
                        name: formData.name,
                        active: formData.active,
                    }),
                );
            }
            showToast("Marital status saved successfully", "success", "success");
            setShowAddModal(false);
            resetForm();
        } catch (error) {
            console.error("Failed to save marital status:", error);
            showToast("Failed to save marital status", "error", "error");
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
                        {editingStatus ? "Edit Marital Status" : "Add New Marital Status"}
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label
                            htmlFor="name"
                            className={`text-sm font-semibold ${theme === "dark" ? "text-white" : "text-slate-700"}`}
                        >
                            Name
                        </Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Enter marital status name"
                        />
                    </div>
                    <div className="flex items-center space-x-3">
                        <Checkbox
                            id="active"
                            checked={formData.active}
                            onCheckedChange={checked =>
                                setFormData({ ...formData, active: checked as boolean })
                            }
                        />
                        <Label
                            htmlFor="active"
                            className={`text-sm font-semibold ${theme === "dark" ? "text-white" : "text-slate-700"}`}
                        >
                            Active
                        </Label>
                    </div>
                    <div className="flex justify-end gap-3 pt-6">
                        <Button
                            variant="outline"
                            onClick={() => setShowAddModal(false)}
                            className={`rounded-lg ${theme === "dark" ? "bg-white/20" : "bg-white"}`}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="bg-amber-600 hover:bg-amber-700 text-white rounded-lg"
                        >
                            {isSubmitting
                                ? "Saving..."
                                : editingStatus
                                    ? "Update Marital Status"
                                    : "Add Marital Status"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
