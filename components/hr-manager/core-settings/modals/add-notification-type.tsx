"use client";
import { useEffect } from "react";
import { useState } from "react";
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

import {
    CoreSettingsRepository as settingsService,
    NotificationTypeModel,
} from "@/lib/repository/hr-settings";
import { useToast } from "@/context/toastContext";
import { useTheme } from "@/components/theme-provider";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/authContext";
import { NOTIFICATION_TYPE_LOG_MESSAGES } from "@/lib/log-descriptions/notification-location";

interface AddNotificationTypeProps {
    showAddModal: boolean;
    setShowAddModal: (show: boolean) => void;
    editingNotification: NotificationTypeModel | null;
    notificationTypes: NotificationTypeModel[];
}

export function AddNotificationType({
    showAddModal,
    setShowAddModal,
    editingNotification,
    notificationTypes,
}: AddNotificationTypeProps) {
    const { showToast } = useToast();
    const { theme } = useTheme();
    const { userData } = useAuth();

    const activeOptions = ["Yes", "No"];

    const resetForm = () =>
        setFormData({
            notificationType: editingNotification?.notificationType || "",
            text: editingNotification?.text || "",
            active: editingNotification?.active || "",
        });

    const [formData, setFormData] = useState<
        Pick<NotificationTypeModel, "notificationType" | "text" | "active">
    >({
        notificationType: "",
        text: "",
        active: "Yes",
    });

    useEffect(() => {
        if (editingNotification) {
            setFormData({
                notificationType: editingNotification.notificationType,
                text: editingNotification.text,
                active: editingNotification.active,
            });
        } else {
            // Reset form when not editing
            setFormData({
                notificationType: "",
                text: "",
                active: "Yes",
            });
        }
    }, [editingNotification]);

    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const handleSubmit = async () => {
        if (isSubmitting) return;
        // Validate required fields
        if (!formData.notificationType.trim()) {
            showToast("Notification type is required", "error", "error");
            return;
        }
        if (!formData.text.trim()) {
            showToast("Notification text is required", "error", "error");
            return;
        }
        const existingNotificationType = notificationTypes.find(
            notificationType =>
                notificationType.notificationType === formData.notificationType &&
                (!editingNotification || notificationType.id !== editingNotification.id),
        );

        if (existingNotificationType) {
            showToast("Notification type must be unique", "error", "error");
            return;
        }
        setIsSubmitting(true);
        try {
            if (editingNotification) {
                await settingsService.update(
                    "notificationTypes",
                    editingNotification.id,
                    formData,
                    userData?.uid ?? "",
                    NOTIFICATION_TYPE_LOG_MESSAGES.UPDATED({
                        id: editingNotification.id,
                        notificationType: formData.notificationType,
                        text: formData.text,
                        active: formData.active,
                    }),
                );
                showToast("Notification type updated successfully", "success", "success");
            } else {
                await settingsService.create(
                    "notificationTypes",
                    formData,
                    userData?.uid ?? "",
                    NOTIFICATION_TYPE_LOG_MESSAGES.CREATED({
                        notificationType: formData.notificationType,
                        text: formData.text,
                        active: formData.active,
                    }),
                );
                showToast("Notification type created successfully", "success", "success");
            }
            setShowAddModal(false);
            resetForm();
        } catch (error) {
            console.error("Failed to save notification type:", error);
            showToast("Failed to save notification type", "error", "error");
        } finally {
            setIsSubmitting(false);
        }
    };
    return (
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
            <DialogContent
                className={`max-w-2xl rounded-2xl shadow-2xl ${theme === "dark" ? "bg-black text-white border border-gray-800" : "bg-white"}`}
            >
                <DialogHeader className="pb-6">
                    <DialogTitle
                        className={`text-2xl font-bold ${theme === "dark" ? "text-white" : "text-slate-900"}`}
                    >
                        {editingNotification
                            ? "Edit Notification Type"
                            : "Add New Notification Type"}
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label
                            htmlFor="notificationType"
                            className={`text-sm font-semibold ${theme === "dark" ? "text-white" : "text-slate-700"}`}
                        >
                            Notification Type
                        </Label>
                        <Input
                            id="notificationType"
                            value={formData.notificationType}
                            onChange={e =>
                                setFormData({ ...formData, notificationType: e.target.value })
                            }
                            placeholder="Enter notification type"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label
                            htmlFor="text"
                            className={`text-sm font-semibold ${theme === "dark" ? "text-white" : "text-slate-700"}`}
                        >
                            Text
                        </Label>
                        <Textarea
                            id="text"
                            value={formData.text}
                            onChange={e => setFormData({ ...formData, text: e.target.value })}
                            placeholder="Enter notification text"
                            rows={4}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label
                            htmlFor="active"
                            className={`text-sm font-semibold ${theme === "dark" ? "text-white" : "text-slate-700"}`}
                        >
                            Active
                        </Label>
                        <Select
                            value={formData.active}
                            onValueChange={v => setFormData({ ...formData, active: v })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select active status" />
                            </SelectTrigger>
                            <SelectContent
                                className={`${theme === "dark" ? "bg-black border-gray-600" : "bg-amber-50/80 border-y border-amber-300"} w-40`}
                            >
                                {activeOptions.map(option => (
                                    <SelectItem key={option} value={option}>
                                        {option}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex justify-end gap-3 pt-6">
                        <Button
                            variant="outline"
                            onClick={() => setShowAddModal(false)}
                            className={`rounded-lg ${theme === "dark" ? "text-white" : "text-slate-700"}`}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className={`bg-amber-600 hover:bg-amber-700 rounded-lg ${theme === "dark" ? "text-white" : "text-white"}`}
                        >
                            {isSubmitting ? (
                                <div className="flex items-center justify-center gap-2">
                                    <Loader2 className="animate-spin h-4 w-4" />
                                    {editingNotification ? "Updating..." : "Adding..."}
                                </div>
                            ) : (
                                `${editingNotification ? "Update" : "Add"}`
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
