"use client";

import type React from "react";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, GraduationCap } from "lucide-react";
import { ColumnConfig, DataToolbar, Density } from "../../../core-settings/blocks/data-toolbar";
import GenericForm from "./generic-form";
import GenericView from "./generic-view";
import GenericTable from "./generic-table";
import { useFirestore } from "@/context/firestore-context";
import { hrSettingsService, LevelOfEducationModel } from "@/lib/backend/firebase/hrSettingsService";
import { useToast } from "@/context/toastContext";
import { TALENT_ACQUISITION_LOG_MESSAGES } from "@/lib/log-descriptions/talent-acquisition";
import { useAuth } from "@/context/authContext";

export default function LevelOfEducationTab() {
    const { showToast } = useToast();
    const { hrSettings } = useFirestore();
    const { userData } = useAuth();
    const levelOfEducations = hrSettings.levelOfEducations;

    const [density, setDensity] = useState<Density>("normal");
    const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
    const [isViewOpen, setIsViewOpen] = useState<boolean>(false);
    const [selectedItem, setSelectedItem] = useState<LevelOfEducationModel | undefined>();
    const [editingItem, setEditingItem] = useState<LevelOfEducationModel | undefined>();

    const [columns, setColumns] = useState<ColumnConfig[]>([
        { key: "name", label: "Name", visible: true },
        { key: "active", label: "Status", visible: true },
        { key: "timestamp", label: "Created", visible: false },
    ]);

    const handleSave = (formData: Omit<LevelOfEducationModel, "id">) => {
        // Validate required fields
        if (!formData.name.trim()) {
            showToast("Please enter a name", "error", "error");
            return;
        }
        // Check for duplicate levelOfEducations name
        const existingLevelOfEducation = levelOfEducations.find(
            levelOfEducation =>
                levelOfEducation.name.toLowerCase() === formData.name.toLowerCase() &&
                (!editingItem || levelOfEducation.id !== editingItem.id),
        );

        if (existingLevelOfEducation) {
            showToast("level Of Education name must be unique", "error", "error");
            return;
        }

        if (editingItem) {
            hrSettingsService.update(
                "levelOfEducations",
                editingItem.id,
                formData,
                userData?.uid,
                TALENT_ACQUISITION_LOG_MESSAGES.EDUCATION_LEVEL_UPDATED({
                    id: editingItem.id,
                    name: formData.name,
                    active: formData.active,
                }),
            );
            showToast("level Of Education updated successfully", "success", "success");
        } else {
            // Add new leave type
            hrSettingsService.create(
                "levelOfEducations",
                formData,
                userData?.uid,
                TALENT_ACQUISITION_LOG_MESSAGES.EDUCATION_LEVEL_CREATED({
                    name: formData.name,
                    active: formData.active,
                }),
            );
            showToast("level Of Education created successfully", "success", "success");
        }
        setIsFormOpen(false);
        setEditingItem(undefined);
    };

    const handleDelete = (id: string) => {
        hrSettingsService.remove(
            "levelOfEducations",
            id,
            userData?.uid,
            TALENT_ACQUISITION_LOG_MESSAGES.EDUCATION_LEVEL_DELETED(id),
        );
        showToast("level Of Education deleted successfully", "success", "success");
    };
    const handleToggleColumn = (key: string) => {
        setColumns(prev =>
            prev.map(col => (col.key === key ? { ...col, visible: !col.visible } : col)),
        );
    };

    const handleExport = () => {
        const headers = columns.filter(col => col.visible).map(col => col.label);
        const csvContent = [
            headers.join(","),
            ...levelOfEducations.map(item =>
                columns
                    .filter(col => col.visible)
                    .map(col => {
                        const value = (item as any)[col.key];
                        if (col.key === "active") return value ? "Active" : "Inactive";
                        if (col.key === "timestamp") return new Date(value).toLocaleDateString();
                        return value;
                    })
                    .join(","),
            ),
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "levels-of-education.csv";
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const filtersContent = (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label>Status</Label>
                <select className="w-full p-2 border rounded">
                    <option value="">All statuses</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </select>
            </div>
        </div>
    );

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-amber-600" />
                    Level of Education
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                    <p className="">Manage education levels and requirements</p>
                    <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                        <DialogTrigger asChild>
                            <Button
                                onClick={() => setEditingItem(undefined)}
                                className="bg-amber-600 hover:bg-amber-700 text-white"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Education Level
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                            <DialogHeader>
                                <DialogTitle>
                                    {editingItem ? "Edit" : "Add"} Education Level
                                </DialogTitle>
                            </DialogHeader>
                            <GenericForm
                                item={editingItem}
                                onSave={handleSave}
                                onCancel={() => setIsFormOpen(false)}
                                title="Education Level"
                            />
                        </DialogContent>
                    </Dialog>
                </div>

                <DataToolbar
                    columns={columns}
                    onToggleColumn={handleToggleColumn}
                    density={density}
                    onDensityChange={setDensity}
                    onExport={handleExport}
                    filtersContent={filtersContent}
                    filtersActiveCount={0}
                />

                <GenericTable
                    data={levelOfEducations}
                    columns={columns}
                    onView={item => {
                        setSelectedItem(item);
                        setIsViewOpen(true);
                    }}
                    onEdit={item => {
                        setEditingItem(item);
                        setIsFormOpen(true);
                    }}
                    onDelete={handleDelete}
                    density={density}
                />

                <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Education Level Details</DialogTitle>
                        </DialogHeader>
                        {selectedItem && (
                            <GenericView item={selectedItem} onClose={() => setIsViewOpen(false)} />
                        )}
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    );
}
