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
import { hrSettingsService, IssueStatusModel } from "@/lib/backend/firebase/hrSettingsService";
import { useToast } from "@/context/toastContext";
import { useFirestore } from "@/context/firestore-context";
import { getTimestamp } from "@/lib/util/dayjs_format";

export const IssueStatusTab = () => {
    const { hrSettings } = useFirestore();
    const { showToast } = useToast();

    const issueStatuses = hrSettings.issueStatus;
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<IssueStatusModel | null>(null);
    const [viewingItem, setViewingItem] = useState<IssueStatusModel | null>(null);
    const [formData, setFormData] = useState<Partial<IssueStatusModel>>({});

    const handleSubmit = (e: React.FormEvent) => {
        try {
            // required fields

            e.preventDefault();
            setIsSubmitting(true);

            const issueStatusData: Omit<IssueStatusModel, "id"> = {
                type: formData.type || "",
                name: formData.name || "",
                timestamp: formData.timestamp || getTimestamp(),
                active: formData.active || "Yes",
            };
            if (editingItem) {
                hrSettingsService.update("issueStatus", editingItem.id, formData);
                showToast("Issue status updated successfully", "success", "success");

                setIsModalOpen(false);
            } else {
                hrSettingsService.create("issueStatus", issueStatusData);
                showToast("Issue status created successfully", "success", "success");

                setIsModalOpen(false);
            }
        } catch (error) {
            showToast("Failed to Issue created", "error", "error");
            console.error("Failed to save issue status:", error);
        } finally {
            setIsSubmitting(false);
            setIsModalOpen(false);
            setEditingItem(null);
            setFormData({});
        }
    };

    const handleEdit = (item: IssueStatusModel) => {
        setEditingItem(item);
        setFormData(item);
        setIsModalOpen(true);
    };

    const handleView = (item: IssueStatusModel) => {
        setViewingItem(item);
        setIsViewModalOpen(true);
    };

    const handleDelete = (id: string) => {
        hrSettingsService.remove("issueStatus", id);
        showToast("Issue type deleted successfully", "success", "success");
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
                    <h3 className="text-lg font-semibold ">Issue Status</h3>
                    <p className="text-sm ">Manage different status types for issue tracking</p>
                </div>
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogTrigger asChild>
                        <Button
                            onClick={openAddModal}
                            className="bg-amber-600 hover:bg-amber-700 text-white"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Issue Status
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>
                                {editingItem ? "Edit Issue Status" : "Add Issue Status"}
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label htmlFor="type">Type</Label>
                                <Input
                                    id="type"
                                    value={formData.type || ""}
                                    onChange={e =>
                                        setFormData(prev => ({ ...prev, type: e.target.value }))
                                    }
                                    placeholder="Enter status type"
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    value={formData.name || ""}
                                    onChange={e =>
                                        setFormData(prev => ({ ...prev, name: e.target.value }))
                                    }
                                    placeholder="Enter status name"
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
                                <TableHead>Type</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Created Date</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {issueStatuses.map(item => (
                                <TableRow key={item.id}>
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className="bg-blue-50 text-blue-700 border-blue-200"
                                        >
                                            {item.type}
                                        </Badge>
                                    </TableCell>
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
                                                            Delete Issue Status
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
                        <DialogTitle>Issue Status Details</DialogTitle>
                    </DialogHeader>
                    {viewingItem && (
                        <div className="space-y-4">
                            <div>
                                <Label className="text-sm font-medium text-gray-500">Type</Label>
                                <p className="text-sm ">{viewingItem.type}</p>
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-gray-500">Name</Label>
                                <p className="text-sm ">{viewingItem.name}</p>
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-gray-500">
                                    Created Date
                                </Label>
                                <p className="text-sm ">
                                    {new Date(viewingItem.timestamp).toLocaleString()}
                                </p>
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-gray-500 mr-4">
                                    Status
                                </Label>
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
