"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { ExitChecklistItemModel } from "@/lib/models/exit-checklist-item";
import { useFirestore } from "@/context/firestore-context";
import getFullName from "@/lib/util/getEmployeeFullName";
import { EmployeeModel } from "@/lib/models/employee";

interface ExitChecklistItemFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (item: ExitChecklistItemModel) => void;
    editingItem: ExitChecklistItemModel | null;
}

export function ExitChecklistItemFormModal({
    isOpen,
    onClose,
    onSave,
    editingItem,
}: ExitChecklistItemFormModalProps) {
    const { activeEmployees } = useFirestore();
    const [formData, setFormData] = useState<ExitChecklistItemModel>({
        timestamp: new Date().toISOString(),
        itemName: "",
        itemDescription: "",
        itemDueDate: "",
        itemCreatedBy: "",
        itemApprover: "",
    });

    const [approverOpen, setApproverOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const approvers = activeEmployees.filter(emp => emp.role.includes("Manager"));

    useEffect(() => {
        if (editingItem) {
            setFormData(editingItem);
        } else {
            setFormData({
                timestamp: new Date().toISOString(),
                itemName: "",
                itemDescription: "",
                itemDueDate: "",
                itemCreatedBy: "",
                itemApprover: "",
            });
        }
    }, [editingItem, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await onSave(formData);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 z-[110]">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-semibold text-brand-800 dark:text-foreground">
                        {editingItem ? "Edit Checklist Item" : "Create New Checklist Item"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-brand-800 dark:text-foreground">
                            Basic Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label>Timestamp</Label>
                                <Input
                                    value={new Date(formData.timestamp).toLocaleString()}
                                    disabled
                                    className="bg-gray-100 dark:bg-gray-800"
                                />
                            </div>
                        </div>

                        <div>
                            <Label>
                                Item Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                value={formData.itemName}
                                onChange={e =>
                                    setFormData({ ...formData, itemName: e.target.value })
                                }
                                placeholder="Enter item name"
                                required
                            />
                        </div>

                        <div>
                            <Label>
                                Item Description <span className="text-red-500">*</span>
                            </Label>
                            <Textarea
                                value={formData.itemDescription}
                                onChange={e =>
                                    setFormData({ ...formData, itemDescription: e.target.value })
                                }
                                placeholder="Enter detailed description of the checklist item"
                                rows={4}
                                required
                            />
                        </div>
                    </div>

                    {/* Additional Details */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-brand-800 dark:text-foreground">
                            Additional Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <Label>Due Date</Label>
                                <Input
                                    type="date"
                                    value={formData.itemDueDate}
                                    onChange={e =>
                                        setFormData({ ...formData, itemDueDate: e.target.value })
                                    }
                                />
                            </div>
                            <div>
                                <Label>Approver</Label>
                                <Popover open={approverOpen} onOpenChange={setApproverOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={approverOpen}
                                            className="w-full justify-between border-gray-400 dark:border-gray-500 bg-transparent"
                                        >
                                            {getFullName(
                                                approvers.find(
                                                    a => a.uid == formData.itemApprover,
                                                ) ?? ({} as EmployeeModel),
                                            ) || "Select approver..."}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent
                                        className="p-0 bg-white dark:bg-gray-800 border-gray-400 dark:border-gray-500 z-[150]"
                                        align="start"
                                        style={{ width: "var(--radix-popover-trigger-width)" }}
                                    >
                                        <Command className="bg-white dark:bg-gray-800">
                                            <CommandInput
                                                placeholder="Search approvers..."
                                                className="h-9 focus:ring-0 focus:outline-none"
                                            />
                                            <CommandList>
                                                <CommandEmpty>No approver found.</CommandEmpty>
                                                <CommandGroup>
                                                    {approvers.map(approver => (
                                                        <CommandItem
                                                            key={approver.uid}
                                                            value={approver.uid}
                                                            onSelect={() => {
                                                                setFormData({
                                                                    ...formData,
                                                                    itemApprover: approver.uid,
                                                                });
                                                                setApproverOpen(false);
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    formData.itemApprover ===
                                                                        approver.uid
                                                                        ? "opacity-100"
                                                                        : "opacity-0",
                                                                )}
                                                            />
                                                            <div className="flex flex-col">
                                                                <span className="font-medium">
                                                                    {getFullName(approver)}
                                                                </span>
                                                            </div>
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>
                            {/* </CHANGE> */}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white"
                        >
                            {isSubmitting
                                ? "Saving..."
                                : editingItem
                                    ? "Update Item"
                                    : "Create Item"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
