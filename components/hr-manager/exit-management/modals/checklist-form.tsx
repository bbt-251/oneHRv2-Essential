"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    Command,
    CommandInput,
    CommandList,
    CommandEmpty,
    CommandGroup,
    CommandItem,
} from "@/components/ui/command";
import { X, ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { ExitChecklistModel } from "@/lib/models/exit-checklist";
import { useFirestore } from "@/context/firestore-context";

interface ExitChecklistFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (checklist: ExitChecklistModel) => void;
    editingChecklist: ExitChecklistModel | null;
}

export function ExitChecklistFormModal({
    isOpen,
    onClose,
    onSave,
    editingChecklist,
}: ExitChecklistFormModalProps) {
    const { exitChecklistItems } = useFirestore();
    const [formData, setFormData] = useState<ExitChecklistModel>({
        timestamp: new Date().toISOString(),
        checklistName: "",
        checklistStatus: "draft",
        checklistDueDate: "",
        listOfItems: [],
    });

    const [itemsDropdownOpen, setItemsDropdownOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (editingChecklist) {
            setFormData(editingChecklist);
        } else {
            setFormData({
                timestamp: new Date().toISOString(),
                checklistName: "",
                checklistStatus: "draft",
                checklistDueDate: "",
                listOfItems: [],
            });
        }
    }, [editingChecklist, isOpen]);

    const handleChange = (field: keyof ExitChecklistModel, value: any) => {
        setFormData({ ...formData, [field]: value });
    };

    const handleAddItem = (item: string) => {
        if (!formData.listOfItems?.includes(item)) {
            setFormData({
                ...formData,
                listOfItems: [...(formData.listOfItems || []), item],
            });
        }
    };

    const handleRemoveItem = (index: number) => {
        setFormData({
            ...formData,
            listOfItems: formData.listOfItems?.filter((_, i) => i !== index),
        });
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            await onSave(formData);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 z-[100]">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-semibold text-brand-800 dark:text-foreground">
                        {editingChecklist ? "Edit Exit Checklist" : "Create New Exit Checklist"}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 mt-4">
                    {/* Basic Information */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-brand-800 dark:text-foreground">
                            Basic Information
                        </h3>
                        <div>
                            <Label>Timestamp</Label>
                            <Input
                                value={new Date(formData.timestamp).toLocaleString()}
                                disabled
                                className="bg-gray-100 dark:bg-gray-800 border-gray-400 dark:border-gray-500"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label>
                                    Checklist Name <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    value={formData.checklistName}
                                    onChange={e => handleChange("checklistName", e.target.value)}
                                    placeholder="Enter checklist name"
                                    className="border-gray-400 dark:border-gray-500"
                                />
                            </div>
                            <div>
                                <Label>
                                    Status <span className="text-red-500">*</span>
                                </Label>
                                <Select
                                    value={formData.checklistStatus}
                                    onValueChange={(value: "draft" | "ongoing" | "done") =>
                                        handleChange("checklistStatus", value)
                                    }
                                    disabled
                                >
                                    <SelectTrigger className="bg-gray-100 dark:bg-gray-800 border-gray-400 dark:border-gray-500">
                                        <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                    <SelectContent className="z-[150] bg-white dark:bg-gray-800 border-gray-400 dark:border-gray-500">
                                        <SelectItem value="draft">Draft</SelectItem>
                                        <SelectItem value="ongoing">Ongoing</SelectItem>
                                        <SelectItem value="done">Done</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div>
                            <Label>Due Date</Label>
                            <Input
                                type="date"
                                value={formData.checklistDueDate || ""}
                                onChange={e => handleChange("checklistDueDate", e.target.value)}
                                className="border-gray-400 dark:border-gray-500"
                            />
                        </div>
                    </div>

                    {/* Checklist Items */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-brand-800 dark:text-foreground">
                            Checklist Items
                        </h3>
                        <Popover open={itemsDropdownOpen} onOpenChange={setItemsDropdownOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={itemsDropdownOpen}
                                    className="w-full justify-between border-gray-400 dark:border-gray-500 bg-transparent"
                                >
                                    Select checklist items to add...
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent
                                className="w-full p-0 z-[150] bg-white dark:bg-gray-800 border-gray-400 dark:border-gray-500"
                                align="start"
                                style={{ width: "var(--radix-popover-trigger-width)" }}
                            >
                                <Command className="bg-white dark:bg-gray-800">
                                    <CommandInput
                                        placeholder="Search checklist items..."
                                        className="h-9 focus:ring-0 focus:outline-none"
                                    />
                                    <CommandList>
                                        <CommandEmpty>No item found.</CommandEmpty>
                                        <CommandGroup>
                                            {exitChecklistItems.map(item => (
                                                <CommandItem
                                                    key={item.id}
                                                    value={item.itemName}
                                                    onSelect={() => handleAddItem(item.id!)}
                                                    className="cursor-pointer"
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            formData.listOfItems?.includes(item.id!)
                                                                ? "opacity-100"
                                                                : "opacity-0",
                                                        )}
                                                    />
                                                    {item.itemName}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>

                        {formData.listOfItems && formData.listOfItems.length > 0 && (
                            <div className="space-y-2">
                                {formData.listOfItems.map((itemId, index) => {
                                    const item = exitChecklistItems.find(i => i.id === itemId);
                                    return (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                                        >
                                            <span className="text-sm text-gray-700 dark:text-gray-300">
                                                {item?.itemName || itemId}
                                            </span>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleRemoveItem(index)}
                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white"
                    >
                        {isSubmitting
                            ? "Saving..."
                            : editingChecklist
                                ? "Update Checklist"
                                : "Create Checklist"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
