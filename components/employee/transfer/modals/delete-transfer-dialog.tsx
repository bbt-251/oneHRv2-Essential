"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/context/toastContext";
import { useAuth } from "@/context/authContext";
import { deleteTransfer } from "@/lib/backend/firebase/transferService";
import { TransferModel } from "@/lib/models/transfer";
import { TransferTypeModel, TransferReasonModel } from "@/lib/backend/firebase/hrSettingsService";
import { Loader2, Trash2, AlertTriangle } from "lucide-react";
import dayjs from "dayjs";

interface DeleteTransferDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    transfer: TransferModel | null;
    transferTypes: TransferTypeModel[];
    transferReasons: TransferReasonModel[];
}

export default function DeleteTransferDialog({
    isOpen,
    onClose,
    onSuccess,
    transfer,
    transferTypes,
    transferReasons,
}: DeleteTransferDialogProps) {
    const { showToast } = useToast();
    const { userData } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Get transfer type name
    const getTransferTypeName = (typeId: string | null) => {
        if (!typeId) return "-";
        const type = transferTypes?.find(t => t.id === typeId);
        return type?.name || typeId;
    };

    // Get transfer reason name
    const getTransferReasonName = (reasonId: string | null) => {
        if (!reasonId) return "-";
        const reason = transferReasons?.find(r => r.id === reasonId);
        return reason?.name || reasonId;
    };

    const handleDelete = async () => {
        if (!transfer?.id) {
            showToast("Transfer data not available", "error", "error");
            return;
        }

        setIsSubmitting(true);

        try {
            const success = await deleteTransfer(transfer.id, userData?.uid);

            if (success) {
                showToast("Transfer request deleted successfully", "success", "success");
                onSuccess();
                onClose();
            } else {
                showToast("Failed to delete transfer request", "error", "error");
            }
        } catch (error) {
            console.error("Error deleting transfer request:", error);
            showToast("An error occurred while deleting the request", "error", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            onClose();
        }
    };

    if (!transfer) return null;

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-md">
                <DialogHeader className="pb-4">
                    <DialogTitle className="text-xl font-bold text-red-600 flex items-center gap-2">
                        <Trash2 className="h-5 w-5" />
                        Delete Transfer Request
                    </DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete this transfer request?
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Warning */}
                    <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
                        <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-medium text-red-800">Warning</p>
                            <p className="text-sm text-red-600 mt-1">
                                This action cannot be undone. This will permanently delete your
                                transfer request.
                            </p>
                        </div>
                    </div>

                    {/* Transfer Summary */}
                    <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Transfer ID</span>
                            <span className="text-sm font-medium text-gray-900">
                                {transfer.transferID}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Type</span>
                            <span className="text-sm font-medium text-gray-900">
                                {getTransferTypeName(transfer.transferType)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Reason</span>
                            <span className="text-sm font-medium text-gray-900">
                                {getTransferReasonName(transfer.transferReason)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Desired Date</span>
                            <span className="text-sm font-medium text-gray-900">
                                {transfer.transferDesiredDate
                                    ? dayjs(transfer.transferDesiredDate).format("MMM DD, YYYY")
                                    : "-"}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Status</span>
                            <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                                {transfer.transferStatus}
                            </Badge>
                        </div>
                    </div>
                </div>

                <DialogFooter className="pt-4 border-t">
                    <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={isSubmitting}
                        className="bg-red-600 hover:bg-red-700"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Deleting...
                            </>
                        ) : (
                            <>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Request
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
