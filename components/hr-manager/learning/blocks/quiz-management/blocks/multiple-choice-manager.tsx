"use client";

import { useEffect, useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search } from "lucide-react";
import { useAuth } from "@/context/authContext";
import { useToast } from "@/context/toastContext";
import CreateMultipleChoiceForm from "../modals/create-multiple-choice-form";
import { useFirestore } from "@/context/firestore-context";
import { deleteMultipleChoice } from "@/lib/backend/api/quiz/multiple-choice-service";

export function MultipleChoiceManager() {
    const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
    const [editingSet, setEditingSet] = useState<any>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
    const [toDeleteID, setToDeleteID] = useState<string>("");
    const [deleteLoading, setDeleteLoading] = useState<boolean>(false);

    const { user } = useAuth();
    const { showToast } = useToast();

    const { multipleChoices } = useFirestore();

    const handleCreateNew = () => {
        setShowCreateForm(true);
    };

    const handleEditSet = (set: any) => {
        setEditingSet(set);
        setShowCreateForm(true);
    };

    const handleDeleteSet = (setId: string) => {
        setShowDeleteDialog(true);
        setToDeleteID(setId);
    };

    const confirmDelete = async () => {
        if (toDeleteID) {
            setDeleteLoading(true);

            showToast("Deleting...", "Info");
            const res = await deleteMultipleChoice(toDeleteID);
            if (res) showToast("Deleted!", "Success", "success");
            else showToast("Error deleting multiple choice. Please try again!", "Error", "error");

            setShowDeleteDialog(false); // Close the confirmation dialog
            setToDeleteID(""); // Reset the set to delete
            setDeleteLoading(false);
        }
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Multiple Choice Management</CardTitle>
                    <CardDescription>
                        Create, edit, and manage your sets of multiple-choice questions.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Action Buttons */}
                    <div className="flex gap-2">
                        <Button onClick={handleCreateNew}>
                            <Plus className="w-4 h-4 mr-1" />
                            Create New Set
                        </Button>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input placeholder="Search multiple choice sets..." className="pl-10" />
                    </div>

                    {/* Multiple Choice Sets List */}
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
                                                        variant={
                                                            set.active ? "default" : "secondary"
                                                        }
                                                    >
                                                        {set.active ? "Active" : "Inactive"}
                                                    </Badge>
                                                </CardTitle>
                                                <CardDescription>{set.description}</CardDescription>
                                            </div>
                                            <div className="flex gap-2 flex-shrink-0">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleEditSet(set)}
                                                >
                                                    Edit
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    disabled={deleteLoading}
                                                    onClick={() => handleDeleteSet(set.id)}
                                                >
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
                            <div className="text-center py-8 text-gray-500">
                                <p>No multiple choice sets found.</p>
                                <p className="text-sm">Click "Create New Set" to get started.</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <CreateMultipleChoiceForm
                isOpen={showCreateForm}
                onClose={() => {
                    setShowCreateForm(false);
                    setEditingSet(null);
                }}
                editingSet={editingSet}
            />

            {/* Delete Confirmation Dialog - This remains a Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Confirm Deletion</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this multiple-choice set? This action
                            cannot be undone.
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
        </>
    );
}
