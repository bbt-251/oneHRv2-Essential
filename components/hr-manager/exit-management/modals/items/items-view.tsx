"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, User, Clock } from "lucide-react";
import { ExitChecklistItemModel } from "@/lib/models/exit-checklist-item";
import { useFirestore } from "@/context/firestore-context";
import getFullName from "@/lib/util/getEmployeeFullName";
import { EmployeeModel } from "@/lib/models/employee";

interface ExitChecklistItemViewModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: ExitChecklistItemModel | null;
}

export function ExitChecklistItemViewModal({
    isOpen,
    onClose,
    item,
}: ExitChecklistItemViewModalProps) {
    const { activeEmployees } = useFirestore();
    if (!item) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 z-[110]">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-semibold text-brand-800 dark:text-foreground">
                        Checklist Item Details
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Header Info */}
                    <div className="flex items-start justify-between">
                        <div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-foreground">
                                {item.itemName}
                            </h3>
                        </div>
                    </div>

                    {/* Basic Information */}
                    <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-brand-800 dark:text-foreground">
                            Basic Information
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <Clock className="h-5 w-5 text-brand-600 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                        Timestamp
                                    </p>
                                    <p className="text-sm text-gray-900 dark:text-foreground">
                                        {new Date(item.timestamp).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <h4 className="text-lg font-semibold text-brand-800 dark:text-foreground">
                            Description
                        </h4>
                        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                {item.itemDescription}
                            </p>
                        </div>
                    </div>

                    {/* Additional Details */}
                    <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-brand-800 dark:text-foreground">
                            Additional Details
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                        Due Date
                                    </p>
                                    <p className="text-sm text-gray-900 dark:text-foreground">
                                        {item.itemDueDate
                                            ? new Date(item.itemDueDate).toLocaleDateString()
                                            : "Not set"}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                <User className="h-5 w-5 text-purple-600 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
                                        Created By
                                    </p>
                                    <p className="text-sm text-gray-900 dark:text-foreground">
                                        {getFullName(
                                            activeEmployees.find(
                                                e => e.uid == item.itemCreatedBy,
                                            ) ?? ({} as EmployeeModel),
                                        )}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                <User className="h-5 w-5 text-green-600 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-green-600 dark:text-green-400">
                                        Approver
                                    </p>
                                    <p className="text-sm text-gray-900 dark:text-foreground">
                                        {getFullName(
                                            activeEmployees.find(e => e.uid == item.itemApprover) ??
                                                ({} as EmployeeModel),
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
