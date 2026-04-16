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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/authContext";
import { useToast } from "@/context/toastContext";
import { createTransferRequest } from "@/lib/backend/firebase/transferService";
import { TransferTypeModel, TransferReasonModel } from "@/lib/backend/firebase/hrSettingsService";
import { Loader2, ArrowRight } from "lucide-react";

interface AddTransferDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    transferTypes: TransferTypeModel[];
    transferReasons: TransferReasonModel[];
}

export default function AddTransferDialog({
    isOpen,
    onClose,
    onSuccess,
    transferTypes,
    transferReasons,
}: AddTransferDialogProps) {
    const { userData } = useAuth();
    const { showToast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        transferType: "",
        transferTypeName: "",
        transferReason: "",
        transferReasonName: "",
        transferDescription: "",
        transferDesiredDate: "",
    });

    const resetForm = () => {
        setFormData({
            transferType: "",
            transferTypeName: "",
            transferReason: "",
            transferReasonName: "",
            transferDescription: "",
            transferDesiredDate: "",
        });
    };

    const handleSubmit = async () => {
        if (!userData?.uid || !userData?.firstName || !userData?.surname) {
            showToast("User data not available", "error", "error");
            return;
        }

        if (!formData.transferType) {
            showToast("Please select a transfer type", "error", "error");
            return;
        }

        if (!formData.transferDesiredDate) {
            showToast("Please select a desired date", "error", "error");
            return;
        }

        setIsSubmitting(true);

        try {
            const success = await createTransferRequest(
                userData.uid,
                `${userData.firstName} ${userData.surname}`,
                {
                    transferType: formData.transferType,
                    transferTypeName: formData.transferTypeName,
                    transferReason: formData.transferReason || null,
                    transferReasonName: formData.transferReasonName || null,
                    transferDescription: formData.transferDescription,
                    transferDesiredDate: formData.transferDesiredDate,
                },
            );

            if (success) {
                showToast("Transfer request submitted successfully", "success", "success");
                resetForm();
                onSuccess();
                onClose();
            } else {
                showToast("Failed to submit transfer request", "error", "error");
            }
        } catch (error) {
            console.error("Error submitting transfer request:", error);
            showToast("An error occurred while submitting the request", "error", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader className="pb-4">
                    <DialogTitle className="text-xl font-bold text-brand-800 flex items-center gap-2">
                        <ArrowRight className="h-5 w-5 text-brand-600" />
                        New Transfer Request
                    </DialogTitle>
                    <DialogDescription>
                        Submit a new transfer request. Fields marked with * are required.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Transfer Type */}
                    <div className="space-y-2">
                        <Label htmlFor="transferType" className="text-sm font-medium">
                            Transfer Type *
                        </Label>
                        <Select
                            value={formData.transferType}
                            onValueChange={value => {
                                const selectedType = transferTypes?.find(t => t.id === value);
                                setFormData(prev => ({
                                    ...prev,
                                    transferType: value,
                                    transferTypeName: selectedType?.name || "",
                                }));
                            }}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select transfer type" />
                            </SelectTrigger>
                            <SelectContent>
                                {transferTypes
                                    ?.filter(type => type.id && type.active === true)
                                    .map(type => (
                                        <SelectItem key={type.id} value={type.id!}>
                                            {type.name}
                                        </SelectItem>
                                    ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Transfer Reason */}
                    <div className="space-y-2">
                        <Label htmlFor="transferReason" className="text-sm font-medium">
                            Transfer Reason
                        </Label>
                        <Select
                            value={formData.transferReason}
                            onValueChange={value => {
                                const selectedReason = transferReasons?.find(r => r.id === value);
                                setFormData(prev => ({
                                    ...prev,
                                    transferReason: value,
                                    transferReasonName: selectedReason?.name || "",
                                }));
                            }}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select transfer reason (optional)" />
                            </SelectTrigger>
                            <SelectContent>
                                {transferReasons
                                    ?.filter(reason => reason.id && reason.active === true)
                                    .map(reason => (
                                        <SelectItem key={reason.id} value={reason.id!}>
                                            {reason.name}
                                        </SelectItem>
                                    ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Desired Date */}
                    <div className="space-y-2">
                        <Label htmlFor="transferDesiredDate" className="text-sm font-medium">
                            Desired Transfer Date *
                        </Label>
                        <Input
                            id="transferDesiredDate"
                            type="date"
                            value={formData.transferDesiredDate}
                            onChange={e =>
                                setFormData(prev => ({
                                    ...prev,
                                    transferDesiredDate: e.target.value,
                                }))
                            }
                            min={new Date().toISOString().split("T")[0]}
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="transferDescription" className="text-sm font-medium">
                            Description
                        </Label>
                        <Textarea
                            id="transferDescription"
                            placeholder="Provide additional details about your transfer request..."
                            value={formData.transferDescription}
                            onChange={e =>
                                setFormData(prev => ({
                                    ...prev,
                                    transferDescription: e.target.value,
                                }))
                            }
                            rows={4}
                        />
                    </div>
                </div>

                <DialogFooter className="pt-4 border-t">
                    <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="bg-brand-600 hover:bg-brand-700 text-white"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Submitting...
                            </>
                        ) : (
                            "Submit Request"
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
