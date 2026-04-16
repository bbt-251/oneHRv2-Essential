"use client";

import { useTheme } from "@/components/theme-provider";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/context/toastContext";
import { monitoringPeriodService } from "@/lib/backend/api/performance-management/monitoring-period-service";
import { MonitoringPeriodModel } from "@/lib/models/performance";
import { useState } from "react";
import MonitoringForm from "../blocks/monitoring-period-form";
import { PERFORMANCE_MANAGEMENT_LOG_MESSAGES } from "@/lib/log-descriptions/performance-management";
import { useAuth } from "@/context/authContext";

interface MonitoringModalProps {
    isOpen: boolean;
    onClose: () => void;
    monitoringPeriod?: MonitoringPeriodModel | null;
}

export default function MonitoringModal({
    isOpen,
    onClose,
    monitoringPeriod = null,
}: MonitoringModalProps) {
    const { theme } = useTheme();
    const { showToast } = useToast();
    const { userData } = useAuth();
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const handleSubmit = async (data: Omit<MonitoringPeriodModel, "id">) => {
        setIsLoading(true);

        try {
            if (monitoringPeriod?.id) {
                // Update existing monitoring period
                await monitoringPeriodService.update(
                    monitoringPeriod.id,
                    data,
                    userData?.uid,
                    PERFORMANCE_MANAGEMENT_LOG_MESSAGES.MONITORING_PERIOD_UPDATED({
                        id: monitoringPeriod.id,
                        title: data.monitoringPeriodName,
                        description: data.monitoringPeriodName,
                        status: "Updated",
                    }),
                );
                showToast("Monitoring period updated successfully", "Success", "success", 4000);
            } else {
                // Create new monitoring period
                await monitoringPeriodService.create(
                    data,
                    userData?.uid,
                    PERFORMANCE_MANAGEMENT_LOG_MESSAGES.MONITORING_PERIOD_CREATED({
                        title: data.monitoringPeriodName,
                        description: data.monitoringPeriodName,
                        status: "Created",
                    }),
                );
                showToast("Monitoring period created successfully", "Success", "success", 4000);
            }

            onClose();
        } catch (error) {
            console.error("Error saving monitoring period:", error);
            showToast(
                `Failed to ${monitoringPeriod?.id ? "update" : "create"} monitoring period. Please try again.`,
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
                className={`max-w-3xl max-h-[90vh] overflow-y-auto ${
                    theme === "dark" ? "bg-black border-gray-700" : "bg-white"
                }`}
            >
                <DialogHeader>
                    <DialogTitle className={theme === "dark" ? "text-white" : "text-gray-900"}>
                        {monitoringPeriod ? "Edit Monitoring Period" : "Add Monitoring Period"}
                    </DialogTitle>
                </DialogHeader>

                <MonitoringForm
                    initialData={monitoringPeriod || undefined}
                    onSubmit={handleSubmit}
                    onCancel={onClose}
                    isLoading={isLoading}
                />
            </DialogContent>
        </Dialog>
    );
}
