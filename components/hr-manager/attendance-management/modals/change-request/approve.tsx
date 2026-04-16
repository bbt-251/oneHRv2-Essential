"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, User, Calendar, Clock, Edit, Check, X } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/context/toastContext";
import { approveAttendanceModification } from "@/lib/backend/api/attendance/request-modification";
import { RequestModificationModel } from "@/lib/models/attendance";
import { AttendanceChangeRequest } from "../../page";
import { useAuth } from "@/context/authContext";
import { getTimestamp } from "@/lib/util/dayjs_format";
import { calculateTotalWorkedHours } from "@/lib/backend/functions/calculateDuration";
import { useFirestore } from "@/context/firestore-context";
import { sendNotification } from "@/lib/util/notification/send-notification";
import { getNotificationRecipients } from "@/lib/util/notification/recipients";
import getFullName from "@/lib/util/getEmployeeFullName";

interface HRAttendanceApproveModalProps {
    isOpen: boolean;
    request: AttendanceChangeRequest | null;
    requestData: RequestModificationModel | null;
    onClose: () => void;
}

export function HRAttendanceApproveModal({
    isOpen,
    onClose,
    request,
    requestData,
}: HRAttendanceApproveModalProps) {
    const { userData } = useAuth();
    const [comments, setComments] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { showToast } = useToast();
    const { employees } = useFirestore();

    if (!request) return null;

    const handleApprove = async () => {
        if (!requestData) {
            showToast("No request data to approve", "Error", "error");
        }

        setIsSubmitting(true);

        const res = await approveAttendanceModification({
            ...requestData,
            reviewedBy: userData?.uid ?? null,
            reviewedDate: getTimestamp(),
            hrComments: comments.trim() ? comments : null,
        } as RequestModificationModel);
        if (res) {
            showToast(
                "Attendance change request approved successfully",
                "Approval Successful",
                "success",
                5000,
            );

            const employee = employees.find(e => request.employeeUid);

            // Get recipients: For attendance change approval, notify BOTH employee and their manager
            const validRecipients = getNotificationRecipients(
                employees,
                [request.employeeUid],
                "manager", // This will get the employee + their reporting line manager
            );

            if (validRecipients.length > 0) {
                await sendNotification({
                    users: validRecipients,
                    channels: ["telegram", "inapp"],
                    messageKey: "ATTENDANCE_CHANGE_REQUEST_APPROVED",
                    payload: {
                        employeeName: employee ? getFullName(employee) : "",
                        date: request.date,
                    },
                    getCustomMessage: (recipientType, payload) => {
                        if (recipientType === "manager") {
                            // Message for Managers
                            return {
                                telegram: `${payload.employeeName}'s attendance change request for ${payload.date} has been approved.`,
                                inapp: `${payload.employeeName}'s attendance change request for ${payload.date} has been approved.`,
                                email: {
                                    subject: `Attendance Change Approved for ${payload.employeeName}`,
                                    body: `${payload.employeeName}'s attendance change request for ${payload.date} has been approved.`,
                                },
                            };
                        } else if (recipientType === "employee") {
                            // Message for Employees
                            return {
                                telegram: `Your attendance change request for ${payload.date} has been approved.`,
                                inapp: `Your attendance change request for ${payload.date} has been approved.`,
                                email: {
                                    subject: `Your Attendance Change Request Approved`,
                                    body: `Your attendance change request for ${payload.date} has been approved.`,
                                },
                            };
                        }
                        return {};
                    },
                });
            }
            handleClose();
        } else {
            showToast(
                "Failed to approve attendance change request",
                "Approval Failed",
                "error",
                5000,
            );
        }

        setIsSubmitting(false);
    };

    const handleClose = () => {
        setComments("");
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto dark:bg-black">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <DialogTitle
                            className="text-xl font-semibold text-[#3f3d56] dark:text-white"
                            style={{ fontFamily: "Montserrat, sans-serif" }}
                        >
                            <CheckCircle className="h-5 w-5 inline mr-2 text-green-600" />
                            Approve Attendance Change Request
                        </DialogTitle>
                    </div>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Request Summary */}
                    <Card className="border-0 shadow-sm bg-gradient-to-r from-green-50 to-green-100 dark:bg-black dark:from-green-500">
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3
                                        className="text-lg font-bold text-[#3f3d56] dark:text-white"
                                        style={{
                                            fontFamily: "Montserrat, sans-serif",
                                        }}
                                    >
                                        Attendance Change Request #{request.requestId ?? ""}
                                    </h3>
                                    <p
                                        className="text-sm text-[#3f3d56] opacity-60 dark:text-gray-300"
                                        style={{
                                            fontFamily: "Montserrat, sans-serif",
                                        }}
                                    >
                                        Employee: {request.employeeName} -{" "}
                                        {request.employeeDepartment}
                                    </p>
                                </div>
                                <Badge className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-black dark:text-green-400">
                                    <Edit className="h-3 w-3 mr-1" />
                                    <span
                                        style={{
                                            fontFamily: "Montserrat, sans-serif",
                                        }}
                                    >
                                        Attendance
                                    </span>
                                </Badge>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-[#3f3d56] opacity-60 dark:text-gray-400" />
                                    <div>
                                        <p className="text-xs text-[#3f3d56] opacity-70 dark:text-gray-400">
                                            Employee
                                        </p>
                                        <p className="text-sm font-medium text-[#3f3d56] dark:text-white">
                                            {request.employeeName}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-[#3f3d56] opacity-60 dark:text-gray-400" />
                                    <div>
                                        <p className="text-xs text-[#3f3d56] opacity-70 dark:text-gray-400">
                                            Date
                                        </p>
                                        <p className="text-sm font-medium text-[#3f3d56] dark:text-white">
                                            {request.date}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-[#3f3d56] opacity-60 dark:text-gray-400" />
                                    <div>
                                        <p className="text-xs text-[#3f3d56] opacity-70 dark:text-gray-400">
                                            Old Worked Hours
                                        </p>
                                        <p className="text-sm font-medium text-[#3f3d56] dark:text-white">
                                            {calculateTotalWorkedHours(request.oldValues)}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-[#3f3d56] opacity-60 dark:text-gray-400" />
                                    <div>
                                        <p className="text-xs text-[#3f3d56] opacity-70 dark:text-gray-400">
                                            New Worked Hours
                                        </p>
                                        <p className="text-sm font-medium text-[#3f3d56] dark:text-white">
                                            {calculateTotalWorkedHours(request.newValues)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Change Summary */}
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-red-50 p-3 rounded-lg border border-red-200 dark:bg-black dark:border-red-400">
                                    <p className="text-xs text-[#3f3d56] opacity-70 mb-2 dark:text-gray-300">
                                        Previous Values
                                    </p>
                                    {request.oldValues.length > 0 ? (
                                        <div className="space-y-1">
                                            {request.oldValues.map((entry, index) => (
                                                <div
                                                    key={index}
                                                    className="flex justify-between text-xs dark:text-white"
                                                >
                                                    <span>{entry.type}:</span>
                                                    <span className="font-medium">
                                                        {entry.hour}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-[#3f3d56] opacity-60 dark:text-gray-400">
                                            No previous entries
                                        </p>
                                    )}
                                </div>

                                <div className="bg-green-50 p-3 rounded-lg border border-green-200 dark:bg-black dark:border-green-400">
                                    <p className="text-xs text-[#3f3d56] opacity-70 mb-2 dark:text-gray-300">
                                        Requested Values
                                    </p>
                                    <div className="space-y-1">
                                        {request.newValues.map((entry, index) => (
                                            <div
                                                key={index}
                                                className="flex justify-between text-xs dark:text-white"
                                            >
                                                <span>{entry.type}:</span>
                                                <span className="font-medium">{entry.hour}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Employee Comment */}
                    <Card className="border-0 shadow-sm dark:bg-black">
                        <CardContent className="p-4">
                            <h4 className="text-sm font-medium text-[#3f3d56] mb-2 dark:text-white">
                                Employee Justification
                            </h4>
                            <p className="text-sm text-[#3f3d56] bg-gray-50 p-3 rounded-lg dark:bg-black dark:text-gray-300">
                                {request.comment}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Approval Comments */}
                    <div className="space-y-3">
                        <Label
                            htmlFor="comments"
                            className="text-sm font-medium text-[#3f3d56] dark:text-white"
                        >
                            Approval Comments *
                        </Label>
                        <Textarea
                            id="comments"
                            placeholder="Provide your approval comments and any additional notes..."
                            value={comments}
                            onChange={e => setComments(e.target.value)}
                            className="min-h-[120px] resize-none dark:bg-black dark:text-white"
                        />
                        <p className="text-xs text-[#3f3d56] opacity-60 dark:text-gray-400">
                            Comments are required and will be visible to the employee.
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            variant="outline"
                            onClick={handleClose}
                            disabled={isSubmitting}
                            className="border-gray-200 text-[#3f3d56] hover:bg-gray-50 dark:bg-black dark:text-white dark:border-gray-600"
                        >
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                        </Button>
                        <Button
                            onClick={handleApprove}
                            disabled={isSubmitting || !comments.trim()}
                            className="bg-green-600 hover:bg-green-700 text-white dark:bg-green-700 dark:hover:bg-green-600"
                        >
                            <Check className="h-4 w-4 mr-2" />
                            {isSubmitting ? "Approving..." : "Approve Request"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
