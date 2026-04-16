"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
    Plus,
    Search,
    Eye,
    Edit,
    Trash2,
    ListChecks,
    Calendar,
    User,
    CheckCircle,
} from "lucide-react";
import { ExitChecklistItemModel } from "@/lib/models/exit-checklist-item";
import { ExitChecklistItemFormModal } from "./item-form";
import { ExitChecklistItemViewModal } from "./items-view";
import { useFirestore } from "@/context/firestore-context";
import {
    createExitChecklistItem,
    updateExitChecklistItem,
    deleteExitChecklistItem,
} from "@/lib/backend/api/exit-instance/exit-checklist-item-service";
import { useToast } from "@/context/toastContext";
import { useConfirm } from "@/hooks/use-confirm-dialog";
import { useAuth } from "@/context/authContext";
import getFullName from "@/lib/util/getEmployeeFullName";
import { EmployeeModel } from "@/lib/models/employee";
import { EXIT_MANAGEMENT_LOG_MESSAGES } from "@/lib/log-descriptions/exit-management";

interface ExitChecklistItemsManagementProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ExitChecklistItemsManagement({
    isOpen,
    onClose,
}: ExitChecklistItemsManagementProps) {
    const { exitChecklistItems, employees } = useFirestore();
    const { userData } = useAuth();
    const { showToast } = useToast();
    const { confirm, ConfirmDialog } = useConfirm();

    const [searchQuery, setSearchQuery] = useState("");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [viewingItem, setViewingItem] = useState<ExitChecklistItemModel | null>(null);
    const [editingItem, setEditingItem] = useState<ExitChecklistItemModel | null>(null);

    const items = exitChecklistItems || [];

    const filteredItems = items.filter(
        item =>
            item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.itemDescription.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    const handleCreate = () => {
        setIsCreateModalOpen(true);
    };

    const handleView = (item: ExitChecklistItemModel) => {
        setViewingItem(item);
    };

    const handleEdit = (item: ExitChecklistItemModel) => {
        setEditingItem(item);
    };

    const handleDelete = (item: ExitChecklistItemModel) => {
        confirm(
            "Are you sure you want to delete this checklist item? This action cannot be undone.",
            async () => {
                if (item.id) {
                    try {
                        const success = await deleteExitChecklistItem(
                            item.id,
                            userData?.uid ?? "",
                            EXIT_MANAGEMENT_LOG_MESSAGES.EXIT_CHECKLIST_ITEM_DELETED(item.itemName),
                        );
                        if (success) {
                            showToast("Checklist item deleted successfully", "success", "success");
                        } else {
                            showToast("Failed to delete checklist item", "error", "error");
                        }
                    } catch (error) {
                        showToast("An error occurred while deleting", "error", "error");
                    }
                }
            },
        );
    };

    const handleSave = async (item: ExitChecklistItemModel) => {
        try {
            if (editingItem && item.id) {
                const success = await updateExitChecklistItem(
                    { ...item, id: item.id },
                    userData?.uid ?? "",
                    EXIT_MANAGEMENT_LOG_MESSAGES.EXIT_CHECKLIST_ITEM_UPDATED(item.itemName),
                );
                if (success) {
                    showToast("Checklist item updated successfully", "success", "success");
                    setIsCreateModalOpen(false);
                    setEditingItem(null);
                } else {
                    showToast("Failed to update checklist item", "error", "error");
                }
            } else {
                const success = await createExitChecklistItem(
                    { ...item, itemCreatedBy: userData?.uid ?? "" },
                    userData?.uid ?? "",
                    EXIT_MANAGEMENT_LOG_MESSAGES.EXIT_CHECKLIST_ITEM_CREATED(item.itemName),
                );
                if (success) {
                    showToast("Checklist item created successfully", "success", "success");
                    setIsCreateModalOpen(false);
                    setEditingItem(null);
                } else {
                    showToast("Failed to create checklist item", "error", "error");
                }
            }
        } catch (error) {
            showToast("An error occurred", "error", "error");
        }
    };

    const itemsWithDueDate = items.filter(i => i.itemDueDate).length;
    const itemsWithApprover = items.filter(i => i.itemApprover).length;

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 z-[100]">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-semibold text-brand-800 dark:text-foreground">
                            Manage Checklist Items
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-6">
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <p className="text-brand-600 dark:text-muted-foreground">
                                Create and manage checklist items that can be used across exit
                                checklists
                            </p>
                            <Button
                                onClick={handleCreate}
                                className="bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white shadow-lg"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Create Item
                            </Button>
                        </div>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <Card className="border-brand-200 bg-gradient-to-br from-brand-50 to-brand-100">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-brand-600">
                                                Total Items
                                            </p>
                                            <p className="text-2xl font-bold text-brand-800">
                                                {items.length}
                                            </p>
                                        </div>
                                        <div className="p-3 bg-brand-200 rounded-lg">
                                            <ListChecks className="h-6 w-6 text-brand-700" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-blue-600">
                                                With Due Date
                                            </p>
                                            <p className="text-2xl font-bold text-blue-800">
                                                {itemsWithDueDate}
                                            </p>
                                        </div>
                                        <div className="p-3 bg-blue-200 rounded-lg">
                                            <Calendar className="h-6 w-6 text-blue-700" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-purple-600">
                                                With Approver
                                            </p>
                                            <p className="text-2xl font-bold text-purple-800">
                                                {itemsWithApprover}
                                            </p>
                                        </div>
                                        <div className="p-3 bg-purple-200 rounded-lg">
                                            <User className="h-6 w-6 text-purple-700" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-green-600">
                                                Active Items
                                            </p>
                                            <p className="text-2xl font-bold text-green-800">
                                                {items.length}
                                            </p>
                                        </div>
                                        <div className="p-3 bg-green-200 rounded-lg">
                                            <CheckCircle className="h-6 w-6 text-green-700" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Search Bar */}
                        <Card className="border-gray-200/60 dark:border-gray-800/60">
                            <CardContent className="p-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder="Search by item name, ID, or description..."
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        className="pl-10 border-gray-300 dark:border-gray-600"
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Items Table */}
                        <Card className="border-gray-200/60 dark:border-gray-800/60">
                            <CardContent className="p-6">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Item ID</TableHead>
                                            <TableHead>Item Name</TableHead>
                                            <TableHead>Description</TableHead>
                                            <TableHead>Due Date</TableHead>
                                            <TableHead>Approver</TableHead>
                                            <TableHead>Created</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredItems.map(item => (
                                            <TableRow key={item.id}>
                                                <TableCell className="font-medium">
                                                    {item.itemName}
                                                </TableCell>
                                                <TableCell>{item.itemName}</TableCell>
                                                <TableCell className="max-w-xs truncate">
                                                    {item.itemDescription}
                                                </TableCell>
                                                <TableCell>
                                                    {item.itemDueDate
                                                        ? new Date(
                                                            item.itemDueDate,
                                                        ).toLocaleDateString()
                                                        : "N/A"}
                                                </TableCell>
                                                <TableCell>
                                                    {getFullName(
                                                        employees.find(
                                                            e => e.uid == item.itemApprover,
                                                        ) ?? ({} as EmployeeModel),
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {new Date(item.timestamp).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleView(item)}
                                                        >
                                                            <Eye className="h-4 w-4 mr-1" />
                                                            View
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleEdit(item)}
                                                            className="border-blue-400 text-blue-700 hover:bg-blue-50 hover:border-blue-500 dark:border-blue-500 dark:text-blue-400 dark:hover:bg-blue-950"
                                                        >
                                                            <Edit className="h-4 w-4 mr-1" />
                                                            Edit
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleDelete(item)}
                                                            className="border-red-300 text-red-700 hover:bg-red-50"
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-1" />
                                                            Delete
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>
                    {ConfirmDialog}
                </DialogContent>
            </Dialog>

            {/* Modals */}
            <ExitChecklistItemFormModal
                isOpen={isCreateModalOpen || editingItem !== null}
                onClose={() => {
                    setIsCreateModalOpen(false);
                    setEditingItem(null);
                }}
                onSave={handleSave}
                editingItem={editingItem}
            />

            <ExitChecklistItemViewModal
                isOpen={viewingItem !== null}
                onClose={() => setViewingItem(null)}
                item={viewingItem}
            />
        </>
    );
}
