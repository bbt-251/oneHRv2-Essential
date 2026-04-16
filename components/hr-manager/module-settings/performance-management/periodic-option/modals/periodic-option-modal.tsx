"use client";

import { useTheme } from "@/components/theme-provider";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/context/toastContext";
import { periodicOptionService } from "@/lib/backend/api/performance-management/periodic-option-service";
import { PeriodicOptionModel } from "@/lib/models/performance";
import { useState } from "react";
import PeriodicOptionForm from "../blocks/periodic-option-form";
import { PERFORMANCE_MANAGEMENT_LOG_MESSAGES } from "@/lib/log-descriptions/performance-management";
import { useAuth } from "@/context/authContext";

interface PeriodicOptionModalProps {
    isOpen: boolean;
    onClose: () => void;
    periodicOption?: PeriodicOptionModel | null;
}

export default function PeriodicOptionModal({
    isOpen,
    onClose,
    periodicOption = null,
}: PeriodicOptionModalProps) {
    const { theme } = useTheme();
    const { showToast } = useToast();
    const { userData } = useAuth();
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const handleSubmit = async (data: Omit<PeriodicOptionModel, "id">) => {
        setIsLoading(true);

        try {
            if (periodicOption) {
                // Update existing periodic option
                await periodicOptionService.update(
                    periodicOption.id as string,
                    data,
                    userData?.uid,
                    PERFORMANCE_MANAGEMENT_LOG_MESSAGES.PERIODIC_OPTION_UPDATED({
                        id: periodicOption.id as string,
                        name: data.periodName,
                        active: true,
                    }),
                );
                showToast("Periodic option updated successfully", "Success", "success", 4000);
            } else {
                // Create new periodic option
                await periodicOptionService.create(
                    data,
                    userData?.uid,
                    PERFORMANCE_MANAGEMENT_LOG_MESSAGES.PERIODIC_OPTION_CREATED({
                        name: data.periodName,
                        active: true,
                    }),
                );
                showToast("Periodic option created successfully", "Success", "success", 4000);
            }

            onClose();
        } catch (error) {
            console.error("Error saving periodic option:", error);
            showToast(
                `Failed to ${periodicOption ? "update" : "create"} periodic option. Please try again.`,
                "Error",
                "error",
                5000,
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent
                className={`max-w-4xl max-h-[90vh] overflow-y-auto ${
                    theme === "dark" ? "bg-black border-gray-700" : "bg-white"
                }`}
            >
                <DialogHeader>
                    <DialogTitle className={theme === "dark" ? "text-white" : "text-gray-900"}>
                        {periodicOption ? "Edit Periodic Option" : "Add Periodic Option"}
                    </DialogTitle>
                </DialogHeader>

                <PeriodicOptionForm
                    initialData={periodicOption || undefined}
                    onSubmit={handleSubmit}
                    onCancel={onClose}
                    isLoading={isLoading}
                />
            </DialogContent>
        </Dialog>
    );
}
