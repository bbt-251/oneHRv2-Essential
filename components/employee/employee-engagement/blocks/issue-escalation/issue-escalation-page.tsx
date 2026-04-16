"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Plus,
    Search,
    Edit,
    Eye,
    AlertTriangle,
    Clock,
    CheckCircle,
    XCircle,
    Filter,
    Loader2,
} from "lucide-react";
import { useFirestore } from "@/context/firestore-context";
import { useToast } from "@/context/toastContext";
import { IssueFormModal } from "../../modals/issue-form-modal";
import { IssueViewModal } from "../../modals/issue-view-modal";
import DeleteConfirm from "@/components/hr-manager/core-settings/blocks/delete-confirm";
import {
    createIssue,
    deleteIssue,
    updateIssue,
} from "@/lib/backend/api/employee-engagement/issue/issue-service";
import { IssueModel } from "@/lib/models/Issue";
import { sendNotification } from "@/lib/util/notification/send-notification";
import { useAuth } from "@/context/authContext";
import dayjs from "dayjs";

export function IssueEscalationPage() {
    const { issues, hrSettings, employees } = useFirestore();
    const { showToast } = useToast();
    const { userData } = useAuth();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loadingActions, setLoadingActions] = useState<Record<string, boolean>>({});

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingIssue, setEditingIssue] = useState<IssueModel | null>(null);
    const [viewingIssue, setViewingIssue] = useState<IssueModel | null>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState<string>("all");
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [filterPriority, setFilterPriority] = useState<string>("all");

    const filteredIssues = issues.filter(issue => {
        // Filter by createdBy for employees (non-HR managers)
        const isEmployee =
            userData?.role?.includes("Employee") && !userData?.role?.includes("HR Manager");
        const matchesCreatedBy = issue.createdBy === userData?.uid;

        const matchesSearch =
            issue.issueTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
            issue.issueType.toLowerCase().includes(searchTerm.toLowerCase()) ||
            issue.issueStatus.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesType = filterType === "all" || issue.issueType === filterType;
        const matchesStatus = filterStatus === "all" || issue.issueStatus === filterStatus;
        const matchesPriority = filterPriority === "all" || issue.priority === filterPriority;

        return matchesCreatedBy && matchesSearch && matchesType && matchesStatus && matchesPriority;
    });

    const handleAddIssue = () => {
        setEditingIssue(null);
        setIsModalOpen(true);
    };

    const handleEditIssue = (issue: IssueModel) => {
        setEditingIssue(issue);
        setIsModalOpen(true);
    };

    const handleViewIssue = (issue: IssueModel) => {
        setViewingIssue(issue);
        setIsViewModalOpen(true);
    };

    const handleDeleteIssue = async (issueId: string) => {
        console.log("Deleting issue with ID:", issueId);
        setLoadingActions(prev => ({ ...prev, [`delete-${issueId}`]: true }));
        try {
            await deleteIssue(issueId);
            showToast("issue deleted successfully", "success", "success");
        } catch (error) {
            console.error("Failed to delete issues:", error);
            showToast("Failed to delete issues", "error", "error");
        } finally {
            setLoadingActions(prev => ({ ...prev, [`delete-${issueId}`]: false }));
        }
    };

    const handleSubmitIssue = async (issueData: Omit<IssueModel, "id">) => {
        try {
            // required fields

            if (!issueData.issueTitle.trim()) {
                showToast("Issue Title is required", "error");
                return;
            }
            setIsSubmitting(true);

            if (editingIssue) {
                await updateIssue({ ...issueData, id: editingIssue.id });
                showToast("Issue updated successfully", "success", "success");

                setIsModalOpen(false);
            } else {
                await createIssue(issueData);

                // Send notification to HR Managers when employee escalates an issue
                const hrManagers = employees.filter(emp => emp.role?.includes("HR Manager"));
                if (hrManagers.length > 0) {
                    await sendNotification({
                        users: hrManagers.map(hr => ({
                            uid: hr.uid,
                            email: hr.companyEmail || hr.personalEmail || "",
                            telegramChatID: hr.telegramChatID || "",
                            recipientType: "hr" as const,
                        })),
                        channels: ["inapp", "telegram"],
                        messageKey: "EMPLOYEE_ISSUE_ESCALATION",
                        title: "Employee Issue Escalation",
                        payload: {
                            employeeName: issueData.protectAnonymity
                                ? "Anonymous"
                                : userData?.firstName + " " + userData?.surname || "Employee",
                            issueTitle: issueData.issueTitle,
                            isAnonymous: issueData.protectAnonymity || false,
                        },
                        getCustomMessage: () => ({
                            inapp: issueData.protectAnonymity
                                ? `An issue has been anonymously submitted, for reason : ${issueData.issueTitle}`
                                : `${userData?.firstName + " " + userData?.surname || "Employee"} has submitted an issue, for reason : ${issueData.issueTitle}`,
                            telegram: issueData.protectAnonymity
                                ? `An issue has been anonymously submitted, for reason : ${issueData.issueTitle}`
                                : `${userData?.firstName + " " + userData?.surname || "Employee"} has submitted an issue, for reason : ${issueData.issueTitle}`,
                        }),
                    });
                }

                showToast("Issue created successfully", "success", "success");
                setIsModalOpen(false);
            }
        } catch (error) {
            showToast("Failed to Issue created", "error", "error");
            console.error("Failed to save issues:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAcknowledge = async (issue: IssueModel) => {
        setLoadingActions(prev => ({ ...prev, [`acknowledge-${issue.id}`]: true }));
        try {
            await updateIssue({ id: issue.id, issueStatus: "Acknowledged" });
            showToast("Issue acknowledged successfully", "success", "success");
        } catch (error) {
            showToast("Failed to acknowledge issue", "error", "error");
            console.error("Failed to acknowledge issue:", error);
        } finally {
            setLoadingActions(prev => ({ ...prev, [`acknowledge-${issue.id}`]: false }));
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "Open":
                return <AlertTriangle className="h-4 w-4 text-red-500" />;
            case "In Review":
                return <Clock className="h-4 w-4 text-blue-500" />;
            case "Reviewed":
                return <CheckCircle className="h-4 w-4 text-orange-500" />;
            case "Acknowledged":
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            default:
                return <AlertTriangle className="h-4 w-4 text-gray-500" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "Open":
                return "bg-red-100 text-red-800";
            case "In Review":
                return "bg-blue-100 text-blue-800";
            case "Reviewed":
                return "bg-orange-100 text-orange-800";
            case "Acknowledged":
                return "bg-green-100 text-green-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "Urgent":
                return "bg-red-100 text-red-800";
            case "High":
                return "bg-orange-100 text-orange-800";
            case "Medium":
                return "bg-yellow-100 text-yellow-800";
            case "Low":
                return "bg-green-100 text-green-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    // Filter issues by createdBy for employees
    const isEmployee =
        userData?.role?.includes("Employee") && !userData?.role?.includes("HR Manager");
    const userIssues = isEmployee ? issues.filter(i => i.createdBy === userData?.uid) : issues;

    const stats = {
        total: userIssues.length,
        open: userIssues.filter(i => i.issueStatus === "Open").length,
        inReviewed: userIssues.filter(i => i.issueStatus === "In Review").length,
        reviewed: userIssues.filter(i => i.issueStatus === "Reviewed").length,
    };

    const uniqueTypes = Array.from(new Set(userIssues.map(issue => issue.issueType))).filter(
        Boolean,
    );
    const uniqueStatuses = Array.from(new Set(userIssues.map(issue => issue.issueStatus))).filter(
        Boolean,
    );
    const uniquePriorities = Array.from(new Set(userIssues.map(issue => issue.priority))).filter(
        Boolean,
    );

    return (
        <div className="p-6 space-y-6 min-h-screen">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold ">Issue Escalation</h1>
                    <p className="text-gray-600 mt-1">Manage and track issue escalations</p>
                </div>
                <Button
                    onClick={handleAddIssue}
                    className="bg-[#FFF8E5] hover:bg-[#F5F0D6] text-gray-800 border border-gray-200"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Issue
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">
                            Total Issues
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold ">{stats.total}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">Open</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{stats.open}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">
                            In Review
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{stats.inReviewed}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600">
                            Reviewed
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">{stats.reviewed}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                        placeholder="Search issues..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>

                {/* Filter controls for issue type, status, and priority */}
                <div className="flex items-center space-x-2">
                    <Filter className="h-4 w-4 text-gray-500" />
                    <Select value={filterType} onValueChange={setFilterType}>
                        <SelectTrigger className="w-40">
                            <SelectValue placeholder="All Types" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            {uniqueTypes.map(type => (
                                <SelectItem key={type} value={type}>
                                    {hrSettings.issueTypes.find(issueType => issueType.id === type)
                                        ?.name || type}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="w-40">
                            <SelectValue placeholder="All Statuses" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            {uniqueStatuses.map(status => (
                                <SelectItem key={status} value={status}>
                                    {hrSettings.issueStatus.find(
                                        issueStatus => issueStatus.id === status,
                                    )?.name || status}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={filterPriority} onValueChange={setFilterPriority}>
                        <SelectTrigger className="w-40">
                            <SelectValue placeholder="All Priorities" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Priorities</SelectItem>
                            {uniquePriorities.map(priority => (
                                <SelectItem key={priority} value={priority}>
                                    {hrSettings.priorities.find(prio => prio.id === priority)
                                        ?.name || priority}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Issues Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Issues</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Issue ID</TableHead>
                                <TableHead>Title</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Priority</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredIssues.map(issue => (
                                <TableRow key={issue.id}>
                                    <TableCell className="font-mono text-sm">
                                        {issue.issueID}
                                    </TableCell>
                                    <TableCell className="max-w-xs truncate">
                                        {issue.issueTitle}
                                    </TableCell>
                                    <TableCell>
                                        {hrSettings.issueTypes.find(
                                            type => type.id === issue.issueType,
                                        )?.name || issue.issueType}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center space-x-2">
                                            {getStatusIcon(issue.issueStatus)}
                                            <Badge className={getStatusColor(issue.issueStatus)}>
                                                {hrSettings.issueStatus.find(
                                                    type => type.id === issue.issueStatus,
                                                )?.name || issue.issueStatus}
                                            </Badge>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={getPriorityColor(issue.priority)}>
                                            {hrSettings.priorities.find(
                                                priority => priority.id === issue.priority,
                                            )?.name || issue.priority}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {dayjs(issue.issueCreationDate).format("MMMM DD, YYYY")}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center space-x-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleViewIssue(issue)}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            {/* Edit and Delete only available for Open status */}
                                            {issue.issueStatus === "Open" && (
                                                <>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleEditIssue(issue)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <DeleteConfirm
                                                        onConfirm={() =>
                                                            handleDeleteIssue(issue.id!)
                                                        }
                                                        itemName={`reason for leaving (${issue.issueTitle})`}
                                                    />
                                                </>
                                            )}
                                            {/* Employee Actions */}
                                            {issue.issueStatus === "Reviewed" && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleAcknowledge(issue)}
                                                    disabled={
                                                        loadingActions[`acknowledge-${issue.id}`]
                                                    }
                                                    className="text-green-600 border-green-600 hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {loadingActions[`acknowledge-${issue.id}`] ? (
                                                        <>
                                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                            Acknowledging...
                                                        </>
                                                    ) : (
                                                        "Acknowledge"
                                                    )}
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Modals */}
            <IssueFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSubmitIssue}
                editingIssue={editingIssue}
                isSubmitting={isSubmitting}
            />

            <IssueViewModal
                isOpen={isViewModalOpen}
                onClose={() => setIsViewModalOpen(false)}
                issue={viewingIssue}
                isHRMode={false}
            />
        </div>
    );
}
