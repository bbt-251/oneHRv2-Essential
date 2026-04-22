"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
    CheckCircle,
    User,
    Calendar,
    Clock,
    DollarSign,
    Check,
    X,
    MoreHorizontal,
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/context/toastContext";
import { calculateDuration } from "@/lib/backend/functions/calculateDuration";
import { updateOvertimeRequest } from "@/lib/backend/api/attendance/overtime-service";
import { batchUpdateEmployee } from "@/lib/backend/api/employee-management/employee-management-service";
import { useAuth } from "@/context/authContext";
import { getTimestamp } from "@/lib/util/dayjs_format";
import { OvertimeRequestModel } from "@/lib/models/overtime-request";
import { useData } from "@/context/app-data-context";
import EmployeesListModal from "@/components/common/modals/employees-list-modal";
import { sendNotification } from "@/lib/util/notification/send-notification";
import { getNotificationRecipients, getEmployeeNames } from "@/lib/util/notification/recipients";

interface HROvertimeApproveModalProps {
    isOpen: boolean;
    onClose: () => void;
    request: OvertimeRequestModel | null;
}

export function HROvertimeApproveModal({ isOpen, onClose, request }: HROvertimeApproveModalProps) {
    const { userData } = useAuth();
    const { employees } = useData();
    const [comments, setComments] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [isEmployeesModalOpen, setIsEmployeesModalOpen] = useState<boolean>(false);
    const { showToast } = useToast();

    if (!request) return null;

    const syncApprovedOvertimeToEmployeeClaims = async () => {
        const targetEmployees = employees.filter(employee =>
            request.employeeUids.includes(employee.uid),
        );

        if (targetEmployees.length === 0) return true;

        const updates = targetEmployees
            .filter(employee => Boolean(employee.id))
            .map(employee => ({
                id: employee.id as string,
                claimedOvertimes: Array.from(
                    new Set([...(employee.claimedOvertimes ?? []), request.id]),
                ),
            }));

        if (updates.length === 0) return false;

        return batchUpdateEmployee(updates);
    };

    const handleApprove = async () => {
        if (!request.id) {
            showToast("No request data to approve", "Error", "error");
        }

        setIsSubmitting(true);

        const res = await updateOvertimeRequest(
            {
                id: request.id,
                status: "approved",
                approvalStage: "completed",
                reviewedBy: userData?.uid ?? null,
                reviewedDate: getTimestamp(),
                hrComments: comments.trim() ? comments : null,
            },
            userData?.uid,
        );

        if (res) {
            const syncClaimResult = await syncApprovedOvertimeToEmployeeClaims();
            if (!syncClaimResult) {
                showToast(
                    "Request approved, but failed to sync OT to payroll claims. Please retry approval sync.",
                    "Sync Warning",
                    "warning",
                    6000,
                );
            }

            // Send notification when OT request is approved
            try {
                const employeeNames = getEmployeeNames(employees, request.employeeUids);

                // Get recipients: For overtime approval, notify the reporting line managers of the employees
                const validRecipients = getNotificationRecipients(
                    employees,
                    request.employeeUids,
                    "manager", // This will get the reporting line managers of the target employees
                );

                if (validRecipients.length > 0) {
                    await sendNotification({
                        users: validRecipients,
                        channels: ["telegram", "inapp"],
                        messageKey: "OT_REQUEST_APPROVED",
                        payload: {
                            employeeName: employeeNames,
                            date: request.overtimeDate,
                        },
                        getCustomMessage: (recipientType, payload) => {
                            if (recipientType === "manager") {
                                // Message for Managers
                                return {
                                    telegram: `HR approved ${payload.employeeName}’s OT request for ${payload.date}.`,
                                    inapp: `HR approved ${payload.employeeName}’s OT request for ${payload.date}.`,
                                    email: {
                                        subject: `OT Request Approved for ${payload.employeeName}`,
                                        body: `HR approved ${payload.employeeName}’s OT request for ${payload.date}.`,
                                    },
                                };
                            } else if (recipientType === "employee") {
                                // Message for Employees
                                return {
                                    telegram: `Your OT request for ${payload.date} has been approved by HR.`,
                                    inapp: `Your OT request for ${payload.date} has been approved by HR.`,
                                    email: {
                                        subject: `Your OT Request Approved`,
                                        body: `Your OT request for ${payload.date} has been approved by HR.`,
                                    },
                                };
                            }
                            return {};
                        },
                    });
                }
            } catch (error) {
                console.error("Failed to send OT approval notification:", {
                    error: error instanceof Error ? error.message : error,
                    requestId: request.id,
                });
            }

            showToast(
                "Overtime request approved successfully",
                "Approval Successful",
                "success",
                5000,
            );
            handleClose();
        } else {
            showToast("Failed to approve overtime request", "Approval Failed", "error", 5000);
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
                            Approve Overtime Request
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
                                        style={{ fontFamily: "Montserrat, sans-serif" }}
                                    >
                                        {request.overtimeId}
                                    </h3>
                                </div>
                                <Badge className="bg-green-100 text-green-800 hover:bg-green-100 dark:bg-black dark:text-green-400">
                                    <DollarSign className="h-3 w-3 mr-1" />
                                    <span style={{ fontFamily: "Montserrat, sans-serif" }}>
                                        Overtime
                                    </span>
                                </Badge>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-[#3f3d56] opacity-60 dark:text-white" />
                                    <div>
                                        <p className="text-xs text-[#3f3d56] opacity-70 dark:text-white">
                                            Date
                                        </p>
                                        <p className="text-sm font-medium text-[#3f3d56] dark:text-white">
                                            {new Date(request.overtimeDate).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-[#3f3d56] opacity-60 dark:text-white" />
                                    <div>
                                        <p className="text-xs text-[#3f3d56] opacity-70 dark:text-white">
                                            Duration
                                        </p>
                                        <p className="text-sm font-medium text-[#3f3d56] dark:text-white">
                                            {calculateDuration(
                                                request.overtimeStartTime,
                                                request.overtimeEndTime,
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 p-3 bg-white rounded-lg border border-green-200 dark:bg-black dark:border-green-400">
                                <p className="text-xs text-[#3f3d56] opacity-70 mb-1 dark:text-gray-300">
                                    Time Range
                                </p>
                                <p className="text-sm font-medium text-[#3f3d56] dark:text-white">
                                    {request.overtimeStartTime} - {request.overtimeEndTime}
                                </p>
                            </div>
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
                            style={{ fontFamily: "Montserrat, sans-serif" }}
                        />
                        <p className="text-xs text-[#3f3d56] opacity-60 dark:text-gray-400">
                            Comments are required and will be visible to the employee and their
                            manager.
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
