"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Eye, Calendar, Users, Clock, ClipboardList } from "lucide-react";
import { QuizForm } from "../modals/quiz-form";
import { QuizModel } from "@/lib/models/quiz.ts";
import { useFirestore } from "@/context/firestore-context";
import { useToast } from "@/context/toastContext";
import { createQuiz, deleteQuiz, updateQuiz } from "@/lib/backend/api/training/quiz.ts";
import { dateFormat, getTimestamp } from "@/lib/util/dayjs_format";
import dayjs from "dayjs";
import { AlertDialogFooter } from "@/components/ui/alert-dialog";
import { LEARNING_LOG_MESSAGES } from "@/lib/log-descriptions/learning";
import { useAuth } from "@/context/authContext";

// Initial state for a new quiz form
const initialFormData: QuizModel = {
    quizTitle: "",
    audienceTarget: [],
    employees: [],
    departments: [],
    sections: [],
    locations: [],
    grades: [],
    selected: [],
    startDate: "",
    endDate: "",
    active: "Yes",
    passingRate: 80,
    questionTimerEnabled: false,
    timer: 30,
    id: "",
    creationDate: "",
    multipleChoice: null,
    shortAnswer: null,
    quizTakenTimestamp: null,
    quizAnswers: [],
    createdBy: "",
};

