"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useFirestore } from "@/context/firestore-context";
import { useToast } from "@/context/toastContext";
import { deleteShortAnswer } from "@/lib/backend/api/talent-acquisition/short-answer-service";
import ShortAnswerModel from "@/lib/models/short-answer";
import { Edit, Eye, FileText, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import AddShortAnswerQuestionModal from "../modals/add-short-answer-question-modal";
import EditShortAnswerQuestionModal from "../modals/edit-short-answer-question-modal";
import ViewShortAnswerQuestionModal from "../modals/view-short-answer-question-modal";

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    loading: boolean;
}

const ConfirmModal = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    loading,
}: ConfirmModalProps) => {
    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-300">{message}</p>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={onClose} disabled={loading}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={onConfirm} disabled={loading}>
                            {loading ? "Deleting..." : "Delete"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default function ShortAnswerQuestions() {
    const { showToast } = useToast();
    const { shortAnswers } = useFirestore();
    const [filteredQuestions, setFilteredQuestions] = useState<ShortAnswerModel[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>("");

    const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState<boolean>(false);
    const [selectedQuestion, setSelectedQuestion] = useState<ShortAnswerModel | null>(null);

    const [deleteLoading, setDeleteLoading] = useState<boolean>(false);
    const [confirmModalOpen, setConfirmModalOpen] = useState<boolean>(false);
    const [toBeDeleted, setToBeDeleted] = useState<ShortAnswerModel | null>(null);

    // Filter questions based on search term
    useEffect(() => {
        if (searchTerm.trim() === "") {
            setFilteredQuestions(shortAnswers);
        } else {
            const filtered = shortAnswers.filter(
                question =>
                    question.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    question.questions.some(q =>
                        q.question.toLowerCase().includes(searchTerm.toLowerCase()),
                    ),
            );
            setFilteredQuestions(filtered);
        }
    }, [shortAnswers, searchTerm]);

    const handleCreateQuestion = (): void => {
        setIsAddModalOpen(true);
    };

    const handleEditQuestion = (question: ShortAnswerModel): void => {
        setSelectedQuestion(question);
        setIsEditModalOpen(true);
    };

    const handleViewQuestion = (question: ShortAnswerModel): void => {
        setSelectedQuestion(question);
        setIsViewModalOpen(true);
    };

    const handleDeleteQuestion = async (question: ShortAnswerModel): Promise<void> => {
        setToBeDeleted(question);
        setConfirmModalOpen(true);
    };

    const confirmDelete = async (): Promise<void> => {
        if (toBeDeleted) {
            setDeleteLoading(true);

            try {
                const result = await deleteShortAnswer(toBeDeleted.id);
                if (result) {
                    showToast("Short answer question deleted successfully.", "Success", "success");
                } else {
                    showToast(
                        "Error deleting short answer question. Please try again.",
                        "Error",
                        "error",
                    );
                }
            } catch (error) {
                showToast("Action failed. Please try again.", "Error", "error");
            }

            setDeleteLoading(false);
            setConfirmModalOpen(false);
            setToBeDeleted(null);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-semibold text-brand-800 dark:text-white">
                        Short Answer Questions
                    </h2>
                    <p className="text-brand-600 dark:text-gray-300">
                        Create and manage short answer screening questions
                    </p>
                </div>
                <Button onClick={handleCreateQuestion}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Question
                </Button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                    placeholder="Search short answer questions..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Short Answer Questions List */}
            <div className="grid gap-4">
                {filteredQuestions.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <div className="text-center">
                                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-brand-800 dark:text-white mb-2">
                                    {shortAnswers.length === 0
                                        ? "No Short Answer Questions Found"
                                        : "No Questions Match Your Search"}
                                </h3>
                                <p className="text-brand-600 dark:text-gray-300 mb-4">
                                    {shortAnswers.length === 0
                                        ? "You haven't created any short answer questions yet. Create your first question to get started."
                                        : "Try adjusting your search terms or create a new question."}
                                </p>
                                <Button onClick={handleCreateQuestion}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    {shortAnswers.length === 0
                                        ? "Create First Question"
                                        : "Create Question"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    filteredQuestions.map(question => (
                        <Card key={question.id} className="p-4 border border-gray-200 rounded-lg">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h4 className="font-medium text-brand-800 dark:text-white">
                                            {question.name}
                                        </h4>
                                        <Badge
                                            variant={question.active ? "default" : "secondary"}
                                            className={
                                                question.active
                                                    ? "bg-green-400 hover:bg-green-500"
                                                    : "bg-red-400 hover:bg-red-500"
                                            }
                                        >
                                            {question.active ? "Active" : "Inactive"}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-brand-600 dark:text-gray-300 mb-2">
                                        {question.questions.length} question
                                        {question.questions.length !== 1 ? "s" : ""}
                                    </p>
                                    <div className="text-sm text-gray-500 mb-2">
                                        {question.questions.slice(0, 2).map((q, index) => (
                                            <div key={index} className="truncate">
                                                {index + 1}.{" "}
                                                {q.question.length > 80
                                                    ? q.question.substring(0, 80) + "..."
                                                    : q.question}
                                            </div>
                                        ))}
                                        {question.questions.length > 2 && (
                                            <div className="text-xs text-gray-400 mt-1">
                                                +{question.questions.length - 2} more question
                                                {question.questions.length - 2 !== 1 ? "s" : ""}
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">
                                        Created: {question.timestamp}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleViewQuestion(question)}
                                    >
                                        <Eye className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleEditQuestion(question)}
                                    >
                                        <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => handleDeleteQuestion(question)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>

            {/* Modals */}
            <AddShortAnswerQuestionModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
            />

            <EditShortAnswerQuestionModal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setSelectedQuestion(null);
                }}
                question={selectedQuestion}
            />

            <ViewShortAnswerQuestionModal
                isOpen={isViewModalOpen}
                onClose={() => {
                    setIsViewModalOpen(false);
                    setSelectedQuestion(null);
                }}
                question={selectedQuestion}
            />

            {/* Confirm Delete Modal */}
            <ConfirmModal
                isOpen={confirmModalOpen}
                onClose={() => setConfirmModalOpen(false)}
                onConfirm={confirmDelete}
                title="Delete Short Answer Question"
                message={`Are you sure you want to delete "${toBeDeleted?.name}"? This action cannot be undone.`}
                loading={deleteLoading}
            />
        </div>
    );
}
