"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { deleteExitInterviewQuestion } from "@/lib/backend/api/exit-instance/exit-interview-questions-service";
import ExitInterviewQuestionModel from "@/lib/models/exit-interview-questions";
import { Clock, Edit, Eye, FileText, Plus, Search, Target, Trash2 } from "lucide-react";
import { useState } from "react";
import EditExitInterviewModal from "./modals/exit-interview/edit-exit-interview-modal";
import ViewExitInterviewModal from "./modals/exit-interview/view-exit-interview-modal";
import AddExitInterviewModal from "./modals/exit-interview/add-exit-interview-modal";

export default function ExitInterview() {
    const [showAddModal, setShowAddModal] = useState<boolean>(false);
    const [showEditModal, setShowEditModal] = useState<boolean>(false);
    const [showViewModal, setShowViewModal] = useState<boolean>(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
    const [toDeleteExitInterview, setToDeleteExitInterview] =
        useState<ExitInterviewQuestionModel | null>(null);
    const [selectedExitInterview, setSelectedExitInterview] =
        useState<ExitInterviewQuestionModel | null>(null);
    const [deleteLoading, setDeleteLoading] = useState<boolean>(false);

    const { showToast } = useToast();
    const { exitInterviewQuestions } = useFirestore();

    const handleEditExitInterview = (exitInterview: ExitInterviewQuestionModel) => {
        setSelectedExitInterview(exitInterview);
        setShowEditModal(true);
    };

    const handleViewExitInterview = (exitInterview: ExitInterviewQuestionModel) => {
        setSelectedExitInterview(exitInterview);
        setShowViewModal(true);
    };

    const handleDeleteConfirm = (exitInterview: ExitInterviewQuestionModel) => {
        setToDeleteExitInterview(exitInterview);
        setShowDeleteDialog(true);
    };

    const confirmDelete = async () => {
        if (toDeleteExitInterview) {
            setDeleteLoading(true);

            const result = await deleteExitInterviewQuestion(toDeleteExitInterview.id);

            if (result) {
                showToast(
                    `Exit interview question "${toDeleteExitInterview.name}" deleted successfully!`,
                    "Success",
                    "success",
                );
            } else {
                showToast(
                    "Error deleting exit interview question. Please try again!",
                    "Error",
                    "error",
                );
            }

            setShowDeleteDialog(false);
            setToDeleteExitInterview(null);
            setDeleteLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-semibold text-brand-800 dark:text-white">
                        Exit Interview Questions
                    </h2>
                    <p className="text-brand-600 dark:text-gray-300">
                        Create and manage exit interview question sets for exit management
                    </p>
                </div>
                {/* TODO: Add create new functionality */}
                <Button onClick={() => setShowAddModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create
                </Button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input placeholder="Search exit interview questions..." className="pl-10" />
            </div>

            {/* Exit Interview Questions List */}
            <div className="space-y-3 pt-4">
                {exitInterviewQuestions.length > 0 ? (
                    exitInterviewQuestions
                        .sort(
                            (a, b) =>
                                new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
                        )
                        .map(exitInterview => (
                            <Card key={exitInterview.id}>
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="flex items-center gap-3 mb-2 text-lg">
                                                {exitInterview.name}
                                                <Badge
                                                    variant={
                                                        exitInterview.active
                                                            ? "default"
                                                            : "secondary"
                                                    }
                                                    className={
                                                        exitInterview.active
                                                            ? "bg-green-400 hover:bg-green-500"
                                                            : "bg-red-400 hover:bg-red-500"
                                                    }
                                                >
                                                    {exitInterview.active ? "Active" : "Inactive"}
                                                </Badge>
                                            </CardTitle>
                                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                                                <div className="flex items-center gap-1">
                                                    <Target className="w-4 h-4" />
                                                    Passing Score: {exitInterview.passingScore}%
                                                </div>
                                                {exitInterview.timerEnabled && (
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="w-4 h-4" />
                                                        Timer: {exitInterview.timer} mins
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-2 flex-shrink-0">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() =>
                                                    handleViewExitInterview(exitInterview)
                                                }
                                            >
                                                <Eye className="w-4 h-4 mr-1" />
                                                View
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() =>
                                                    handleEditExitInterview(exitInterview)
                                                }
                                            >
                                                <Edit className="w-4 h-4 mr-1" />
                                                Edit
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                disabled={deleteLoading}
                                                onClick={() => handleDeleteConfirm(exitInterview)}
                                            >
                                                <Trash2 className="w-4 h-4 mr-1" />
                                                Delete
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span>
                                                {exitInterview.multipleChoiceQuestions.length +
                                                    exitInterview.shortAnswerQuestions.length}{" "}
                                                total questions
                                            </span>
                                            <span>Created: {exitInterview.timestamp}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            {exitInterview.multipleChoiceQuestions.length > 0 && (
                                                <Badge variant="outline" className="text-xs">
                                                    {exitInterview.multipleChoiceQuestions.length}{" "}
                                                    Multiple Choice
                                                </Badge>
                                            )}
                                            {exitInterview.shortAnswerQuestions.length > 0 && (
                                                <Badge variant="outline" className="text-xs">
                                                    {exitInterview.shortAnswerQuestions.length}{" "}
                                                    Short Answer
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                ) : (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <div className="text-center">
                                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-brand-800 dark:text-white mb-2">
                                    No Exit Interview Questions Found
                                </h3>
                                <p className="text-brand-600 dark:text-gray-300 mb-4">
                                    You haven't created any exit interview questions yet. Create
                                    your first set to get started.
                                </p>
                                <Button onClick={() => setShowAddModal(true)}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Create
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Add Modal */}
            <AddExitInterviewModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />

            {/* Edit Modal */}
            <EditExitInterviewModal
                isOpen={showEditModal}
                onClose={() => {
                    setShowEditModal(false);
                    setSelectedExitInterview(null);
                }}
                exitInterview={selectedExitInterview}
            />

            {/* View Modal */}
            <ViewExitInterviewModal
                isOpen={showViewModal}
                onClose={() => {
                    setShowViewModal(false);
                    setSelectedExitInterview(null);
                }}
                exitInterview={selectedExitInterview}
            />

            {/* Delete Confirmation Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Confirm Deletion</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete the exit interview question set "
                            {toDeleteExitInterview?.name}"? This action cannot be undone.
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
