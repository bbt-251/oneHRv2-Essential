"use client";

import type React from "react";
import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Users, Package, BookOpen, Route } from "lucide-react";
import type { OrderGuideModel } from "@/lib/models/order-guide-and-order-item";
import { OrderGuideService } from "@/lib/backend/api/order-guide-service";
import { useToast } from "@/context/toastContext";
import { ORDER_GUIDE_LOG_MESSAGES } from "@/lib/log-descriptions/order-guide";
import { useAuth } from "@/context/authContext";

interface OrderGuideDeleteDialogProps {
    isOpen: boolean;
    onClose: () => void;
    guide: OrderGuideModel | null;
}

export function OrderGuideDeleteDialog({ isOpen, onClose, guide }: OrderGuideDeleteDialogProps) {
    const { showToast } = useToast();
    const { userData } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    if (!guide) return null;

    const handleConfirm = async () => {
        setIsLoading(true);
        try {
            if (!guide.id) {
                throw new Error("Order guide ID is missing");
            }
            await OrderGuideService.deleteOrderGuide(
                guide.id,
                userData?.uid ?? "",
                ORDER_GUIDE_LOG_MESSAGES.ORDER_GUIDE_DELETED(guide.orderGuideName),
            );
            onClose();
            showToast("Order guide deleted successfully", "Success", "success");
        } catch (error) {
            console.error("Error deleting order guide:", error);
            showToast("Failed to delete order guide", "Error", "error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold flex items-center gap-2">
                        <AlertTriangle className="h-6 w-6" />
                        Delete Order Guide
                    </DialogTitle>
                    <DialogDescription className="mt-2">
                        Are you sure you want to delete this order guide? This action cannot be
                        undone.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 mt-6">
                    {/* Guide Information */}
                    <div className="p-4 rounded-lg border">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center">
                                <span className="font-semibold text-sm">
                                    {guide.orderGuideName.charAt(0)}
                                </span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold mb-1">{guide.orderGuideName}</h3>
                                <Badge>{guide.orderGuideID}</Badge>
                                <p className="text-sm mt-1">Created: {guide.timestamp}</p>
                            </div>
                        </div>
                    </div>

                    {/* Impact Summary */}
                    <div className="space-y-3">
                        <h4 className="font-medium">This will also delete:</h4>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex items-center gap-2 p-3 rounded-lg border">
                                <Users className="h-4 w-4" />
                                <div>
                                    <p className="text-sm font-medium">
                                        {guide.associatedEmployees.length} Employees
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 p-3 rounded-lg border">
                                <Package className="h-4 w-4" />
                                <div>
                                    <p className="text-sm font-medium">
                                        {guide.associatedItems.length} Items
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 p-3 rounded-lg border">
                                <Route className="h-4 w-4" />
                                <div>
                                    <p className="text-sm font-medium">
                                        {guide.associatedTrainingPaths?.length || 0} Training Paths
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 p-3 rounded-lg border">
                                <BookOpen className="h-4 w-4" />
                                <div>
                                    <p className="text-sm font-medium">
                                        {guide.associatedTrainingMaterials.length} Materials
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Warning */}
                    <div className="p-4 rounded-lg border">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium">Warning</p>
                                <p className="text-sm mt-1">
                                    This action will permanently remove the order guide and all
                                    associated data. Make sure you have backed up any important
                                    information.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleConfirm}
                            disabled={isLoading}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {isLoading ? "Deleting..." : "Delete Order Guide"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
