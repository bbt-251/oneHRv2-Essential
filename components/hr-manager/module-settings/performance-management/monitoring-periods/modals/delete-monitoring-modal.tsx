"use client";

import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/context/toastContext";
import { monitoringPeriodService } from "@/lib/backend/api/performance-management/monitoring-period-service";
import { performanceDisplayService } from "@/lib/backend/api/performance-management/performance-display-service";
import { MonitoringPeriodModel } from "@/lib/models/performance";
import { AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { PERFORMANCE_MANAGEMENT_LOG_MESSAGES } from "@/lib/log-descriptions/performance-management";
import { useAuth } from "@/context/authContext";

interface DeleteMonitoringModalProps {
    isOpen: boolean;
    onClose: () => void;
    monitoringPeriod: MonitoringPeriodModel | null;
}

export default function DeleteMonitoringModal({
    isOpen,
    onClose,
    monitoringPeriod,
}: DeleteMonitoringModalProps) {
    const { theme } = useTheme();
    const { showToast } = useToast();
    const { userData } = useAuth();
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [displayNames, setDisplayNames] = useState<{ periodName: string; roundName: string }>({
        periodName: "",
        roundName: "",
    });

    useEffect(() => {
        const loadDisplayNames = async () => {
            if (monitoringPeriod?.periodID && monitoringPeriod?.roundID) {
                const { periodName, roundName } =
                    await performanceDisplayService.getPeriodAndRoundDisplayNames(
                        monitoringPeriod.periodID,
                        monitoringPeriod.roundID,
                    );
                setDisplayNames({
                    periodName: periodName || monitoringPeriod.periodID,
                    roundName: roundName || monitoringPeriod.roundID,
                });
            }
        };

        if (monitoringPeriod) {
            loadDisplayNames();
        }
    }, [monitoringPeriod]);

    const handleDelete = async () => {
        if (!monitoringPeriod?.id) return;

        setIsLoading(true);

        try {
            await monitoringPeriodService.delete(
                monitoringPeriod.id,
                userData?.uid,
                PERFORMANCE_MANAGEMENT_LOG_MESSAGES.MONITORING_PERIOD_DELETED(),
            );

            showToast(
                `Monitoring period "${monitoringPeriod.monitoringPeriodName}" deleted successfully`,
                "Success",
                "success",
                4000,
            );

            onClose();
        } catch (error) {
            console.error("Error deleting monitoring period:", error);
            showToast(
                "Failed to delete monitoring period. Please try again.",
                "Error",
                "error",
                5000,
            );
        } finally {
            setIsLoading(false);
        }
    };

    if (!monitoringPeriod) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent
                className={`max-w-md ${theme === "dark" ? "bg-black border-gray-700" : "bg-white"}`}
            >
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div
                            className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                                theme === "dark" ? "bg-red-900/20" : "bg-red-100"
                            }`}
                        >
                            <AlertCircle
                                className={`w-5 h-5 ${theme === "dark" ? "text-red-400" : "text-red-600"}`}
                            />
                        </div>
                        <div>
                            <DialogTitle
                                className={theme === "dark" ? "text-white" : "text-gray-900"}
                            >
                                Delete Monitoring Period
                            </DialogTitle>
                            <DialogDescription
                                className={theme === "dark" ? "text-gray-300" : "text-gray-600"}
                            >
                                This action cannot be undone.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="py-4">
                    <p
                        className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}
                    >
                        Are you sure you want to delete the monitoring period{" "}
                        <strong>"{monitoringPeriod.monitoringPeriodName}"</strong>?
                    </p>

                    <div
                        className={`mt-4 p-3 rounded-lg ${
                            theme === "dark" ? "bg-gray-900/50" : "bg-gray-50"
                        }`}
                    >
                        <div
                            className={`text-sm ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}
                        >
                            <p>
                                <strong>Period:</strong> {displayNames.periodName}
                            </p>
                            <p>
                                <strong>Round:</strong> {displayNames.roundName}
                            </p>
                            <p>
                                <strong>Duration:</strong>{" "}
                                {new Date(monitoringPeriod.startDate).toLocaleDateString()} -{" "}
                                {new Date(monitoringPeriod.endDate).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end space-x-3">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={isLoading}
                        className={
                            theme === "dark"
                                ? "border-gray-700 text-gray-300 hover:bg-gray-900"
                                : ""
                        }
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={isLoading}
                        className={
                            theme === "dark"
                                ? "bg-red-600 hover:bg-red-700 text-white"
                                : "bg-red-600 hover:bg-red-700 text-white"
                        }
                    >
                        {isLoading ? "Deleting..." : "Delete"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
