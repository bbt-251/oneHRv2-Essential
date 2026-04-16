"use client";

import { useState, useEffect } from "react";
import { InterviewService } from "@/lib/backend/api/interview-service";
import { InterviewModel, InterviewType } from "@/lib/models/interview";
import { useToast } from "@/context/toastContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Search, Plus, Pencil, Trash2, Eye, Calendar, Users } from "lucide-react";
import AddInterviewDialog from "./modals/add-interview-dialog";
import EditInterviewDialog from "./modals/edit-interview-dialog";
import DeleteInterviewDialog from "./modals/delete-interview-dialog";
import ViewInterviewDialog from "./modals/view-interview-dialog";

export default function InterviewsPage() {
    const { showToast } = useToast();
    const [interviews, setInterviews] = useState<InterviewModel[]>([]);
    const [filteredInterviews, setFilteredInterviews] = useState<InterviewModel[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [typeFilter, setTypeFilter] = useState<string>("all");

    // Modal states
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
    const [selectedInterview, setSelectedInterview] = useState<InterviewModel | null>(null);

    useEffect(() => {
        loadInterviews();
    }, []);

    useEffect(() => {
        filterInterviews();
    }, [interviews, searchTerm, typeFilter]);

    const loadInterviews = async () => {
        try {
            setLoading(true);
            const data = await InterviewService.getAllInterviews();
            setInterviews(data);
        } catch (error) {
            console.error("Error loading interviews:", error);
            showToast("Failed to load interviews", "Error", "error");
        } finally {
            setLoading(false);
        }
    };

    const filterInterviews = () => {
        let filtered = [...interviews];

        if (searchTerm) {
            filtered = filtered.filter(
                interview =>
                    interview.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    interview.interviewID.toLowerCase().includes(searchTerm.toLowerCase()),
            );
        }

        if (typeFilter !== "all") {
            filtered = filtered.filter(interview => interview.type === typeFilter);
        }

        setFilteredInterviews(filtered);
    };

    const handleAddInterview = async (interviewData: Omit<InterviewModel, "id">) => {
        try {
            await InterviewService.createInterview(interviewData, "hr-manager", {
                title: "Interview Created",
                description: `Created interview "${interviewData.name}"`,
                module: "Career Development",
            });
            showToast("Interview created successfully", "Success", "success");
            loadInterviews();
            setIsAddDialogOpen(false);
        } catch (error) {
            console.error("Error creating interview:", error);
            showToast("Failed to create interview", "Error", "error");
        }
    };

    const handleEditInterview = async (id: string, updates: Partial<InterviewModel>) => {
        try {
            await InterviewService.updateInterview(id, updates, "hr-manager", {
                title: "Interview Updated",
                description: `Updated interview`,
                module: "Career Development",
            });
            showToast("Interview updated successfully", "Success", "success");
            loadInterviews();
            setIsEditDialogOpen(false);
        } catch (error) {
            console.error("Error updating interview:", error);
            showToast("Failed to update interview", "Error", "error");
        }
    };

    const handleDeleteInterview = async (id: string) => {
        try {
            await InterviewService.deleteInterview(id, "hr-manager", {
                title: "Interview Deleted",
                description: `Deleted interview`,
                module: "Career Development",
            });
            showToast("Interview deleted successfully", "Success", "success");
            loadInterviews();
            setIsDeleteDialogOpen(false);
        } catch (error) {
            console.error("Error deleting interview:", error);
            showToast("Failed to delete interview", "Error", "error");
        }
    };

    const openEditDialog = (interview: InterviewModel) => {
        setSelectedInterview(interview);
        setIsEditDialogOpen(true);
    };

    const openDeleteDialog = (interview: InterviewModel) => {
        setSelectedInterview(interview);
        setIsDeleteDialogOpen(true);
    };

    const openViewDialog = (interview: InterviewModel) => {
        setSelectedInterview(interview);
        setIsViewDialogOpen(true);
    };

    const getTypeBadgeColor = (type: InterviewType) => {
        switch (type) {
            case "Transfer":
                return "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200";
            case "Promotion":
                return "bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200";
            default:
                return "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200";
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-800 mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Loading interviews...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        Interviews
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Manage transfer and promotion interviews
                    </p>
                </div>
                <Button
                    onClick={() => setIsAddDialogOpen(true)}
                    className="bg-brand-800 hover:bg-brand-700 dark:bg-brand-700 dark:hover:bg-brand-600"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Interview
                </Button>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <Input
                                placeholder="Search interviews..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Filter by type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="Transfer">Transfer</SelectItem>
                                <SelectItem value="Promotion">Promotion</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Interviews List */}
            <div className="space-y-4">
                {filteredInterviews.length === 0 ? (
                    <Card>
                        <CardContent className="p-12 text-center">
                            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-gray-100">
                                No interviews found
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                Create your first interview to get started.
                            </p>
                            <Button
                                onClick={() => setIsAddDialogOpen(true)}
                                className="bg-brand-800 hover:bg-brand-700 dark:bg-brand-700 dark:hover:bg-brand-600"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Add Interview
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    filteredInterviews.map(interview => (
                        <Card key={interview.id} className="overflow-hidden">
                            <CardHeader className="pb-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <CardTitle className="text-lg text-gray-900 dark:text-gray-100">
                                                {interview.name}
                                            </CardTitle>
                                            <Badge className={getTypeBadgeColor(interview.type)}>
                                                {interview.type}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                            ID: {interview.interviewID}
                                        </p>
                                        <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="w-4 h-4" />
                                                <span>{interview.creationDate}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Users className="w-4 h-4" />
                                                <span>
                                                    {interview.evaluators.length} Evaluators
                                                </span>
                                            </div>
                                            {interview.processStarted && (
                                                <Badge
                                                    variant="outline"
                                                    className="text-green-600 dark:text-green-400 border-green-600 dark:border-green-400"
                                                >
                                                    In Progress
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => openViewDialog(interview)}
                                        >
                                            <Eye className="w-4 h-4 mr-1" />
                                            View
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => openEditDialog(interview)}
                                        >
                                            <Pencil className="w-4 h-4 mr-1" />
                                            Edit
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950"
                                            onClick={() => openDeleteDialog(interview)}
                                        >
                                            <Trash2 className="w-4 h-4 mr-1" />
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                        </Card>
                    ))
                )}
            </div>

            {/* Dialogs */}
            <AddInterviewDialog
                isOpen={isAddDialogOpen}
                onClose={() => setIsAddDialogOpen(false)}
                onSubmit={handleAddInterview}
            />

            {selectedInterview && (
                <>
                    <EditInterviewDialog
                        isOpen={isEditDialogOpen}
                        onClose={() => setIsEditDialogOpen(false)}
                        interview={selectedInterview}
                        onSubmit={handleEditInterview}
                    />

                    <DeleteInterviewDialog
                        isOpen={isDeleteDialogOpen}
                        onClose={() => setIsDeleteDialogOpen(false)}
                        interview={selectedInterview}
                        onConfirm={() => handleDeleteInterview(selectedInterview.id!)}
                    />

                    <ViewInterviewDialog
                        isOpen={isViewDialogOpen}
                        onClose={() => setIsViewDialogOpen(false)}
                        interview={selectedInterview}
                    />
                </>
            )}
        </div>
    );
}
