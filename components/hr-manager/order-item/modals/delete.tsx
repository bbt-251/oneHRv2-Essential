"use client";

import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/context/toastContext";

interface OrderItemDeleteDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    itemName: string;
}

export function OrderItemDeleteDialog({
    isOpen,
    onClose,
    onConfirm,
    itemName,
}: OrderItemDeleteDialogProps) {
    const { showToast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    const handleConfirm = async () => {
        setIsLoading(true);
        try {
            await onConfirm();
            showToast("Order item deleted successfully", "Success", "success");
        } catch (error) {
            console.error("Error deleting order item:", error);
            showToast("Failed to delete order item", "Error", "error");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AlertDialog open={isOpen} onOpenChange={onClose}>
            <AlertDialogContent className="">
                <AlertDialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                            <AlertTriangle className="h-6 w-6 text-red-600" />
                        </div>
                        <div>
                            <AlertDialogTitle className="text-xl font-semibold ">
                                Delete Order Item
                            </AlertDialogTitle>
                        </div>
                    </div>
                    <AlertDialogDescription className=" pt-4">
                        Are you sure you want to delete{" "}
                        <span className="font-semibold">{itemName}</span>? This action cannot be
                        undone and will permanently remove this item from the system.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="mt-6">
                    <Button variant="outline" onClick={onClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={isLoading}
                        className="bg-red-600 hover:bg-red-700 text-white"
                    >
                        {isLoading ? "Deleting..." : "Delete Item"}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
