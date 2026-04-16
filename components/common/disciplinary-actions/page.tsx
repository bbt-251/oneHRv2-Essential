"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Search,
    Plus,
    Edit,
    Trash2,
    Eye,
    Filter,
    Check,
    X,
    MoreHorizontal,
    MessageSquare,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DisciplinaryActionModal } from "./modals/action-modal";
import { DisciplinaryApprovalModal } from "./modals/approval-modal";
import { AppealApprovalModal } from "./modals/appeal-approval-modal";
import { CommentsModal } from "./modals/comments-modal";
import {
    DisciplinaryActionModel,
    ViolationModel,
    DActionsModel,
} from "@/lib/models/disciplinary-action";
import { useFirestore } from "@/context/firestore-context";
import { useAuth } from "@/context/authContext";
import {
    createDisciplinaryAction,
    updateDisciplinaryAction,
    deleteDisciplinaryAction,
} from "@/lib/backend/api/disciplinary-actions/disciplinary-actions-service";
import { EmployeeModel } from "@/lib/models/employee";
import generateID from "@/lib/util/generateID";
import { DISCIPLINARY_ACTION_LOG_MESSAGES } from "@/lib/log-descriptions/disciplinary-actions";
import { useConfirm } from "@/hooks/use-confirm-dialog";
import { sendNotification } from "@/lib/util/notification/send-notification";

interface DisciplinaryActionsPageProps {
    isHRContext?: boolean;
}

