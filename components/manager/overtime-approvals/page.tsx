"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Plus,
    Users,
    Clock,
    Check,
    X,
    CheckCircle,
    XCircle,
    AlertCircle,
    MoreHorizontal,
    MoreVertical,
} from "lucide-react";
import EmployeesListModal from "@/components/common/modals/employees-list-modal";
import { useState, useMemo, useEffect } from "react";
import { OvertimeFilter } from "./blocks/overtime-filter";
import { OvertimeForm } from "./blocks/overtime-form";
import { OvertimeDetailModal } from "./modals/overtime-detail-modal";
import { OvertimeRequestModel } from "@/lib/models/overtime-request";
import {
    createOvertimeRequest,
    deleteOvertimeRequest,
    updateOvertimeRequest,
} from "@/lib/backend/api/attendance/overtime-service";
import { useToast } from "@/context/toastContext";
import { sendNotification } from "@/lib/util/notification/send-notification";
import { getNotificationRecipients, getEmployeeNames } from "@/lib/util/notification/recipients";
import { sendTelegram } from "@/lib/util/notification/channels";
import { useFirestore } from "@/context/firestore-context";
import { useAuth } from "@/context/authContext";
import { EmployeeModel } from "@/lib/models/employee";
import { useTheme } from "@/components/theme-provider";
import { useDelegation } from "@/hooks/use-delegation";
import dayjs from "dayjs";

import { dateFormat } from "@/lib/util/dayjs_format";
import generateID from "@/lib/util/generateID";
import { calculateDuration } from "@/lib/backend/functions/calculateDuration";
import getFullName from "@/lib/util/getEmployeeFullName";
import { getPrimaryOvertimeEmployee } from "@/lib/util/overtime-request-display";
import { Trash2, Undo2 } from "lucide-react";

