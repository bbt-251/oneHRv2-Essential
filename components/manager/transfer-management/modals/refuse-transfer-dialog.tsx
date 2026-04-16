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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/context/toastContext";
import { useAuth } from "@/context/authContext";
import { managerRefuseTransfer } from "@/lib/backend/firebase/transferService";
import { TransferModel } from "@/lib/models/transfer";
import { Loader2, XCircle } from "lucide-react";
import dayjs from "dayjs";

interface RefuseTransferDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    transfer: TransferModel | null;
}

export default function RefuseTransferDialog({
    isOpen,
    onClose,
    onSuccess,
    transfer,
}: RefuseTransferDialogProps) {
    const { showToast } = useToast();
    const { userData } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [remark, setRemark] = useState("");

    const handleRefuse = async () => {
        if (!transfer?.id) {
            showToast("Transfer data not available", "error", "error");
            return;
        }

        if (!remark.trim()) {
            showToast("Remark is required for refusal", "error", "error");
            return;
        }

        setIsSubmitting(true);

        try {
            const success = await managerRefuseTransfer(
                transfer.id,
                userData?.uid,
                `${userData?.firstName} ${userData?.surname}`,
                remark.trim(),
            );

            if (success) {
                showToast("Transfer request refused", "success", "success");
                setRemark("");
                onSuccess();
                onClose();
            } else {
                showToast("Failed to refuse transfer request", "error", "error");
            }
        } catch (error) {
            console.error("Error refusing transfer request:", error);
            showToast("An error occurred while refusing the request", "error", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            setRemark("");
            onClose();
        }
    };

    if (!transfer) return null;

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-md">
                <DialogHeader className="pb-4">
                    <DialogTitle className="text-xl font-bold text-red-600 flex items-center gap-2">
                        <XCircle className="h-5 w-5" />
                        Refuse Transfer Request
                    </DialogTitle>
                    <DialogDescription>
                        As the current manager, refuse this transfer request.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Warning */}
                    <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
                        <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-medium text-red-800">Refusal Confirmation</p>
                            <p className="text-sm text-red-600 mt-1">
                                This will refuse the transfer request and close it. The employee
                                will be notified.
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
                            <span className="text-sm text-gray-500">Employee</span>
                            <span className="text-sm font-medium text-gray-900">
                                {transfer.employeeFullName}
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
                            <span className="text-sm text-gray-500">Current Status</span>
                            <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                                {transfer.transferStatus}
                            </Badge>
                        </div>
                    </div>

                    {/* Remark */}
                    <div className="space-y-2">
                        <Label
                            htmlFor="remark"
                            className="text-sm font-medium flex items-center gap-1"
                        >
                            Remark / Reason
                            <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                            id="remark"
                            placeholder="Provide a reason for refusing this transfer request..."
                            value={remark}
                            onChange={e => setRemark(e.target.value)}
                            rows={3}
                            required
                        />
                    </div>
                </div>

                <DialogFooter className="pt-4 border-t">
                    <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleRefuse}
                        disabled={isSubmitting || !remark.trim()}
                        className="bg-red-600 hover:bg-red-700"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Refusing...
                            </>
                        ) : (
                            <>
                                <XCircle className="h-4 w-4 mr-2" />
                                Refuse Request
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