export function DisciplinaryActionsPage({ isHRContext = false }: DisciplinaryActionsPageProps) {
    const { disciplinaryActions: allDisciplinaryActions, employees, hrSettings } = useFirestore();
    const { userData } = useAuth();
    const { confirm, ConfirmDialog } = useConfirm();

    const disciplinaryActions = isHRContext
        ? allDisciplinaryActions
        : allDisciplinaryActions.filter(action => action.createdBy === userData?.uid);
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAction, setEditingAction] = useState<DisciplinaryActionModel | null>(null);
    const [viewingAction, setViewingAction] = useState<DisciplinaryActionModel | null>(null);
    const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
    const [approvingAction, setApprovingAction] = useState<DisciplinaryActionModel | null>(null);
    const [isAppealModalOpen, setIsAppealModalOpen] = useState(false);
    const [appealAction, setAppealAction] = useState<DisciplinaryActionModel | null>(null);
    const [appealModalMode, setAppealModalMode] = useState<"approve" | "reject">("approve");
    const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);
    const [commentsAction, setCommentsAction] = useState<DisciplinaryActionModel | null>(null);

    const filteredActions = disciplinaryActions.filter(action => {
        const employee = employees.find(emp => emp.uid === action.employeeUid);
        const employeeName = employee ? `${employee.firstName} ${employee.surname}` : "";
        const employeeID = employee?.employeeID || "";
        const location = hrSettings.locations.find(loc => loc.id === action.violationLocationId);
        const locationName = location ? location.name : "";
        return (
            employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            employeeID.toLowerCase().includes(searchTerm.toLowerCase()) ||
            locationName.toLowerCase().includes(searchTerm.toLowerCase())
        );
    });
    const handleAddAction = () => {
        setEditingAction(null);
        setViewingAction(null);
        setIsModalOpen(true);
    };

    const handleEditAction = (action: DisciplinaryActionModel) => {
        setEditingAction(action);
        setViewingAction(null);
        setIsModalOpen(true);
    };

    const handleViewAction = (action: DisciplinaryActionModel) => {
        setViewingAction(action);
        setEditingAction(null);
        setIsModalOpen(true);
    };

    const handleDeleteAction = async (id: string) => {
        confirm(
            "Are you sure you want to delete this disciplinary action? This action cannot be undone.",
            async () => {
                const action = disciplinaryActions.find(a => a.id === id);
                await deleteDisciplinaryAction(
                    id,
                    userData?.uid ?? "",
                    DISCIPLINARY_ACTION_LOG_MESSAGES.DELETED({
                        id: id,
                        employeeUid: action?.employeeUid || "",
                        actionID: action?.actionID,
                    }),
                );
            },
        );
    };

    const handleApproveAction = (action: DisciplinaryActionModel) => {
        if (action.status === "Appealed") {
            setAppealAction(action);
            setAppealModalMode("approve");
            setIsAppealModalOpen(true);
        } else {
            setApprovingAction(action);
            setIsApprovalModalOpen(true);
        }
    };

    const handleRejectAppeal = (action: DisciplinaryActionModel) => {
        setAppealAction(action);
        setAppealModalMode("reject");
        setIsAppealModalOpen(true);
    };

    const handleRefuseAction = async (action: DisciplinaryActionModel) => {
        await updateDisciplinaryAction(
            { ...action, approved: false, status: "Rejected", id: action.id! },
            userData?.uid ?? "",
            DISCIPLINARY_ACTION_LOG_MESSAGES.REJECTED({
                id: action.id!,
                employeeUid: action.employeeUid,
                actionID: action.actionID,
            }),
        );
    };

    const handleViewComments = (action: DisciplinaryActionModel) => {
        setCommentsAction(action);
        setIsCommentsModalOpen(true);
    };

    const handleSaveAction = async (action: DisciplinaryActionModel) => {
        if (editingAction) {
            await updateDisciplinaryAction(
                { ...action, id: editingAction.id! },
                userData?.uid ?? "",
                DISCIPLINARY_ACTION_LOG_MESSAGES.UPDATED({
                    id: editingAction.id!,
                    employeeUid: action.employeeUid,
                    status: action.status,
                    occurrenceLevel: action.occurrenceLevel,
                }),
            );
        } else {
            await createDisciplinaryAction(
                {
                    ...action,
                    createdBy: userData?.uid ?? "",
                    actionID: generateID(),
                    timestamp: new Date().toISOString(),
                    status: isHRContext ? "Raised" : "Waiting HR Approval",
                },
                userData?.uid ?? "",
                DISCIPLINARY_ACTION_LOG_MESSAGES.CREATED({
                    employeeUid: action.employeeUid,
                    actionID: generateID(),
                    occurrenceLevel: action.occurrenceLevel,
                    status: isHRContext ? "Raised" : "Waiting HR Approval",
                }),
            );
        }
        setIsModalOpen(false);
        setEditingAction(null);
        setViewingAction(null);
    };

    const handleConfirmApproval = async (
        disciplinaryEntries: { id: string; disciplinaryTypeId: string; comments: string }[],
    ) => {
        if (approvingAction) {
            const newDisciplinaryActions = disciplinaryEntries.map(entry => ({
                id: `DA${Date.now()}_${entry.id}`,
                disciplinaryActionId: entry.disciplinaryTypeId,
                details: entry.comments,
            }));

            await updateDisciplinaryAction(
                {
                    ...approvingAction,
                    approved: true,
                    status: "Approved",
                    disciplinaryActions: [
                        ...(approvingAction.disciplinaryActions || []),
                        ...newDisciplinaryActions,
                    ],
                    id: approvingAction.id!,
                },
                userData?.uid ?? "",
                DISCIPLINARY_ACTION_LOG_MESSAGES.APPROVED({
                    id: approvingAction.id!,
                    employeeUid: approvingAction.employeeUid,
                    actionID: approvingAction.actionID,
                }),
            );

            // Send notification when HR approves DA (isHRContext is true)
            if (isHRContext) {
                const employee = employees.find(emp => emp.uid === approvingAction.employeeUid);
                const manager = employees.find(emp => emp.uid === employee?.reportingLineManager);

                const notificationUsers = [
                    ...(employee
                        ? [
                            {
                                uid: employee.uid,
                                email: employee.companyEmail || employee.personalEmail || "",
                                telegramChatID: employee.telegramChatID || "",
                                recipientType: "employee" as const,
                            },
                        ]
                        : []),
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

                if (notificationUsers.length > 0 && employee) {
                    await sendNotification({
                        users: notificationUsers,
                        channels: ["inapp", "telegram"],
                        messageKey: "HR_DA_APPROVED",
                        payload: {
                            employeeName: employee.firstName + " " + employee.surname,
                        },
                        getCustomMessage: recipientType => {
                            const employeeName = employee.firstName + " " + employee.surname;
                            if (recipientType === "employee") {
                                return {
                                    inapp: `A disciplinary action has been submitted related a violation, please review.`,
                                    telegram: `A disciplinary action has been submitted related a violation, please review.`,
                                };
                            } else {
                                return {
                                    inapp: `The initiated disciplinary action against ${employeeName} has been approved, and the employee has been notified.`,
                                    telegram: `The initiated disciplinary action against ${employeeName} has been approved, and the employee has been notified.`,
                                };
                            }
                        },
                    });
                }
            }
        }
        setApprovingAction(null);
    };

    const handleConfirmAppealApproval = async () => {
        if (appealAction) {
            await updateDisciplinaryAction(
                {
                    ...appealAction,
                    approved: true,
                    status: "Appeal Approved",
                    id: appealAction.id!,
                },
                userData?.uid ?? "",
                DISCIPLINARY_ACTION_LOG_MESSAGES.APPEAL_APPROVED({
                    id: appealAction.id!,
                    employeeUid: appealAction.employeeUid,
                    actionID: appealAction.actionID,
                }),
            );
        }
        setAppealAction(null);
    };

    const handleConfirmRejectAppeal = async () => {
        if (appealAction) {
            await updateDisciplinaryAction(
                {
                    ...appealAction,
                    approved: false,
                    status: "Appeal Refused",
                    id: appealAction.id!,
                },
                userData?.uid ?? "",
                DISCIPLINARY_ACTION_LOG_MESSAGES.APPEAL_REJECTED({
                    id: appealAction.id!,
                    employeeUid: appealAction.employeeUid,
                    actionID: appealAction.actionID,
                }),
            );
        }
        setAppealAction(null);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "Waiting HR Approval":
                return "bg-orange-100 text-orange-800";
            case "Raised":
                return "bg-yellow-100 text-yellow-800";
            case "Approved":
                return "bg-green-100 text-green-800";
            case "Rejected":
                return "bg-red-100 text-red-800";
            case "Appealed":
                return "bg-blue-100 text-blue-800";
            case "Appeal Approved":
                return "bg-purple-100 text-purple-800";
            case "Appeal Refused":
                return "bg-pink-100 text-pink-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    const getStageColor = (stage: string) => {
        return stage === "Open" ? "bg-orange-100 text-orange-800" : "bg-gray-100 text-gray-800";
    };

    const getOccurrenceColor = (level: string) => {
        switch (level) {
            case "First Occurrence":
                return "bg-green-100 text-green-800";
            case "Second Occurrence":
                return "bg-yellow-100 text-yellow-800";
            case "Third Occurrence":
                return "bg-red-100 text-red-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    // Statistics
    const totalActions = disciplinaryActions.length;
    const openActions = disciplinaryActions.filter(a => a.stage === "Open").length;
    const closedActions = disciplinaryActions.filter(a => a.stage === "Closed").length;
    const pendingApproval = disciplinaryActions.filter(
        a => !a.approved && a.stage === "Open",
    ).length;

    return (
        <div className="p-8 space-y-6 bg-gray-50 min-h-screen dark:bg-background">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-foreground">
                        Disciplinary Actions
                    </h1>
                    <p className="text-gray-600 mt-1 dark:text-muted-foreground">
                        Manage employee disciplinary actions and violations
                    </p>
                </div>
                <Button
                    onClick={handleAddAction}
                    className="bg-[#FFF8E5] hover:bg-[#F5F0D6] text-gray-800 border border-gray-200"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Disciplinary Action
                </Button>
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
                                    {totalActions}
                                </p>
                            </div>
                            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Filter className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-muted-foreground">
                                    Open Cases
                                </p>
                                <p className="text-2xl font-bold text-orange-600">{openActions}</p>
                            </div>
                            <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                                <Eye className="h-6 w-6 text-orange-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-muted-foreground">
                                    Closed Cases
                                </p>
                                <p className="text-2xl font-bold text-green-600">{closedActions}</p>
                            </div>
                            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <Edit className="h-6 w-6 text-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-muted-foreground">
                                    Pending Approval
                                </p>
                                <p className="text-2xl font-bold text-purple-600">
                                    {pendingApproval}
                                </p>
                            </div>
                            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                <Plus className="h-6 w-6 text-purple-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search and Filters */}
            <div className="flex gap-4 items-center">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                        placeholder="Search by employee name, ID, or location..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {/* Disciplinary Actions Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Disciplinary Actions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-border">
                                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-muted-foreground">
                                        Action ID
                                    </th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-muted-foreground">
                                        Employee
                                    </th>
                                    {isHRContext && (
                                        <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-muted-foreground">
                                            Created By
                                        </th>
                                    )}
                                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-muted-foreground">
                                        Violation Date
                                    </th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-muted-foreground">
                                        Location
                                    </th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-muted-foreground">
                                        Occurrence
                                    </th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-muted-foreground">
                                        Stage
                                    </th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-muted-foreground">
                                        Status
                                    </th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-muted-foreground">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredActions.map(action => (
                                    <tr
                                        key={action.id}
                                        className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer dark:border-border dark:hover:bg-accent"
                                        onClick={() => handleViewAction(action)}
                                    >
                                        <td className="py-4 px-4 font-medium text-gray-900 dark:text-foreground">
                                            {action.actionID}
                                        </td>
                                        <td className="py-4 px-4">
                                            <div>
                                                <div className="font-medium text-gray-900 dark:text-foreground">
                                                    {(() => {
                                                        const employee = employees.find(
                                                            emp => emp.uid === action.employeeUid,
                                                        );
                                                        return employee
                                                            ? `${employee.firstName} ${employee.surname}`
                                                            : "Unknown Employee";
                                                    })()}
                                                </div>
                                                <div className="text-sm text-gray-500 dark:text-muted-foreground">
                                                    {(() => {
                                                        const employee = employees.find(
                                                            emp => emp.uid === action.employeeUid,
                                                        );
                                                        return employee?.employeeID || "Unknown ID";
                                                    })()}
                                                </div>
                                            </div>
                                        </td>
                                        {isHRContext && (
                                            <td className="py-4 px-4">
                                                <div>
                                                    <div className="font-medium text-gray-900 dark:text-foreground">
                                                        {(() => {
                                                            const creator = employees.find(
                                                                emp => emp.uid === action.createdBy,
                                                            );
                                                            return creator
                                                                ? `${creator.firstName} ${creator.surname}`
                                                                : "Unknown Creator";
                                                        })()}
                                                    </div>
                                                    <div className="text-sm text-gray-500 dark:text-muted-foreground">
                                                        {(() => {
                                                            const creator = employees.find(
                                                                emp => emp.uid === action.createdBy,
                                                            );
                                                            return (
                                                                creator?.employeeID || "Unknown ID"
                                                            );
                                                        })()}
                                                    </div>
                                                </div>
                                            </td>
                                        )}
                                        <td className="py-4 px-4 text-gray-600 dark:text-muted-foreground">
                                            {new Date(
                                                action.violationDateAndTime,
                                            ).toLocaleDateString()}
                                        </td>
                                        <td className="py-4 px-4 text-gray-600 dark:text-muted-foreground">
                                            {(() => {
                                                const location = hrSettings.locations.find(
                                                    loc => loc.id === action.violationLocationId,
                                                );
                                                return location
                                                    ? location.name
                                                    : action.violationLocationId;
                                            })()}
                                        </td>
                                        <td className="py-4 px-4">
                                            <Badge
                                                className={getOccurrenceColor(
                                                    action.occurrenceLevel,
                                                )}
                                            >
                                                {action.occurrenceLevel}
                                            </Badge>
                                        </td>
                                        <td className="py-4 px-4">
                                            <Badge className={getStageColor(action.stage)}>
                                                {action.stage}
                                            </Badge>
                                        </td>
                                        <td className="py-4 px-4">
                                            <Badge className={getStatusColor(action.status)}>
                                                {action.status}
                                            </Badge>
                                        </td>
                                        <td className="py-4 px-4">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0"
                                                        onClick={e => e.stopPropagation()}
                                                    >
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        onClick={e => {
                                                            e.stopPropagation();
                                                            handleViewAction(action);
                                                        }}
                                                    >
                                                        <Eye className="h-4 w-4 mr-2" />
                                                        View Details
                                                    </DropdownMenuItem>
                                                    {action.status !== "Approved" &&
                                                        action.status !== "Rejected" &&
                                                        action.status !==
                                                            "Accepted By Employee" && (
                                                        <DropdownMenuItem
                                                            onClick={e => {
                                                                e.stopPropagation();
                                                                handleEditAction(action);
                                                            }}
                                                        >
                                                            <Edit className="h-4 w-4 mr-2" />
                                                                Edit
                                                        </DropdownMenuItem>
                                                    )}
                                                    {isHRContext &&
                                                        action.status === "Waiting HR Approval" && (
                                                        <>
                                                            <DropdownMenuItem
                                                                onClick={e => {
                                                                    e.stopPropagation();
                                                                    handleApproveAction(action);
                                                                }}
                                                            >
                                                                <Check className="h-4 w-4 mr-2" />
                                                                    Approve Request
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={e => {
                                                                    e.stopPropagation();
                                                                    handleRefuseAction(action);
                                                                }}
                                                            >
                                                                <X className="h-4 w-4 mr-2" />
                                                                    Refuse Request
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}
                                                    {isHRContext &&
                                                        action.status === "Appealed" && (
                                                        <>
                                                            <DropdownMenuItem
                                                                onClick={e => {
                                                                    e.stopPropagation();
                                                                    handleApproveAction(action);
                                                                }}
                                                            >
                                                                <Check className="h-4 w-4 mr-2" />
                                                                    Approve Appeal
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={e => {
                                                                    e.stopPropagation();
                                                                    handleRejectAppeal(action);
                                                                }}
                                                            >
                                                                <X className="h-4 w-4 mr-2" />
                                                                    Refuse Appeal
                                                            </DropdownMenuItem>
                                                        </>
                                                    )}
                                                    <DropdownMenuItem
                                                        onClick={e => {
                                                            e.stopPropagation();
                                                            handleViewComments(action);
                                                        }}
                                                    >
                                                        <MessageSquare className="h-4 w-4 mr-2" />
                                                        See Comments
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={e => {
                                                            e.stopPropagation();
                                                            action.id &&
                                                                handleDeleteAction(action.id);
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Delete
                                                    </DropdownMenuItem>
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

            {/* Modal */}
            <DisciplinaryActionModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingAction(null);
                    setViewingAction(null);
                }}
                onSave={handleSaveAction}
                editingAction={editingAction ?? viewingAction}
                viewOnly={!!viewingAction}
                HRView={isHRContext}
            />

            <DisciplinaryApprovalModal
                isOpen={isApprovalModalOpen}
                onClose={() => {
                    setIsApprovalModalOpen(false);
                    setApprovingAction(null);
                }}
                onApprove={handleConfirmApproval}
                action={approvingAction}
            />

            <CommentsModal
                isOpen={isCommentsModalOpen}
                onClose={() => {
                    setIsCommentsModalOpen(false);
                    setCommentsAction(null);
                }}
                action={commentsAction}
            />

            <AppealApprovalModal
                isOpen={isAppealModalOpen}
                onClose={() => {
                    setIsAppealModalOpen(false);
                    setAppealAction(null);
                }}
                onApprove={handleConfirmAppealApproval}
                onReject={handleConfirmRejectAppeal}
                action={appealAction}
                mode={appealModalMode}
            />

            {ConfirmDialog}
        </div>
    );
}
