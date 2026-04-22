"use client";
import { useEffect } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { hrSettingsService, LocationModel } from "@/lib/backend/hr-settings-service";
import { useToast } from "@/context/toastContext";
import { useTheme } from "@/components/theme-provider";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { useAuth } from "@/context/authContext";
import { LOCATION_LOG_MESSAGES } from "@/lib/log-descriptions/notification-location";

interface LocationNode extends LocationModel {
    parentId?: string | null;
    children: LocationNode[];
    isExpanded?: boolean;
    description?: string;
    address?: string;
}

interface AddLocationProps {
    showAddModal: boolean;
    setShowAddModal: (show: boolean) => void;
    editingLocation: LocationNode | null;
    selectedParent: LocationNode | null;
    setSelectedParent: (parent: LocationNode | null) => void;
    locations: LocationNode[];
}

export function AddLocation({
    showAddModal,
    setShowAddModal,
    editingLocation,
    selectedParent,
    setSelectedParent,
    locations,
}: AddLocationProps) {
    const { showToast } = useToast();
    const { theme } = useTheme();
    const { userData } = useAuth();

    const [locationTypesState, setLocationTypesState] = useState<
        { value: string; label: string }[]
    >([
        { value: "country", label: "Country" },
        { value: "region", label: "Region/State" },
        { value: "city", label: "City" },
        { value: "office", label: "Office/Facility" },
        { value: "department", label: "Department" },
        { value: "building", label: "Building" },
        { value: "floor", label: "Floor" },
    ]);

    const [showAddTypeInput, setShowAddTypeInput] = useState<boolean>(false);
    const locationTypes = locationTypesState.map(t => ({
        ...t,
        value: t.value.toLowerCase().replace(/\s+/g, "-"),
    }));
    const [newTypeName, setNewTypeName] = useState<string>("");

    const resetForm = () =>
        setFormData({
            name: "",
            type: "office",
            startDate: "",
            endDate: "",
            active: "Yes",
            description: "",
            address: "",
        });

    const [formData, setFormData] = useState<LocationModel>({
        name: "",
        type: "office",
        startDate: "",
        endDate: "",
        active: "Yes",
        description: "",
        address: "",
    });

    useEffect(() => {
        if (editingLocation) {
            setFormData({
                name: editingLocation.name,
                type: editingLocation.type,
                startDate: editingLocation.startDate,
                endDate: editingLocation.endDate,
                active: editingLocation.active,
                description: editingLocation.description || "",
                address: editingLocation.address || "",
            });
        } else {
            // Reset form when not editing
            setFormData({
                name: "",
                type: "office",
                startDate: "",
                endDate: "",
                active: "Yes",
                description: "",
                address: "",
            });
        }
    }, [editingLocation]);

    const getFullPath = (
        nodes: LocationNode[],
        targetId: string,
        path: string[] = [],
    ): string[] => {
        for (const node of nodes) {
            const current = [...path, node.name];
            if (node.id === targetId) return current;
            const found = getFullPath(node.children, targetId, current);
            if (found.length) return found;
        }
        return [];
    };

    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const handleSubmit = async () => {
        if (isSubmitting) return;
        // required fields validation
        if (!formData.name.trim()) {
            showToast("Location name is required", "error", "error");
            return;
        }
        if (!formData.type.trim()) {
            showToast("Location type is required", "error", "error");
            return;
        }

        if (new Date(formData.startDate) >= new Date(formData.endDate)) {
            showToast("Start date must be before end date", "Validation Error", "error");
            return;
        }

        const existingLocation = locations.find(
            location =>
                location.name === formData.name &&
                (!editingLocation || location.id !== editingLocation.id),
        );

        if (existingLocation) {
            showToast("Location name must be unique", "error", "error");
            return;
        }

        setIsSubmitting(true);
        if (editingLocation) {
            const locationDataToUpdate: Partial<LocationModel> = {
                ...formData,
                updatedAt: new Date().toISOString(),
            };
            await hrSettingsService.update(
                "locations",
                editingLocation.id,
                locationDataToUpdate,
                userData?.uid ?? "",
                LOCATION_LOG_MESSAGES.UPDATED({
                    id: editingLocation.id,
                    parentId: editingLocation.parentId,
                    type: formData.type,
                    name: formData.name,
                    startDate: formData.startDate,
                    endDate: formData.endDate,
                    active: formData.active,
                    description: formData.description,
                    address: formData.address,
                }),
            );
        } else {
            const newLocationData = {
                ...formData,
                parentId: selectedParent?.id || null,
            };
            await hrSettingsService.create(
                "locations",
                newLocationData,
                userData?.uid ?? "",
                LOCATION_LOG_MESSAGES.CREATED({
                    parentId: selectedParent?.id || null,
                    type: formData.type,
                    name: formData.name,
                    startDate: formData.startDate,
                    endDate: formData.endDate,
                    active: formData.active,
                    description: formData.description,
                    address: formData.address,
                }),
            );
        }
        showToast("Location saved successfully", "success", "success");
        setShowAddModal(false);
        resetForm();
        setSelectedParent(null);
        setIsSubmitting(false);
    };

    const addNewLocationType = () => {
        if (
            newTypeName.trim() &&
            !locationTypes.some(t => t.value === newTypeName.toLowerCase().replace(/\s+/g, "-"))
        ) {
            const newType = {
                value: newTypeName.toLowerCase().replace(/\s+/g, "-"),
                label: newTypeName.trim(),
            };
            setLocationTypesState([...locationTypesState, newType]);
            setFormData({ ...formData, type: newType.value });
            setNewTypeName("");
            setShowAddTypeInput(false);
        }
    };

    return (
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
            <DialogContent
                className={`max-w-2xl rounded-2xl border-0 shadow-2xl max-h-[90vh] overflow-y-auto ${theme === "dark" ? "bg-black text-white border border-gray-800" : "bg-white"}`}
            >
                <DialogHeader className="pb-6">
                    <DialogTitle
                        className={`text-2xl font-bold ${theme === "dark" ? "text-white" : "text-slate-900"}`}
                    >
                        {editingLocation ? "Edit Location" : "Add New Location"}
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                    <div className="space-y-2"></div>
                    <div className="space-y-2">
                        <Label
                            className={`text-sm font-semibold ${theme === "dark" ? "text-white" : "text-slate-700"}`}
                        >
                            Name
                        </Label>
                        <Input
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Enter location name"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label
                                className={`text-sm font-semibold ${theme === "dark" ? "text-white" : "text-slate-700"}`}
                            >
                                Type
                            </Label>
                            <div className="space-y-2">
                                <Select
                                    value={formData.type}
                                    onValueChange={v => {
                                        if (v === "add-new") {
                                            setShowAddTypeInput(true);
                                        } else {
                                            setFormData({ ...formData, type: v });
                                        }
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select location type" />
                                    </SelectTrigger>
                                    <SelectContent
                                        className={`bg-white ${theme === "dark" ? "bg-black text-white" : "bg-white"}`}
                                    >
                                        {locationTypes.map(t => (
                                            <SelectItem key={t.value} value={t.value}>
                                                {t.label}
                                            </SelectItem>
                                        ))}
                                        <SelectItem
                                            value="add-new"
                                            className="text-amber-600 font-medium"
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add New Type
                                        </SelectItem>
                                    </SelectContent>
                                </Select>

                                {showAddTypeInput && (
                                    <div className="flex gap-2">
                                        <Input
                                            value={newTypeName}
                                            onChange={e => setNewTypeName(e.target.value)}
                                            placeholder="Enter new type name"
                                            onKeyDown={e => {
                                                if (e.key === "Enter") {
                                                    addNewLocationType();
                                                } else if (e.key === "Escape") {
                                                    setShowAddTypeInput(false);
                                                    setNewTypeName("");
                                                }
                                            }}
                                            autoFocus
                                        />
                                        <Button
                                            type="button"
                                            size="sm"
                                            onClick={addNewLocationType}
                                            className="bg-amber-600 hover:bg-amber-700 text-white"
                                            disabled={!newTypeName.trim()}
                                        >
                                            Add
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setShowAddTypeInput(false);
                                                setNewTypeName("");
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label
                                className={`text-sm font-semibold ${theme === "dark" ? "text-white" : "text-slate-700"}`}
                            >
                                Active
                            </Label>
                            <Select
                                value={formData.active}
                                onValueChange={v =>
                                    setFormData({ ...formData, active: v as "Yes" | "No" })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent
                                    className={`bg-white ${theme === "dark" ? "bg-black text-white" : "bg-white"}`}
                                >
                                    <SelectItem value="Yes">Yes</SelectItem>
                                    <SelectItem value="No">No</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label
                                className={`text-sm font-semibold ${theme === "dark" ? "text-white" : "text-slate-700"}`}
                            >
                                Start Date
                            </Label>
                            <Input
                                type="date"
                                value={formData.startDate}
                                onChange={e =>
                                    setFormData({ ...formData, startDate: e.target.value })
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label
                                className={`text-sm font-semibold ${theme === "dark" ? "text-white" : "text-slate-700"}`}
                            >
                                End Date
                            </Label>
                            <Input
                                type="date"
                                value={formData.endDate}
                                onChange={e =>
                                    setFormData({ ...formData, endDate: e.target.value })
                                }
                            />
                        </div>
                    </div>

                    {selectedParent && (
                        <div className="space-y-2">
                            <Label
                                className={`text-sm font-semibold ${theme === "dark" ? "text-white" : "text-slate-700"}`}
                            >
                                Parent Location
                            </Label>
                            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                                <div className="font-medium text-amber-900">
                                    {selectedParent.name}
                                </div>
                                <div className="text-sm text-amber-700">
                                    {getFullPath(locations, selectedParent.id!).join(" → ")}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label
                            className={`text-sm font-semibold ${theme === "dark" ? "text-white" : "text-slate-700"}`}
                        >
                            Address
                        </Label>
                        <Textarea
                            value={formData.address}
                            onChange={e => setFormData({ ...formData, address: e.target.value })}
                            rows={2}
                            placeholder="Enter physical address"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label
                            className={`text-sm font-semibold ${theme === "dark" ? "text-white" : "text-slate-700"}`}
                        >
                            Description
                        </Label>
                        <Textarea
                            value={formData.description}
                            onChange={e =>
                                setFormData({ ...formData, description: e.target.value })
                            }
                            rows={2}
                            placeholder="Enter description"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-6">
                        <Button
                            variant="outline"
                            onClick={() => setShowAddModal(false)}
                            className="rounded-lg"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            className="bg-amber-600 hover:bg-amber-700 text-white rounded-lg"
                            disabled={isSubmitting}
                        >
                            {isSubmitting
                                ? "Saving..."
                                : editingLocation
                                    ? "Update Location"
                                    : "Add Location"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
