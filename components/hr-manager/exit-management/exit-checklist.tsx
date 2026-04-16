"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Plus,
    Search,
    Eye,
    Edit,
    Trash2,
    ClipboardCheck,
    Calendar,
    ListChecks,
    FileCheck,
    Settings,
} from "lucide-react";
import { ExitChecklistModel } from "@/lib/models/exit-checklist";
import { ExitChecklistFormModal } from "./modals/checklist-form";
import { ExitChecklistViewModal } from "./modals/checklist-view";
import { ExitChecklistItemsManagement } from "./modals/items/checklist-items";
import { useFirestore } from "@/context/firestore-context";
import {
    createExitChecklist,
    updateExitChecklist,
    deleteExitChecklist,
} from "@/lib/backend/api/exit-instance/exit-checklist-service";
import { useAuth } from "@/context/authContext";
import { useToast } from "@/context/toastContext";
import { EXIT_MANAGEMENT_LOG_MESSAGES } from "@/lib/log-descriptions/exit-management";
import { useConfirm } from "@/hooks/use-confirm-dialog";

export function ExitChecklist() {
    const { exitChecklists } = useFirestore();
    const { userData } = useAuth();
    const { showToast } = useToast();
    const { confirm, ConfirmDialog } = useConfirm();

    const [searchQuery, setSearchQuery] = useState("");
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [viewingChecklist, setViewingChecklist] = useState<ExitChecklistModel | null>(null);
    const [editingChecklist, setEditingChecklist] = useState<ExitChecklistModel | null>(null);
    const [deletingChecklist, setDeletingChecklist] = useState<ExitChecklistModel | null>(null);
    const [isManageItemsOpen, setIsManageItemsOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const checklists = exitChecklists || [];

    const filteredChecklists = checklists.filter(
        checklist =>
            checklist.checklistName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            checklist.checklistStatus.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    const handleCreate = () => {
        setIsCreateModalOpen(true);
    };

    const handleView = (checklist: ExitChecklistModel) => {
        setViewingChecklist(checklist);
    };

    const handleEdit = (checklist: ExitChecklistModel) => {
        setEditingChecklist(checklist);
    };

    const handleDelete = (checklist: ExitChecklistModel) => {
        confirm(
            "Are you sure you want to delete this exit checklist? This action cannot be undone.",
            async () => {
                if (checklist.id) {
                    setIsDeleting(true);
                    try {
                        const success = await deleteExitChecklist(
                            checklist.id,
                            userData?.uid ?? "",
                            EXIT_MANAGEMENT_LOG_MESSAGES.EXIT_CHECKLIST_DELETED(
                                checklist.checklistName,
                            ),
                        );
                        if (success) {
                            showToast("Checklist deleted successfully", "success", "success");
                        } else {
                            showToast("Failed to delete checklist", "error", "error");
                        }
                    } catch (error) {
                        showToast("An error occurred while deleting", "error", "error");
                    } finally {
                        setIsDeleting(false);
                    }
                }
            },
        );
    };

    const handleSave = async (checklist: ExitChecklistModel) => {
        try {
            if (editingChecklist && checklist.id) {
                const success = await updateExitChecklist(
                    { ...checklist, id: checklist.id },
                    userData?.uid ?? "",
                    EXIT_MANAGEMENT_LOG_MESSAGES.EXIT_CHECKLIST_UPDATED(checklist.checklistName),
                );
                if (success) {
                    showToast("Checklist updated successfully", "success", "success");
                } else {
                    showToast("Failed to update checklist", "error", "error");
                }
            } else {
                const success = await createExitChecklist(
                    checklist,
                    userData?.uid ?? "",
                    EXIT_MANAGEMENT_LOG_MESSAGES.EXIT_CHECKLIST_CREATED(checklist.checklistName),
                );
                if (success) {
                    showToast("Checklist created successfully", "success", "success");
                } else {
                    showToast("Failed to create checklist", "error", "error");
                }
            }
        } catch (error) {
            showToast("An error occurred", "error", "error");
        }
        setIsCreateModalOpen(false);
        setEditingChecklist(null);
    };

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            draft: { color: "bg-gray-100 text-gray-800 border-gray-300", label: "Draft" },
            ongoing: { color: "bg-blue-100 text-blue-800 border-blue-300", label: "Ongoing" },
            done: { color: "bg-green-100 text-green-800 border-green-300", label: "Done" },
        };
        const config = statusConfig[status as keyof typeof statusConfig];
        return (
            <Badge className={`${config.color} border`} variant="outline">
                {config.label}
            </Badge>
        );
    };

    const draftCount = checklists.filter(c => c.checklistStatus === "draft").length;
    const ongoingCount = checklists.filter(c => c.checklistStatus === "ongoing").length;
    const doneCount = checklists.filter(c => c.checklistStatus === "done").length;

    return (
        <div className="p-8 space-y-6 bg-gray-50 min-h-screen dark:bg-background">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-brand-800 dark:text-foreground">
                            Exit Checklist Management
                        </h1>
                        <p className="text-brand-600 mt-2 dark:text-muted-foreground">
                            Manage and track exit checklists for departing employees
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            onClick={() => setIsManageItemsOpen(true)}
                            variant="outline"
                            className="border-brand-300 text-brand-700 hover:bg-brand-50"
                        >
                            <Settings className="h-4 w-4 mr-2" />
                            Manage Items
                        </Button>
                        <Button
                            onClick={handleCreate}
                            className="bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white shadow-lg"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Create Checklist
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <Card className="border-brand-200 bg-gradient-to-br from-brand-50 to-brand-100">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-brand-600">
                                        Total Checklists
                                    </p>
                                    <p className="text-2xl font-bold text-brand-800">
                                        {checklists.length}
                                    </p>
                                </div>
                                <div className="p-3 bg-brand-200 rounded-lg">
                                    <ClipboardCheck className="h-6 w-6 text-brand-700" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Draft</p>
                                    <p className="text-2xl font-bold text-gray-800">{draftCount}</p>
                                </div>
                                <div className="p-3 bg-gray-200 rounded-lg">
                                    <FileCheck className="h-6 w-6 text-gray-700" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-blue-600">Ongoing</p>
                                    <p className="text-2xl font-bold text-blue-800">
                                        {ongoingCount}
                                    </p>
                                </div>
                                <div className="p-3 bg-blue-200 rounded-lg">
                                    <ListChecks className="h-6 w-6 text-blue-700" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-green-600">Completed</p>
                                    <p className="text-2xl font-bold text-green-800">{doneCount}</p>
                                </div>
                                <div className="p-3 bg-green-200 rounded-lg">
                                    <Calendar className="h-6 w-6 text-green-700" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Search Bar */}
                <Card className="mb-6 border-gray-200/60 dark:border-gray-800/60">
                    <CardContent className="p-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search by checklist name, ID, or status..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="pl-10 border-gray-300 dark:border-gray-600"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Checklists Table */}
                <Card className="border-gray-200/60 dark:border-gray-800/60">
                    <CardContent className="p-6">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Checklist Name</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Due Date</TableHead>
                                    <TableHead>Items Count</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredChecklists.map(checklist => (
                                    <TableRow key={checklist.id}>
                                        <TableCell>{checklist.checklistName}</TableCell>
                                        <TableCell>
                                            {getStatusBadge(checklist.checklistStatus)}
                                        </TableCell>
                                        <TableCell>
                                            {checklist.checklistDueDate
                                                ? new Date(
                                                    checklist.checklistDueDate,
                                                ).toLocaleDateString()
                                                : "N/A"}
                                        </TableCell>
                                        <TableCell>
                                            {checklist.listOfItems?.length || 0} items
                                        </TableCell>
                                        <TableCell>
                                            {new Date(checklist.timestamp).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleView(checklist)}
                                                >
                                                    <Eye className="h-4 w-4 mr-1" />
                                                    View
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleEdit(checklist)}
                                                >
                                                    <Edit className="h-4 w-4 mr-1" />
                                                    Edit
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleDelete(checklist)}
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

            {/* Modals */}
            <ExitChecklistFormModal
                isOpen={isCreateModalOpen || editingChecklist !== null}
                onClose={() => {
                    setIsCreateModalOpen(false);
                    setEditingChecklist(null);
                }}
                onSave={handleSave}
                editingChecklist={editingChecklist}
            />

            <ExitChecklistViewModal
                isOpen={viewingChecklist !== null}
                onClose={() => setViewingChecklist(null)}
                checklist={viewingChecklist}
            />

            <ExitChecklistItemsManagement
                isOpen={isManageItemsOpen}
                onClose={() => setIsManageItemsOpen(false)}
            />

            {ConfirmDialog}
        </div>
    );
}
