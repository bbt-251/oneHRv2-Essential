"use client";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PromotionInstanceModel } from "@/lib/models/promotion-instance";

interface DeletePromotionDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    promotion: Omit<PromotionInstanceModel, "id"> | null;
}

export function DeletePromotionDialog({
    isOpen,
    onClose,
    onConfirm,
    promotion,
}: DeletePromotionDialogProps) {
    return (
        <AlertDialog open={isOpen} onOpenChange={onClose}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete Promotion Instance</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to delete the promotion instance "
                        {promotion?.promotionName}"? This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
