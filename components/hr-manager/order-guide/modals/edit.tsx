"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useFirestore } from "@/context/firestore-context";
import { useToast } from "@/context/toastContext";
import { OrderGuideService } from "@/lib/backend/api/order-guide-service";
import { EmployeeModel } from "@/lib/models/employee";
import type { OrderGuideModel } from "@/lib/models/order-guide-and-order-item";
import getFullName from "@/lib/util/getEmployeeFullName";
import { ORDER_GUIDE_LOG_MESSAGES } from "@/lib/log-descriptions/order-guide";
import { useAuth } from "@/context/authContext";
import { cn } from "@/lib/utils";
import {
    AlertCircle,
    BookOpen,
    ChevronsUpDown,
    GraduationCap,
    Package,
    Route,
    Users,
    X,
} from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";

interface OrderGuideEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    editingGuide: OrderGuideModel | null;
}

export function OrderGuideEditModal({ isOpen, onClose, editingGuide }: OrderGuideEditModalProps) {
    const { employees, orderItems, trainingMaterials, trainingPaths } = useFirestore();
    const { showToast } = useToast();
    const { userData } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        orderGuideName: "",
        associatedEmployees: [] as OrderGuideModel["associatedEmployees"],
        associatedItems: [] as string[],
        associatedTrainingPaths: [] as string[],
        associatedTrainingMaterials: [] as string[],
    });

    const [openEmployees, setOpenEmployees] = useState(false);
    const [openItems, setOpenItems] = useState(false);
    const [openPaths, setOpenPaths] = useState(false);
    const [openMaterials, setOpenMaterials] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    // Populate form when editingGuide changes
    useEffect(() => {
        if (editingGuide) {
            setFormData({
                orderGuideName: editingGuide.orderGuideName,
                associatedEmployees: editingGuide.associatedEmployees,
                associatedItems: editingGuide.associatedItems,
                associatedTrainingPaths: editingGuide.associatedTrainingPaths || [],
                associatedTrainingMaterials: editingGuide.associatedTrainingMaterials,
            });
        }
    }, [editingGuide]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        if (!formData.orderGuideName.trim() || !editingGuide) return;

        const guide: OrderGuideModel = {
            ...editingGuide,
            orderGuideName: formData.orderGuideName,
            associatedEmployees: formData.associatedEmployees,
            associatedItems: formData.associatedItems,
            associatedTrainingPaths: formData.associatedTrainingPaths,
            associatedTrainingMaterials: formData.associatedTrainingMaterials,
        };

        try {
            if (!editingGuide.id) {
                throw new Error("Order guide ID is missing");
            }
            await OrderGuideService.updateOrderGuide(
                editingGuide.id,
                guide,
                userData?.uid ?? "",
                ORDER_GUIDE_LOG_MESSAGES.ORDER_GUIDE_UPDATED(guide.orderGuideName),
            );
            onClose();

            // Reset form
            setFormData({
                orderGuideName: "",
                associatedEmployees: [],
                associatedItems: [],
                associatedTrainingPaths: [],
                associatedTrainingMaterials: [],
            });
            showToast("Order guide updated successfully", "Success", "success");
        } catch (error) {
            console.error("Error updating order guide:", error);
            showToast("Failed to update order guide", "Error", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddEmployee = (employeeId: string) => {
        const employee = employees.find(emp => emp.id === employeeId);
        if (employee) {
            // Allow duplicates as requested
            setFormData(prev => ({
                ...prev,
                associatedEmployees: [
                    ...prev.associatedEmployees,
                    {
                        uid: employee.uid,
                        comment: null,
                        rating: null,
                        status: null,
                    },
                ],
            }));
        }
    };

    const handleRemoveEmployee = (employeeId: string) => {
        setFormData(prev => ({
            ...prev,
            associatedEmployees: prev.associatedEmployees.filter(emp => emp.uid !== employeeId),
        }));
    };

    const handleAddItem = (itemId: string) => {
        if (!formData.associatedItems.includes(itemId)) {
            setFormData(prev => ({
                ...prev,
                associatedItems: [...prev.associatedItems, itemId],
            }));
        }
    };

    const handleRemoveItem = (index: number) => {
        setFormData(prev => ({
            ...prev,
            associatedItems: prev.associatedItems.filter((_, i) => i !== index),
        }));
    };

    const handleAddTrainingPath = (pathId: string) => {
        if (!formData.associatedTrainingPaths?.includes(pathId)) {
            setFormData(prev => ({
                ...prev,
                associatedTrainingPaths: [...(prev.associatedTrainingPaths || []), pathId],
            }));
        }
    };

    const handleRemoveTrainingPath = (index: number) => {
        setFormData(prev => ({
            ...prev,
            associatedTrainingPaths: (prev.associatedTrainingPaths || []).filter(
                (_, i) => i !== index,
            ),
        }));
    };

    const handleAddMaterial = (materialId: string) => {
        if (!formData.associatedTrainingMaterials.includes(materialId)) {
            setFormData(prev => ({
                ...prev,
                associatedTrainingMaterials: [...prev.associatedTrainingMaterials, materialId],
            }));
        }
    };

    const handleRemoveMaterial = (index: number) => {
        setFormData(prev => ({
            ...prev,
            associatedTrainingMaterials: prev.associatedTrainingMaterials.filter(
                (_, i) => i !== index,
            ),
        }));
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-semibold">Edit Order Guide</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 mt-6">
                    {/* Basic Information */}
                    <Card>
                        <CardContent className="p-6">
                            <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="orderGuideName" className="text-sm font-medium">
                                        Order Guide Name *
                                    </Label>
                                    <Input
                                        id="orderGuideName"
                                        value={formData.orderGuideName}
                                        onChange={e =>
                                            setFormData(prev => ({
                                                ...prev,
                                                orderGuideName: e.target.value,
                                            }))
                                        }
                                        placeholder="Enter order guide name"
                                        className="mt-1"
                                        required
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Associated Employees */}
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Users className="h-5 w-5 text-accent-600" />
                                <h3 className="text-lg font-semibold">
                                    Associated Employees ({formData.associatedEmployees.length})
                                </h3>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-sm font-medium flex items-center gap-2">
                                    <Users className="h-4 w-4" />
                                    Associated Employees <span className="text-danger-500">*</span>
                                </Label>

                                <Popover open={openEmployees} onOpenChange={setOpenEmployees}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={openEmployees}
                                            className={cn(
                                                "w-full justify-between border-gray-400",
                                                errors.associatedEmployees && "border-danger-500",
                                            )}
                                        >
                                            Select employees to add
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent
                                        className="p-0 z-[150]"
                                        align="start"
                                        style={{ width: "var(--radix-popover-trigger-width)" }}
                                    >
                                        <Command>
                                            <CommandInput
                                                placeholder="Search employees..."
                                                className="h-9 focus:ring-0 focus:outline-none"
                                            />
                                            <CommandList>
                                                <CommandEmpty>No employee found.</CommandEmpty>
                                                <CommandGroup>
                                                    {employees
                                                        .filter(
                                                            emp =>
                                                                !formData.associatedEmployees.find(
                                                                    e => e.uid === emp.uid,
                                                                ),
                                                        )
                                                        .map(employee => (
                                                            <CommandItem
                                                                key={employee.id}
                                                                value={`${employee.firstName} ${employee.surname}`}
                                                                onSelect={() => {
                                                                    handleAddEmployee(employee.id!);
                                                                    setOpenEmployees(false);
                                                                }}
                                                            >
                                                                <div className="flex flex-col">
                                                                    <span className="font-medium">
                                                                        {employee.firstName}{" "}
                                                                        {employee.middleName
                                                                            ? employee.middleName +
                                                                              " "
                                                                            : ""}
                                                                        {employee.surname}
                                                                    </span>
                                                                </div>
                                                            </CommandItem>
                                                        ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>

                                {errors.associatedEmployees && (
                                    <p className="text-xs text-danger-600 flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" />
                                        {errors.associatedEmployees}
                                    </p>
                                )}

                                {formData.associatedEmployees.length > 0 && (
                                    <div className="space-y-2 mt-3">
                                        {formData.associatedEmployees.map(employee => (
                                            <div
                                                key={employee.uid}
                                                className="flex items-center justify-between p-3 rounded-lg border"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div>
                                                        <p className="font-medium">
                                                            {getFullName(
                                                                employees.find(
                                                                    e => e.uid === employee.uid,
                                                                ) as EmployeeModel,
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        handleRemoveEmployee(employee.uid)
                                                    }
                                                    className="text-danger-600 hover:text-danger-700 hover:bg-danger-50"
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Associated Items */}
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Package className="h-5 w-5 text-secondary-600" />
                                <h3 className="text-lg font-semibold">
                                    Associated Items ({formData.associatedItems.length})
                                </h3>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-sm font-medium flex items-center gap-2">
                                    <Package className="h-4 w-4" />
                                    Associated Items <span className="text-danger-500">*</span>
                                </Label>

                                <Popover open={openItems} onOpenChange={setOpenItems}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={openItems}
                                            className={cn(
                                                "w-full justify-between border-gray-400",
                                                errors.associatedItems && "border-danger-500",
                                            )}
                                        >
                                            Select items to add
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent
                                        className="p-0 z-[150]"
                                        align="start"
                                        style={{ width: "var(--radix-popover-trigger-width)" }}
                                    >
                                        <Command>
                                            <CommandInput
                                                placeholder="Search items..."
                                                className="h-9 focus:ring-0 focus:outline-none"
                                            />
                                            <CommandList>
                                                <CommandEmpty>No item found.</CommandEmpty>
                                                <CommandGroup>
                                                    {orderItems
                                                        .filter(
                                                            item =>
                                                                !formData.associatedItems.includes(
                                                                    item.id!,
                                                                ),
                                                        )
                                                        .map(item => (
                                                            <CommandItem
                                                                key={item.id}
                                                                value={`${item.itemName} ${item.itemDescription}`}
                                                                onSelect={() => {
                                                                    handleAddItem(item.id!);
                                                                    setOpenItems(false);
                                                                }}
                                                            >
                                                                <div className="flex flex-col">
                                                                    <span className="font-medium">
                                                                        {item.itemName}
                                                                    </span>
                                                                    <span className="text-xs text-brand-500">
                                                                        {item.itemDescription}
                                                                    </span>
                                                                </div>
                                                            </CommandItem>
                                                        ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>

                                {errors.associatedItems && (
                                    <p className="text-xs text-danger-600 flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" />
                                        {errors.associatedItems}
                                    </p>
                                )}

                                {formData.associatedItems.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {formData.associatedItems.map((itemId, index) => {
                                            const item = orderItems.find(i => i.id === itemId);
                                            return (
                                                <Badge
                                                    key={index}
                                                    className="bg-secondary-100 text-secondary-800 border-secondary-200 px-3 py-1"
                                                >
                                                    {item?.itemName || itemId}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveItem(index)}
                                                        className="ml-2 hover:text-danger-600"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </Badge>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Training Paths */}
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Route className="h-5 w-5 text-purple-600" />
                                <h3 className="text-lg font-semibold">
                                    Training Paths ({formData.associatedTrainingPaths?.length || 0})
                                </h3>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-sm font-medium flex items-center gap-2">
                                    <GraduationCap className="h-4 w-4" />
                                    Training Paths
                                </Label>

                                <Popover open={openPaths} onOpenChange={setOpenPaths}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={openPaths}
                                            className="w-full justify-between border-gray-400 bg-transparent"
                                        >
                                            Select training paths to add
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent
                                        className="p-0 z-[150]"
                                        align="start"
                                        style={{ width: "var(--radix-popover-trigger-width)" }}
                                    >
                                        <Command>
                                            <CommandInput
                                                placeholder="Search training paths..."
                                                className="h-9 focus:ring-0 focus:outline-none"
                                            />
                                            <CommandList>
                                                <CommandEmpty>No training path found.</CommandEmpty>
                                                <CommandGroup>
                                                    {trainingPaths
                                                        .filter(
                                                            path =>
                                                                !(
                                                                    formData.associatedTrainingPaths ||
                                                                    []
                                                                ).includes(path.id!),
                                                        )
                                                        .map(path => (
                                                            <CommandItem
                                                                key={path.id}
                                                                value={path.name}
                                                                onSelect={() => {
                                                                    handleAddTrainingPath(path.id!);
                                                                    setOpenPaths(false);
                                                                }}
                                                            >
                                                                {path.name}
                                                            </CommandItem>
                                                        ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>

                                {(formData.associatedTrainingPaths || []).length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {(formData.associatedTrainingPaths || []).map(
                                            (pathId, index) => {
                                                const path = trainingPaths.find(
                                                    p => p.id === pathId,
                                                );
                                                return (
                                                    <Badge
                                                        key={index}
                                                        className="bg-purple-100 text-purple-800 border-purple-200 px-3 py-1"
                                                    >
                                                        {path?.name || pathId}
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleRemoveTrainingPath(index)
                                                            }
                                                            className="ml-2 hover:text-danger-600"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    </Badge>
                                                );
                                            },
                                        )}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Training Materials */}
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <BookOpen className="h-5 w-5 text-success-600" />
                                <h3 className="text-lg font-semibold">
                                    Training Materials (
                                    {formData.associatedTrainingMaterials.length})
                                </h3>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-sm font-medium flex items-center gap-2">
                                    <BookOpen className="h-4 w-4" />
                                    Training Materials
                                </Label>

                                <Popover open={openMaterials} onOpenChange={setOpenMaterials}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={openMaterials}
                                            className="w-full justify-between border-gray-400 bg-transparent"
                                        >
                                            Select training materials to add
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent
                                        className="p-0 z-[150]"
                                        align="start"
                                        style={{ width: "var(--radix-popover-trigger-width)" }}
                                    >
                                        <Command>
                                            <CommandInput
                                                placeholder="Search training materials..."
                                                className="h-9 focus:ring-0 focus:outline-none"
                                            />
                                            <CommandList>
                                                <CommandEmpty>
                                                    No training material found.
                                                </CommandEmpty>
                                                <CommandGroup>
                                                    {trainingMaterials
                                                        .filter(
                                                            material =>
                                                                !formData.associatedTrainingMaterials.includes(
                                                                    material.id!,
                                                                ),
                                                        )
                                                        .map(material => (
                                                            <CommandItem
                                                                key={material.id}
                                                                value={`${material.name}`}
                                                                onSelect={() => {
                                                                    handleAddMaterial(material.id!);
                                                                    setOpenMaterials(false);
                                                                }}
                                                            >
                                                                <div className="flex flex-col">
                                                                    <span className="font-medium">
                                                                        {material.name}
                                                                    </span>
                                                                </div>
                                                            </CommandItem>
                                                        ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>

                                {formData.associatedTrainingMaterials.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {formData.associatedTrainingMaterials.map(
                                            (materialId, index) => {
                                                const material = trainingMaterials.find(
                                                    m => m.id === materialId,
                                                );
                                                return (
                                                    <Badge
                                                        key={index}
                                                        className="bg-success-100 text-success-800 border-success-200 px-3 py-1"
                                                    >
                                                        {material?.name || materialId}
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleRemoveMaterial(index)
                                                            }
                                                            className="ml-2 hover:text-danger-600"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    </Badge>
                                                );
                                            },
                                        )}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Form Actions */}
                    <div className="flex justify-end gap-3 pt-6 border-t">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="bg-brand-600 hover:bg-brand-700 text-white"
                        >
                            {isLoading ? "Updating..." : "Update Order Guide"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
