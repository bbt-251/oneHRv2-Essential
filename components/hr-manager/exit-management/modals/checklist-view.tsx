"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ClipboardCheck, ListChecks, CheckCircle2 } from "lucide-react";
import { ExitChecklistModel } from "@/lib/models/exit-checklist";
import { useFirestore } from "@/context/firestore-context";

interface ExitChecklistViewModalProps {
    isOpen: boolean;
    onClose: () => void;
    checklist: ExitChecklistModel | null;
}

export function ExitChecklistViewModal({
    isOpen,
    onClose,
    checklist,
}: ExitChecklistViewModalProps) {
    const { exitChecklistItems } = useFirestore();
    if (!checklist) return null;

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            draft: { color: "bg-gray-100 text-gray-800 border-gray-300", label: "Draft" },
            ongoing: { color: "bg-blue-100 text-blue-800 border-blue-300", label: "Ongoing" },
            done: { color: "bg-green-100 text-green-800 border-green-300", label: "Done" },
        };
        const config = statusConfig[status as keyof typeof statusConfig];
        return (
            <Badge className={`${config.color} border`} variant="outline">
                {config.label}
            </Badge>
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 z-[100]">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-semibold text-brand-800 dark:text-foreground flex items-center gap-2">
                        <ClipboardCheck className="h-6 w-6 text-brand-600" />
                        Exit Checklist Details
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 mt-6">
                    {/* Header Info */}
                    <div className="bg-brand-50 p-6 rounded-lg border border-brand-200 dark:bg-gray-800 dark:border-gray-700">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h3 className="text-xl font-bold text-brand-800 dark:text-foreground">
                                    {checklist.checklistName}
                                </h3>
                            </div>
                            {getStatusBadge(checklist.checklistStatus)}
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-4">
                            <div>
                                <p className="text-sm text-brand-600 dark:text-muted-foreground">
                                    Created
                                </p>
                                <p className="font-medium text-brand-800 dark:text-foreground">
                                    {new Date(checklist.timestamp).toLocaleString()}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-brand-600 dark:text-muted-foreground">
                                    Due Date
                                </p>
                                <p className="font-medium text-brand-800 dark:text-foreground">
                                    {checklist.checklistDueDate
                                        ? new Date(checklist.checklistDueDate).toLocaleDateString()
                                        : "N/A"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Checklist Items */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <ListChecks className="h-5 w-5 text-brand-600" />
                            <h3 className="text-lg font-semibold text-brand-800 dark:text-foreground">
                                Checklist Items
                            </h3>
                            <Badge variant="outline" className="ml-2">
                                {checklist.listOfItems?.length || 0} items
                            </Badge>
                        </div>
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                            {checklist.listOfItems && checklist.listOfItems.length > 0 ? (
                                <div className="space-y-2">
                                    {checklist.listOfItems.map((item, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
                                        >
                                            <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                                            <span className="text-sm text-gray-700 dark:text-gray-300">
                                                {exitChecklistItems.find(i => i.id == item)
                                                    ?.itemName || item}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                                    No items added yet
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
