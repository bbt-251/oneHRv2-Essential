"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MessageSquare, Check, AlertTriangle, Search, Filter, MoreHorizontal } from "lucide-react";
import { DisciplinaryActionModal } from "@/components/common/disciplinary-actions/modals/action-modal";
import { CommentModal } from "./modals/comment-modal";
import { DisciplinaryActionModel } from "@/lib/models/disciplinary-action";
import { useFirestore } from "@/context/firestore-context";
import { useAuth } from "@/context/authContext";
import { updateDisciplinaryAction } from "@/lib/backend/api/disciplinary-actions/disciplinary-actions-service";
import getFullName from "@/lib/util/getEmployeeFullName";
import { EmployeeModel } from "@/lib/models/employee";
import { DISCIPLINARY_ACTION_LOG_MESSAGES } from "@/lib/log-descriptions/disciplinary-actions";
import { sendNotification } from "@/lib/util/notification/send-notification";

export function EmployeeDisciplinaryActions() {
    const { disciplinaryActions: allDisciplinaryActions, employees } = useFirestore();
    const { userData } = useAuth();
    const actions = allDisciplinaryActions.filter(
        action => action.employeeUid === userData?.uid && action.status !== "Waiting HR Approval",
    );
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedAction, setSelectedAction] = useState<DisciplinaryActionModel | null>(null);
    const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedActionForDetails, setSelectedActionForDetails] =
        useState<DisciplinaryActionModel | null>(null);

    const filteredActions = actions.filter(
        action =>
            action.violations[0]?.violationTypeId
                ?.toLowerCase()
                ?.includes(searchTerm.toLowerCase()) ||
            action.violations[0]?.details?.toLowerCase()?.includes(searchTerm.toLowerCase()) ||
            action.createdBy?.toLowerCase()?.includes(searchTerm.toLowerCase()),
    );

    const handleAddComment = async (actionId: string | undefined, comment: string) => {
        const action = actions.find(a => a.id === actionId);
        if (action) {
            await updateDisciplinaryAction(
                {
                    ...action,
                    employeeComments: [
                        ...action.employeeComments,
                        {
                            id: `C${Date.now()}`,
                            author: "Employee",
                            content: comment,
                            timestamp: new Date().toLocaleString(),
                        },
                    ],
                    id: action.id!,
                },
                userData?.uid ?? "",
                DISCIPLINARY_ACTION_LOG_MESSAGES.COMMENT_ADDED({
                    id: action.id!,
                    employeeUid: action.employeeUid,
                    author: "Employee",
                }),
            );
        }
    };

    const handleStatusChange = async (
        actionId: string | undefined,
        newStatus: "Accepted By Employee" | "Appealed",
    ) => {
        const action = actions.find(a => a.id === actionId);
        if (action) {
            await updateDisciplinaryAction(
                { ...action, status: newStatus, id: action.id! },
                userData?.uid ?? "",
                DISCIPLINARY_ACTION_LOG_MESSAGES.STATUS_CHANGED(newStatus),
            );

            // Send notifications when employee accepts or appeals DA
            const hrManagers = employees.filter(emp => emp.role?.includes("HR Manager"));
            const manager = employees.find(emp => emp.uid === userData?.reportingLineManager);

            const notificationUsers = [
                ...hrManagers.map(hr => ({
                    uid: hr.uid,
                    email: hr.companyEmail || hr.personalEmail || "",
                    telegramChatID: hr.telegramChatID || "",
                    recipientType: "hr" as const,
                })),
                ...(manager
                    ? [
                        {
                            uid: manager.uid,
                            email: manager.companyEmail || manager.personalEmail || "",
                            telegramChatID: manager.telegramChatID || "",
                            recipientType: "manager" as const,
                        },
                    ]
                    : []),
            ];

            if (newStatus === "Accepted By Employee") {
                await sendNotification({
                    users: notificationUsers,
                    channels: ["inapp", "telegram"],
                    messageKey: "EMPLOYEE_DA_ACCEPTED",
                    payload: {
                        employeeName: userData?.firstName + " " + userData?.surname || "Employee",
                    },
                    title: "Employee DA Accepted",
                    getCustomMessage: recipientType => {
                        const employeeName =
                            userData?.firstName + " " + userData?.surname || "Employee";
                        if (recipientType === "hr") {
                            return {
                                inapp: `${employeeName} has approved the disciplinary actions, and the HR Manager has been notified.`,
                                telegram: `${employeeName} has approved the disciplinary actions, and the HR Manager has been notified.`,
                            };
                        } else {
                            return {
                                inapp: `${employeeName} has approved the disciplinary actions, and the manager has been notified.`,
                                telegram: `${employeeName} has approved the disciplinary actions, and the manager has been notified.`,
                            };
                        }
                    },
                });
            } else if (newStatus === "Appealed") {
                await sendNotification({
                    users: notificationUsers,
                    channels: ["inapp", "telegram"],
                    messageKey: "EMPLOYEE_DA_APPEALED",
                    payload: {
                        employeeName: userData?.firstName + " " + userData?.surname || "Employee",
                    },
                    title: "Employee DA Appealed",
                    getCustomMessage: recipientType => {
                        const employeeName =
                            userData?.firstName + " " + userData?.surname || "Employee";
                        return {
                            inapp: `${employeeName} has appealed the disciplinary actions`,
                            telegram: `${employeeName} has appealed the disciplinary actions`,
                        };
                    },
                });
            }
        }
    };

    const handleRowClick = (action: DisciplinaryActionModel) => {
        setSelectedActionForDetails(action);
        setIsDetailsModalOpen(true);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "Waiting HR Approval":
                return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
            case "Raised":
                return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
            case "Accepted By Employee":
                return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
            case "Appealed":
                return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
            case "Appeal Approved":
                return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300";
            case "Appeal Refused":
                return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
            case "Under Review":
                return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300";
            case "Approved":
                return "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300";
            case "Rejected":
                return "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300";
            default:
                return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
        }
    };

    const getOccurrenceLevelColor = (level: string) => {
        switch (level) {
            case "First Occurrence":
                return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
            case "Second Occurrence":
                return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
            case "Third Occurrence":
                return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
            default:
                return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-foreground">
                        My Disciplinary Actions
                    </h1>
                    <p className="text-gray-600 dark:text-muted-foreground mt-1">
                        View and respond to disciplinary actions
                    </p>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-muted-foreground">
                                    Total Actions
                                </p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-foreground">
                                    {actions.length}
                                </p>
                            </div>
                            <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                                <AlertTriangle className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-muted-foreground">
                                    Pending
                                </p>
                                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                                    {actions.filter(a => a.status === "Waiting HR Approval").length}
                                </p>
                            </div>
                            <div className="h-12 w-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
                                <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-300" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-muted-foreground">
                                    Approved
                                </p>
                                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                    {actions.filter(a => a.status === "Approved").length}
                                </p>
                            </div>
                            <div className="h-12 w-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                                <Check className="h-6 w-6 text-green-600 dark:text-green-300" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-muted-foreground">
                                    Appealed
                                </p>
                                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                                    {actions.filter(a => a.status === "Appealed").length}
                                </p>
                            </div>
                            <div className="h-12 w-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                                <AlertTriangle className="h-6 w-6 text-orange-600 dark:text-orange-300" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search and Filter */}
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input
                                placeholder="Search disciplinary actions..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Button variant="outline" size="sm">
                            <Filter className="h-4 w-4 mr-2" />
                            Filter
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Disciplinary Actions Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Disciplinary Actions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-gray-700">
                                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-foreground">
                                        ID
                                    </th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-foreground">
                                        Reported By
                                    </th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-foreground">
                                        Date
                                    </th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-foreground">
                                        Level
                                    </th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-foreground">
                                        Status
                                    </th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-foreground">
                                        Comments
                                    </th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-foreground">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredActions.map(action => (
                                    <tr
                                        key={action.id}
                                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
                                        onClick={() => handleRowClick(action)}
                                    >
                                        <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-foreground">
                                            {action.actionID}
                                        </td>
                                        <td className="py-3 px-4 text-sm text-gray-600 dark:text-muted-foreground">
                                            {getFullName(
                                                employees.find(e => e.uid == action.createdBy) ??
                                                    ({} as EmployeeModel),
                                            )}
                                        </td>
                                        <td className="py-3 px-4 text-sm text-gray-600 dark:text-muted-foreground">
                                            {action.violationDateAndTime}
                                        </td>
                                        <td className="py-3 px-4">
                                            <Badge
                                                className={getOccurrenceLevelColor(
                                                    action.occurrenceLevel,
                                                )}
                                            >
                                                {action.occurrenceLevel}
                                            </Badge>
                                        </td>
                                        <td className="py-3 px-4">
                                            <Badge className={getStatusColor(action.status)}>
                                                {action.status}
                                            </Badge>
                                        </td>
                                        <td className="py-3 px-4 text-sm text-gray-600 dark:text-muted-foreground">
                                            {action.employeeComments.length} comment
                                            {action.employeeComments.length !== 1 ? "s" : ""}
                                        </td>
                                        <td className="py-3 px-4">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0"
                                                        onClick={e => e.stopPropagation()} // Prevent row click when clicking dropdown
                                                    >
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        onClick={e => {
                                                            e.stopPropagation();
                                                            setSelectedAction(action);
                                                            setIsCommentModalOpen(true);
                                                        }}
                                                    >
                                                        <MessageSquare className="h-4 w-4 mr-2" />
                                                        Add Comment
                                                    </DropdownMenuItem>
                                                    {(action.status === "Approved" ||
                                                        action.status === "Raised") && (
                                                        <>
                                                            <DropdownMenuItem
                                                                onClick={e => {
                                                                    e.stopPropagation();
                                                                    handleStatusChange(
                                                                        action.id,
                                                                        "Accepted By Employee",
                                                                    );
                                                                }}
                                                            >
                                                                <Check className="h-4 w-4 mr-2" />
                                                                Accept
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={e => {
                                                                    e.stopPropagation();
                                                                    handleStatusChange(
                                                                        action.id,
                                                                        "Appealed",
                                                                    );
                                                                }}
                                                            >
                                                                <AlertTriangle className="h-4 w-4 mr-2" />
                                                                Appeal
                                                            </DropdownMenuItem>
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

            {/* Comment Modal */}
            <CommentModal
                isOpen={isCommentModalOpen}
                onClose={() => {
                    setIsCommentModalOpen(false);
                    setSelectedAction(null);
                }}
                onSubmit={comment => {
                    if (selectedAction) {
                        handleAddComment(selectedAction.id, comment);
                    }
                    setIsCommentModalOpen(false);
                    setSelectedAction(null);
                }}
                action={selectedAction}
            />

            <DisciplinaryActionModal
                isOpen={isDetailsModalOpen}
                onClose={() => {
                    setIsDetailsModalOpen(false);
                    setSelectedActionForDetails(null);
                }}
                onSave={() => {}} // No save functionality needed for view-only
                editingAction={selectedActionForDetails}
                viewOnly={true}
            />
        </div>
    );
}
