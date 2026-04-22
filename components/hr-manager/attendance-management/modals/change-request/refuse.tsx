"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { XCircle, User, Calendar, Clock, Edit, X, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/context/toastContext";
import { RequestModificationModel } from "@/lib/models/attendance";
import { refuseAttendanceModification } from "@/lib/backend/api/attendance/request-modification";
import { AttendanceChangeRequest } from "../../page";
import { useAuth } from "@/context/authContext";
import { getTimestamp } from "@/lib/util/dayjs_format";
import { calculateTotalWorkedHours } from "@/lib/backend/functions/calculateDuration";
import { useData } from "@/context/app-data-context";
import { sendNotification } from "@/lib/util/notification/send-notification";
import { getNotificationRecipients } from "@/lib/util/notification/recipients";
import getFullName from "@/lib/util/getEmployeeFullName";

interface HRAttendanceRefuseModalProps {
    isOpen: boolean;
    request: AttendanceChangeRequest | null;
    requestData: RequestModificationModel | null;
    onClose: () => void;
}

const FONT = { fontFamily: "Montserrat, sans-serif" };

export function HRAttendanceRefuseModal({
    isOpen,
    onClose,
    request,
    requestData,
}: HRAttendanceRefuseModalProps) {
    const { userData } = useAuth();
    const [reason, setReason] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const { showToast } = useToast();
    const { employees } = useData();

    if (!request) return null;

    const handleRefuse = async () => {
        if (!reason.trim()) {
            showToast("Please provide a rejection reason", "Validation Error", "error", 3000);
            return;
        }

        if (!requestData) {
            showToast("No request data to reject", "Error", "error");
            return;
        }

        setIsSubmitting(true);

        const res = await refuseAttendanceModification({
            ...requestData,
            reviewedBy: userData?.uid ?? null,
            reviewedDate: getTimestamp(),
            hrComments: reason,
        } as RequestModificationModel);

        if (res) {
            // Send notification when attendance change request is rejected
            try {
                const employee = employees.find(e => e.uid === request.employeeUid);

                // Get recipients: For attendance change rejection, notify BOTH employee and their manager
                const validRecipients = getNotificationRecipients(
                    employees,
                    [request.employeeUid],
                    "manager", // This will get the employee + their reporting line manager
                );

                if (validRecipients.length > 0) {
                    await sendNotification({
                        users: validRecipients,
                        channels: ["email", "telegram", "inapp"],
                        messageKey: "ATTENDANCE_CHANGE_REFUSED_FOR_MANAGER",
                        payload: {
                            employeeName: employee ? getFullName(employee) : "",
                            date: request.date,
                        },
                        getCustomMessage: recipientType => {
                            if (recipientType === "manager") {
                                // Message for Managers
                                return {
                                    telegram: `${payload.employeeName}'s attendance change request for ${payload.date} has been refused.`,
                                    inapp: `${payload.employeeName}'s attendance change request for ${payload.date} has been refused.`,
                                    email: {
                                        subject: `Attendance Change Rejected for ${payload.employeeName}`,
                                        body: `${payload.employeeName}'s attendance change request for ${payload.date} has been refused.`,
                                    },
                                };
                            } else if (recipientType === "employee") {
                                // Message for Employees
                                return {
                                    telegram: `Your attendance change request for ${payload.date} has been refused.`,
                                    inapp: `Your attendance change request for ${payload.date} has been refused.`,
                                    email: {
                                        subject: `Your Attendance Change Request Refused`,
                                        body: `Your attendance change request for ${payload.date} has been refused.`,
                                    },
                                };
                            }
                            return {};
                        },
                    });
                }
            } catch (error) {
                console.error("Failed to send attendance change rejection notification:", {
                    error: error instanceof Error ? error.message : error,
                });
            }

            showToast(
                "Attendance change request rejected successfully",
                "Rejection Successful",
                "success",
                5000,
            );
            handleClose();
        } else {
            showToast(
                "Failed to reject attendance change request",
                "Rejection Failed",
                "error",
                5000,
            );
        }

        setIsSubmitting(false);
    };

    const handleClose = () => {
        setReason("");
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <DialogTitle
                            className="text-xl font-semibold text-[#3f3d56] dark:text-white"
                            style={FONT}
                        >
                            <XCircle className="h-5 w-5 inline mr-2 text-red-600" />
                            Reject Attendance Change Request
                        </DialogTitle>
                    </div>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Warning Alert */}
                    <Card className="border-0 shadow-sm bg-gradient-to-r from-red-50 to-red-100 border-red-200 dark:bg-black dark:from-red-700">
                        <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-white mt-0.5 flex-shrink-0" />
                                <div>
                                    <h4
                                        className="font-medium text-red-800 dark:text-white"
                                        style={FONT}
                                    >
                                        Rejection Warning
                                    </h4>
                                    <p
                                        className="text-sm text-red-700 mt-1 dark:text-white"
                                        style={FONT}
                                    >
                                        This action will permanently reject the attendance change
                                        request. The employee will be notified of this decision.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Request Summary */}
                    <Card className="border-0 shadow-sm bg-gradient-to-r from-red-50 to-red-100 dark:bg-black dark:from-red-700">
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3
                                        className="text-lg font-bold text-[#3f3d56] dark:text-white"
                                        style={FONT}
                                    >
                                        Attendance Change Request #{request.requestId ?? ""}
                                    </h3>
                                    <p
                                        className="text-sm text-[#3f3d56] dark:text-white opacity-60"
                                        style={FONT}
                                    >
                                        Employee: {request.employeeName} -{" "}
                                        {request.employeeDepartment}
                                    </p>
                                </div>
                                <Badge className="bg-red-100 text-red-800 dark:text-white dark:bg-red-800 hover:bg-red-100">
                                    <Edit className="h-3 w-3 mr-1" />
                                    <span style={FONT}>Attendance</span>
                                </Badge>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Employee */}
                                <SummaryItem
                                    icon={
                                        <User className="h-4 w-4 text-[#3f3d56] dark:text-white opacity-60" />
                                    }
                                    label="Employee"
                                    value={request.employeeName}
                                />

                                {/* Date */}
                                <SummaryItem
                                    icon={
                                        <Calendar className="h-4 w-4 text-[#3f3d56] dark:text-white opacity-60" />
                                    }
                                    label="Date"
                                    value={request.date}
                                />

                                {/* Old Worked Hours */}
                                <SummaryItem
                                    icon={
                                        <Clock className="h-4 w-4 text-[#3f3d56] dark:text-white opacity-60" />
                                    }
                                    label="Old Worked Hours"
                                    value={calculateTotalWorkedHours(request.oldValues)}
                                />

                                {/* New Worked Hours */}
                                <SummaryItem
                                    icon={
                                        <Clock className="h-4 w-4 text-[#3f3d56] dark:text-white opacity-60" />
                                    }
                                    label="New Worked Hours"
                                    value={calculateTotalWorkedHours(request.newValues)}
                                />
                            </div>

                            {/* Change Summary */}
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <ChangeBox
                                    title="Previous Values"
                                    entries={request.oldValues}
                                    color="red"
                                />
                                <ChangeBox
                                    title="Requested Values"
                                    entries={request.newValues}
                                    color="green"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Employee Comment */}
                    <Card className="border-0 shadow-sm">
                        <CardContent className="p-4">
                            <h4
                                className="text-sm font-medium text-[#3f3d56] dark:text-white mb-2"
                                style={FONT}
                            >
                                Employee Justification
                            </h4>
                            <p
                                className="text-sm text-[#3f3d56] dark:text-white bg-gray-50 dark:bg-black dark:border p-3 rounded-lg"
                                style={FONT}
                            >
                                {request.comment}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Rejection Reason */}
                    <div className="space-y-3">
                        <Label
                            htmlFor="reason"
                            className="text-sm font-medium text-[#3f3d56] dark:text-white"
                            style={FONT}
                        >
                            Rejection Reason *
                        </Label>
                        <Textarea
                            id="reason"
                            placeholder="Please provide a clear and professional reason for rejecting this attendance change request..."
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            className="min-h-[120px] resize-none"
                            style={FONT}
                        />
                        <p
                            className="text-xs text-[#3f3d56] dark:text-white opacity-60"
                            style={FONT}
                        >
                            This reason will be shared with the employee. Please be professional and
                            constructive.
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            variant="outline"
                            onClick={handleClose}
                            disabled={isSubmitting}
                            className="border-gray-200 text-[#3f3d56] dark:text-white hover:bg-gray-50"
                            style={FONT}
                        >
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                        </Button>
                        <Button
                            onClick={handleRefuse}
                            disabled={isSubmitting || !reason.trim()}
                            className="bg-red-600 hover:bg-red-700 text-white"
                            style={FONT}
                        >
                            <XCircle className="h-4 w-4 mr-2" />
                            {isSubmitting ? "Rejecting..." : "Reject Request"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

/* --- Small Subcomponents for Cleanliness --- */

function SummaryItem({
    icon,
    label,
    value,
}: {
    icon: React.ReactNode;
    label: string;
    value: string | number;
}) {
    return (
        <div className="flex items-center gap-2">
            {icon}
            <div>
                <p className="text-xs text-[#3f3d56] dark:text-white opacity-70" style={FONT}>
                    {label}
                </p>
                <p className="text-sm font-medium text-[#3f3d56] dark:text-white" style={FONT}>
                    {value}
                </p>
            </div>
        </div>
    );
}

function ChangeBox({
    title,
    entries,
    color,
}: {
    title: string;
    entries: { type: string; hour: string }[];
    color: "red" | "green";
}) {
    const border =
        color === "red"
            ? "border-red-200 bg-red-50 dark:bg-black dark:border"
            : "border-green-200 bg-green-50 dark:bg-black dark:border";

    return (
        <div className={`p-3 rounded-lg border ${border}`}>
            <p className="text-xs text-[#3f3d56] dark:text-white opacity-70 mb-2" style={FONT}>
                {title}
            </p>
            {entries.length > 0 ? (
                <div className="space-y-1">
                    {entries.map((entry, index) => (
                        <div key={index} className="flex justify-between text-xs">
                            <span style={FONT}>{entry.type}:</span>
                            <span className="font-medium" style={FONT}>
                                {entry.hour}
                            </span>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-xs text-[#3f3d56] dark:text-white opacity-60" style={FONT}>
                    No entries
                </p>
            )}
        </div>
    );
}
