"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/context/toastContext";
import { useFirestore } from "@/context/firestore-context";
import { useAuth } from "@/context/authContext";
import {
    createLeaveManagement,
    updateLeaveManagement,
} from "@/lib/backend/api/employee-management/leave-management-service";
import { EMPLOYEE_MANAGEMENT_LOG_MESSAGES } from "@/lib/log-descriptions/employee-management";
import { uploadLeaveAttachment } from "@/lib/backend/firebase/upload/uploadLeaveAttachment";
import { LeaveModel } from "@/lib/models/leave";
import { getTimestamp } from "@/lib/util/dayjs_format";
import dayjs from "dayjs";
import { sendNotification } from "../notification/send-notification";

export interface LeaveRequestFormData {
    id: string;
    leaveType: string;
    firstDayOfLeave: string;
    lastDayOfLeave: string;
    dateOfReturn: string;
    numberOfLeaveDaysRequested: number;
    reason: string;
    standIn: string;
    authorizedDays: string;
    onBehalf: boolean;
    employee: string;
    attachments: File[];
    halfDayOption: "HDM" | "HDA" | null;
}

interface useLeaveRequestFormProps {
    initialData?: LeaveModel | null;
    isEditing?: boolean;
    onSuccess?: () => void;
    onOpenChange: (open: boolean) => void;
}

