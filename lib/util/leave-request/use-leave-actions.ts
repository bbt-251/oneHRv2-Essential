// useLeaveActions.ts

import { useAuth } from "@/context/authContext";
import { useData } from "@/context/data-provider";
import { useToast } from "@/context/toastContext";
import { updateAttendance } from "@/lib/backend/api/attendance/attendance-service";
import { updateEmployee } from "@/lib/backend/api/employee-management/employee-management-service";
import {
    getLeaveRequestByIdWithBackend,
    updateLeaveRequestWithBackend,
} from "@/lib/backend/client/leave-client";
import getListOfDays, { months } from "@/lib/backend/functions/getListOfDays";
import { AttendanceModel, DailyAttendance } from "@/lib/models/attendance";
import { EmployeeModel } from "@/lib/models/employee";
import { LeaveCommentModel, LeaveModel } from "@/lib/models/leave";
import { LeaveTypeModel } from "@/lib/models/hr-settings";
import dayjs from "dayjs";
import { useState } from "react";
import { sendNotification } from "../notification/send-notification";

export const useLeaveActions = (
    selectedLeave: LeaveModel,
    setIsLeaveDetailModalOpen: (open: boolean) => void,
) => {
    const { activeEmployees, attendances, ...hrSettings } = useData();
    const { showToast } = useToast();
    const { userData } = useAuth();
    const leaveTypes = hrSettings.leaveTypes;

    const getLeaveTypeName = (positionId: string) =>
        leaveTypes.find(p => p.id === positionId)?.name || "Unknown";

    const [isApproveLoading, setIsApproveLoading] = useState<boolean>(false);
    const [isRefuseLeaveLoading, setIsRefuseLeaveLoading] = useState<boolean>(false);
    const [isAcceptRollbackLoading, setIsAcceptRollbackLoading] = useState<boolean>(false);
    const [isRefuseRollbackLoading, setIsRefuseRollbackLoading] = useState<boolean>(false);

    const handleRefuseLeaveRequest = async (leaveRequestId: string, comment: string) => {
        setIsRefuseLeaveLoading(true);
        try {
            const existingLeave = await getLeaveRequestByIdWithBackend(leaveRequestId);
            if (!existingLeave) {
                showToast("Error", "Leave request not found", "error");
                return;
            }

            const newComment: LeaveCommentModel = {
                by: userData?.employeeID || "",
                date: dayjs().format("MMMM DD, YYYY hh:mm A"),
                comment: comment,
            };
            const updatedComments = existingLeave.comments
                ? [...existingLeave.comments, newComment]
                : [newComment];

            const response = await updateLeaveRequestWithBackend({
                id: leaveRequestId,
                leaveStage: "Refused",
                leaveState: "Closed",
                comments: updatedComments,
            });
            const result = Boolean(response);

            if (result) {
                showToast("Leave Refused", "Leave request has been refused.", "success");
                setIsLeaveDetailModalOpen(false);

                await sendNotification({
                    users: [
                        {
                            uid: userData?.uid || "",
                            email: userData?.personalEmail || "",
                            telegramChatID: userData?.telegramChatID || "",
                        },
                    ],
                    channels: ["telegram", "inapp"],
                    messageKey: "LEAVE_REQUEST_REFUSED",
                    payload: {
                        leaveType: getLeaveTypeName(selectedLeave.leaveType),
                        startDate: selectedLeave.firstDayOfLeave,
                        endDate: selectedLeave.lastDayOfLeave,
                    },
                    title: "Leave Request Refused",
                });
            } else {
                showToast("Error", "Failed to update leave request", "error");
            }
        } catch (error) {
            console.error("Error refusing leave:", error);
            showToast("Error", "An error occurred while refusing the leave", "error");
        } finally {
            setIsRefuseLeaveLoading(false);
        }
    };

    const handleApproveLeave = async (leaveRequest: LeaveModel) => {
        setIsApproveLoading(true);
        try {
            const employee = activeEmployees.find(
                (emp: EmployeeModel) => emp.uid === leaveRequest.employeeID,
            );
            if (!employee) {
                showToast("Error", "Employee not found. Cannot process leave.", "error");
                return;
            }

            const leaveTypeDetails = leaveTypes.find(
                (lt: LeaveTypeModel) => lt.name === leaveRequest.leaveType,
            );
            let leaveAcronym =
                leaveTypeDetails?.acronym ||
                leaveRequest.leaveType
                    .split(" ")
                    .map(word => word[0])
                    .join("")
                    .toUpperCase() ||
                "LV";

            // Half-day attendance markers
            const halfDayMorningAcronym = `${leaveAcronym}-HDM`;
            const halfDayAfternoonAcronym = `${leaveAcronym}-HDA`;

            const listOfDays = getListOfDays(
                dayjs(leaveRequest.firstDayOfLeave),
                dayjs(leaveRequest.lastDayOfLeave),
            );
            const employeeAttendances = attendances.filter(
                (doc: AttendanceModel) => doc.uid === leaveRequest.employeeID,
            );
            const updatedAttendancesMap = new Map<string, AttendanceModel>();

            // Check if this is a half-day leave
            const isHalfDay = !!leaveRequest.halfDayOption;
            const isSameDay = dayjs(leaveRequest.firstDayOfLeave).isSame(
                dayjs(leaveRequest.lastDayOfLeave),
                "day",
            );

            listOfDays.months.forEach(month => {
                const daysInMonth = listOfDays.dates.filter(
                    date => date.month() === months.indexOf(month),
                );
                const originalAttendance = employeeAttendances.find(
                    a => a.month === month && a.year === daysInMonth[0]?.year(),
                );

                if (originalAttendance) {
                    const attendanceToUpdate =
                        updatedAttendancesMap.get(originalAttendance.id) ||
                        JSON.parse(JSON.stringify(originalAttendance));
                    daysInMonth.forEach(d => {
                        const dayAtt = attendanceToUpdate.values.find(
                            (val: DailyAttendance) => val.day === d.date(),
                        );
                        if (dayAtt) {
                            if (isHalfDay && isSameDay) {
                                // Handle half-day attendance marking
                                if (leaveRequest.halfDayOption === "HDM") {
                                    // Half-day Morning: mark morning as leave, afternoon as present
                                    dayAtt.value = halfDayMorningAcronym;
                                    // Note: For half-day morning, we mark the day with HDM but keep afternoon as working
                                    // In this system, we mark the entire day with the half-day code
                                } else if (leaveRequest.halfDayOption === "HDA") {
                                    // Half-day Afternoon: mark afternoon as leave, morning as present
                                    dayAtt.value = halfDayAfternoonAcronym;
                                }
                            } else {
                                // Full day leave
                                dayAtt.value = leaveAcronym;
                            }
                            dayAtt.from = null;
                            dayAtt.to = null;
                            dayAtt.status = "Verified";
                            dayAtt.timestamp = dayjs().format("MMMM DD, YYYY hh:mm A");
                        }
                    });
                    updatedAttendancesMap.set(attendanceToUpdate.id, attendanceToUpdate);
                }
            });

            const updatePromises = Array.from(updatedAttendancesMap.values()).map(att =>
                updateAttendance(att, userData?.uid || ""),
            );
            updatePromises.push(
                updateLeaveRequestWithBackend({
                    id: leaveRequest.id,
                    leaveStage: "Approved",
                    leaveState: "Closed",
                }),
            );
            updatePromises.push(
                updateEmployee({
                    id: employee.id,
                    balanceLeaveDays:
                        (employee.balanceLeaveDays || 0) - leaveRequest.numberOfLeaveDaysRequested,
                }),
            );

            const results = await Promise.all(updatePromises);

            if (results.every(res => res)) {
                showToast(
                    "Leave Approved",
                    "Leave request has been approved and records updated.",
                    "success",
                );
                setIsLeaveDetailModalOpen(false);

                await sendNotification({
                    users: [
                        {
                            uid: userData?.uid || "",
                            email: userData?.personalEmail || "",
                            telegramChatID: userData?.telegramChatID || "",
                        },
                    ],
                    channels: ["telegram", "inapp"],
                    messageKey: "LEAVE_REQUEST_APPROVED",
                    payload: {
                        leaveType: getLeaveTypeName(selectedLeave.leaveType),
                        startDate: selectedLeave.firstDayOfLeave,
                        endDate: selectedLeave.lastDayOfLeave,
                    },
                    title: "Leave Request Approved",
                });
            } else {
                showToast(
                    "Partial Error",
                    "An error occurred. Some records may not have been updated.",
                    "error",
                );
            }
        } catch (error) {
            console.error("Error approving leave:", error);
            showToast("Error", "An unexpected error occurred while approving the leave.", "error");
        } finally {
            setIsApproveLoading(false);
        }
    };

    const handleAcceptRollbackRequest = async (leaveRequest: LeaveModel) => {
        setIsAcceptRollbackLoading(true);
        try {
            const employee = activeEmployees.find(
                (emp: EmployeeModel) => emp.uid === leaveRequest.employeeID,
            );
            if (!employee) {
                showToast("Error", "Employee not found.", "error");
                return;
            }

            const listOfDays = getListOfDays(
                dayjs(leaveRequest.firstDayOfLeave),
                dayjs(leaveRequest.lastDayOfLeave),
            );
            const employeeAttendances = attendances.filter(
                doc => doc.uid === leaveRequest.employeeID,
            );
            const updatedAttendancesMap = new Map<string, AttendanceModel>();

            // Check if this is a half-day leave rollback
            const isHalfDay = !!leaveRequest.halfDayOption;
            const isSameDay = dayjs(leaveRequest.firstDayOfLeave).isSame(
                dayjs(leaveRequest.lastDayOfLeave),
                "day",
            );

            listOfDays.months.forEach(month => {
                const daysInMonth = listOfDays.dates.filter(
                    date => date.month() === months.indexOf(month),
                );
                const originalAttendance = employeeAttendances.find(
                    a => a.month === month && a.year === daysInMonth[0]?.year(),
                );

                if (originalAttendance) {
                    const attendanceToUpdate =
                        updatedAttendancesMap.get(originalAttendance.id) ||
                        JSON.parse(JSON.stringify(originalAttendance));
                    daysInMonth.forEach(d => {
                        const dayAtt = attendanceToUpdate.values.find(
                            (val: DailyAttendance) => val.day === d.date(),
                        );
                        if (dayAtt) {
                            // For half-day, only reset if it matches the half-day code
                            if (isHalfDay && isSameDay && dayAtt.value) {
                                const leaveTypeDetails = leaveTypes.find(
                                    (lt: LeaveTypeModel) => lt.name === leaveRequest.leaveType,
                                );
                                const leaveAcronym =
                                    leaveTypeDetails?.acronym ||
                                    leaveRequest.leaveType
                                        .split(" ")
                                        .map(word => word[0])
                                        .join("")
                                        .toUpperCase() ||
                                    "LV";
                                const halfDayMorningAcronym = `${leaveAcronym}-HDM`;
                                const halfDayAfternoonAcronym = `${leaveAcronym}-HDA`;

                                if (
                                    dayAtt.value === halfDayMorningAcronym ||
                                    dayAtt.value === halfDayAfternoonAcronym
                                ) {
                                    dayAtt.value = null;
                                    dayAtt.from = null;
                                    dayAtt.to = null;
                                    dayAtt.status = "N/A";
                                    dayAtt.timestamp = "N/A";
                                }
                            } else {
                                dayAtt.value = null;
                                dayAtt.from = null;
                                dayAtt.to = null;
                                dayAtt.status = "N/A";
                                dayAtt.timestamp = "N/A";
                            }
                        }
                    });
                    updatedAttendancesMap.set(attendanceToUpdate.id, attendanceToUpdate);
                }
            });

            const updatePromises = Array.from(updatedAttendancesMap.values()).map(att =>
                updateAttendance(att, userData?.uid || ""),
            );
            updatePromises.push(
                updateLeaveRequestWithBackend({
                    id: leaveRequest.id,
                    leaveStage: "Cancelled",
                    leaveState: "Closed",
                    rollbackStatus: "Accepted",
                }),
            );
            updatePromises.push(
                updateEmployee({
                    id: employee.id,
                    balanceLeaveDays:
                        (employee.balanceLeaveDays || 0) + leaveRequest.numberOfLeaveDaysRequested,
                }),
            );

            const results = await Promise.all(updatePromises);
            if (results.every(res => res)) {
                showToast(
                    "Rollback Accepted",
                    "Leave request rolled back and balance updated.",
                    "success",
                );
                setIsLeaveDetailModalOpen(false);

                await sendNotification({
                    users: [
                        {
                            uid: userData?.uid || "",
                            email: userData?.personalEmail || "",
                            telegramChatID: userData?.telegramChatID || "",
                        },
                    ],
                    channels: ["telegram", "inapp"],
                    messageKey: "LEAVE_ROLLBACK_ACCEPTED",
                    payload: {
                        leaveType: getLeaveTypeName(selectedLeave.leaveType),
                        startDate: selectedLeave.firstDayOfLeave,
                        endDate: selectedLeave.lastDayOfLeave,
                    },
                    title: "Leave Rollback Accepted",
                });
            } else {
                showToast("Error", "An error occurred. Not all records were updated.", "error");
            }
        } catch (error) {
            console.error("Error accepting rollback:", error);
            showToast(
                "Error",
                "An unexpected error occurred while accepting the rollback.",
                "error",
            );
        } finally {
            setIsAcceptRollbackLoading(false);
        }
    };

    const handleRefuseRollbackRequest = async (leaveRequestId: string, refuseComment: string) => {
        setIsRefuseRollbackLoading(true);
        try {
            const existingLeave = await getLeaveRequestByIdWithBackend(leaveRequestId);
            if (!existingLeave) {
                showToast("Error", "Leave request not found", "error");
                return;
            }

            const newComment: LeaveCommentModel = {
                by: userData?.employeeID || "",
                date: dayjs().format("MMMM DD, YYYY hh:mm A"),
                comment: refuseComment,
            };
            const updatedComments = existingLeave.comments
                ? [...existingLeave.comments, newComment]
                : [newComment];

            const response = await updateLeaveRequestWithBackend({
                id: leaveRequestId,
                rollbackStatus: "Refused",
                comments: updatedComments,
            });
            const result = Boolean(response);

            if (result) {
                showToast("Rollback Refused", "The leave request will remain active.", "success");
                setIsLeaveDetailModalOpen(false);
                await sendNotification({
                    users: [
                        {
                            uid: userData?.uid || "",
                            email: userData?.personalEmail || "",
                            telegramChatID: userData?.telegramChatID || "",
                        },
                    ],
                    channels: ["telegram", "inapp"],
                    messageKey: "LEAVE_ROLLBACK_REFUSED",
                    payload: {
                        leaveType: getLeaveTypeName(selectedLeave.leaveType),
                        startDate: selectedLeave.firstDayOfLeave,
                        endDate: selectedLeave.lastDayOfLeave,
                    },
                    title: "Leave Rollback Refused",
                });
            } else {
                showToast("Error", "Failed to update the leave request.", "error");
            }
        } catch (error) {
            console.error("Error rejecting rollback request:", error);
            showToast("Error", "An error occurred while rejecting the rollback.", "error");
        } finally {
            setIsRefuseRollbackLoading(false);
        }
    };

    return {
        isApproveLoading,
        isRefuseLeaveLoading,
        isAcceptRollbackLoading,
        isRefuseRollbackLoading,
        handleApproveLeave,
        handleRefuseLeaveRequest,
        handleAcceptRollbackRequest,
        handleRefuseRollbackRequest,
    };
};
