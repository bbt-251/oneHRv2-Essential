"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { SuccessionPlanningModel } from "@/lib/models/succession-planning";
import { OrderGuideModel } from "@/lib/models/order-guide-and-order-item";
import { updateSuccessionPlan } from "@/lib/backend/api/succession-planning/succession-planning-service";
import { useToast } from "@/context/toastContext";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    plan: SuccessionPlanningModel | null;
    orderGuides: OrderGuideModel[];
}

export function AssociateOrderGuideDialog({ open, onOpenChange, plan, orderGuides }: Props) {
    const { showToast } = useToast();
    const [saving, setSaving] = useState(false);
    const [selectedOrderGuideId, setSelectedOrderGuideId] = useState<string | undefined>(
        plan?.orderGuide,
    );

    if (!plan) return null;

    const handleSubmit = async () => {
        if (!plan || !selectedOrderGuideId) {
            showToast("Please select an order guide", "Error", "error");
            return;
        }

        setSaving(true);
        try {
            const updatedPlan: SuccessionPlanningModel = {
                ...plan,
                orderGuide: selectedOrderGuideId,
            };

            const result = await updateSuccessionPlan(updatedPlan);
            if (!result) {
                showToast("Failed to associate order guide", "Error", "error");
                setSaving(false);
                return;
            }

            showToast("Order guide associated successfully", "Success", "success");
            onOpenChange(false);
        } catch (e) {
            console.error(e);
            showToast("Something went wrong. Please try again.", "Error", "error");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Associate Order Guide</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                        <Label className="text-sm">Order Guide</Label>
                        <Select
                            value={selectedOrderGuideId}
                            onValueChange={val => setSelectedOrderGuideId(val)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select an order guide" />
                            </SelectTrigger>
                            <SelectContent>
                                {orderGuides.map(og => (
                                    <SelectItem key={og.orderGuideID} value={og.orderGuideID}>
                                        {og.orderGuideName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onOpenChange(false)}
                            disabled={saving}
                        >
                            Cancel
                        </Button>
                        <Button size="sm" onClick={handleSubmit} disabled={saving}>
                            {saving ? "Saving..." : "Save"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
