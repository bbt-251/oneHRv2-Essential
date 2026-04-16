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
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Plus, FileQuestion, Trash2, Edit, Eye } from "lucide-react";
import { ColumnConfig, DataToolbar, Density } from "../../../core-settings/blocks/data-toolbar";
import { useFirestore } from "@/context/firestore-context";
import { hrSettingsService, TransferReasonModel } from "@/lib/backend/firebase/hrSettingsService";
import { useToast } from "@/context/toastContext";
import { useAuth } from "@/context/authContext";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import dayjs from "dayjs";

export default function TransferReasonTab() {
    const { showToast } = useToast();
    const { hrSettings } = useFirestore();
    const { userData } = useAuth();
    const transferReasons = hrSettings.transferReasons || [];

    const [density, setDensity] = useState<Density>("normal");
    const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
    const [isViewOpen, setIsViewOpen] = useState<boolean>(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState<boolean>(false);
    const [selectedItem, setSelectedItem] = useState<TransferReasonModel | undefined>();
    const [editingItem, setEditingItem] = useState<TransferReasonModel | undefined>();
    const [deletingItem, setDeletingItem] = useState<TransferReasonModel | undefined>();

    const [formData, setFormData] = useState<Omit<TransferReasonModel, "id">>({
        name: "",
        active: true,
        timestamp: new Date().toISOString(),
        type: "Transfer Reason",
    });

    const [columns, setColumns] = useState<ColumnConfig[]>([
        { key: "name", label: "Name", visible: true },
        { key: "active", label: "Status", visible: true },
        { key: "timestamp", label: "Created", visible: false },
    ]);

    const resetForm = () => {
        setFormData({
            name: "",
            active: true,
            timestamp: new Date().toISOString(),
            type: "Transfer Reason",
        });
        setEditingItem(undefined);
    };

    const handleOpenForm = (item?: TransferReasonModel) => {
        if (item) {
            setEditingItem(item);
            setFormData({
                name: item.name,
                active: item.active,
                timestamp: item.timestamp || new Date().toISOString(),
                type: "Transfer Reason",
            });
        } else {
            resetForm();
        }
        setIsFormOpen(true);
    };

    const handleSave = () => {
        // Validate required fields
        if (!formData.name.trim()) {
            showToast("Please enter a name", "error", "error");
            return;
        }

        // Check for duplicate transfer reason name
        const existingReason = transferReasons.find(
            reason =>
                reason.name.toLowerCase() === formData.name.toLowerCase() &&
                (!editingItem || reason.id !== editingItem.id),
        );

        if (existingReason) {
            showToast("Transfer reason name must be unique", "error", "error");
            return;
        }

        if (editingItem) {
            hrSettingsService.update("transferReasons", editingItem.id!, formData, userData?.uid, {
                title: "Transfer Reason Updated",
                description: `Transfer reason "${formData.name}" was updated`,
                module: "Career Development",
            });
            showToast("Transfer reason updated successfully", "success", "success");
        } else {
            hrSettingsService.create("transferReasons", formData, userData?.uid, {
                title: "Transfer Reason Created",
                description: `Transfer reason "${formData.name}" was created`,
                module: "Career Development",
            });
            showToast("Transfer reason created successfully", "success", "success");
        }
        setIsFormOpen(false);
        resetForm();
    };

    const handleDeleteClick = (item: TransferReasonModel) => {
        setDeletingItem(item);
        setIsDeleteOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (deletingItem) {
            hrSettingsService.remove("transferReasons", deletingItem.id!, userData?.uid, {
                title: "Transfer Reason Deleted",
                description: `Transfer reason "${deletingItem.name}" was deleted`,
                module: "Career Development",
            });
            showToast("Transfer reason deleted successfully", "success", "success");
        }
        setIsDeleteOpen(false);
        setDeletingItem(undefined);
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
            ...transferReasons.map(item =>
                columns
                    .filter(col => col.visible)
                    .map(col => {
                        const value = (item as any)[col.key];
                        if (col.key === "active") return value === true ? "Active" : "Inactive";
                        if (col.key === "timestamp") return new Date(value).toLocaleDateString();
                        return value || "";
                    })
                    .join(","),
            ),
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "transfer_reasons.csv";
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const getDensityClasses = () => {
        switch (density) {
            case "compact":
                return "text-xs py-1 px-2";
            case "comfortable":
                return "text-sm py-3 px-4";
            default:
                return "text-sm py-4 px-4";
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileQuestion className="h-5 w-5 text-amber-600" />
                    Transfer Reasons
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                    <p className="">
                        Manage transfer reason options for employee transfer requests
                    </p>
                    <Dialog
                        open={isFormOpen}
                        onOpenChange={open => {
                            setIsFormOpen(open);
                            if (!open) resetForm();
                        }}
                    >
                        <DialogTrigger asChild>
                            <Button
                                onClick={() => handleOpenForm()}
                                className="bg-amber-600 hover:bg-amber-700 text-white"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Add Transfer Reason
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                            <DialogHeader>
                                <DialogTitle>
                                    {editingItem ? "Edit" : "Add"} Transfer Reason
                                </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Name *</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={e =>
                                            setFormData(prev => ({ ...prev, name: e.target.value }))
                                        }
                                        placeholder="Enter transfer reason name"
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="active">Active</Label>
                                    <Switch
                                        id="active"
                                        checked={formData.active}
                                        onCheckedChange={checked =>
                                            setFormData(prev => ({ ...prev, active: checked }))
                                        }
                                        className={formData.active ? "bg-amber-600" : ""}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setIsFormOpen(false);
                                        resetForm();
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleSave}
                                    className="bg-amber-600 hover:bg-amber-700 text-white"
                                >
                                    {editingItem ? "Update" : "Create"}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                <DataToolbar
                    columns={columns}
                    onToggleColumn={handleToggleColumn}
                    density={density}
                    onDensityChange={setDensity}
                    onExport={handleExport}
                    filtersContent={null}
                    filtersActiveCount={0}
                />

                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {columns
                                    .filter(col => col.visible)
                                    .map(col => (
                                        <TableHead key={col.key} className={getDensityClasses()}>
                                            {col.label}
                                        </TableHead>
                                    ))}
                                <TableHead className={getDensityClasses()}>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {transferReasons.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={columns.filter(col => col.visible).length + 1}
                                        className="text-center py-8 text-muted-foreground"
                                    >
                                        No transfer reasons found. Click "Add Transfer Reason" to
                                        create one.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                transferReasons.map(item => (
                                    <TableRow key={item.id}>
                                        {columns
                                            .filter(col => col.visible)
                                            .map(col => (
                                                <TableCell
                                                    key={col.key}
                                                    className={getDensityClasses()}
                                                >
                                                    {col.key === "active" ? (
                                                        <Badge
                                                            variant={
                                                                item.active === true
                                                                    ? "default"
                                                                    : "destructive"
                                                            }
                                                            className={
                                                                item.active === true
                                                                    ? "bg-green-500 text-white hover:bg-green-600"
                                                                    : "bg-red-500 text-white hover:bg-red-600"
                                                            }
                                                        >
                                                            {item.active === true
                                                                ? "Active"
                                                                : "Inactive"}
                                                        </Badge>
                                                    ) : col.key === "timestamp" ? (
                                                        item.timestamp ? (
                                                            dayjs(item.timestamp).format(
                                                                "MMM DD, YYYY",
                                                            )
                                                        ) : (
                                                            "-"
                                                        )
                                                    ) : (
                                                        (item as any)[col.key] || "-"
                                                    )}
                                                </TableCell>
                                            ))}
                                        <TableCell className={getDensityClasses()}>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        setSelectedItem(item);
                                                        setIsViewOpen(true);
                                                    }}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleOpenForm(item)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDeleteClick(item)}
                                                    className="text-red-600 hover:text-red-700"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* View Dialog */}
                <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Transfer Reason Details</DialogTitle>
                        </DialogHeader>
                        {selectedItem && (
                            <div className="space-y-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-muted-foreground">Name</Label>
                                        <p className="font-medium">{selectedItem.name}</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Status</Label>
                                        <p>
                                            <Badge
                                                variant={
                                                    selectedItem.active === true
                                                        ? "default"
                                                        : "destructive"
                                                }
                                                className={
                                                    selectedItem.active === true
                                                        ? "bg-green-500 text-white hover:bg-green-600"
                                                        : "bg-red-500 text-white hover:bg-red-600"
                                                }
                                            >
                                                {selectedItem.active === true
                                                    ? "Active"
                                                    : "Inactive"}
                                            </Badge>
                                        </p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Created</Label>
                                        <p className="font-medium">
                                            {selectedItem.timestamp
                                                ? dayjs(selectedItem.timestamp).format(
                                                    "MMM DD, YYYY HH:mm",
                                                )
                                                : "-"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Delete Transfer Reason</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to delete the transfer reason "
                                {deletingItem?.name}"? This action cannot be undone.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
                                Cancel
                            </Button>
                            <Button variant="destructive" onClick={handleDeleteConfirm}>
                                Delete
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    );
}
