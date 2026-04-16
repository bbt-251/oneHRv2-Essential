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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Edit, Eye, Plus, Trash2, X, MoreHorizontal } from "lucide-react";
import { CommonAnswerModel, QuestionModel } from "@/lib/models/commonAnswer";
import { commonAnswerService } from "@/lib/backend/api/common-answer-service";
import { useFirestore } from "@/context/firestore-context";
import { useToast } from "@/context/toastContext";
import { getTimestamp } from "@/lib/util/dayjs_format";
import { useAuth } from "@/context/authContext";

export function CommonAnswers() {
    const { hrSettings, commonAnswers } = useFirestore();
    const commonAnswerTypes = hrSettings.commonAnswerTypes || [];

    const { showToast } = useToast();
    const { userData } = useAuth();

    const [isSubmitting, setIsSubmitting] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<CommonAnswerModel | null>(null);
    const [viewingItem, setViewingItem] = useState<CommonAnswerModel | null>(null);
    const [formData, setFormData] = useState<Partial<CommonAnswerModel>>({});
    const [currentQuestions, setCurrentQuestions] = useState<QuestionModel[]>([]);

    const handleSubmit = async (e: React.FormEvent) => {
        try {
            e.preventDefault();
            setIsSubmitting(true);

            const CommonAnswerData: Omit<CommonAnswerModel, "id"> = {
                title: formData.title || "",
                timestamp: formData.timestamp || getTimestamp(),
                active: formData.active || "Yes",
                questions: currentQuestions.map((question, index) => ({
                    qID: question.qID || `q${index + 1}`,
                    qTitle: question.qTitle,
                    answerType: question.answerType,
                })),
            };

            if (editingItem) {
                await commonAnswerService.update(editingItem.id!, CommonAnswerData);
                showToast("Common Answer updated successfully", "success", "success");
            } else {
                await commonAnswerService.create(CommonAnswerData);
                showToast("Common Answer created successfully", "success", "success");
            }
        } catch (error) {
            showToast("Failed to create Common Answer", "error", "error");
            console.error("Failed to save common answer:", error);
        } finally {
            setIsSubmitting(false);
            setIsModalOpen(false);
            setEditingItem(null);
            setFormData({});
        }
    };

    const handleEdit = (item: CommonAnswerModel) => {
        setEditingItem(item);
        setFormData(item);
        setCurrentQuestions(item.questions || []);
        setIsModalOpen(true);
    };

    const handleView = (item: CommonAnswerModel) => {
        setViewingItem(item);
        setIsViewModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        try {
            await commonAnswerService.delete(id);
            showToast("Common Answer deleted successfully", "success", "success");
        } catch (error) {
            showToast("Failed to delete common answer", "error", "error");
            console.error("Failed to delete common answer:", error);
        }
    };

    const openAddModal = () => {
        setEditingItem(null);
        setFormData({});
        setCurrentQuestions([]);
        setIsModalOpen(true);
    };

    const addQuestion = () => {
        setCurrentQuestions(prev => [
            ...prev,
            {
                qID: `q${prev.length + 1}`,
                qTitle: "",
                answerType: "",
            },
        ]);
    };

    const updateQuestion = (index: number, field: keyof QuestionModel, value: string) => {
        setCurrentQuestions(prev =>
            prev.map((question, i) => (i === index ? { ...question, [field]: value } : question)),
        );
    };

    const removeQuestion = (index: number) => {
        setCurrentQuestions(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg font-semibold">Common Answers</CardTitle>
                <p className="text-sm">Manage reusable answer sets for surveys and forms</p>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex justify-end items-center">
                    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                        <DialogTrigger asChild>
                            <Button
                                onClick={openAddModal}
                                className="bg-amber-600 hover:bg-amber-700 text-white"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Answer Set
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>
                                    {editingItem ? "Edit Answer Set" : "Add Answer Set"}
                                </DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <Label htmlFor="title">Title</Label>
                                    <Input
                                        id="title"
                                        value={formData.title || ""}
                                        onChange={e =>
                                            setFormData(prev => ({
                                                ...prev,
                                                title: e.target.value,
                                            }))
                                        }
                                        placeholder="Enter answer set title"
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
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <Label>Questions</Label>
                                        <Button
                                            type="button"
                                            onClick={addQuestion}
                                            size="sm"
                                            variant="outline"
                                        >
                                            <Plus className="w-4 h-4 mr-1" />
                                            Add Question
                                        </Button>
                                    </div>
                                    <div className="space-y-3 max-h-96 overflow-y-auto">
                                        {currentQuestions.map((question, index) => (
                                            <div
                                                key={index}
                                                className="border rounded-lg p-4 space-y-3"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-sm font-medium">
                                                        Question {index + 1}
                                                    </Label>
                                                    <Button
                                                        type="button"
                                                        onClick={() => removeQuestion(index)}
                                                        size="sm"
                                                        variant="ghost"
                                                        className="text-red-600 hover:text-red-700"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                                <div className="space-y-2">
                                                    <Input
                                                        value={question.qTitle}
                                                        onChange={e =>
                                                            updateQuestion(
                                                                index,
                                                                "qTitle",
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder="Enter question title"
                                                        required
                                                    />
                                                    <Select
                                                        value={question.answerType}
                                                        onValueChange={value =>
                                                            updateQuestion(
                                                                index,
                                                                "answerType",
                                                                value,
                                                            )
                                                        }
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select answer type" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {commonAnswerTypes.map(type => (
                                                                <SelectItem
                                                                    key={type.id}
                                                                    value={type.id}
                                                                >
                                                                    {type.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        ))}
                                        {currentQuestions.length === 0 && (
                                            <p className="text-sm text-gray-500 text-center py-4">
                                                No questions added yet. Click "Add Question" to get
                                                started.
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex justify-end space-x-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsModalOpen(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="bg-amber-600 hover:bg-amber-700"
                                    >
                                        {isSubmitting
                                            ? "Saving..."
                                            : editingItem
                                                ? "Update"
                                                : "Create"}
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
                                    <TableHead>Title</TableHead>
                                    <TableHead>Questions</TableHead>
                                    <TableHead>Created Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {commonAnswers.map(item => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">{item.title}</TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-blue-600 hover:text-blue-700"
                                                onClick={() => {
                                                    setViewingItem(item);
                                                    setIsViewModalOpen(true);
                                                }}
                                            >
                                                <MoreHorizontal className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
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
                                                                Delete Answer Set
                                                            </AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Are you sure you want to delete "
                                                                {item.title}"? This action cannot be
                                                                undone.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>
                                                                Cancel
                                                            </AlertDialogCancel>
                                                            <AlertDialogAction
                                                                onClick={() =>
                                                                    handleDelete(item.id!)
                                                                }
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
                    <DialogContent className="sm:max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Answer Set Details</DialogTitle>
                        </DialogHeader>
                        {viewingItem && (
                            <div className="space-y-4">
                                <div>
                                    <Label className="text-sm font-medium text-gray-500">
                                        Title
                                    </Label>
                                    <p className="text-sm ">{viewingItem.title}</p>
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
                                        variant={
                                            viewingItem.active === "Yes" ? "default" : "secondary"
                                        }
                                        className={
                                            viewingItem.active === "Yes"
                                                ? "bg-green-100 text-green-800"
                                                : "bg-gray-100 text-gray-800"
                                        }
                                    >
                                        {viewingItem.active === "Yes" ? "Active" : "Inactive"}
                                    </Badge>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium text-gray-500">
                                        Questions ({viewingItem.questions?.length || 0})
                                    </Label>
                                    <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
                                        {viewingItem.questions?.map((question, index) => (
                                            <div
                                                key={index}
                                                className="border rounded p-3 space-y-2"
                                            >
                                                <div className="flex items-center space-x-2">
                                                    <Badge variant="outline" className="text-xs">
                                                        {index + 1}
                                                    </Badge>
                                                    <span className="text-sm font-medium">
                                                        {question.qTitle}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    Answer Type:{" "}
                                                    {commonAnswerTypes.find(
                                                        t => t.id == question.answerType,
                                                    )?.name || "Not specified"}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex justify-end">
                                    <Button onClick={() => setIsViewModalOpen(false)}>Close</Button>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    );
}
