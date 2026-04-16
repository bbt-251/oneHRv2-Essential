"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { OrderItemModel } from "@/lib/models/order-guide-and-order-item";
import { useToast } from "@/context/toastContext";

interface OrderItemAddModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (item: OrderItemModel) => void;
}

export function OrderItemAddModal({ isOpen, onClose, onSubmit }: OrderItemAddModalProps) {
    const { showToast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<OrderItemModel>>({
        itemID: "",
        itemName: "",
        itemDescription: "",
        active: "Yes",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await onSubmit(formData as OrderItemModel);
            setFormData({
                itemID: "",
                itemName: "",
                itemDescription: "",
                active: "Yes",
            });
            showToast("Order item created successfully", "Success", "success");
        } catch (error) {
            console.error("Error creating order item:", error);
            showToast("Failed to create order item", "Error", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (field: keyof OrderItemModel, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto z-[100]">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-semibold">
                        Create New Order Item
                    </DialogTitle>
                    <DialogDescription>
                        Fill in the details to create a new order item
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                    {/* Item ID */}
                    <div className="space-y-2">
                        <Label htmlFor="itemID" className="font-medium">
                            Item ID <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="itemID"
                            value={formData.itemID}
                            onChange={e => handleChange("itemID", e.target.value)}
                            placeholder="e.g., ITEM-001"
                            required
                            className="border-gray-400"
                        />
                    </div>

                    {/* Item Name */}
                    <div className="space-y-2">
                        <Label htmlFor="itemName" className="font-medium">
                            Item Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="itemName"
                            value={formData.itemName}
                            onChange={e => handleChange("itemName", e.target.value)}
                            placeholder="e.g., Laptop - Dell XPS 15"
                            required
                            className="border-gray-400"
                        />
                    </div>

                    {/* Item Description */}
                    <div className="space-y-2">
                        <Label htmlFor="itemDescription" className="font-medium">
                            Item Description <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                            id="itemDescription"
                            value={formData.itemDescription}
                            onChange={e => handleChange("itemDescription", e.target.value)}
                            placeholder="Provide a detailed description of the item..."
                            required
                            rows={4}
                            className="border-gray-400 resize-none"
                        />
                    </div>

                    {/* Active Status */}
                    <div className="space-y-2">
                        <Label htmlFor="active" className="font-medium">
                            Status <span className="text-red-500">*</span>
                        </Label>
                        <Select
                            value={formData.active}
                            onValueChange={(value: "Yes" | "No") => handleChange("active", value)}
                        >
                            <SelectTrigger className="border-gray-400">
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent className="z-[150] border-gray-400">
                                <SelectItem value="Yes">Active</SelectItem>
                                <SelectItem value="No">Inactive</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-sm text-brand-500">
                            Active items are available for ordering
                        </p>
                    </div>

                    {/* Form Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-accent-200">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="border-accent-200 bg-transparent"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="bg-brand-600 hover:bg-brand-700 text-white"
                        >
                            {isLoading ? "Creating..." : "Create Item"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
