"use client";

import type React from "react";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/authContext";
import { useData } from "@/context/app-data-context";
import { useToast } from "@/context/toastContext";
import { OvertimeConfigurationModel } from "@/lib/models/hr-settings";
import { OvertimeRequestModel } from "@/lib/models/overtime-request";
import { AttendanceRepository } from "@/lib/repository/attendance";
import { dateFormat, timestampFormat } from "@/lib/util/dayjs_format";
import getFullName from "@/lib/util/getEmployeeFullName";
import { getNotificationRecipients } from "@/lib/util/notification/recipients";
import { sendNotification } from "@/lib/util/notification/send-notification";
import generateID from "@/lib/util/generateID";
import dayjs from "dayjs";
import { Calendar, Clock, Loader } from "lucide-react";
import { useEffect, useState } from "react";

interface EmployeeOvertimeFormProps {
    day: {
        day: number;
        month: string;
        year: number;
    };
    overtimeTypes: OvertimeConfigurationModel[];
    editingRequest: OvertimeRequestModel | null;
    onClose: () => void;
    onSuccess: () => void;
}

interface FormData {
    timestamp: string;
    overtimeDate: string;
    overtimeStartTime: string;
    overtimeEndTime: string;
    overtimeType: string;
    overtimeGoal: string;
    overtimeJustification: string;
}

const defaultFormData = (day: { day: number; month: string; year: number }): FormData => ({
    timestamp: dayjs().format(timestampFormat),
    overtimeDate: `${day.year}-${String(new Date(`${day.month} 1, ${day.year}`).getMonth() + 1).padStart(2, "0")}-${String(day.day).padStart(2, "0")}`,
    overtimeStartTime: "",
    overtimeEndTime: "",
    overtimeType: "",
    overtimeGoal: "",
    overtimeJustification: "",
});

const HOUR_OPTIONS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));
const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

const parseTimeParts = (time24: string) => {
    const parsed = dayjs(time24, "HH:mm", true);
    if (!parsed.isValid()) {
        return { hour: "", minute: "", meridiem: "" as "" | "AM" | "PM" };
    }
    return {
        hour: parsed.format("hh"),
        minute: parsed.format("mm"),
        meridiem: parsed.format("A") as "AM" | "PM",
    };
};

const build24HourTime = (hour: string, minute: string, meridiem: string) => {
    if (!hour || !minute || !meridiem) return "";
    const parsed = dayjs(`${hour}:${minute} ${meridiem}`, "hh:mm A", true);
    return parsed.isValid() ? parsed.format("HH:mm") : "";
};