export function OvertimeApprovals() {
    const { theme } = useTheme();
    const { userData } = useAuth();
    const { showToast } = useToast();
    const { activeEmployees, overtimeRequests: overtimeRequestsData, hrSettings } = useFirestore();
    const { allReportees, delegatedReportees } = useDelegation();
    const overtimeTypes = hrSettings.overtimeTypes;
    const [reportees, setReportees] = useState<EmployeeModel[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isRequestLoading, setIsRequestLoading] = useState(false);

    const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
    const [selectedOvertimeTypes, setSelectedOvertimeTypes] = useState<string[]>([]);
    const [selectedDateFrom, setSelectedDateFrom] = useState("");
    const [selectedDateTo, setSelectedDateTo] = useState("");
    const [selectedTimeFrom, setSelectedTimeFrom] = useState("");
    const [selectedTimeTo, setSelectedTimeTo] = useState("");

    const [selectedRequestForDetail, setSelectedRequestForDetail] =
        useState<OvertimeRequestModel | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    const [overtimeRequests, setOvertimeRequests] = useState<OvertimeRequestModel[]>([]);
    const [isEmployeesModalOpen, setIsEmployeesModalOpen] = useState(false);
    const [employeesModalRequest, setEmployeesModalRequest] = useState<OvertimeRequestModel | null>(
        null,
    );
    const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
    const [confirmAction, setConfirmAction] = useState<{
        type: "delete" | "rollback";
        request: OvertimeRequestModel | null;
    }>({ type: "delete", request: null });

    // Combine own reportees with delegated reportees
    useEffect(() => {
        const ownReportees = activeEmployees.filter(e => userData?.reportees?.includes(e.uid));
        const delegatedEmployees = activeEmployees.filter(e => delegatedReportees.includes(e.uid));
        const combinedReportees = [...ownReportees, ...delegatedEmployees];
        // Remove duplicates
        const uniqueReportees = Array.from(
            new Map(combinedReportees.map(e => [e.uid, e])).values(),
        );
        setReportees(uniqueReportees);
    }, [activeEmployees, userData?.reportees, delegatedReportees]);

    // Show all overtime requests that either:
    // - were submitted by this manager, OR
    // - include any of their reportees (including delegated reportees), OR
    // - include the manager themselves as an employee.
    useEffect(() => {
        const reporteeUids = new Set(reportees.map(r => r.uid));
        const managerUid = userData?.uid;

        const visibleRequests = overtimeRequestsData.filter(ot => {
            const hasReportee = ot.employeeUids.some(uid => reporteeUids.has(uid));
            const includesManager = managerUid ? ot.employeeUids.includes(managerUid) : false;
            const requestedByManager = managerUid ? ot.requestedBy === managerUid : false;
            return requestedByManager || hasReportee || includesManager;
        });

        setOvertimeRequests(visibleRequests);
    }, [overtimeRequestsData, reportees, userData?.uid]);

    const handleFormSubmit = async (formData: any): Promise<boolean> => {
        setIsRequestLoading(true);

        if (!userData) {
            showToast(
                "User is not authenticated, refresh and please try again",
                "User Authentication",
                "warning",
            );
            return false;
        }
        const start = dayjs(formData.overtimeStartTime, "HH:mm");
        const end = dayjs(formData.overtimeEndTime, "HH:mm");

        // Calculate duration handling overnight shifts (e.g., 5:00 PM to 2:00 AM)
        let duration = end.diff(start, "hour", true);
        if (duration < 0) {
            duration += 24; // Add 24 hours for overnight shifts
        }

        const newRequest: Omit<OvertimeRequestModel, "id"> = {
            timestamp: formData.timestamp,
            overtimeId: generateID(),
            overtimeDate: dayjs(formData.overtimeDate).format(dateFormat),
            overtimeStartTime: start.format("hh:mm A"),
            overtimeEndTime: end.format("hh:mm A"),
            overtimeType: formData.overtimeType,
            employeeUids: formData.employees,
            overtimeGoal: formData.overtimeGoal,
            overtimeJustification: formData.overtimeJustification,
            status: "pending",
            requestedBy: userData?.uid ?? "",
            // Manager-created requests are implicitly manager-approved
            // and go straight to HR for approval.
            approvalStage: "hr",
            reviewedBy: null,
            reviewedDate: null,
            hrComments: null,
            duration: duration,
        };

        const res = await createOvertimeRequest(newRequest, userData?.uid || "");

        if (res) {
            // Send notification to HR Manager and Employees when OT request is submitted
            try {
                const employeeNames = getEmployeeNames(
                    activeEmployees,
                    formData.employees as string[],
                );

                // Get manager info for the notification payload
                const manager = activeEmployees.find(
                    emp => emp.uid === userData?.reportingLineManager,
                );

                // Get all recipients (HR Managers and Employees) using the new utility function
                const allRecipients = getNotificationRecipients(
                    activeEmployees,
                    formData.employees as string[],
                    "both", // This will get both HR Managers and target employees
                );

                if (allRecipients.length > 0 && manager) {
                    await sendNotification({
                        users: allRecipients,
                        channels: ["telegram", "inapp"],
                        messageKey: "OT_REQUEST_SUBMITTED",
                        payload: {
                            managerName: `${manager.firstName} ${manager.surname}`,
                            position: manager.employmentPosition || "",
                            department: manager.department || "",
                            employeeName: employeeNames,
                        },
                        title: "Overtime Request Submitted",
                        action: "/hr/attendance-management",
                        getCustomMessage: (recipientType, payload) => {
                            if (recipientType === "hr") {
                                return {
                                    telegram: `HR Manager, ${payload.managerName} (${payload.position}) from ${payload.department} has submitted an overtime request for ${payload.employeeName} waiting your review.`,
                                    inapp: `HR Manager, ${payload.managerName} (${payload.position}) from ${payload.department} has submitted an overtime request for ${payload.employeeName} waiting your review.`,
                                    email: {
                                        subject: `OT Request Submitted by ${payload.managerName}`,
                                        body: `HR Manager, ${payload.managerName} (${payload.position}) from ${payload.department} has submitted an overtime request for ${payload.employeeName} waiting your review.`,
                                    },
                                };
                            } else if (recipientType === "employee") {
                                return {
                                    telegram: `Your line manager has submitted an overtime request for you and is awaiting HR review.`,
                                    inapp: `Your line manager has submitted an overtime request for you and is awaiting HR review.`,
                                    email: {
                                        subject: `Overtime Request Submitted`,
                                        body: `Your line manager has submitted an overtime request for you and is awaiting HR review.`,
                                    },
                                };
                            }
                            return {};
                        },
                    });
                }
            } catch (error) {
                console.error("Failed to send OT request notification:", {
                    error: error instanceof Error ? error.message : error,
                });
            }

            showToast("Request created successfully", "Success", "success");
            setIsFormOpen(false);
            setIsRequestLoading(false);
            return true;
        } else {
            showToast("Something went wrong, please try again", "Error", "error");
            setIsRequestLoading(false);
            return false;
        }
    };

    const handleClearFilters = () => {
        setSelectedEmployees([]);
        setSelectedOvertimeTypes([]);
        setSelectedDateFrom("");
        setSelectedDateTo("");
        setSelectedTimeFrom("");
        setSelectedTimeTo("");
    };

    const handleViewDetails = (request: OvertimeRequestModel) => {
        setSelectedRequestForDetail(request);
        setIsDetailModalOpen(true);
    };

    const handleManagerApprove = async (request: OvertimeRequestModel) => {
        if (!userData?.uid) {
            showToast(
                "User is not authenticated, refresh and please try again",
                "User Authentication",
                "warning",
            );
            return;
        }
        setActionLoadingId(request.id);
        const res = await updateOvertimeRequest(
            {
                id: request.id,
                approvalStage: "hr",
            },
            userData.uid,
        );
        if (!res) {
            showToast(
                "Failed to forward overtime request to HR. Please try again.",
                "Error",
                "error",
            );
        } else {
            showToast("Overtime request forwarded to HR for approval.", "Success", "success");
        }
        setActionLoadingId(null);
    };

    const handleManagerReject = async (request: OvertimeRequestModel) => {
        if (!userData?.uid) {
            showToast(
                "User is not authenticated, refresh and please try again",
                "User Authentication",
                "warning",
            );
            return;
        }
        setActionLoadingId(request.id);
        const res = await updateOvertimeRequest(
            {
                id: request.id,
                status: "rejected",
                approvalStage: "completed",
                employeeUids: request.employeeUids,
                overtimeType: request.overtimeType,
                duration: request.duration,
            },
            userData.uid,
        );
        if (!res) {
            showToast("Failed to reject overtime request. Please try again.", "Error", "error");
        } else {
            showToast("Overtime request rejected.", "Success", "success");
        }
        setActionLoadingId(null);
    };

    const canManagerDelete = (request: OvertimeRequestModel) =>
        request.status === "pending" && request.approvalStage === "manager";

    const canManagerRollback = (request: OvertimeRequestModel) =>
        request.status === "pending" && request.approvalStage === "hr";

    const canManagerApprove = (request: OvertimeRequestModel) =>
        request.status === "pending" && request.approvalStage === "manager";

    const canManagerReject = (request: OvertimeRequestModel) =>
        request.status === "pending" && request.approvalStage === "manager";

    const handleManagerDelete = async (request: OvertimeRequestModel) => {
        if (!userData?.uid) {
            showToast(
                "User is not authenticated, refresh and please try again",
                "User Authentication",
                "warning",
            );
            return;
        }
        setActionLoadingId(request.id);
        const res = await deleteOvertimeRequest(request.id, userData.uid, request.employeeUids);
        if (!res) {
            showToast("Failed to delete overtime request. Please try again.", "Error", "error");
        } else {
            showToast("Overtime request deleted successfully.", "Success", "success");
        }
        setActionLoadingId(null);
    };

    const handleManagerRollback = async (request: OvertimeRequestModel) => {
        if (!userData?.uid) {
            showToast(
                "User is not authenticated, refresh and please try again",
                "User Authentication",
                "warning",
            );
            return;
        }
        setActionLoadingId(request.id);
        const res = await updateOvertimeRequest(
            {
                id: request.id,
                status: "pending",
                approvalStage: "manager",
                reviewedBy: null,
                reviewedDate: null,
                hrComments: null,
            },
            userData.uid,
        );
        if (!res) {
            showToast("Failed to rollback overtime request. Please try again.", "Error", "error");
        } else {
            showToast("Overtime request rolled back to manager review.", "Success", "success");
        }
        setActionLoadingId(null);
    };

    const handleConfirmAction = async () => {
        if (!confirmAction.request) return;
        const request = confirmAction.request;
        const actionType = confirmAction.type;
        setConfirmAction(prev => ({ ...prev, request: null }));
        if (actionType === "delete") {
            await handleManagerDelete(request);
            return;
        }
        await handleManagerRollback(request);
    };

    const filteredRequests = useMemo(() => {
        const getRequestOvertimeDate = (request: OvertimeRequestModel) => {
            const parsedFormattedDate = dayjs(request.overtimeDate, dateFormat, true);
            if (parsedFormattedDate.isValid()) return parsedFormattedDate;

            const parsedLooseDate = dayjs(request.overtimeDate);
            if (parsedLooseDate.isValid()) return parsedLooseDate;

            return null;
        };

        const getSortableRequestTimestamp = (request: OvertimeRequestModel) => {
            const parsedOvertimeDate = getRequestOvertimeDate(request);
            if (parsedOvertimeDate) return parsedOvertimeDate.valueOf();

            const parsedTimestamp = dayjs(request.timestamp);
            if (parsedTimestamp.isValid()) return parsedTimestamp.valueOf();

            return 0;
        };

        return overtimeRequests
            .filter(request => {
                if (
                    selectedEmployees.length > 0 &&
                    !selectedEmployees.some(e => request.employeeUids.includes(e))
                )
                    return false;
                if (
                    selectedOvertimeTypes.length > 0 &&
                    !selectedOvertimeTypes.includes(request.overtimeType)
                )
                    return false;
                const overtimeDate = getRequestOvertimeDate(request);
                if (
                    selectedDateFrom &&
                    overtimeDate &&
                    overtimeDate.isBefore(dayjs(selectedDateFrom), "day")
                )
                    return false;
                if (
                    selectedDateTo &&
                    overtimeDate &&
                    overtimeDate.isAfter(dayjs(selectedDateTo), "day")
                )
                    return false;
                if (
                    selectedTimeFrom &&
                    dayjs(request.overtimeStartTime, "hh:mm A").isBefore(
                        dayjs(selectedTimeFrom, "HH:mm"),
                    )
                )
                    return false;
                if (
                    selectedTimeTo &&
                    dayjs(request.overtimeEndTime, "hh:mm A").isAfter(
                        dayjs(selectedTimeTo, "HH:mm"),
                    )
                )
                    return false;
                return true;
            })
            .sort((a, b) => getSortableRequestTimestamp(b) - getSortableRequestTimestamp(a));
    }, [
        overtimeRequests,
        selectedEmployees,
        selectedOvertimeTypes,
        selectedDateFrom,
        selectedDateTo,
        selectedTimeFrom,
        selectedTimeTo,
    ]);

    const getTextColor = () => (theme === "dark" ? "text-white" : "text-[#3f3d56]");
    const getMutedTextColor = () =>
        theme === "dark" ? "text-slate-400" : "text-[#3f3d56] opacity-70";
    const getCardBg = () => (theme === "dark" ? "bg-gray-900" : "bg-white");

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "approved":
                return (
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        <span>Approved</span>
                    </Badge>
                );
            case "rejected":
                return (
                    <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                        <XCircle className="h-3 w-3 mr-1" />
                        <span>Rejected</span>
                    </Badge>
                );
            case "pending":
                return (
                    <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        <span>Pending</span>
                    </Badge>
                );
            default:
                return (
                    <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
                        <span>Unknown</span>
                    </Badge>
                );
        }
    };

    const getStageBadge = (request: OvertimeRequestModel) => {
        const stage = request.approvalStage ?? "hr";
        if (stage === "manager") {
            return (
                <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                    <span>Manager Review</span>
                </Badge>
            );
        }
        if (stage === "hr") {
            return (
                <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">
                    <span>HR Review</span>
                </Badge>
            );
        }
        return (
            <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">
                <span>Completed</span>
            </Badge>
        );
    };

    return (
        <div
            className={`space-y-6 p-4 min-h-screen ${theme === "dark" ? "bg-black" : "bg-slate-100"}`}
        >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2
                        className={`text-2xl font-bold ${getTextColor()}`}
                        style={{ fontFamily: "Montserrat, sans-serif" }}
                    >
                        Manager Dashboard
                    </h2>
                    <p
                        className={`text-sm ${getMutedTextColor()}`}
                        style={{ fontFamily: "Montserrat, sans-serif" }}
                    >
                        Manage overtime requests for your team
                        {delegatedReportees.length > 0 && (
                            <span className="ml-2 text-blue-600">
                                ({delegatedReportees.length} delegated reportees)
                            </span>
                        )}
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button
                        onClick={() => setIsFormOpen(true)}
                        className="bg-[#3f3d56] hover:bg-[#3f3d56]/90 text-white"
                        style={{ fontFamily: "Montserrat, sans-serif" }}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Submit Overtime Request
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    {
                        title: "Total Requests",
                        icon: Users,
                        value: overtimeRequests.length,
                        subtitle: "This month",
                    },
                    {
                        title: "Pending Approval",
                        icon: AlertCircle,
                        value: overtimeRequests.filter(r => r.status === "pending").length,
                        subtitle: "Awaiting response",
                    },
                    {
                        title: "Approved This Month",
                        icon: CheckCircle,
                        value: overtimeRequests.filter(r => r.status === "approved").length,
                        subtitle: "Successfully approved",
                    },
                    {
                        title: "Filtered Results",
                        icon: Clock,
                        value: filteredRequests.length,
                        subtitle: "Matching filters",
                    },
                ].map(({ title, icon: Icon, value, subtitle }, i) => (
                    <Card key={i} className={`border-0 shadow-sm ${getCardBg()}`}>
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-center">
                                <CardTitle
                                    className={`text-sm font-medium ${getMutedTextColor()}`}
                                    style={{ fontFamily: "Montserrat, sans-serif" }}
                                >
                                    {title}
                                </CardTitle>
                                <div className="w-8 h-8 bg-[#ffe6a7] rounded-lg flex items-center justify-center">
                                    <Icon className="h-4 w-4 text-[#3f3d56]" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div
                                className={`text-3xl font-bold mb-1 ${getTextColor()}`}
                                style={{ fontFamily: "Montserrat, sans-serif" }}
                            >
                                {value}
                            </div>
                            <p
                                className={`text-sm ${getMutedTextColor()}`}
                                style={{ fontFamily: "Montserrat, sans-serif" }}
                            >
                                {subtitle}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <OvertimeFilter
                employees={reportees}
                selectedEmployees={selectedEmployees}
                selectedOvertimeTypes={selectedOvertimeTypes}
                selectedDateFrom={selectedDateFrom}
                selectedDateTo={selectedDateTo}
                selectedTimeFrom={selectedTimeFrom}
                selectedTimeTo={selectedTimeTo}
                overtimeTypes={overtimeTypes}
                onEmployeesChange={setSelectedEmployees}
                onOvertimeTypesChange={setSelectedOvertimeTypes}
                onDateFromChange={setSelectedDateFrom}
                onDateToChange={setSelectedDateTo}
                onTimeFromChange={setSelectedTimeFrom}
                onTimeToChange={setSelectedTimeTo}
                onClearFilters={handleClearFilters}
            />

            {/* Overtime Requests List */}
            <Card className="border-0 shadow-sm bg-white">
                <CardHeader>
                    <CardTitle
                        className="text-lg font-semibold text-[#3f3d56]"
                        style={{ fontFamily: "Montserrat, sans-serif" }}
                    >
                        Overtime Requests
                        {filteredRequests.length !== overtimeRequests.length && (
                            <span className="text-sm font-normal opacity-60 ml-2">
                                ({filteredRequests.length} of {overtimeRequests.length} shown)
                            </span>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {filteredRequests.length > 0 ? (
                        <div className="space-y-4">
                            {filteredRequests.map((request, index) => {
                                const employee = getPrimaryOvertimeEmployee(
                                    request,
                                    activeEmployees,
                                );
                                return (
                                    <Card
                                        key={index}
                                        className="border border-gray-200 cursor-pointer hover:shadow-md transition-shadow duration-200"
                                        onClick={() => handleViewDetails(request)}
                                    >
                                        <CardContent className="p-4">
                                            <div className="flex items-start justify-between mb-4">
                                                <div>
                                                    <h3
                                                        className="font-semibold text-[#3f3d56]"
                                                        style={{
                                                            fontFamily: "Montserrat, sans-serif",
                                                        }}
                                                    >
                                                        {request.overtimeId}
                                                    </h3>
                                                    <p
                                                        className="text-sm text-[#3f3d56] opacity-60"
                                                        style={{
                                                            fontFamily: "Montserrat, sans-serif",
                                                        }}
                                                    >
                                                        Submitted on {request.timestamp}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    {getStatusBadge(request.status)}
                                                    {getStageBadge(request)}
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={e => e.stopPropagation()}
                                                                className="h-8 w-8 p-0"
                                                                style={{
                                                                    fontFamily:
                                                                        "Montserrat, sans-serif",
                                                                }}
                                                            >
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent
                                                            align="end"
                                                            onClick={e => e.stopPropagation()}
                                                        >
                                                            <DropdownMenuItem
                                                                disabled={
                                                                    !canManagerApprove(request) ||
                                                                    actionLoadingId === request.id
                                                                }
                                                                onClick={e => {
                                                                    e.stopPropagation();
                                                                    handleManagerApprove(request);
                                                                }}
                                                                className="cursor-pointer hover:bg-gray-100 focus:bg-gray-100 dark:hover:bg-gray-800 dark:focus:bg-gray-800 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50"
                                                            >
                                                                <Check className="h-4 w-4 mr-2 text-green-600" />
                                                                Approve
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                disabled={
                                                                    !canManagerReject(request) ||
                                                                    actionLoadingId === request.id
                                                                }
                                                                onClick={e => {
                                                                    e.stopPropagation();
                                                                    handleManagerReject(request);
                                                                }}
                                                                className="cursor-pointer hover:bg-gray-100 focus:bg-gray-100 dark:hover:bg-gray-800 dark:focus:bg-gray-800 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50"
                                                            >
                                                                <X className="h-4 w-4 mr-2 text-red-600" />
                                                                Reject
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                disabled={
                                                                    !canManagerRollback(request) ||
                                                                    actionLoadingId === request.id
                                                                }
                                                                onClick={e => {
                                                                    e.stopPropagation();
                                                                    setConfirmAction({
                                                                        type: "rollback",
                                                                        request,
                                                                    });
                                                                }}
                                                                className="cursor-pointer hover:bg-gray-100 focus:bg-gray-100 dark:hover:bg-gray-800 dark:focus:bg-gray-800 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50"
                                                            >
                                                                <Undo2 className="h-4 w-4 mr-2" />
                                                                Rollback
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                disabled={
                                                                    !canManagerDelete(request) ||
                                                                    actionLoadingId === request.id
                                                                }
                                                                onClick={e => {
                                                                    e.stopPropagation();
                                                                    setConfirmAction({
                                                                        type: "delete",
                                                                        request,
                                                                    });
                                                                }}
                                                                className="text-red-600 cursor-pointer hover:bg-red-50 focus:bg-red-50 dark:hover:bg-red-900/30 dark:focus:bg-red-900/30 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50"
                                                            >
                                                                <Trash2 className="h-4 w-4 mr-2" />
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                                <div>
                                                    <div className="flex items-center gap-1">
                                                        <p
                                                            className="text-sm font-medium text-[#3f3d56] opacity-70"
                                                            style={{
                                                                fontFamily:
                                                                    "Montserrat, sans-serif",
                                                            }}
                                                        >
                                                            Employee
                                                        </p>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 shrink-0"
                                                            aria-label="View all employees on this request"
                                                            onClick={e => {
                                                                e.stopPropagation();
                                                                setEmployeesModalRequest(request);
                                                                setIsEmployeesModalOpen(true);
                                                            }}
                                                        >
                                                            <MoreHorizontal className="h-5 w-5 text-[#3f3d56]" />
                                                        </Button>
                                                    </div>
                                                    <p
                                                        className="text-[#3f3d56]"
                                                        style={{
                                                            fontFamily: "Montserrat, sans-serif",
                                                        }}
                                                    >
                                                        {employee ? getFullName(employee) : "—"}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p
                                                        className="text-sm font-medium text-[#3f3d56] opacity-70"
                                                        style={{
                                                            fontFamily: "Montserrat, sans-serif",
                                                        }}
                                                    >
                                                        Date & Duration
                                                    </p>
                                                    <p
                                                        className="text-[#3f3d56]"
                                                        style={{
                                                            fontFamily: "Montserrat, sans-serif",
                                                        }}
                                                    >
                                                        {request.overtimeDate}
                                                    </p>
                                                    <p
                                                        className="text-sm text-[#3f3d56] opacity-60"
                                                        style={{
                                                            fontFamily: "Montserrat, sans-serif",
                                                        }}
                                                    >
                                                        {calculateDuration(
                                                            request.overtimeStartTime,
                                                            request.overtimeEndTime,
                                                        )}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p
                                                        className="text-sm font-medium text-[#3f3d56] opacity-70"
                                                        style={{
                                                            fontFamily: "Montserrat, sans-serif",
                                                        }}
                                                    >
                                                        Time Period
                                                    </p>
                                                    <p
                                                        className="text-[#3f3d56]"
                                                        style={{
                                                            fontFamily: "Montserrat, sans-serif",
                                                        }}
                                                    >
                                                        {request.overtimeStartTime} -{" "}
                                                        {request.overtimeEndTime}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p
                                                        className="text-sm font-medium text-[#3f3d56] opacity-70"
                                                        style={{
                                                            fontFamily: "Montserrat, sans-serif",
                                                        }}
                                                    >
                                                        Type
                                                    </p>
                                                    <p
                                                        className="text-[#3f3d56]"
                                                        style={{
                                                            fontFamily: "Montserrat, sans-serif",
                                                        }}
                                                    >
                                                        {overtimeTypes.find(
                                                            ot => ot.id == request.overtimeType,
                                                        )?.overtimeType ?? ""}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <div>
                                                    <p
                                                        className="text-sm font-medium text-[#3f3d56] opacity-70 mb-1"
                                                        style={{
                                                            fontFamily: "Montserrat, sans-serif",
                                                        }}
                                                    >
                                                        Overtime Goal
                                                    </p>
                                                    <p
                                                        className="text-sm text-[#3f3d56] bg-gray-50 p-3 rounded-lg"
                                                        style={{
                                                            fontFamily: "Montserrat, sans-serif",
                                                        }}
                                                    >
                                                        {request.overtimeGoal}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p
                                                        className="text-sm font-medium text-[#3f3d56] opacity-70 mb-1"
                                                        style={{
                                                            fontFamily: "Montserrat, sans-serif",
                                                        }}
                                                    >
                                                        Justification
                                                    </p>
                                                    <p
                                                        className="text-sm text-[#3f3d56] bg-gray-50 p-3 rounded-lg"
                                                        style={{
                                                            fontFamily: "Montserrat, sans-serif",
                                                        }}
                                                    >
                                                        {request.overtimeJustification}
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                            <p
                                className="text-[#3f3d56] opacity-60"
                                style={{ fontFamily: "Montserrat, sans-serif" }}
                            >
                                {overtimeRequests.length === 0
                                    ? "No overtime requests submitted yet"
                                    : "No requests match the current filters"}
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <OvertimeForm
                reportees={reportees}
                isOpen={isFormOpen}
                isRequestLoading={isRequestLoading}
                overtimeTypes={overtimeTypes}
                onClose={() => setIsFormOpen(false)}
                onSubmit={handleFormSubmit}
            />

            {/* Employees Modal */}
            <EmployeesListModal
                open={isEmployeesModalOpen}
                onOpenChange={open => {
                    if (!open) {
                        setIsEmployeesModalOpen(false);
                        setEmployeesModalRequest(null);
                    } else {
                        setIsEmployeesModalOpen(true);
                    }
                }}
                employees={activeEmployees}
                employeeUids={employeesModalRequest?.employeeUids ?? []}
                title="Employee"
            />

            <OvertimeDetailModal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                request={selectedRequestForDetail as any}
                overtimeTypes={overtimeTypes}
            />

            <AlertDialog
                open={!!confirmAction.request}
                onOpenChange={open => {
                    if (!open) {
                        setConfirmAction(prev => ({ ...prev, request: null }));
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {confirmAction.type === "delete"
                                ? "Delete Overtime Request"
                                : "Rollback Overtime Request"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {confirmAction.type === "delete"
                                ? "Delete this overtime request? This action cannot be undone."
                                : "Rollback this overtime request to manager review?"}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel
                            disabled={
                                !!confirmAction.request &&
                                actionLoadingId === confirmAction.request.id
                            }
                        >
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmAction}
                            disabled={
                                !!confirmAction.request &&
                                actionLoadingId === confirmAction.request.id
                            }
                            className={
                                confirmAction.type === "delete" ? "bg-red-600 hover:bg-red-700" : ""
                            }
                        >
                            {confirmAction.type === "delete" ? "Delete" : "Rollback"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