export function QuizDefinition() {
    const { quizzes, multipleChoices, shortAnswers, hrSettings } = useFirestore();
    const sections = hrSettings?.sectionSettings || [];
    const departments = hrSettings?.departmentSettings || [];
    const locations = hrSettings?.locations || [];
    const grades = hrSettings?.grades || [];
    const { userData } = useAuth();

    const getSectionName = (sectionId: string) => {
        const section = sections.find(s => s.id === sectionId);
        return section?.name || "unknown";
    };
    const getDepartmentName = (id: string) => {
        const department = departments.find(d => d.id === id);
        return department?.name || "unknown";
    };
    const getLocationName = (id: string) => {
        const location = locations.find(l => l.id === id);
        return location?.name || "unknown";
    };
    const getGradeName = (id: string) => {
        const grade = grades.find(g => g.id === id);
        return grade?.grade || "unknown";
    };

    const { showToast } = useToast();

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);

    const [isViewOpen, setIsViewOpen] = useState(false);
    const [selectedQuiz, setSelectedQuiz] = useState<QuizModel | null>(null);

    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState<Partial<QuizModel>>(initialFormData);

    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    const resetForm = () => {
        setFormData(initialFormData);
        setSelectedQuiz(null);
        setCurrentStep(1);
        setIsEditMode(false);
    };

    const handleOpenCreate = () => {
        resetForm();
        setIsFormOpen(true);
    };

    const handleOpenEdit = (quiz: QuizModel) => {
        resetForm();
        setIsEditMode(true);
        setSelectedQuiz(quiz);
        setFormData(quiz);
        setIsFormOpen(true);
    };

    const handleOpenView = (quiz: QuizModel) => {
        setSelectedQuiz(quiz);
        setIsViewOpen(true);
    };

    const handleDelete = async (id: string) => {
        setDeleteId(id);
        setIsDeleteDialogOpen(true);
    };
    const confirmDelete = async () => {
        if (!deleteId) return;

        const quizToDelete = quizzes.find(q => q.id === deleteId);
        try {
            const success = await deleteQuiz(
                deleteId,
                userData?.uid ?? "",
                LEARNING_LOG_MESSAGES.QUIZ_DELETED(quizToDelete?.quizTitle || ""),
            );
            if (success) {
                showToast("Quiz deleted successfully", "success", "success");
            } else {
                showToast("Failed to delete quiz", "error", "error");
            }
        } catch (error) {
            showToast("An error occurred while deleting the request", "error", "error");
        } finally {
            setIsDeleteDialogOpen(false);
            setDeleteId(null);
        }
    };

    const handleSubmit = async () => {
        const finalFormData = { ...formData };
        if (finalFormData.multipleChoice?.[0] === null) {
            delete finalFormData.multipleChoice;
        }
        if (finalFormData.shortAnswer?.[0] === null) {
            delete finalFormData.shortAnswer;
        }

        try {
            if (isEditMode && selectedQuiz) {
                setIsSubmitting(true);
                await updateQuiz(
                    { ...finalFormData, id: selectedQuiz.id },
                    userData?.uid ?? "",
                    LEARNING_LOG_MESSAGES.QUIZ_UPDATED(selectedQuiz.quizTitle),
                );
                showToast("Quiz updated successfully", "success", "success");
            } else {
                setIsSubmitting(true);
                const newQuiz: Omit<QuizModel, "id"> = {
                    ...initialFormData,
                    ...finalFormData,
                    creationDate: getTimestamp(),
                } as QuizModel;
                await createQuiz(
                    newQuiz,
                    userData?.uid ?? "",
                    LEARNING_LOG_MESSAGES.QUIZ_CREATED(finalFormData.quizTitle || ""),
                );
                showToast("Quiz created successfully", "success", "success");
            }
        } catch (error) {
            console.error("Failed to submit quiz:", error);
            showToast("Failed to submit quiz", "error", "error");
        } finally {
            setIsSubmitting(false);
            setIsFormOpen(false);
            resetForm();
        }
    };

    const renderAudienceDetails = (quiz: QuizModel) => (
        <div className="mt-2 flex flex-wrap gap-1">
            {quiz.departments?.map(id => (
                <Badge key={`dept-${id}`} variant="outline" className="text-xs font-normal">
                    Dept: {getDepartmentName(id)}
                </Badge>
            ))}
            {quiz.sections?.map(id => (
                <Badge key={`sec-${id}`} variant="outline" className="text-xs font-normal">
                    Sec: {getSectionName(id)}
                </Badge>
            ))}
            {quiz.locations?.map(id => (
                <Badge key={`loc-${id}`} variant="outline" className="text-xs font-normal">
                    Loc: {getLocationName(id)}
                </Badge>
            ))}
            {quiz.grades?.map(id => (
                <Badge key={`grade-${id}`} variant="outline" className="text-xs font-normal">
                    Grade: {getGradeName(id)}
                </Badge>
            ))}
            {quiz.employees && quiz.employees.length > 0 && (
                <Badge key="employees" variant="outline" className="text-xs font-normal">
                    {quiz.employees.length} Employee(s)
                </Badge>
            )}
        </div>
    );

    return (
        <>
            <Card className="border-brand-200 dark:border-brand-800">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-xl font-semibold text-brand-800 dark:text-white">
                            Quiz Definitions
                        </CardTitle>
                        <Button
                            className="bg-brand-600 hover:bg-brand-700 text-white"
                            onClick={handleOpenCreate}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Create New Quiz
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {quizzes.length === 0 ? (
                            <Card className="border-brand-100 dark:border-brand-700">
                                <CardContent className="p-6 text-center">
                                    <div className="flex flex-col items-center justify-center space-y-4">
                                        <ClipboardList className="h-12 w-12 text-brand-400" />
                                        <h3 className="text-lg font-medium text-brand-800 dark:text-white">
                                            No Quizzes Found
                                        </h3>
                                        <p className="text-brand-600 dark:text-brand-300 max-w-md">
                                            You haven't created any quizzes yet. Click the "Create
                                            New Quiz" button to get started.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            quizzes.map(quiz => (
                                <Card
                                    key={quiz.id}
                                    className="border-brand-100 dark:border-brand-700"
                                >
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="font-semibold text-brand-800 dark:text-white">
                                                        {quiz.quizTitle}
                                                    </h3>
                                                    <Badge
                                                        variant={
                                                            quiz.active === "Yes"
                                                                ? "default"
                                                                : "secondary"
                                                        }
                                                    >
                                                        {quiz.active === "Yes"
                                                            ? "Active"
                                                            : "Inactive"}
                                                    </Badge>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-brand-600 dark:text-brand-300">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="h-4 w-4" />
                                                        <span>
                                                            {dayjs(quiz.startDate).format(
                                                                dateFormat,
                                                            )}{" "}
                                                            -{" "}
                                                            {dayjs(quiz.endDate).format(dateFormat)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Users className="h-4 w-4" />
                                                        <span>
                                                            {quiz.audienceTarget.join(", ")}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="h-4 w-4" />
                                                        <span>Passing: {quiz.passingRate}%</span>
                                                    </div>
                                                </div>
                                                <div className="mt-2 flex flex-wrap gap-1">
                                                    {quiz.departments.map((dept, index) => (
                                                        <Badge
                                                            key={index}
                                                            variant="outline"
                                                            className="text-xs"
                                                        >
                                                            {dept}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 ml-4">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleOpenView(quiz)}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleOpenEdit(quiz)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-red-600 hover:text-red-700"
                                                    onClick={() => handleDelete(quiz.id!)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Unified Create/Edit Dialog */}
            <Dialog
                open={isFormOpen}
                onOpenChange={isOpen => {
                    if (!isOpen) {
                        resetForm();
                    }
                    setIsFormOpen(isOpen);
                }}
            >
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>{isEditMode ? "Edit Quiz" : "Create New Quiz"}</DialogTitle>
                    </DialogHeader>
                    <QuizForm
                        isEdit={isEditMode}
                        currentStep={currentStep}
                        setCurrentStep={setCurrentStep}
                        formData={formData}
                        setFormData={setFormData}
                        multipleChoiceQuestions={multipleChoices}
                        shortAnswerQuestions={shortAnswers}
                    />
                    <div className="flex justify-between pt-4">
                        <div>
                            {currentStep === 2 && (
                                <Button variant="outline" onClick={() => setCurrentStep(1)}>
                                    Previous
                                </Button>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
                                Cancel
                            </Button>
                            {currentStep === 1 ? (
                                <Button
                                    onClick={() => setCurrentStep(2)}
                                    className="bg-brand-600 text-white hover:bg-brand-700"
                                >
                                    Next
                                </Button>
                            ) : (
                                <Button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className={`bg-brand-600 text-white hover:bg-brand-700 ${
                                        isSubmitting ? "animate-loader2" : ""
                                    }`}
                                >
                                    {isEditMode ? "Update Quiz" : "Create Quiz"}
                                </Button>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* View Modal */}
            <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Quiz Details</DialogTitle>
                    </DialogHeader>
                    {selectedQuiz && (
                        <div className="space-y-4 max-h-96 overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <strong>Creation Date:</strong> {selectedQuiz.creationDate}
                                </div>
                                <div>
                                    <strong>Title:</strong> {selectedQuiz.quizTitle}
                                </div>
                                <div>
                                    <strong>Status:</strong> {selectedQuiz.active}
                                </div>
                                <div>
                                    <strong>Start Date:</strong>{" "}
                                    {dayjs(selectedQuiz.startDate).format(dateFormat)}
                                </div>
                                <div>
                                    <strong>End Date:</strong>{" "}
                                    {dayjs(selectedQuiz.endDate).format(dateFormat)}
                                </div>
                                <div>
                                    <strong>Passing Rate:</strong> {selectedQuiz.passingRate}%
                                </div>
                                <div>
                                    <strong>Timer Enabled:</strong>{" "}
                                    {selectedQuiz.questionTimerEnabled ? "Yes" : "No"}
                                </div>
                            </div>
                            <div>
                                <strong>Audience Target Types:</strong>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {selectedQuiz.audienceTarget.map((target, index) => (
                                        <Badge key={index} variant="outline" className="capitalize">
                                            {target.replace(/_/g, " ")}
                                        </Badge>
                                    ))}
                                </div>
                            </div>

                            {(selectedQuiz.departments?.length ||
                                selectedQuiz.sections?.length ||
                                selectedQuiz.locations?.length ||
                                selectedQuiz.grades?.length ||
                                selectedQuiz.employees?.length) > 0 && (
                                <div>
                                    <strong>Specific Selections:</strong>
                                    {renderAudienceDetails(selectedQuiz)}
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Are you sure?</DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. This will permanently delete the quiz.
                        </DialogDescription>
                    </DialogHeader>
                    <AlertDialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={confirmDelete}>
                            Delete
                        </Button>
                    </AlertDialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