export const useLeaveRequestForm = ({
    initialData = null,
    isEditing = false,
    onSuccess = () => {},
    onOpenChange,
}: useLeaveRequestFormProps) => {
    const { showToast } = useToast();
    const { activeEmployees, hrSettings } = useFirestore();
    const { user, userData } = useAuth();

    const getLeaveTypeName = (positionId: string) =>
        hrSettings.leaveTypes.find(p => p.id === positionId)?.name || "Unknown";

    const manager = activeEmployees.find(emp => emp.uid === userData?.reportingLineManager);

    const [requestId] = useState(() =>
        isEditing && initialData
            ? initialData.leaveRequestID
            : `LR-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    );
    const availableBalance = userData?.balanceLeaveDays || 0;

    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [formData, setFormData] = useState<LeaveRequestFormData>({
        id: initialData?.id || "",
        leaveType: initialData?.leaveType || "",
        firstDayOfLeave: initialData?.firstDayOfLeave || "",
        lastDayOfLeave: initialData?.lastDayOfLeave || "",
        dateOfReturn: initialData?.dateOfReturn || "",
        numberOfLeaveDaysRequested: initialData?.numberOfLeaveDaysRequested || 0,
        reason: initialData?.reason || "",
        standIn: initialData?.standIn || "",
        authorizedDays: initialData?.authorizedDays || "",
        onBehalf: !!initialData?.requestedFor,
        employee: initialData?.requestedFor || "",
        attachments: [],
        halfDayOption: initialData?.halfDayOption || null,
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const currentEmployee = activeEmployees.find(emp => emp.id === user?.uid);

    useEffect(() => {
        if (initialData) {
            setFormData({
                id: initialData.id,
                leaveType: initialData.leaveType,
                firstDayOfLeave: initialData.firstDayOfLeave,
                lastDayOfLeave: initialData.lastDayOfLeave,
                dateOfReturn: initialData.dateOfReturn,
                numberOfLeaveDaysRequested: initialData.numberOfLeaveDaysRequested,
                reason: initialData.reason || "",
                standIn: initialData.standIn || "",
                authorizedDays: initialData.authorizedDays || "",
                onBehalf: !!initialData.requestedFor,
                employee: initialData.requestedFor || "",
                attachments: [],
                halfDayOption: initialData.halfDayOption || null,
            });
        }
    }, [initialData]);

    const authorizedDays = hrSettings.leaveTypes.find(
        leaveType => leaveType.id === formData.leaveType,
    )?.authorizedDays;

    useEffect(() => {
        if (formData.firstDayOfLeave && formData.lastDayOfLeave) {
            const start = dayjs(formData.firstDayOfLeave);
            const end = dayjs(formData.lastDayOfLeave);

            if (end.isBefore(start)) {
                setFormData(prev => ({
                    ...prev,
                    dateOfReturn: "",
                    numberOfLeaveDaysRequested: 0,
                    halfDayOption: null,
                }));
                return;
            }

            const employeeForLeaveId = formData.onBehalf ? formData.employee : user?.uid;
            const employee = activeEmployees.find(emp => emp.uid === employeeForLeaveId);
            const shiftType = hrSettings.shiftTypes.find(st => st.id === employee?.shiftType);
            const holidays = hrSettings.holidays || [];

            if (!shiftType) {
                setFormData(prev => ({
                    ...prev,
                    dateOfReturn: "", // Cannot accurately determine without defined shift working days
                    numberOfLeaveDaysRequested: 0,
                    halfDayOption: null,
                }));
                return;
            }

            // Check if it's a same-day leave for half-day option
            const isSameDay = start.isSame(end, "day");

            // Calculate leave days
            let leaveDays = 0;
            let current = start;
            const dayMap = [
                "Sunday",
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
            ];

            while (current.isBefore(end) || current.isSame(end, "day")) {
                const dayOfWeekName = dayMap[current.day()];
                const isWorkingDay = shiftType.workingDays.some(
                    day => day.dayOfTheWeek === dayOfWeekName,
                );
                const isHoliday = holidays.some(
                    h => h.active === "Yes" && dayjs(h.date).isSame(current, "day"),
                );

                if (isWorkingDay && !isHoliday) {
                    leaveDays++;
                }
                current = current.add(1, "day");
            }

            // Handle half-day logic
            let halfDayOption = formData.halfDayOption;
            let returnDate = end;

            if (isSameDay && formData.halfDayOption) {
                // Same day with half-day option
                leaveDays = 0.5;

                if (formData.halfDayOption === "HDM") {
                    // Half-day Morning: return same day (work in afternoon)
                    returnDate = end;
                } else if (formData.halfDayOption === "HDA") {
                    // Half-day Afternoon: return next working day
                    returnDate = end.add(1, "day");
                }
            } else if (isSameDay && !formData.halfDayOption) {
                // Same day but no half-day selected - reset to full day
                leaveDays = 1;
                returnDate = end.add(1, "day");
            } else if (!isSameDay) {
                // Multi-day leave - clear half-day option
                halfDayOption = null;
                returnDate = end.add(1, "day");
            }

            // Find next working day for return date
            while (true) {
                const dayOfWeekName = dayMap[returnDate.day()];
                const isWorkingDay = shiftType.workingDays.some(
                    day => day.dayOfTheWeek === dayOfWeekName,
                );
                const isHoliday = holidays.some(
                    h => h.active === "Yes" && dayjs(h.date).isSame(returnDate, "day"),
                );

                if (isWorkingDay && !isHoliday) {
                    break; // Found the next working day
                }
                returnDate = returnDate.add(1, "day");
            }

            setFormData(prev => ({
                ...prev,
                dateOfReturn: returnDate.format("MMMM DD, YYYY"),
                numberOfLeaveDaysRequested: leaveDays,
                halfDayOption: halfDayOption,
            }));
        }
    }, [
        formData.firstDayOfLeave,
        formData.lastDayOfLeave,
        formData.employee,
        formData.onBehalf,
        formData.halfDayOption,
        activeEmployees,
        hrSettings,
        user?.uid,
    ]);

    // Effect to handle half-day option changes
    useEffect(() => {
        if (formData.firstDayOfLeave && formData.lastDayOfLeave) {
            const start = dayjs(formData.firstDayOfLeave);
            const end = dayjs(formData.lastDayOfLeave);
            const isSameDay = start.isSame(end, "day");

            // If not same day, clear half-day option
            if (!isSameDay && formData.halfDayOption) {
                setFormData(prev => ({ ...prev, halfDayOption: null }));
            }
        }
    }, [formData.halfDayOption]);

    const handleDateChange = (field: string, value: string) => {
        setFormData(prev => {
            const formattedDate = dayjs(value).format("YYYY-MM-DD");
            const newData = { ...prev, [field]: formattedDate };
            return newData;
        });
        setErrors(prev => ({ ...prev, [field]: "" }));
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);
        setFormData(prev => ({
            ...prev,
            attachments: [...prev.attachments, ...files],
        }));
    };

    const removeFile = (index: number) => {
        setFormData(prev => ({
            ...prev,
            attachments: prev.attachments.filter((_, i) => i !== index),
        }));
    };

    const handleOnBehalfChange = (checked: boolean) => {
        setFormData(prev => ({
            ...prev,
            onBehalf: checked,
            employee: checked ? prev.employee : "",
        }));
        if (!checked && errors.employee) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.employee;
                return newErrors;
            });
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!formData.leaveType) newErrors.leaveType = "Leave type is required";
        if (!formData.firstDayOfLeave) newErrors.firstDayOfLeave = "Start date is required";
        if (!formData.lastDayOfLeave) newErrors.lastDayOfLeave = "End date is required";

        // Check if first day of leave is a holiday
        const holidays = hrSettings.holidays || [];
        if (formData.firstDayOfLeave) {
            const firstDayDate = dayjs(formData.firstDayOfLeave);
            const matchingHoliday = holidays.find(
                h => h.active === "Yes" && dayjs(h.date).isSame(firstDayDate, "day"),
            );
            if (matchingHoliday) {
                newErrors.firstDayOfLeave = `The first day of leave (${matchingHoliday.name}) is a holiday. Please select a different date.`;
            }
        }

        if (formData.firstDayOfLeave && formData.lastDayOfLeave) {
            const startDate = new Date(formData.firstDayOfLeave);
            const endDate = new Date(formData.lastDayOfLeave);
            if (startDate > endDate) {
                newErrors.lastDayOfLeave = "End date must be after start date";
            }
        }
        if (formData.onBehalf && !formData.employee)
            newErrors.employee = "Employee selection is required";
        if (formData.numberOfLeaveDaysRequested <= 0)
            newErrors.lastDayOfLeave = "Invalid leave period";

        if (formData.numberOfLeaveDaysRequested > availableBalance) {
            newErrors.lastDayOfLeave = "Requested leave days exceed available balance.";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) {
            showToast("Please fix the errors in the form", "Validation Error", "error", 4000);
            return;
        }
        setIsSubmitting(true);
        try {
            const attachmentUrls = [];
            if (formData.attachments && formData.attachments.length > 0) {
                const uploadPromises = formData.attachments.map(file =>
                    uploadLeaveAttachment(file, initialData?.id || `LR${Date.now()}`),
                );
                attachmentUrls.push(...(await Promise.all(uploadPromises)));
            }
            const leaveRequestData = {
                id: isEditing && initialData ? initialData.id : `LR${Date.now()}`,
                employeeID: user?.uid || "",
                timestamp: isEditing && initialData ? initialData.timestamp : getTimestamp(),
                leaveRequestID: isEditing && initialData ? initialData.leaveRequestID : requestId,
                leaveState: (isEditing && initialData
                    ? initialData.leaveState
                    : "Requested") as LeaveModel["leaveState"],
                leaveStage: (isEditing && initialData
                    ? initialData.leaveStage
                    : "Open") as LeaveModel["leaveStage"],
                leaveType: formData.leaveType || "",
                standIn: formData.standIn || null,
                authorizedDays: authorizedDays?.toString() || null,
                firstDayOfLeave: formData.firstDayOfLeave,
                lastDayOfLeave: formData.lastDayOfLeave,
                dateOfReturn: formData.dateOfReturn,
                numberOfLeaveDaysRequested: formData.numberOfLeaveDaysRequested,
                balanceLeaveDays:
                    isEditing && initialData
                        ? initialData.balanceLeaveDays
                        : userData?.balanceLeaveDays || 0,
                comments: isEditing && initialData ? initialData.comments : [],
                attachments: attachmentUrls,
                requestedFor: formData.onBehalf ? formData.employee : null,
                requestedBy: formData.onBehalf ? user?.uid || "" : null,
                rollbackStatus: (isEditing && initialData
                    ? initialData.rollbackStatus
                    : "N/A") as LeaveModel["rollbackStatus"],
                reason: formData.reason || null,
                halfDayOption: formData.halfDayOption,
            };
            if (isEditing && initialData) {
                await updateLeaveManagement(
                    { ...leaveRequestData, id: initialData.id },
                    user?.uid ?? "",
                    userData?.firstName + " " + userData?.surname || "Employee",
                );
                showToast("Leave request updated successfully", "Success", "success", 3000);
                onSuccess();
            } else {
                await createLeaveManagement(
                    leaveRequestData as Omit<LeaveModel, "id">,
                    user?.uid ?? "",
                    userData?.firstName + " " + userData?.surname || "Employee",
                );
                showToast("Leave request submitted successfully", "Success", "success");

                await sendNotification({
                    users: [
                        {
                            uid: userData?.reportingLineManager || "",
                            email: manager?.personalEmail || "",
                            telegramChatID: manager?.telegramChatID || "",
                        },
                    ],
                    channels: ["email", "telegram", "inapp"],
                    messageKey: "LEAVE_REQUEST_SUBMITTED_TO_MANAGER",
                    payload: {
                        employeeName:
                            userData?.firstName + " " + userData?.surname || "An employee",
                        leaveType: getLeaveTypeName(leaveRequestData.leaveType),
                        startDate: leaveRequestData.firstDayOfLeave,
                        endDate: leaveRequestData.lastDayOfLeave,
                    },
                    title: "Leave Request Submitted",
                });

                if (formData.onBehalf) {
                    const onBehalfEmployee = activeEmployees.find(
                        emp => emp.uid === formData.employee,
                    );
                    if (onBehalfEmployee) {
                        await sendNotification({
                            users: [
                                {
                                    uid: onBehalfEmployee.uid,
                                    email: onBehalfEmployee.personalEmail,
                                    telegramChatID: onBehalfEmployee.telegramChatID || "",
                                },
                            ],
                            channels: ["telegram", "inapp"],
                            messageKey: "ON_BEHALF_LEAVE_SUBMITTED",
                            payload: {
                                leaveType: getLeaveTypeName(leaveRequestData.leaveType),
                                startDate: leaveRequestData.firstDayOfLeave,
                                endDate: leaveRequestData.lastDayOfLeave,
                            },
                            title: "Leave Request Submitted On Behalf",
                        });
                    }
                }
            }
            handleCancel();
        } catch (error) {
            console.error("Error saving leave request:", error);
            showToast("Failed to save leave request. Please try again.", "Error", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        setFormData({
            id: "",
            leaveType: "",
            firstDayOfLeave: "",
            lastDayOfLeave: "",
            dateOfReturn: "",
            numberOfLeaveDaysRequested: 0,
            reason: "",
            standIn: "",
            authorizedDays: "",
            onBehalf: false,
            employee: "",
            attachments: [],
            halfDayOption: null,
        });
        setErrors({});
        onOpenChange(false);
    };

    return {
        formData,
        setFormData,
        errors,
        isSubmitting,
        requestId,
        handleDateChange,
        handleFileUpload,
        removeFile,
        handleOnBehalfChange,
        handleSubmit,
        handleCancel,
        activeEmployees,
        hrSettings,
        user,
        currentEmployee,
        authorizedDays,
    };
};
