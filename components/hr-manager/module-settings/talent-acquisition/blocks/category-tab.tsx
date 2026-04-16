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
import { Plus, Tag } from "lucide-react";
import { ColumnConfig, DataToolbar, Density } from "../../../core-settings/blocks/data-toolbar";
import GenericForm from "./generic-form";
import GenericView from "./generic-view";
import GenericTable from "./generic-table";
import { useFirestore } from "@/context/firestore-context";
import { hrSettingsService, CategoryModel } from "@/lib/backend/firebase/hrSettingsService";
import { useToast } from "@/context/toastContext";
import { TALENT_ACQUISITION_LOG_MESSAGES } from "@/lib/log-descriptions/talent-acquisition";
import { useAuth } from "@/context/authContext";

export default function CategoryTab() {
    const { showToast } = useToast();
    const { hrSettings } = useFirestore();
    const { userData } = useAuth();
    const categories = hrSettings.categories;

    const [density, setDensity] = useState<Density>("normal");
    const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
    const [isViewOpen, setIsViewOpen] = useState<boolean>(false);
    const [selectedItem, setSelectedItem] = useState<CategoryModel | undefined>();
    const [editingItem, setEditingItem] = useState<CategoryModel | undefined>();

    const [columns, setColumns] = useState<ColumnConfig[]>([
        { key: "name", label: "Name", visible: true },
        { key: "active", label: "Status", visible: true },
        { key: "timestamp", label: "Created", visible: false },
    ]);

    const handleSave = (formData: Omit<CategoryModel, "id">) => {
        // Validate required fields
        if (!formData.name.trim()) {
            showToast("Please enter a name", "error", "error");
            return;
        }
        // Check for duplicate categories name
        const existingCategory = categories.find(
            category =>
                category.name.toLowerCase() === formData.name.toLowerCase() &&
                (!editingItem || category.id !== editingItem.id),
        );

        if (existingCategory) {
            showToast("Category name must be unique", "error", "error");
            return;
        }

        if (editingItem) {
            hrSettingsService.update(
                "categories",
                editingItem.id,
                formData,
                userData?.uid,
                TALENT_ACQUISITION_LOG_MESSAGES.CATEGORY_UPDATED({
                    id: editingItem.id,
                    name: formData.name,
                    active: formData.active,
                }),
            );
            showToast("Category updated successfully", "success", "success");
        } else {
            // Add new leave type
            hrSettingsService.create(
                "categories",
                formData,
                userData?.uid,
                TALENT_ACQUISITION_LOG_MESSAGES.CATEGORY_CREATED({
                    name: formData.name,
                    active: formData.active,
                }),
            );
            showToast("Category created successfully", "success", "success");
        }
        setIsFormOpen(false);
        setEditingItem(undefined);
    };

    const handleDelete = (id: string) => {
        hrSettingsService.remove(
            "categories",
            id,
            userData?.uid,
            TALENT_ACQUISITION_LOG_MESSAGES.CATEGORY_DELETED(id),
        );
        showToast("Category deleted successfully", "success", "success");
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
            ...categories.map(item =>
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
        a.download = "categories.csv";
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
                    <Tag className="h-5 w-5 text-amber-600" />
                    Category
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                    <p className="">Manage job categories and classifications</p>
                    <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                        <DialogTrigger asChild>
                            <Button
                                onClick={() => setEditingItem(undefined)}
                                className="bg-amber-600 hover:bg-amber-700 text-white"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Category
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                            <DialogHeader>
                                <DialogTitle>{editingItem ? "Edit" : "Add"} Category</DialogTitle>
                            </DialogHeader>
                            <GenericForm
                                item={editingItem}
                                onSave={handleSave}
                                onCancel={() => setIsFormOpen(false)}
                                title="Category"
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
                    data={categories}
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
                            <DialogTitle>Category Details</DialogTitle>
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
