"use client";

import { format } from "date-fns";
import { Package, Calendar, Hash, FileText, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { OrderItemModel } from "@/lib/models/order-guide-and-order-item";

interface OrderItemViewModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: OrderItemModel | null;
}

export function OrderItemViewModal({ isOpen, onClose, item }: OrderItemViewModalProps) {
    if (!item) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto z-[100]">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-semibold">Order Item Details</DialogTitle>
                    <DialogDescription>
                        Complete information about this order item
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                    {/* Header Section */}
                    <div className="flex items-start justify-between">
                        <div className="space-y-1">
                            <h3 className="text-xl font-semibold">{item.itemName}</h3>
                            <p className="text-sm">Item ID: {item.itemID}</p>
                        </div>
                        <Badge
                            variant={item.active === "Yes" ? "default" : "secondary"}
                            className={
                                item.active === "Yes"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                            }
                        >
                            {item.active === "Yes" ? "Active" : "Inactive"}
                        </Badge>
                    </div>

                    <Separator />

                    {/* Basic Information */}
                    <div className="space-y-4">
                        <h4 className="font-semibold flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            Basic Information
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-sm">
                                    <Hash className="h-4 w-4" />
                                    <span>Item ID</span>
                                </div>
                                <p className="font-medium pl-6">{item.itemID}</p>
                            </div>

                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-sm">
                                    <Calendar className="h-4 w-4" />
                                    <span>Created Date</span>
                                </div>
                                <p className="font-medium pl-6">
                                    {format(new Date(item.timestamp), "PPP")}
                                </p>
                            </div>

                            <div className="space-y-1">
                                <div className="flex items-center gap-2 text-sm">
                                    <Activity className="h-4 w-4" />
                                    <span>Status</span>
                                </div>
                                <p className="font-medium pl-6">
                                    {item.active === "Yes" ? "Active" : "Inactive"}
                                </p>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Description */}
                    <div className="space-y-4">
                        <h4 className="font-semibold flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Description
                        </h4>
                        <div className="rounded-lg p-4">
                            <p className="leading-relaxed">{item.itemDescription}</p>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex justify-end pt-4 border-t">
                        <Button onClick={onClose}>Close</Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