export function EmployeeOvertimeForm({
    day,
    overtimeTypes,
    editingRequest,
    onClose,
    onSuccess,
}: EmployeeOvertimeFormProps) {
    const { theme } = useTheme();
    const { userData } = useAuth();
    const { employees } = useData();
    const { showToast } = useToast();
    const isDark = theme === "dark";
    const isEdit = !!editingRequest;

    const [formData, setFormData] = useState<FormData>(defaultFormData(day));
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    useEffect(() => {
        if (editingRequest) {
            const start = dayjs(editingRequest.overtimeStartTime, "hh:mm A");
            const end = dayjs(editingRequest.overtimeEndTime, "hh:mm A");
            const dateParsed = dayjs(editingRequest.overtimeDate, dateFormat);
            setFormData({
                timestamp: editingRequest.timestamp,
                overtimeDate: dateParsed.format("YYYY-MM-DD"),
                overtimeStartTime: start.isValid() ? start.format("HH:mm") : "",
                overtimeEndTime: end.isValid() ? end.format("HH:mm") : "",
                overtimeType: editingRequest.overtimeType,
                overtimeGoal: editingRequest.overtimeGoal,
                overtimeJustification: editingRequest.overtimeJustification,
            });
        } else {
            setFormData(defaultFormData(day));
        }
    }, [editingRequest, day]);

    const handleInputChange = (field: keyof FormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleTimePartChange = (
        field: "overtimeStartTime" | "overtimeEndTime",
        part: "hour" | "minute" | "meridiem",
        value: string,
    ) => {
        const current = parseTimeParts(formData[field]);
        const nextHour = part === "hour" ? value : current.hour || "12";
        const nextMinute = part === "minute" ? value : current.minute || "00";
        const nextMeridiem = part === "meridiem" ? value : current.meridiem || "AM";
        handleInputChange(field, build24HourTime(nextHour, nextMinute, nextMeridiem));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userData?.uid) {
            showToast("You must be logged in to submit.", "Error", "error");
            return;
        }
        const start = dayjs(formData.overtimeStartTime, "HH:mm", true);
        const end = dayjs(formData.overtimeEndTime, "HH:mm", true);
        if (!start.isValid() || !end.isValid()) {
            showToast("Please enter valid start and end times.", "Validation", "warning");
            return;
        }

        // Calculate duration handling overnight shifts (e.g., 5:00 PM to 2:00 AM)
        let durationHours = end.diff(start, "hour", true);
        if (durationHours < 0) {
            durationHours += 24; // Add 24 hours for overnight shifts
        }

        if (durationHours <= 0) {
            showToast(
                "Invalid duration. Please check your start and end times.",
                "Validation",
                "warning",
            );
            return;
        }

        setIsSubmitting(true);
        try {
            if (isEdit) {
                const res = await AttendanceRepository.updateOvertimeRequest(
                    {
                        id: editingRequest.id,
                        overtimeDate: dayjs(formData.overtimeDate).format(dateFormat),
                        overtimeStartTime: start.format("hh:mm A"),
                        overtimeEndTime: end.format("hh:mm A"),
                        overtimeType: formData.overtimeType,
                        overtimeGoal: formData.overtimeGoal,
                        overtimeJustification: formData.overtimeJustification,
                        duration: durationHours,
                    },
                    userData.uid,
                );
                if (res.success) {
                    showToast("Overtime request updated successfully.", "Success", "success");
                    onSuccess();
                } else {
                    showToast("Failed to update request. Please try again.", "Error", "error");
                }
            } else {
                const newRequest: Omit<OvertimeRequestModel, "id"> = {
                    timestamp: formData.timestamp,
                    overtimeId: generateID(),
                    overtimeDate: dayjs(formData.overtimeDate).format(dateFormat),
                    overtimeStartTime: start.format("hh:mm A"),
                    overtimeEndTime: end.format("hh:mm A"),
                    overtimeType: formData.overtimeType,
                    employeeUids: [userData.uid],
                    overtimeGoal: formData.overtimeGoal,
                    overtimeJustification: formData.overtimeJustification,
                    status: "pending",
                    // Employee-created requests must be approved by the manager first
                    // before moving on to HR.
                    approvalStage: "manager",
                    requestedBy: userData.uid,
                    reviewedBy: null,
                    reviewedDate: null,
                    hrComments: null,
                    duration: durationHours,
                };
                const res = await AttendanceRepository.createOvertimeRequest(newRequest);
                if (res.success) {
                    try {
                        const validRecipients = getNotificationRecipients(
                            employees,
                            [userData.uid],
                            "both",
                        );
                        const employeeName = getFullName(userData);
                        const manager = employees.find(
                            e => e.uid === userData.reportingLineManager,
                        );
                        if (validRecipients.length > 0) {
                            await sendNotification({
                                users: validRecipients,
                                channels: ["telegram", "inapp"],
                                messageKey: "OT_REQUEST_SUBMITTED",
                                payload: {
                                    managerName: manager ? getFullName(manager) : "",
                                    position: manager?.employmentPosition ?? "",
                                    department: manager?.department ?? "",
                                    employeeName,
                                },
                                title: "Overtime Request Submitted",
                                action: "/overtime_requests",
                                getCustomMessage: recipientType => {
                                    if (recipientType === "hr") {
                                        return {
                                            telegram: `Employee ${employeeName} submitted an overtime request for ${newRequest.overtimeDate} awaiting your review.`,
                                            inapp: `Employee ${employeeName} submitted an overtime request for ${newRequest.overtimeDate} awaiting your review.`,
                                            email: {
                                                subject: `Overtime Request by ${employeeName}`,
                                                body: `Employee ${employeeName} submitted an overtime request for ${newRequest.overtimeDate} awaiting your review.`,
                                            },
                                        };
                                    }
                                    if (recipientType === "manager") {
                                        return {
                                            telegram: `Your reportee ${employeeName} submitted an overtime request for ${newRequest.overtimeDate}.`,
                                            inapp: `Your reportee ${employeeName} submitted an overtime request for ${newRequest.overtimeDate}.`,
                                            email: {
                                                subject: `Overtime Request by ${employeeName}`,
                                                body: `Your reportee ${employeeName} submitted an overtime request for ${newRequest.overtimeDate}.`,
                                            },
                                        };
                                    }
                                    return {};
                                },
                            });
                        }
                    } catch (err) {
                        console.error("Failed to send OT notification:", err);
                    }
                    showToast("Overtime request submitted successfully.", "Success", "success");
                    onSuccess();
                } else {
                    showToast("Failed to submit request. Please try again.", "Error", "error");
                }
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent
                className={`max-w-4xl max-h-[90vh] overflow-y-auto ${isDark ? "bg-gray-900 text-white" : "bg-white"}`}
            >
                <DialogHeader>
                    <DialogTitle
                        className={`text-xl font-semibold ${isDark ? "text-white" : "text-[#3f3d56]"}`}
                        style={{ fontFamily: "Montserrat, sans-serif" }}
                    >
                        {isEdit ? "Edit Overtime Request" : "Submit Overtime Request"}
                    </DialogTitle>
                </DialogHeader>
                <Card
                    className={`border-0 shadow-sm ${isDark ? "bg-gray-800 text-white" : "bg-white"}`}
                >
                    <CardContent className="p-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {[
                                    {
                                        id: "overtimeDate" as const,
                                        label: "Overtime Date",
                                        type: "date",
                                        icon: (
                                            <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        ),
                                    },
                                    {
                                        id: "overtimeStartTime" as const,
                                        label: "Overtime Start Time",
                                        type: "time",
                                        icon: (
                                            <Clock className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        ),
                                    },
                                    {
                                        id: "overtimeEndTime" as const,
                                        label: "Overtime End Time",
                                        type: "time",
                                        icon: (
                                            <Clock className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        ),
                                    },
                                ].map(({ id, label, type, icon }) => (
                                    <div key={id} className="space-y-2">
                                        <Label
                                            htmlFor={id}
                                            className={`text-sm font-medium flex items-center gap-1 ${isDark ? "text-slate-300" : "text-[#3f3d56]"}`}
                                            style={{ fontFamily: "Montserrat, sans-serif" }}
                                        >
                                            <span className="text-red-500">*</span> {label} :
                                        </Label>
                                        <div className="relative">
                                            {id === "overtimeStartTime" ||
                                            id === "overtimeEndTime" ? (
                                                    <div className="grid grid-cols-3 gap-2">
                                                        <Select
                                                            value={parseTimeParts(formData[id]).hour}
                                                            onValueChange={value =>
                                                                handleTimePartChange(id, "hour", value)
                                                            }
                                                        >
                                                            <SelectTrigger
                                                                className={
                                                                    isDark
                                                                        ? "bg-gray-700 text-white"
                                                                        : ""
                                                                }
                                                            >
                                                                <SelectValue placeholder="hh" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {HOUR_OPTIONS.map(hour => (
                                                                    <SelectItem key={hour} value={hour}>
                                                                        {hour}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <Select
                                                            value={parseTimeParts(formData[id]).minute}
                                                            onValueChange={value =>
                                                                handleTimePartChange(
                                                                    id,
                                                                    "minute",
                                                                    value,
                                                                )
                                                            }
                                                        >
                                                            <SelectTrigger
                                                                className={
                                                                    isDark
                                                                        ? "bg-gray-700 text-white"
                                                                        : ""
                                                                }
                                                            >
                                                                <SelectValue placeholder="mm" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {MINUTE_OPTIONS.map(minute => (
                                                                    <SelectItem
                                                                        key={minute}
                                                                        value={minute}
                                                                    >
                                                                        {minute}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <Select
                                                            value={
                                                                parseTimeParts(formData[id]).meridiem
                                                            }
                                                            onValueChange={value =>
                                                                handleTimePartChange(
                                                                    id,
                                                                    "meridiem",
                                                                    value,
                                                                )
                                                            }
                                                        >
                                                            <SelectTrigger
                                                                className={
                                                                    isDark
                                                                        ? "bg-gray-700 text-white"
                                                                        : ""
                                                                }
                                                            >
                                                                <SelectValue placeholder="AM/PM" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="AM">AM</SelectItem>
                                                                <SelectItem value="PM">PM</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <Input
                                                            id={id}
                                                            type={type}
                                                            value={formData[id]}
                                                            onChange={e =>
                                                                handleInputChange(id, e.target.value)
                                                            }
                                                            className={`w-full pr-10 ${isDark ? "bg-gray-700 text-white" : ""}`}
                                                            required
                                                        />
                                                        {icon}
                                                    </>
                                                )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="overtimeType"
                                        className={`text-sm font-medium flex items-center gap-1 ${isDark ? "text-slate-300" : "text-[#3f3d56]"}`}
                                        style={{ fontFamily: "Montserrat, sans-serif" }}
                                    >
                                        <span className="text-red-500">*</span> Overtime Type :
                                    </Label>
                                    <Select
                                        value={formData.overtimeType}
                                        onValueChange={v => handleInputChange("overtimeType", v)}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select overtime type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {overtimeTypes
                                                .filter(ot => ot.active === "Yes")
                                                .map(type => (
                                                    <SelectItem key={type.id} value={type.id}>
                                                        {type.overtimeType}
                                                    </SelectItem>
                                                ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            {[
                                {
                                    id: "overtimeGoal" as const,
                                    label: "Overtime Goal",
                                    placeholder:
                                        "Describe the goal and objectives for this overtime work...",
                                },
                                {
                                    id: "overtimeJustification" as const,
                                    label: "Overtime Justification",
                                    placeholder:
                                        "Provide justification for why this overtime is necessary...",
                                },
                            ].map(({ id, label, placeholder }) => (
                                <div key={id} className="space-y-2">
                                    <Label
                                        htmlFor={id}
                                        className={`text-sm font-medium flex items-center gap-1 ${isDark ? "text-slate-300" : "text-[#3f3d56]"}`}
                                        style={{ fontFamily: "Montserrat, sans-serif" }}
                                    >
                                        <span className="text-red-500">*</span> {label} :
                                    </Label>
                                    <Textarea
                                        id={id}
                                        placeholder={placeholder}
                                        value={formData[id]}
                                        onChange={e => handleInputChange(id, e.target.value)}
                                        className={`w-full min-h-[120px] resize-none ${isDark ? "bg-gray-700 text-white" : ""}`}
                                        required
                                    />
                                </div>
                            ))}
                            <div className="flex flex-col sm:flex-row gap-3 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={onClose}
                                    className={`flex-1 ${isDark ? "border-gray-700 text-slate-200 hover:bg-gray-800" : "border-gray-200 text-[#3f3d56] hover:bg-gray-50"}`}
                                    style={{ fontFamily: "Montserrat, sans-serif" }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 bg-[#3f3d56] hover:bg-[#3f3d56]/90 text-white flex items-center justify-center gap-2"
                                    style={{ fontFamily: "Montserrat, sans-serif" }}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader className="animate-spin w-4 h-4" />
                                            {isEdit ? "Updating..." : "Submitting..."}
                                        </>
                                    ) : isEdit ? (
                                        "Update Overtime Request"
                                    ) : (
                                        "Submit Overtime Request"
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </DialogContent>
        </Dialog>
    );
}
