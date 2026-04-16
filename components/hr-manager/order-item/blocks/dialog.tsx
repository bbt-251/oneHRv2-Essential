"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrderItemManagement } from "../page";

interface OrderItemManagementDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export function OrderItemManagementDialog({ isOpen, onClose }: OrderItemManagementDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-[95vw] w-full max-h-[95vh] p-0z-[100] flex flex-col">
                <DialogHeader className="px-8 pt-6 pb-4 border-b border-accent-200 flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-2xl font-semibold">
                            Order Item Management
                        </DialogTitle>
                    </div>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto px-8 py-6">
                    <OrderItemManagement />
                </div>
            </DialogContent>
        </Dialog>
    );
}
