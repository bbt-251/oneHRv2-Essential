"use client";

import type React from "react";
import { useState } from "react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Edit, Eye, Plus, Trash2 } from "lucide-react";
import { useFirestore } from "@/context/firestore-context";
import { useToast } from "@/context/toastContext";
import { hrSettingsService, ViolationTypeModel } from "@/lib/backend/firebase/hrSettingsService";
import { getTimestamp } from "@/lib/util/dayjs_format";
import { EMPLOYEE_ENGAGEMENT_LOG_MESSAGES } from "@/lib/log-descriptions/employee-engagement";
import { useAuth } from "@/context/authContext";

export const ViolationTypeTab = () => {
    const { hrSettings } = useFirestore();

    const violationTypes = hrSettings.violationTypes || [];

    const { showToast } = useToast();
    const { userData } = useAuth();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<ViolationTypeModel | null>(null);
    const [viewingItem, setViewingItem] = useState<ViolationTypeModel | null>(null);
    const [formData, setFormData] = useState<Partial<ViolationTypeModel>>({});

    const handleSubmit = async (e: React.FormEvent) => {
        try {
            // required fields

            // if (!formData.trim()) {
            //     showToast("Issue Title is required", "error");
            //     return;
            // }

            e.preventDefault();
            setIsSubmitting(true);

            const violationTypeData: Omit<ViolationTypeModel, "id"> = {
                name: formData.name || "",
                timestamp: formData.timestamp || getTimestamp(),
                active: formData.active || "Yes",
            };

            if (editingItem) {
                hrSettingsService.update(
                    "violationTypes",
                    editingItem.id,
                    formData,
                    userData?.uid,
                    EMPLOYEE_ENGAGEMENT_LOG_MESSAGES.VIOLATION_TYPE_UPDATED({
                        id: editingItem.id,
                        name: formData.name,
                        active: formData.active,
                    }),
                );
                showToast("violation Type updated successfully", "success", "success");

                setIsModalOpen(false);
            } else {
                hrSettingsService.create(
                    "violationTypes",
                    violationTypeData,
                    userData?.uid,
                    EMPLOYEE_ENGAGEMENT_LOG_MESSAGES.VIOLATION_TYPE_CREATED({
                        name: violationTypeData.name,
                        active: violationTypeData.active,
                    }),
                );
                showToast("violation Type created successfully", "success", "success");

                setIsModalOpen(false);
            }
        } catch (error) {
            showToast("Failed to create violation Type", "error", "error");
            console.error("Failed to save violation Type:", error);
        } finally {
            setIsSubmitting(false);
            setIsModalOpen(false);
            setEditingItem(null);
            setFormData({});
        }
    };

    const handleEdit = (item: ViolationTypeModel) => {
        setEditingItem(item);
        setFormData(item);
        setIsModalOpen(true);
    };

    const handleView = (item: ViolationTypeModel) => {
        setViewingItem(item);
        setIsViewModalOpen(true);
    };

    const handleDelete = (id: string) => {
        hrSettingsService.remove(
            "violationTypes",
            id,
            userData?.uid,
            EMPLOYEE_ENGAGEMENT_LOG_MESSAGES.VIOLATION_TYPE_DELETED(id),
        );
        showToast("violation type deleted successfully", "success", "success");
    };

    const openAddModal = () => {
        setEditingItem(null);
        setFormData({});
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-semibold ">Violation Types</h3>
                    <p className="text-sm ">Manage different types of workplace violations</p>
                </div>
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogTrigger asChild>
                        <Button
                            onClick={openAddModal}
                            className="bg-amber-600 hover:bg-amber-700 text-white"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Violation Type
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>
                                {editingItem ? "Edit Violation Type" : "Add Violation Type"}
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    value={formData.name || ""}
                                    onChange={e =>
                                        setFormData(prev => ({ ...prev, name: e.target.value }))
                                    }
                                    placeholder="Enter violation type name"
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="active">Status</Label>
                                <Select
                                    value={formData.active || "Yes"}
                                    onValueChange={value =>
                                        setFormData(prev => ({
                                            ...prev,
                                            active: value as "Yes" | "No",
                                        }))
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Yes">Active</SelectItem>
                                        <SelectItem value="No">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex justify-end space-x-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsModalOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" className="bg-amber-600 hover:bg-amber-700">
                                    {isSubmitting ? "Saving..." : editingItem ? "Update" : "Create"}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Created Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {violationTypes.map(item => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{item.name}</TableCell>
                                    <TableCell>
                                        {new Date(item.timestamp).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={
                                                item.active === "Yes" ? "default" : "secondary"
                                            }
                                            className={
                                                item.active === "Yes"
                                                    ? "bg-green-100 text-green-800"
                                                    : "bg-gray-100 text-gray-800"
                                            }
                                        >
                                            {item.active === "Yes" ? "Active" : "Inactive"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end space-x-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleView(item)}
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleEdit(item)}
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-red-600 hover:text-red-700"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>
                                                            Delete Violation Type
                                                        </AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Are you sure you want to delete "
                                                            {item.name}"? This action cannot be
                                                            undone.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>
                                                            Cancel
                                                        </AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={() => handleDelete(item.id!)}
                                                            className="bg-red-600 hover:bg-red-700"
                                                        >
                                                            Delete
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Violation Type Details</DialogTitle>
                    </DialogHeader>
                    {viewingItem && (
                        <div className="space-y-4">
                            <div>
                                <Label className="text-sm font-medium text-gray-500">Name</Label>
                                <p className="text-sm ">{viewingItem.name}</p>
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-gray-500 mr-4">
                                    Created Date
                                </Label>
                                <p className="text-sm ">
                                    {new Date(viewingItem.timestamp).toLocaleString()}
                                </p>
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-gray-500">Status</Label>
                                <Badge
                                    variant={viewingItem.active === "Yes" ? "default" : "secondary"}
                                    className={
                                        viewingItem.active === "Yes"
                                            ? "bg-green-100 text-green-800"
                                            : "bg-gray-100 text-gray-800"
                                    }
                                >
                                    {viewingItem.active === "Yes" ? "Active" : "Inactive"}
                                </Badge>
                            </div>
                            <div className="flex justify-end">
                                <Button onClick={() => setIsViewModalOpen(false)}>Close</Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};
