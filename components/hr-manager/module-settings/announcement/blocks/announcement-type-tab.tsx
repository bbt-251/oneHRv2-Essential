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
import { Plus, Megaphone } from "lucide-react";
import { ColumnConfig, DataToolbar, Density } from "../../../core-settings/blocks/data-toolbar";
import GenericForm from "../../talent-acquisition/blocks/generic-form";
import GenericView from "../../talent-acquisition/blocks/generic-view";
import GenericTable from "../../talent-acquisition/blocks/generic-table";
import { useFirestore } from "@/context/firestore-context";
import { AnnouncementTypeModel, hrSettingsService } from "@/lib/backend/firebase/hrSettingsService";
import { useToast } from "@/context/toastContext";
import { ANNOUNCEMENT_LOG_MESSAGES } from "@/lib/log-descriptions/announcement";
import { useAuth } from "@/context/authContext";

export default function AnnouncementTypeTab() {
    const { showToast } = useToast();
    const { hrSettings } = useFirestore();
    const { userData } = useAuth();
    const announcementTypes = hrSettings.announcementTypes;
    const [density, setDensity] = useState<Density>("normal");
    const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
    const [isViewOpen, setIsViewOpen] = useState<boolean>(false);
    const [selectedItem, setSelectedItem] = useState<AnnouncementTypeModel | undefined>();
    const [editingItem, setEditingItem] = useState<AnnouncementTypeModel | undefined>();

    const [columns, setColumns] = useState<ColumnConfig[]>([
        { key: "name", label: "Name", visible: true },
        { key: "active", label: "Status", visible: true },
    ]);

    const handleSave = (formData: Omit<AnnouncementTypeModel, "id">) => {
        // Validate required fields
        if (!formData.name.trim()) {
            showToast("Please enter a name", "error", "error");
            return;
        }
        // Check for duplicate announcementTypes name
        const existingAnnouncementType = announcementTypes.find(
            announcementType =>
                announcementType.name.toLowerCase() === formData.name.toLowerCase() &&
                (!editingItem || announcementType.id !== editingItem.id),
        );

        if (existingAnnouncementType) {
            showToast("Announcement type name must be unique", "error", "error");
            return;
        }

        if (editingItem) {
            hrSettingsService.update(
                "announcementTypes",
                editingItem.id,
                formData,
                userData?.uid,
                ANNOUNCEMENT_LOG_MESSAGES.ANNOUNCEMENT_TYPE_UPDATED({
                    id: editingItem.id,
                    name: formData.name,
                    active: formData.active,
                }),
            );
            showToast("Announcement type updated successfully", "success", "success");
        } else {
            // Add new announcement type
            hrSettingsService.create(
                "announcementTypes",
                formData,
                userData?.uid,
                ANNOUNCEMENT_LOG_MESSAGES.ANNOUNCEMENT_TYPE_CREATED({
                    name: formData.name,
                    active: formData.active,
                }),
            );
            showToast("Announcement type created successfully", "success", "success");
        }
        setIsFormOpen(false);
        setEditingItem(undefined);
    };

    const handleDelete = (id: string) => {
        hrSettingsService.remove(
            "announcementTypes",
            id,
            userData?.uid,
            ANNOUNCEMENT_LOG_MESSAGES.ANNOUNCEMENT_TYPE_DELETED(id),
        );
        showToast("Announcement type deleted successfully", "success", "success");
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
            ...announcementTypes.map(item =>
                columns
                    .filter(col => col.visible)
                    .map(col => {
                        const value = (item as any)[col.key];
                        if (col.key === "active") return value ? "Active" : "Inactive";
                        return value;
                    })
                    .join(","),
            ),
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "announcement-types.csv";
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
                    <Megaphone className="h-5 w-5 text-amber-600" />
                    Announcement Types
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                    <p className="">Manage different types of announcements</p>
                    <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                        <DialogTrigger asChild>
                            <Button
                                onClick={() => setEditingItem(undefined)}
                                className="bg-amber-600 hover:bg-amber-700 text-white"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Announcement Type
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                            <DialogHeader>
                                <DialogTitle>
                                    {editingItem ? "Edit" : "Add"} Announcement Type
                                </DialogTitle>
                            </DialogHeader>
                            <GenericForm
                                item={editingItem}
                                onSave={handleSave}
                                onCancel={() => setIsFormOpen(false)}
                                title="Announcement Type"
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
                    data={announcementTypes}
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
                            <DialogTitle>Announcement Type Details</DialogTitle>
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
