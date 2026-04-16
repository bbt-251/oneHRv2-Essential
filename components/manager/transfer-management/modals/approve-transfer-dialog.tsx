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
import { managerApproveTransfer } from "@/lib/backend/firebase/transferService";
import { TransferModel } from "@/lib/models/transfer";
import { Loader2, CheckCircle, ArrowRight, AlertTriangle } from "lucide-react";
import dayjs from "dayjs";
import getFullName from "@/lib/util/getEmployeeFullName";
import { EmployeeModel } from "@/lib/models/employee";

interface ApproveTransferDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    transfer: TransferModel | null;
}

export default function ApproveTransferDialog({
    isOpen,
    onClose,
    onSuccess,
    transfer,
}: ApproveTransferDialogProps) {
    const { showToast } = useToast();
    const { userData } = useAuth();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [riskMitigationPlan, setRiskMitigationPlan] = useState("");

    const handleApprove = async () => {
        if (!transfer?.id) {
            showToast("Transfer data not available", "error", "error");
            return;
        }

        if (!riskMitigationPlan.trim()) {
            showToast("Risk mitigation plan is required for approval", "error", "error");
            return;
        }

        setIsSubmitting(true);

        try {
            const success = await managerApproveTransfer(
                transfer.id,
                userData?.uid,
                getFullName(userData as EmployeeModel),
                riskMitigationPlan.trim(),
            );

            if (success) {
                showToast("Transfer request validated successfully", "success", "success");
                setRiskMitigationPlan("");
                onSuccess();
                onClose();
            } else {
                showToast("Failed to validate transfer request", "error", "error");
            }
        } catch (error) {
            console.error("Error validating transfer request:", error);
            showToast("An error occurred while validating the request", "error", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (!isSubmitting) {
            setRiskMitigationPlan("");
            onClose();
        }
    };

    if (!transfer) return null;

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-md">
                <DialogHeader className="pb-4">
                    <DialogTitle className="text-xl font-bold text-green-600 flex items-center gap-2">
                        <CheckCircle className="h-5 w-5" />
                        Validate Transfer Request
                    </DialogTitle>
                    <DialogDescription>
                        As the current manager, validate this transfer request and provide a risk
                        mitigation plan.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Success Info */}
                    <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-medium text-green-800">
                                Validation Confirmation
                            </p>
                            <p className="text-sm text-green-600 mt-1">
                                This will validate the transfer request and forward it to HR for
                                further assessment.
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

                    {/* Risk Mitigation Plan */}
                    <div className="space-y-2">
                        <Label
                            htmlFor="riskMitigation"
                            className="text-sm font-medium flex items-center gap-1"
                        >
                            Risk Mitigation Plan
                            <span className="text-red-500">*</span>
                        </Label>
                        <div className="flex items-start gap-2 p-2 bg-yellow-50 rounded border border-yellow-200 mb-2">
                            <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-yellow-700">
                                Describe how potential risks from this transfer will be mitigated.
                            </p>
                        </div>
                        <Textarea
                            id="riskMitigation"
                            placeholder="Enter the risk mitigation plan for this transfer..."
                            value={riskMitigationPlan}
                            onChange={e => setRiskMitigationPlan(e.target.value)}
                            rows={4}
                            required
                        />
                    </div>
                </div>

                <DialogFooter className="pt-4 border-t">
                    <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleApprove}
                        disabled={isSubmitting || !riskMitigationPlan.trim()}
                        className="bg-green-600 hover:bg-green-700 text-white"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Validating...
                            </>
                        ) : (
                            <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Validate Request
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
