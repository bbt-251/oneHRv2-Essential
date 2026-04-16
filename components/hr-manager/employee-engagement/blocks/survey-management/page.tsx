"use client";

import { useState } from "react";
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Plus,
    Search,
    Edit,
    Trash2,
    CheckCircle,
    XCircle,
    Filter,
    MoreVertical,
    Bell,
} from "lucide-react";
import { useFirestore } from "@/context/firestore-context";
import { SurveyModel } from "@/lib/models/survey";
import {
    createSurvey,
    updateSurvey,
    deleteSurvey,
} from "@/lib/backend/api/employee-engagement/survey/survey-service";
import { useConfirm } from "@/hooks/use-confirm-dialog";
import { SurveyModal } from "./modals/survey-modal";
import { SurveyDetailTabs } from "./surveyDetailTabs";
import { sendNotification } from "@/lib/util/notification/send-notification";
import { isSurveyAssigned } from "../../../../employee/employee-engagement/blocks/survey/survey";
import { useToast } from "@/context/toastContext";
import { rest } from "lodash";
import { EMPLOYEE_ENGAGEMENT_LOG_MESSAGES } from "@/lib/log-descriptions/employee-engagement";
import { useAuth } from "@/context/authContext";

export function SurveyManagement() {
    const { showToast } = useToast();
    const { surveys, employees } = useFirestore();
    const { confirm, ConfirmDialog } = useConfirm();
    const { userData } = useAuth();
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSurvey, setEditingSurvey] = useState<SurveyModel | null>(null);
    const [isViewMode, setIsViewMode] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [detailSurvey, setDetailSurvey] = useState<SurveyModel | null>(null);

    const [targetFilter, setTargetFilter] = useState<string>("all");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [durationMin, setDurationMin] = useState<string>("");
    const [durationMax, setDurationMax] = useState<string>("");
    const [periodStart, setPeriodStart] = useState<string>("");
    const [periodEnd, setPeriodEnd] = useState<string>("");

    const filteredSurveys = surveys.filter(survey => {
        const matchesSearch = survey.surveyTitle.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesTarget =
            targetFilter === "all" ||
            survey.surveyTarget?.includes(targetFilter) ||
            (targetFilter === "All" && survey.surveyTarget?.includes("all"));
        const matchesStatus = statusFilter === "all" || survey.publishStatus === statusFilter;

        const matchesDuration =
            (!durationMin || survey.duration >= Number.parseInt(durationMin)) &&
            (!durationMax || survey.duration <= Number.parseInt(durationMax));

        const matchesPeriod =
            (!periodStart || new Date(survey.startDate) >= new Date(periodStart)) &&
            (!periodEnd || new Date(survey.endDate) <= new Date(periodEnd));

        return matchesSearch && matchesTarget && matchesStatus && matchesDuration && matchesPeriod;
    });

    const clearFilters = () => {
        setTargetFilter("all");
        setStatusFilter("all");
        setDurationMin("");
        setDurationMax("");
        setPeriodStart("");
        setPeriodEnd("");
        setSearchTerm("");
    };

    const handleAddSurvey = () => {
        setEditingSurvey(null);
        setIsViewMode(false);
        setIsModalOpen(true);
    };

    const handleEditSurvey = (survey: SurveyModel) => {
        setEditingSurvey(survey);
        setIsViewMode(false);
        setIsModalOpen(true);
    };

    const handleViewSurvey = (survey: SurveyModel) => {
        setDetailSurvey(survey);
        setIsDetailModalOpen(true);
    };

    const handleDeleteSurvey = (surveyId: string) => {
        confirm(
            "Are you sure you want to delete this survey? This action cannot be undone.",
            async () => {
                await deleteSurvey(
                    surveyId,
                    userData?.uid ?? "",
                    EMPLOYEE_ENGAGEMENT_LOG_MESSAGES.SURVEY_DELETED(
                        surveys.find(s => s.id === surveyId)?.surveyTitle ?? "",
                    ),
                );
            },
        );
    };

    const handlePublishSurvey = async (surveyId: string) => {
        await updateSurvey(
            { id: surveyId, publishStatus: "Published" },
            userData?.uid ?? "",
            EMPLOYEE_ENGAGEMENT_LOG_MESSAGES.SURVEY_PUBLISHED(
                surveys.find(s => s.id === surveyId)?.surveyTitle ?? "",
            ),
        );
    };

    const handleUnpublishSurvey = async (surveyId: string) => {
        await updateSurvey(
            { id: surveyId, publishStatus: "Unpublished" },
            userData?.uid ?? "",
            EMPLOYEE_ENGAGEMENT_LOG_MESSAGES.SURVEY_UNPUBLISHED(
                surveys.find(s => s.id === surveyId)?.surveyTitle ?? "",
            ),
        );
    };

    const handleSaveSurvey = async (surveyData: SurveyModel) => {
        const isPublishing =
            surveyData.publishStatus === "Published" &&
            (!editingSurvey || editingSurvey.publishStatus !== "Published");
        let res = false;
        if (editingSurvey && editingSurvey.id) {
            res = await updateSurvey(
                { ...surveyData, id: editingSurvey.id },
                userData?.uid ?? "",
                EMPLOYEE_ENGAGEMENT_LOG_MESSAGES.SURVEY_UPDATED(surveyData.surveyTitle),
            );
        } else {
            const { id, ...rest } = surveyData;
            console.log(rest);
            res = await createSurvey(
                rest,
                userData?.uid ?? "",
                EMPLOYEE_ENGAGEMENT_LOG_MESSAGES.SURVEY_CREATED(rest.surveyTitle),
            );
        }
        if (res) {
            showToast("Survey saved successfully", "success", "success");
        } else {
            showToast("Failed to save survey", "error", "error");
            return;
        }

        // Send notification when HR publishes a survey
        if (isPublishing) {
            // Filter employees who are assigned to this survey
            const assignedEmployees = employees.filter(employee =>
                isSurveyAssigned(surveyData, employee),
            );

            if (assignedEmployees.length === 0) {
                console.log("No employees assigned to this survey");
            } else {
                // Send notifications to assigned employees
                await sendNotification({
                    users: assignedEmployees.map(employee => ({
                        uid: employee.uid,
                        email: employee.companyEmail || employee.personalEmail || "",
                        telegramChatID: employee.telegramChatID || "",
                        recipientType: "employee" as const,
                    })),
                    channels: ["inapp", "telegram"],
                    messageKey: "SURVEY_PUBLISHED",
                    payload: {
                        surveyTitle: surveyData.surveyTitle,
                    },
                    title: "Survey Published",
                    getCustomMessage: () => ({
                        inapp: `A survey "${surveyData.surveyTitle}" has been published, please take a short to complete`,
                        telegram: `A survey "${surveyData.surveyTitle}" has been published, please take a short to complete`,
                    }),
                });

                console.log(
                    `Survey published notification sent to ${assignedEmployees.length} employees for survey "${surveyData.surveyTitle}"`,
                );
            }
        }

        setIsModalOpen(false);
        setEditingSurvey(null);
        setIsViewMode(false);
    };

    const handleSendReminder = async (survey: SurveyModel) => {
        try {
            // Filter employees who are assigned to this survey
            const assignedEmployees = employees.filter(employee =>
                isSurveyAssigned(survey, employee),
            );

            if (assignedEmployees.length === 0) {
                console.log("No employees assigned to this survey");
                return;
            }

            // Send notifications to assigned employees
            await sendNotification({
                users: assignedEmployees.map(employee => ({
                    uid: employee.uid,
                    email: employee.companyEmail || employee.personalEmail || "",
                    telegramChatID: employee.telegramChatID || "",
                    recipientType: "employee" as const,
                })),
                channels: ["inapp", "telegram"],
                messageKey: "SURVEY_PUBLISHED",
                payload: {
                    surveyTitle: survey.surveyTitle,
                },
                title: "Survey Published",
                getCustomMessage: () => ({
                    inapp: `A survey "${survey.surveyTitle}" has been published, please take a short to complete`,
                    telegram: `A survey "${survey.surveyTitle}" has been published, please take a short to complete`,
                }),
            });

            console.log(
                `Reminder sent to ${assignedEmployees.length} employees for survey "${survey.surveyTitle}"`,
            );
        } catch (error) {
            console.error("Error sending survey reminder:", error);
        }
    };

    const totalSurveys = surveys.length;
    const publishedSurveys = surveys.filter(s => s.publishStatus === "Published").length;
    const unpublishedSurveys = surveys.filter(s => s.publishStatus === "Unpublished").length;
    const activeSurveys = surveys.filter(s => {
        const now = new Date();
        const startDate = new Date(s.startDate);
        const endDate = new Date(s.endDate);
        return now >= startDate && now <= endDate && s.publishStatus === "Published";
    }).length;

    return (
        <div className="p-8 bg-gray-50 min-h-screen dark:bg-background">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-foreground">
                            Survey Management
                        </h1>
                        <p className="text-gray-600 mt-1 dark:text-muted-foreground">
                            Create and manage employee surveys
                        </p>
                    </div>
                    <Button
                        onClick={handleAddSurvey}
                        className="bg-[#FFF8E5] hover:bg-[#F5F0D6] text-gray-800 border border-gray-200"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Survey
                    </Button>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600 dark:text-muted-foreground">
                                Total Surveys
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gray-900 dark:text-foreground">
                                {totalSurveys}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600 dark:text-muted-foreground">
                                Published
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                {publishedSurveys}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600 dark:text-muted-foreground">
                                Unpublished
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-orange-600">
                                {unpublishedSurveys}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-gray-600 dark:text-muted-foreground">
                                Active
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">{activeSurveys}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Search and Filters */}
                <div className="space-y-4">
                    <div className="flex gap-4 items-center flex-wrap">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input
                                placeholder="Search surveys..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        {/* Target Filter */}
                        <Select value={targetFilter} onValueChange={setTargetFilter}>
                            <SelectTrigger className="w-48">
                                <SelectValue placeholder="Filter by Target" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Targets</SelectItem>
                                <SelectItem value="Employees">Employees</SelectItem>
                                <SelectItem value="Department">Department</SelectItem>
                                <SelectItem value="Section">Section</SelectItem>
                                <SelectItem value="Location">Location</SelectItem>
                                <SelectItem value="Managers">Managers</SelectItem>
                                <SelectItem value="Not Managers">Not Managers</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Status Filter */}
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-48">
                                <SelectValue placeholder="Filter by Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="Published">Published</SelectItem>
                                <SelectItem value="Unpublished">Unpublished</SelectItem>
                            </SelectContent>
                        </Select>

                        <Button variant="outline" onClick={clearFilters} size="sm">
                            <Filter className="h-4 w-4 mr-2" />
                            Clear Filters
                        </Button>
                    </div>

                    {/* Duration and Period Range Filters */}
                    <div className="flex gap-4 items-center flex-wrap">
                        {/* Duration Range */}
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-600 dark:text-muted-foreground">
                                Duration:
                            </span>
                            <Input
                                type="number"
                                placeholder="Min"
                                value={durationMin}
                                onChange={e => setDurationMin(e.target.value)}
                                className="w-20"
                                min="0"
                            />
                            <span className="text-gray-400">-</span>
                            <Input
                                type="number"
                                placeholder="Max"
                                value={durationMax}
                                onChange={e => setDurationMax(e.target.value)}
                                className="w-20"
                                min="0"
                            />
                            <span className="text-sm text-gray-500">min(s)</span>
                        </div>

                        {/* Period Range */}
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-600 dark:text-muted-foreground">
                                Period:
                            </span>
                            <Input
                                type="date"
                                value={periodStart}
                                onChange={e => setPeriodStart(e.target.value)}
                                className="w-40"
                            />
                            <span className="text-gray-400">to</span>
                            <Input
                                type="date"
                                value={periodEnd}
                                onChange={e => setPeriodEnd(e.target.value)}
                                className="w-40"
                            />
                        </div>
                    </div>
                </div>

                {/* Surveys Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Surveys</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-muted-foreground">
                                            Title
                                        </th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-muted-foreground">
                                            Target
                                        </th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-muted-foreground">
                                            Status
                                        </th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-muted-foreground">
                                            Duration
                                        </th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-muted-foreground">
                                            Period
                                        </th>
                                        <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-muted-foreground">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredSurveys.map(survey => (
                                        <tr
                                            key={survey.id}
                                            className="border-b hover:bg-gray-50 dark:hover:bg-accent/50 cursor-pointer"
                                            onClick={() => handleViewSurvey(survey)}
                                        >
                                            <td className="py-3 px-4">{survey.surveyTitle}</td>
                                            <td className="py-3 px-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {survey.surveyTarget?.map(target => (
                                                        <Badge
                                                            key={target}
                                                            variant="outline"
                                                            className="text-xs"
                                                        >
                                                            {target === "all"
                                                                ? "All Employees"
                                                                : target === "employees"
                                                                    ? "Employees"
                                                                    : target === "department"
                                                                        ? "Department"
                                                                        : target === "section"
                                                                            ? "Section"
                                                                            : target === "location"
                                                                                ? "Location"
                                                                                : target === "managers"
                                                                                    ? "Managers"
                                                                                    : target ===
                                                                              "not_managers"
                                                                                        ? "Not Managers"
                                                                                        : target === "grade"
                                                                                            ? "Grade"
                                                                                            : target}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <Badge
                                                    variant={
                                                        survey.publishStatus === "Published"
                                                            ? "default"
                                                            : "secondary"
                                                    }
                                                    className={
                                                        survey.publishStatus === "Published"
                                                            ? "bg-green-100 text-green-800"
                                                            : "bg-orange-100 text-orange-800"
                                                    }
                                                >
                                                    {survey.publishStatus}
                                                </Badge>
                                            </td>
                                            <td className="py-3 px-4">{survey.duration} min(s)</td>
                                            <td className="py-3 px-4 text-sm text-gray-600 dark:text-muted-foreground">
                                                {survey.startDate} - {survey.endDate}
                                            </td>
                                            <td className="py-3 px-4">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={e => e.stopPropagation()}
                                                        >
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem
                                                            onClick={e => {
                                                                e.stopPropagation();
                                                                handleEditSurvey(survey);
                                                            }}
                                                        >
                                                            <Edit className="h-4 w-4 mr-2" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={e => {
                                                                e.stopPropagation();
                                                                handleDeleteSurvey(survey.id!);
                                                            }}
                                                            className="text-red-600 focus:text-red-600"
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                        {survey.publishStatus === "Unpublished" ? (
                                                            <DropdownMenuItem
                                                                onClick={e => {
                                                                    e.stopPropagation();
                                                                    handlePublishSurvey(survey.id!);
                                                                }}
                                                                className="text-green-600 focus:text-green-600"
                                                            >
                                                                <CheckCircle className="h-4 w-4 mr-2" />
                                                                Publish
                                                            </DropdownMenuItem>
                                                        ) : (
                                                            <>
                                                                <DropdownMenuItem
                                                                    onClick={e => {
                                                                        e.stopPropagation();
                                                                        handleUnpublishSurvey(
                                                                            survey.id!,
                                                                        );
                                                                    }}
                                                                    className="text-orange-600 focus:text-orange-600"
                                                                >
                                                                    <XCircle className="h-4 w-4 mr-2" />
                                                                    Unpublish
                                                                </DropdownMenuItem>
                                                                {survey.publishStatus ===
                                                                    "Published" && (
                                                                    <DropdownMenuItem
                                                                        onClick={e => {
                                                                            e.stopPropagation();
                                                                            handleSendReminder(
                                                                                survey,
                                                                            );
                                                                        }}
                                                                        className="text-blue-600 focus:text-blue-600"
                                                                    >
                                                                        <Bell className="h-4 w-4 mr-2" />
                                                                        Push Reminder Notification
                                                                    </DropdownMenuItem>
                                                                )}
                                                            </>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Survey Modal */}
                <SurveyModal
                    isOpen={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        setEditingSurvey(null);
                        setIsViewMode(false);
                    }}
                    onSave={handleSaveSurvey}
                    survey={editingSurvey}
                    viewOnly={isViewMode}
                />

                {/* Survey Detail Modal */}
                <SurveyDetailTabs
                    open={isDetailModalOpen}
                    setOpen={setIsDetailModalOpen}
                    data={detailSurvey}
                />

                {/* Confirm Dialog */}
                {ConfirmDialog}
            </div>
        </div>
    );
}
