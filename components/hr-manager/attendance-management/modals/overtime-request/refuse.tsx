"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
    XCircle,
    User,
    Calendar,
    Clock,
    DollarSign,
    X,
    AlertTriangle,
    MoreHorizontal,
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/context/toastContext";
import { calculateDuration } from "@/lib/util/functions/calculateDuration";
import { AttendanceRepository } from "@/lib/repository/attendance";
import { useAuth } from "@/context/authContext";
import { getTimestamp } from "@/lib/util/dayjs_format";
import { OvertimeRequestModel } from "@/lib/models/overtime-request";
import { useData } from "@/context/app-data-context";
import EmployeesListModal from "@/components/common/modals/employees-list-modal";
import { sendNotification } from "@/lib/util/notification/send-notification";
import { getNotificationRecipients, getEmployeeNames } from "@/lib/util/notification/recipients";

interface HROvertimeRefuseModalProps {
    isOpen: boolean;
    onClose: () => void;
    request: OvertimeRequestModel | null;
}

const FONT = { fontFamily: "Montserrat, sans-serif" };

export function HROvertimeRefuseModal({ isOpen, onClose, request }: HROvertimeRefuseModalProps) {
    const { userData } = useAuth();
    const [reason, setReason] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [isEmployeesModalOpen, setIsEmployeesModalOpen] = useState<boolean>(false);
    const { showToast } = useToast();
    const { employees } = useData();

    if (!request) return null;

    const handleRefuse = async () => {
        if (!reason.trim()) {
            showToast("Please provide a rejection reason", "Validation Error", "error", 3000);
            return;
        }

        setIsSubmitting(true);

        const res = await AttendanceRepository.updateOvertimeRequest(
            {
                id: request.id,
                status: "rejected",
                approvalStage: "completed",
                reviewedBy: userData?.uid ?? null,
                reviewedDate: getTimestamp(),
                hrComments: reason.trim() ? reason : null,
            },
            userData?.uid,
        );
        if (res.success) {
            // Send notification when OT request is rejected
            try {
                const employeeNames = getEmployeeNames(employees, request.employeeUids);

                // Get recipients: For overtime rejection, notify BOTH managers and employees
                const validRecipients = getNotificationRecipients(
                    employees,
                    request.employeeUids,
                    "both", // This will get both managers and employees
                );

                if (validRecipients.length > 0) {
                    await sendNotification({
                        users: validRecipients,
                        channels: ["telegram", "inapp"],
                        messageKey: "OT_REQUEST_REJECTED",
                        payload: {
                            employeeName: employeeNames,
                            date: request.overtimeDate,
                        },
                        getCustomMessage: (recipientType, payload) => {
                            if (recipientType === "manager") {
                                // Message for Managers
                                return {
                                    telegram: `HR rejected ${payload.employeeName}’s OT request for ${payload.date}.`,
                                    inapp: `HR rejected ${payload.employeeName}’s OT request for ${payload.date}.`,
                                    email: {
                                        subject: `OT Request Rejected for ${payload.employeeName}`,
                                        body: `HR rejected ${payload.employeeName}’s OT request for ${payload.date}.`,
                                    },
                                };
                            } else if (recipientType === "employee") {
                                // Message for Employees
                                return {
                                    telegram: `Your OT request for ${payload.date} has been rejected by HR.`,
                                    inapp: `Your OT request for ${payload.date} has been rejected by HR.`,
                                    email: {
                                        subject: `Your OT Request Rejected`,
                                        body: `Your OT request for ${payload.date} has been rejected by HR.`,
                                    },
                                };
                            }
                            return {};
                        },
                    });
                }
            } catch (error) {
                console.error("Failed to send OT rejection notification:", {
                    error: error instanceof Error ? error.message : error,
                    requestId: request.id,
                });
            }

            showToast(
                "Overtime request rejected successfully",
                "Rejection Successful",
                "success",
                5000,
            );
            handleClose();
        } else {
            showToast("Failed to reject overtime request", "Rejection Failed", "error", 5000);
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
                            Reject Overtime Request
                        </DialogTitle>
                    </div>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Warning Alert */}
                    <Card className="border-0 shadow-sm bg-gradient-to-r from-red-50 to-red-100 border-red-200 dark:bg-black dark:border-black dark:from-red-700 dark:border">
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
                                        className="text-sm text-red-700 dark:text-white mt-1"
                                        style={FONT}
                                    >
                                        This action will permanently reject the overtime request.
                                        The employee and their manager will be notified of this
                                        decision.
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
                                        {request.overtimeId}
                                    </h3>
                                </div>
                                <Badge className="bg-red-100 text-red-800 dark:text-white dark:bg-red-800 hover:bg-red-100">
                                    <DollarSign className="h-3 w-3 mr-1" />
                                    <span style={FONT}>Overtime</span>
                                </Badge>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Employees */}
                                <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-[#3f3d56] opacity-60 dark:text-white" />
                                    <div>
                                        <p className="text-xs text-[#3f3d56] opacity-70 dark:text-white">
                                            Employees
                                        </p>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            aria-label="View employees"
                                            onClick={() => setIsEmployeesModalOpen(true)}
                                        >
                                            <MoreHorizontal className="h-4 w-4 text-[#3f3d56] dark:text-white" />
                                        </Button>
                                    </div>
                                </div>
                                {/* Date */}
                                <SummaryItem
                                    icon={
                                        <Calendar className="h-4 w-4 text-[#3f3d56] dark:text-white opacity-60" />
                                    }
                                    label="Date"
                                    value={new Date(request.overtimeDate).toLocaleDateString()}
                                />
                                {/* Duration */}
                                <SummaryItem
                                    icon={
                                        <Clock className="h-4 w-4 text-[#3f3d56] dark:text-white opacity-60" />
                                    }
                                    label="Duration"
                                    value={calculateDuration(
                                        request.overtimeStartTime,
                                        request.overtimeEndTime,
                                    )}
                                />
                            </div>

                            {/* Time Range */}
                            <div className="mt-4 p-3 bg-white rounded-lg border border-red-200 dark:bg-black dark:border">
                                <p
                                    className="text-xs text-[#3f3d56] opacity-70 dark:text-white dark:opacity-70 mb-1"
                                    style={FONT}
                                >
                                    Time Range
                                </p>
                                <p
                                    className="text-sm font-medium text-[#3f3d56] dark:text-white"
                                    style={FONT}
                                >
                                    {request.overtimeStartTime} - {request.overtimeEndTime}
                                </p>
                            </div>
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
                            placeholder="Please provide a clear and professional reason for rejecting this overtime request..."
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            className="min-h-[120px] resize-none"
                            style={FONT}
                        />
                        <p
                            className="text-xs text-[#3f3d56] opacity-60 dark:text-white dark:opacity-60"
                            style={FONT}
                        >
                            This reason will be shared with the employee and their manager. Please
                            be professional and constructive.
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            variant="outline"
                            onClick={handleClose}
                            disabled={isSubmitting}
                            className="border-gray-200 text-[#3f3d56] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800"
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

            {/* Employees Modal */}
            <EmployeesListModal
                open={isEmployeesModalOpen}
                onOpenChange={setIsEmployeesModalOpen}
                employees={employees}
                employeeUids={request.employeeUids}
                title="Employees"
            />
        </Dialog>
    );
}

/* --- Subcomponent --- */
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
                <p
                    className="text-xs text-[#3f3d56] opacity-70 dark:text-white dark:opacity-70"
                    style={FONT}
                >
                    {label}
                </p>
                <p className="text-sm font-medium text-[#3f3d56] dark:text-white" style={FONT}>
                    {value}
                </p>
            </div>
        </div>
    );
}
