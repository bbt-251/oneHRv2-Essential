"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useFirestore } from "@/context/firestore-context";
import { useToast } from "@/context/toastContext";
import { deleteMultipleChoice } from "@/lib/backend/api/talent-acquisition/multiple-choice-service";
import MultipleChoiceModel from "@/lib/models/multiple-choice";
import { Edit, Eye, FileText, Plus, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import AddMultipleChoiceModal from "../modals/add-multiple-choice-modal";
import EditMultipleChoiceModal from "../modals/edit-multiple-choice-modal";
import ViewMultipleChoiceModal from "../modals/view-multiple-choice-modal";

export default function MultipleChoiceQuestions() {
    const [showAddModal, setShowAddModal] = useState<boolean>(false);
    const [showEditModal, setShowEditModal] = useState<boolean>(false);
    const [showViewModal, setShowViewModal] = useState<boolean>(false);
    const [selected, setSelected] = useState<MultipleChoiceModel | null>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
    const [toDeleteID, setToDeleteID] = useState<string>("");
    const [deleteLoading, setDeleteLoading] = useState<boolean>(false);

    const { showToast } = useToast();
    const { multipleChoices } = useFirestore();

    const handleCreateNew = () => {
        setShowAddModal(true);
    };

    const handleEdit = (multipleChoice: MultipleChoiceModel) => {
        setSelected(multipleChoice);
        setShowEditModal(true);
    };

    const handleView = (multipleChoice: MultipleChoiceModel) => {
        setSelected(multipleChoice);
        setShowViewModal(true);
    };

    const handleDelete = (multipleChoiceID: string) => {
        setShowDeleteDialog(true);
        setToDeleteID(multipleChoiceID);
    };

    const confirmDelete = async () => {
        if (toDeleteID) {
            setDeleteLoading(true);

            const res = await deleteMultipleChoice(toDeleteID);
            if (res) showToast("Deleted!", "Success", "success");
            else showToast("Error deleting multiple choice. Please try again!", "Error", "error");

            setShowDeleteDialog(false);
            setToDeleteID("");
            setDeleteLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-semibold text-brand-800 dark:text-white">
                        Multiple Choice
                    </h2>
                    <p className="text-brand-600 dark:text-gray-300">
                        Create and manage multiple choice screening questions
                    </p>
                </div>
                <Button onClick={handleCreateNew}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create
                </Button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input placeholder="Search multiple choice sets..." className="pl-10" />
            </div>

            {/* Multiple Choice s List */}
            <div className="space-y-3 pt-4">
                {multipleChoices.length > 0 ? (
                    multipleChoices.map(set => (
                        <Card key={set.id}>
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="flex items-center gap-3 mb-2 text-lg">
                                            {set.name}
                                            <Badge
                                                variant={set.active ? "default" : "secondary"}
                                                className={
                                                    set.active
                                                        ? "bg-green-400 hover:bg-green-500"
                                                        : "bg-red-400 hover:bg-red-500"
                                                }
                                            >
                                                {set.active ? "Active" : "Inactive"}
                                            </Badge>
                                        </CardTitle>
                                        <CardDescription>
                                            {set.description || "No description provided"}
                                        </CardDescription>
                                    </div>
                                    <div className="flex gap-2 flex-shrink-0">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleView(set)}
                                        >
                                            <Eye className="w-4 h-4 mr-1" />
                                            View
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleEdit(set)}
                                        >
                                            <Edit className="w-4 h-4 mr-1" />
                                            Edit
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            disabled={deleteLoading}
                                            onClick={() => handleDelete(set.id)}
                                        >
                                            <Trash2 className="w-4 h-4 mr-1" />
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-gray-500">
                                    {set.questions.length} question
                                    {set.questions.length !== 1 ? "s" : ""}
                                </p>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <div className="text-center">
                                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-brand-800 dark:text-white mb-2">
                                    No Multiple Choice Questions Found
                                </h3>
                                <p className="text-brand-600 dark:text-gray-300 mb-4">
                                    You haven't created any multiple choice questions yet. Create
                                    your first set to get started.
                                </p>
                                <Button onClick={handleCreateNew}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Create
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Add Modal */}
            <AddMultipleChoiceModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />

            {/* Edit Modal */}
            <EditMultipleChoiceModal
                isOpen={showEditModal}
                onClose={() => {
                    setShowEditModal(false);
                    setSelected(null);
                }}
                multipleChoice={selected}
            />

            {/* View Modal */}
            <ViewMultipleChoiceModal
                isOpen={showViewModal}
                onClose={() => {
                    setShowViewModal(false);
                    setSelected(null);
                }}
                multipleChoice={selected}
            />

            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Confirm Deletion</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this multiple choice? This action cannot
                            be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={confirmDelete}
                            disabled={deleteLoading}
                        >
                            {deleteLoading ? "Deleting..." : "Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
