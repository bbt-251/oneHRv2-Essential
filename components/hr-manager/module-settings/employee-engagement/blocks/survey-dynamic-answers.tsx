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
import { Edit, Eye, Plus, Trash2, X } from "lucide-react";
import {
    CommonAnswerTypesModel,
    hrSettingsService,
} from "@/lib/backend/firebase/hrSettingsService";
import { useFirestore } from "@/context/firestore-context";
import { useToast } from "@/context/toastContext";
import { getTimestamp } from "@/lib/util/dayjs_format";
import { EMPLOYEE_ENGAGEMENT_LOG_MESSAGES } from "@/lib/log-descriptions/employee-engagement";
import { useAuth } from "@/context/authContext";

export const SurveyDynamicAnswers = () => {
    const { hrSettings } = useFirestore();

    const commonAnswerTypes = hrSettings.commonAnswerTypes || [];

    const { showToast } = useToast();
    const { userData } = useAuth();

    const [isSubmitting, setIsSubmitting] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<CommonAnswerTypesModel | null>(null);
    const [viewingItem, setViewingItem] = useState<CommonAnswerTypesModel | null>(null);
    const [formData, setFormData] = useState<Partial<CommonAnswerTypesModel>>({});
    const [currentAnswers, setCurrentAnswers] = useState<string[]>([]);

    const handleSubmit = async (e: React.FormEvent) => {
        try {
            // required fields

            // if (!formData.trim()) {
            //     showToast("Issue Title is required", "error");
            //     return;
            // }

            e.preventDefault();
            setIsSubmitting(true);

            const CommonAnswerData: Omit<CommonAnswerTypesModel, "id"> = {
                name: formData.name || "",
                timestamp: formData.timestamp || getTimestamp(),
                active: formData.active || "Yes",
                answers: currentAnswers || [],
            };

            if (editingItem) {
                hrSettingsService.update(
                    "commonAnswerTypes",
                    editingItem.id,
                    formData,
                    userData?.uid,
                    EMPLOYEE_ENGAGEMENT_LOG_MESSAGES.SURVEY_ANSWER_SET_UPDATED({
                        id: editingItem.id,
                        name: formData.name,
                        answers: currentAnswers,
                        active: formData.active,
                    }),
                );
                showToast("Common Answer updated successfully", "success", "success");

                setIsModalOpen(false);
            } else {
                hrSettingsService.create(
                    "commonAnswerTypes",
                    CommonAnswerData,
                    userData?.uid,
                    EMPLOYEE_ENGAGEMENT_LOG_MESSAGES.SURVEY_ANSWER_SET_CREATED({
                        name: CommonAnswerData.name,
                        answers: CommonAnswerData.answers,
                        active: CommonAnswerData.active,
                    }),
                );
                showToast("Common Answer created successfully", "success", "success");

                setIsModalOpen(false);
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

    const handleEdit = (item: CommonAnswerTypesModel) => {
        setEditingItem(item);
        setFormData(item);
        setCurrentAnswers([...item.answers]);
        setIsModalOpen(true);
    };

    const handleView = (item: CommonAnswerTypesModel) => {
        setViewingItem(item);
        setIsViewModalOpen(true);
    };

    const handleDelete = (id: string) => {
        hrSettingsService.remove(
            "commonAnswerTypes",
            id,
            userData?.uid,
            EMPLOYEE_ENGAGEMENT_LOG_MESSAGES.SURVEY_ANSWER_SET_DELETED(id),
        );
        showToast("common Answer deleted successfully", "success", "success");
    };

    const openAddModal = () => {
        setEditingItem(null);
        setFormData({});
        setCurrentAnswers([]);
        setIsModalOpen(true);
    };

    const addAnswer = () => {
        setCurrentAnswers(prev => [...prev, ""]);
    };

    const updateAnswer = (index: number, value: string) => {
        setCurrentAnswers(prev => prev.map((answer, i) => (i === index ? value : answer)));
    };

    const removeAnswer = (index: number) => {
        setCurrentAnswers(prev => prev.filter((_, i) => i !== index));
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg font-semibold">Survey Dynamic Answers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-semibold ">Common Answer Sets</h3>
                        <p className="text-sm">Manage reusable answer sets for employee surveys</p>
                    </div>
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
                                    <Label htmlFor="name">Name</Label>
                                    <Input
                                        id="name"
                                        value={formData.name || ""}
                                        onChange={e =>
                                            setFormData(prev => ({
                                                ...prev,
                                                name: e.target.value,
                                            }))
                                        }
                                        placeholder="Enter answer set name"
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
                                        <Label>Answers</Label>
                                        <Button
                                            type="button"
                                            onClick={addAnswer}
                                            size="sm"
                                            variant="outline"
                                        >
                                            <Plus className="w-4 h-4 mr-1" />
                                            Add Answer
                                        </Button>
                                    </div>
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                        {currentAnswers.map((answer, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center space-x-2"
                                            >
                                                <Input
                                                    value={answer}
                                                    onChange={e =>
                                                        updateAnswer(index, e.target.value)
                                                    }
                                                    placeholder={`Answer ${index + 1}`}
                                                    required
                                                />
                                                <Button
                                                    type="button"
                                                    onClick={() => removeAnswer(index)}
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-red-600 hover:text-red-700"
                                                >
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ))}
                                        {currentAnswers.length === 0 && (
                                            <p className="text-sm text-gray-500 text-center py-4">
                                                No answers added yet. Click "Add Answer" to get
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
                                    <TableHead>Name</TableHead>
                                    <TableHead>Answers Count</TableHead>
                                    <TableHead>Created Date</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {commonAnswerTypes.map(item => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">{item.name}</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="outline"
                                                className="bg-blue-50 text-blue-700 border-blue-200"
                                            >
                                                {item.answers.length} answers
                                            </Badge>
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
                                                                {item.name}"? This action cannot be
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
                                        Name
                                    </Label>
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
                                        Answers ({viewingItem.answers.length})
                                    </Label>
                                    <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
                                        {viewingItem.answers.map((answer, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center space-x-2"
                                            >
                                                <Badge variant="outline" className="text-xs">
                                                    {index + 1}
                                                </Badge>
                                                <span className="text-sm ">{answer}</span>
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
};
