"use client";

import { useState } from "react";
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
import { Plus, Search, Upload, Crown } from "lucide-react";
import { useAuth } from "@/context/authContext";
import { useToast } from "@/context/toastContext";
import { useFirestore } from "@/context/firestore-context";
import { deleteShortAnswer } from "@/lib/backend/api/quiz/short-answer-service";
import CreateShortAnswerForm from "../modals/create-short-answer-form";

export default function ShortAnswerManager() {
    const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
    const [editingQuestion, setEditingQuestion] = useState<any>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
    const [toDeleteID, setToDeleteID] = useState<string>("");
    const [deleteLoading, setDeleteLoading] = useState<boolean>(false);

    const { user } = useAuth();
    const { showToast } = useToast();

    const { shortAnswers } = useFirestore();

    const handleCreateNew = () => {
        setShowCreateForm(true);
    };

    const handleEditQuestion = (question: any) => {
        setEditingQuestion(question);
        setShowCreateForm(true);
    };

    const handleDeleteQuestion = (questionId: string) => {
        setShowDeleteDialog(true);
        setToDeleteID(questionId);
    };

    const confirmDelete = async () => {
        if (toDeleteID) {
            console.log("Deleting question:", toDeleteID);
            setDeleteLoading(true);

            const res = await deleteShortAnswer(toDeleteID);
            if (res) showToast("Deleted!", "Success", "success");
            else showToast("Error deleting short answer. Please try again!", "Error", "error");

            setShowDeleteDialog(false); // Close the confirmation dialog
            setToDeleteID(""); // Reset the question to delete
            setDeleteLoading(false);
        }
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Short Answer Management</CardTitle>
                    <CardDescription>
                        Create, edit, and manage your short answer questions.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Action Buttons */}
                    <div className="flex gap-2">
                        <Button onClick={handleCreateNew}>
                            <Plus className="w-4 h-4 mr-1" />
                            Create New Question
                        </Button>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input placeholder="Search short answer questions..." className="pl-10" />
                    </div>

                    {/* Short Answer Questions List */}
                    <div className="space-y-3 pt-4">
                        {shortAnswers.length > 0 ? (
                            shortAnswers.map(question => (
                                <Card key={question.id}>
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <CardTitle className="flex items-center gap-3 mb-2 text-lg">
                                                    {question.name}
                                                    <Badge
                                                        variant={
                                                            question.active
                                                                ? "default"
                                                                : "secondary"
                                                        }
                                                    >
                                                        {question.active ? "Active" : "Inactive"}
                                                    </Badge>
                                                </CardTitle>
                                                <CardDescription>
                                                    {question.question}
                                                </CardDescription>
                                            </div>
                                            <div className="flex gap-2 flex-shrink-0">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleEditQuestion(question)}
                                                >
                                                    Edit
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    disabled={deleteLoading}
                                                    onClick={() =>
                                                        handleDeleteQuestion(question.id)
                                                    }
                                                >
                                                    Delete
                                                </Button>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-gray-500">
                                            Word limit: {question.wordLimit}
                                        </p>
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <p>No short answer questions found.</p>
                                <p className="text-sm">
                                    Click "Create New Question" to get started.
                                </p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <CreateShortAnswerForm
                isOpen={showCreateForm}
                onClose={() => {
                    setShowCreateForm(false);
                    setEditingQuestion(null);
                }}
                editingQuestion={editingQuestion}
            />

            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Confirm Deletion</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this short answer question? This action
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
