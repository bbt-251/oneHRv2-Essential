"use client";

import { useState, useEffect, useMemo } from "react";
import { useToast } from "@/context/toastContext";
import { useData } from "@/context/data-provider";
import { useAuth } from "@/context/authContext";
import { LeaveRepository } from "@/lib/repository/leave";
import { StorageRepository } from "@/lib/repository/storage/storage.repository";
import { LeaveModel } from "@/lib/models/leave";
import { getTimestamp } from "@/lib/util/dayjs_format";
import dayjs from "dayjs";
import { sendNotification } from "../notification/send-notification";

const ZERO_AUTHORIZED_LEAVE_TYPES = new Set(["annual-paid-leave", "unpaid-leave"]);

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
    const {
        activeEmployees,
        leaveTypes,
        shiftTypes,
        holidays,
        positions,
        departmentSettings,
        backdateCapabilities,
        isResourceHydrated,
    } = useData();
    const { user, userData } = useAuth();
    const settingsLookup = {
        leaveTypes,
        shiftTypes,
        holidays,
        positions,
        departmentSettings,
        backdateCapabilities,
    };
    const isLeaveSettingsReady =
        isResourceHydrated("leaveTypes") &&
        isResourceHydrated("positions") &&
        isResourceHydrated("departmentSettings") &&
        isResourceHydrated("backdateCapabilities");

    const getLeaveTypeName = (positionId: string) =>
        leaveTypes.find(p => p.id === positionId)?.name || "Unknown";

    const manager = activeEmployees.find(emp => emp.uid === userData?.reportingLineManager);

    const [requestId] = useState<string>(() =>
        isEditing && initialData
            ? initialData.leaveRequestID
            : `LR-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    );
    const availableBalance = userData?.balanceLeaveDays || 0;

    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [formState, setFormState] = useState<LeaveRequestFormData>({
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

    const currentEmployee = activeEmployees.find(emp => emp.uid === user?.uid);

    useEffect(() => {
        if (initialData) {
            setFormState({
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

    const authorizedDays = useMemo(() => {
        if (!formState.leaveType) {
            return undefined;
        }

        if (ZERO_AUTHORIZED_LEAVE_TYPES.has(formState.leaveType)) {
            return 0;
        }

        return leaveTypes.find(leaveType => leaveType.id === formState.leaveType)?.authorizedDays;
    }, [formState.leaveType, leaveTypes]);

    const calculated = useMemo(() => {
        if (!formState.firstDayOfLeave || !formState.lastDayOfLeave) {
            return { dateOfReturn: "", numberOfLeaveDaysRequested: 0 };
        }

        const start = dayjs(formState.firstDayOfLeave);
        const end = dayjs(formState.lastDayOfLeave);

        if (end.isBefore(start)) {
            return { dateOfReturn: "", numberOfLeaveDaysRequested: 0 };
        }

        const employeeForLeaveId = formState.onBehalf ? formState.employee : user?.uid;
        const employee = activeEmployees.find(emp => emp.uid === employeeForLeaveId);
        const shiftTypeId =
            employee?.shiftType || (employeeForLeaveId === user?.uid ? userData?.shiftType : "");
        const shiftType = shiftTypes.find(st => st.id === shiftTypeId);
        const holidaySettings = holidays || [];

        if (!shiftType) {
            return { dateOfReturn: "", numberOfLeaveDaysRequested: 0 };
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
            const isHoliday = holidaySettings.some(
                h => h.active === "Yes" && dayjs(h.date).isSame(current, "day"),
            );

            if (isWorkingDay && !isHoliday) {
                leaveDays++;
            }
            current = current.add(1, "day");
        }

        let returnDate = end;

        if (isSameDay && formState.halfDayOption) {
            // Same day with half-day option
            leaveDays = 0.5;

            if (formState.halfDayOption === "HDM") {
                // Half-day Morning: return same day (work in afternoon)
                returnDate = end;
            } else if (formState.halfDayOption === "HDA") {
                // Half-day Afternoon: return next working day
                returnDate = end.add(1, "day");
            }
        } else if (isSameDay && !formState.halfDayOption) {
            // Same day but no half-day selected - reset to full day
            leaveDays = 1;
            returnDate = end.add(1, "day");
        } else if (!isSameDay) {
            // Multi-day leave
            returnDate = end.add(1, "day");
        }

        // Find next working day for return date
        while (true) {
            const dayOfWeekName = dayMap[returnDate.day()];
            const isWorkingDay = shiftType.workingDays.some(
                day => day.dayOfTheWeek === dayOfWeekName,
            );
            const isHoliday = holidaySettings.some(
                h => h.active === "Yes" && dayjs(h.date).isSame(returnDate, "day"),
            );

            if (isWorkingDay && !isHoliday) {
                break; // Found the next working day
            }
            returnDate = returnDate.add(1, "day");
        }

        return {
            dateOfReturn: returnDate.format("MMMM DD, YYYY"),
            numberOfLeaveDaysRequested: leaveDays,
        };
    }, [
        formState.firstDayOfLeave,
        formState.lastDayOfLeave,
        formState.employee,
        formState.onBehalf,
        formState.halfDayOption,
        activeEmployees,
        holidays,
        shiftTypes,
        user?.uid,
        userData?.shiftType,
    ]);

    const formData = useMemo(
        () => ({
            ...formState,
            dateOfReturn: calculated.dateOfReturn,
            numberOfLeaveDaysRequested: calculated.numberOfLeaveDaysRequested,
        }),
        [calculated.dateOfReturn, calculated.numberOfLeaveDaysRequested, formState],
    );

    const hasAuthorizedDays = authorizedDays !== undefined && authorizedDays !== null;
    const hasRequiredFields =
        !!formData.leaveType &&
        !!formData.firstDayOfLeave &&
        !!formData.lastDayOfLeave &&
        !!formData.dateOfReturn &&
        formData.numberOfLeaveDaysRequested > 0 &&
        hasAuthorizedDays;
    const canSubmit =
        hasRequiredFields &&
        (!formData.onBehalf || !!formData.employee) &&
        formData.numberOfLeaveDaysRequested <= availableBalance;

    // Effect to handle half-day option changes
    useEffect(() => {
        if (formState.firstDayOfLeave && formState.lastDayOfLeave) {
            const start = dayjs(formState.firstDayOfLeave);
            const end = dayjs(formState.lastDayOfLeave);
            const isSameDay = start.isSame(end, "day");

            // If not same day, clear half-day option
            if (!isSameDay && formState.halfDayOption) {
                setFormState(prev => ({ ...prev, halfDayOption: null }));
            }
        }
    }, [formState.firstDayOfLeave, formState.halfDayOption, formState.lastDayOfLeave]);

    const handleDateChange = (field: string, value: string) => {
        setFormState(prev => {
            const formattedDate = dayjs(value).format("YYYY-MM-DD");
            const newData = { ...prev, [field]: formattedDate };
            return newData;
        });
        setErrors(prev => ({ ...prev, [field]: "" }));
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);
        setFormState(prev => ({
            ...prev,
            attachments: [...prev.attachments, ...files],
        }));
    };

    const removeFile = (index: number) => {
        setFormState(prev => ({
            ...prev,
            attachments: prev.attachments.filter((_, i) => i !== index),
        }));
    };

    const handleOnBehalfChange = (checked: boolean) => {
        setFormState(prev => ({
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
        if (!formData.dateOfReturn) newErrors.dateOfReturn = "Date of return is required";
        if (formData.numberOfLeaveDaysRequested <= 0)
            newErrors.numberOfLeaveDaysRequested = "Leave days requested must be greater than 0";
        if (!hasAuthorizedDays) newErrors.authorizedDays = "Authorized days are required";

        // Check if first day of leave is a holiday
        const holidaySettings = holidays || [];
        if (formData.firstDayOfLeave) {
            const firstDayDate = dayjs(formData.firstDayOfLeave);
            const matchingHoliday = holidaySettings.find(
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
            const leaveEntityId = isEditing && initialData ? initialData.id : `LR${Date.now()}`;
            const attachmentObjectKeys = [];
            if (formData.attachments && formData.attachments.length > 0) {
                const uploadPromises = formData.attachments.map(file =>
                    StorageRepository.uploadFile({
                        file,
                        linkage: {
                            module: "leaveManagements",
                            entityId: leaveEntityId,
                            field: "attachments",
                        },
                    }),
                );
                attachmentObjectKeys.push(
                    ...(await Promise.all(uploadPromises)).map(item => item.objectKey),
                );
            }
            const leaveRequestData = {
                id: leaveEntityId,
                employeeID: userData?.uid || user?.uid || "",
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
                authorizedDays: hasAuthorizedDays ? String(authorizedDays) : null,
                firstDayOfLeave: formData.firstDayOfLeave,
                lastDayOfLeave: formData.lastDayOfLeave,
                dateOfReturn: formData.dateOfReturn,
                numberOfLeaveDaysRequested: formData.numberOfLeaveDaysRequested,
                balanceLeaveDays:
                    isEditing && initialData
                        ? initialData.balanceLeaveDays
                        : userData?.balanceLeaveDays || 0,
                comments: isEditing && initialData ? initialData.comments : [],
                attachments: attachmentObjectKeys,
                requestedFor: formData.onBehalf ? formData.employee : null,
                requestedBy: formData.onBehalf ? userData?.uid || user?.uid || "" : null,
                rollbackStatus: (isEditing && initialData
                    ? initialData.rollbackStatus
                    : "N/A") as LeaveModel["rollbackStatus"],
                reason: formData.reason || null,
                halfDayOption: formData.halfDayOption,
            };
            if (isEditing && initialData) {
                const result = await LeaveRepository.updateLeaveRequest({
                    ...leaveRequestData,
                    id: initialData.id,
                });
                if (!result.success) {
                    throw new Error(result.message);
                }

                showToast(result.message, "Success", "success", 3000);
                onSuccess();
            } else {
                const result = await LeaveRepository.createLeaveRequest(
                    leaveRequestData as Omit<LeaveModel, "id">,
                );
                if (!result.success) {
                    throw new Error(result.message);
                }

                showToast(result.message, "Success", "success");

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
            showToast(
                error instanceof Error
                    ? error.message
                    : "Failed to save leave request. Please try again.",
                "Error",
                "error",
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        setFormState({
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
        setFormData: setFormState,
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
        settingsLookup,
        user,
        currentEmployee,
        authorizedDays,
        canSubmit,
        isLeaveSettingsReady,
    };
};
