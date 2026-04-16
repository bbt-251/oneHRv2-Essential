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
import { periodicOptionService } from "@/lib/backend/api/performance-management/periodic-option-service";
import { PeriodicOptionModel } from "@/lib/models/performance";
import { AlertCircle } from "lucide-react";
import { useState } from "react";
import { PERFORMANCE_MANAGEMENT_LOG_MESSAGES } from "@/lib/log-descriptions/performance-management";
import { useAuth } from "@/context/authContext";

interface DeletePeriodicOptionModalProps {
    isOpen: boolean;
    onClose: () => void;
    periodicOption: PeriodicOptionModel | null;
}

export default function DeletePeriodicOptionModal({
    isOpen,
    onClose,
    periodicOption,
}: DeletePeriodicOptionModalProps) {
    const { theme } = useTheme();
    const { showToast } = useToast();
    const { userData } = useAuth();
    const [isLoading, setIsLoading] = useState<boolean>(false);

    const handleDelete = async () => {
        if (!periodicOption?.id) return;

        setIsLoading(true);

        try {
            await periodicOptionService.delete(
                periodicOption.id,
                userData?.uid,
                PERFORMANCE_MANAGEMENT_LOG_MESSAGES.PERIODIC_OPTION_DELETED(periodicOption.id),
            );

            showToast(
                `Periodic option "${periodicOption.periodName}" deleted successfully`,
                "Success",
                "success",
                4000,
            );

            onClose();
        } catch (error) {
            console.error("Error deleting periodic option:", error);
            showToast(
                "Failed to delete periodic option. Please try again.",
                "Error",
                "error",
                5000,
            );
        } finally {
            setIsLoading(false);
        }
    };

    if (!periodicOption) return null;

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
                                Delete Periodic Option
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
                        Are you sure you want to delete the periodic option{" "}
                        <strong>"{periodicOption.periodName}"</strong>?
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
                                <strong>Period Name:</strong> {periodicOption.periodName}
                            </p>
                            <p>
                                <strong>Year:</strong> {periodicOption.year}
                            </p>
                            <p>
                                <strong>Evaluation Rounds:</strong>{" "}
                                {periodicOption.evaluations.length}
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
