"use client";

import React from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useTheme } from "@/components/theme-provider";
import { dateFormat } from "@/lib/util/dayjs_format";
import { CalendarIcon, Upload, X, FileText, AlertCircle, User, Clock } from "lucide-react";
import dayjs from "dayjs";
import { useLeaveRequestForm } from "@/lib/util/leave-request/use-leave-request-form";
import { useAuth } from "@/context/authContext";
import { Textarea } from "@/components/ui/textarea";

export const annualLeaveType = {
    id: "annual-paid-leave",
    name: "Annual Paid Leave",
    authorizedDays: 0,
    active: "Yes",
};
export const unpaidLeaveType = {
    id: "unpaid-leave",
    name: "Unpaid Leave",
    authorizedDays: 0,
    active: "Yes",
};

interface AddLeaveRequestModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function AddLeaveRequestModal({
    open,
    onOpenChange,
    onSuccess = () => {},
}: AddLeaveRequestModalProps) {
    const { theme } = useTheme();
    const {
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
        authorizedDays,
    } = useLeaveRequestForm({ onSuccess, onOpenChange });
    const { userData } = useAuth();
    const { leaveTypes, positions, departmentSettings, backdateCapabilities } = hrSettings;

    const allLeaveTypes = [...leaveTypes, annualLeaveType, unpaidLeaveType];
    const filteredLeaveTypes = allLeaveTypes.filter(
        (leaveType, index, self) =>
            leaveType.active === "Yes" &&
            (index === 0 || self.findIndex(t => t.name === leaveType.name) === index),
    );
    const isBackdateAllowed = backdateCapabilities[0]?.allowBackdatedRequests;

    const getEmploymentPositionName = (positionId: string) =>
        positions.find(p => p.id === positionId)?.name || "Unknown";
    const getDepartmentName = (departmentId: string) =>
        departmentSettings.find(d => d.id === departmentId)?.name || "Unknown";
    const selectedEmployee = activeEmployees.find(emp => emp.id === formData.employee);

    const availableBalance = userData?.balanceLeaveDays || 0;

    const isBalanceExceeded = formData.numberOfLeaveDaysRequested > availableBalance;

    // Check if it's a same-day leave (half-day eligible)
    const isSameDay =
        formData.firstDayOfLeave &&
        formData.lastDayOfLeave &&
        dayjs(formData.firstDayOfLeave).isSame(dayjs(formData.lastDayOfLeave), "day");

    const handleHalfDayOptionChange = (value: string) => {
        const halfDayValue = value === "none" ? null : (value as "HDM" | "HDA");
        setFormData(prev => ({ ...prev, halfDayOption: halfDayValue }));
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className={`sm:max-w-[800px] max-h-[90vh] overflow-y-auto ${
                    theme === "dark" ? "bg-black border-gray-800" : "bg-white"
                }`}
            >
                <DialogHeader>
                    <DialogTitle
                        className={`text-2xl font-semibold flex items-center gap-2 ${
                            theme === "dark" ? "text-white" : "text-slate-900"
                        }`}
                    >
                        <FileText className="h-6 w-6" />
                        Submit Leave Request
                    </DialogTitle>
                    <DialogDescription
                        className={theme === "dark" ? "text-slate-300" : "text-slate-600"}
                    >
                        Submit a new leave request. Fields marked with{" "}
                        <span className="text-red-500">*</span> are required.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Request ID */}
                    <div
                        className={`p-4 rounded-lg border ${
                            theme === "dark"
                                ? "bg-gray-900 border-gray-700"
                                : "bg-slate-50 border-slate-200"
                        }`}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <Label
                                    className={`text-sm font-medium ${
                                        theme === "dark" ? "text-slate-300" : "text-slate-600"
                                    }`}
                                >
                                    Request ID
                                </Label>
                                <p
                                    className={`text-lg font-mono mt-1 ${
                                        theme === "dark" ? "text-slate-200" : "text-slate-700"
                                    }`}
                                >
                                    {requestId}
                                </p>
                            </div>
                            <Badge
                                className={`${
                                    theme === "dark"
                                        ? "bg-gray-700 text-slate-200"
                                        : "bg-slate-200 text-slate-700"
                                }`}
                            >
                                New
                            </Badge>
                        </div>
                    </div>

                    {/* On Behalf Checkbox */}
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="onBehalf"
                            checked={formData.onBehalf}
                            onCheckedChange={handleOnBehalfChange}
                        />
                        <Label
                            htmlFor="onBehalf"
                            className={`text-sm ${theme === "dark" ? "text-slate-300" : "text-slate-600"}`}
                        >
                            Request leave on someone&apos;s behalf
                        </Label>
                    </div>

                    {/* Employee Selection */}
                    {formData.onBehalf && (
                        <div
                            className={`space-y-2 p-4 rounded-lg border ${
                                theme === "dark"
                                    ? "bg-blue-900/20 border-blue-700"
                                    : "bg-blue-50 border-blue-200"
                            }`}
                        >
                            <Label
                                htmlFor="employee"
                                className={`text-sm font-medium flex items-center gap-2 ${
                                    theme === "dark" ? "text-slate-300" : "text-slate-600"
                                }`}
                            >
                                <User className="h-4 w-4" />
                                Select Employee <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={formData.employee}
                                onValueChange={value =>
                                    setFormData(prev => ({ ...prev, employee: value }))
                                }
                            >
                                <SelectTrigger
                                    className={`${
                                        theme === "dark"
                                            ? "border-gray-600 focus:border-blue-500 bg-gray-800"
                                            : "border-slate-300 focus:border-blue-500 bg-white"
                                    } ${errors.employee ? "border-red-500" : ""}`}
                                >
                                    <SelectValue placeholder="Choose an employee" />
                                </SelectTrigger>
                                <SelectContent>
                                    {activeEmployees
                                        .filter(e => e.uid !== user?.uid)
                                        .map(e => (
                                            <SelectItem key={e.id} value={e.uid}>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">
                                                        {e.firstName} {e.middleName} {e.surname}
                                                    </span>
                                                    <span
                                                        className={`text-xs ${
                                                            theme === "dark"
                                                                ? "text-slate-400"
                                                                : "text-slate-400"
                                                        }`}
                                                    >
                                                        {getEmploymentPositionName(
                                                            e.employmentPosition,
                                                        )}{" "}
                                                        • {getDepartmentName(e.department)}
                                                    </span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                            {errors.employee && (
                                <p className="text-xs text-red-600 flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    {errors.employee}
                                </p>
                            )}
                            {selectedEmployee && (
                                <div
                                    className={`mt-2 p-3 rounded-md border ${
                                        theme === "dark"
                                            ? "bg-gray-800 border-gray-700"
                                            : "bg-white border-slate-200"
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                            <span className="text-white text-sm font-medium">
                                                {selectedEmployee.firstName[0]}
                                                {selectedEmployee.surname[0]}
                                            </span>
                                        </div>
                                        <div>
                                            <p
                                                className={`font-medium ${
                                                    theme === "dark"
                                                        ? "text-slate-200"
                                                        : "text-slate-600"
                                                }`}
                                            >
                                                {selectedEmployee.firstName}{" "}
                                                {selectedEmployee.middleName}{" "}
                                                {selectedEmployee.surname}
                                            </p>
                                            <p
                                                className={`text-xs ${
                                                    theme === "dark"
                                                        ? "text-slate-400"
                                                        : "text-slate-400"
                                                }`}
                                            >
                                                {getEmploymentPositionName(
                                                    selectedEmployee.employmentPosition,
                                                )}{" "}
                                                • {getDepartmentName(selectedEmployee.department)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Leave Type and Stand In */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label
                                htmlFor="leave-type"
                                className={`text-sm font-semibold ${
                                    theme === "dark" ? "text-slate-200" : "text-slate-700"
                                }`}
                            >
                                Leave Type <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={formData.leaveType}
                                onValueChange={value =>
                                    setFormData(prev => ({ ...prev, leaveType: value }))
                                }
                            >
                                <SelectTrigger
                                    className={`${
                                        theme === "dark"
                                            ? "border-gray-600 bg-gray-800"
                                            : "border-slate-300 bg-white"
                                    } ${errors.leaveType ? "border-red-500" : ""}`}
                                >
                                    <SelectValue placeholder="Select leave type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {filteredLeaveTypes.map(lt => (
                                        <SelectItem key={lt.id} value={lt.id}>
                                            {lt.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.leaveType && (
                                <p className="text-sm text-red-500">{errors.leaveType}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label
                                htmlFor="stand-in"
                                className={`text-sm font-semibold ${
                                    theme === "dark" ? "text-slate-200" : "text-slate-700"
                                }`}
                            >
                                Stand In Person
                            </Label>
                            <div className="flex gap-2">
                                <Select
                                    value={formData.standIn}
                                    onValueChange={value =>
                                        setFormData(prev => ({ ...prev, standIn: value }))
                                    }
                                >
                                    <SelectTrigger
                                        className={`${
                                            theme === "dark"
                                                ? "border-gray-600 bg-gray-800"
                                                : "border-slate-300 bg-white"
                                        } ${errors.standIn ? "border-red-500" : ""}`}
                                    >
                                        <SelectValue placeholder="Select stand-in person" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {activeEmployees
                                            .filter(e => e.uid !== user?.uid)
                                            .filter(
                                                e =>
                                                    e.reportingLineManager ===
                                                    userData?.reportingLineManager,
                                            )
                                            .map(e => (
                                                <SelectItem key={e.id} value={e.uid}>
                                                    {e.firstName} {e.middleName} {e.surname}
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                                {formData.standIn && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            setFormData(prev => ({ ...prev, standIn: "" }))
                                        }
                                        className={`h-10 w-10 p-0 ${theme === "dark" ? "border-gray-600" : "border-slate-300"}`}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Date Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <Label
                                className={`text-sm font-semibold ${
                                    theme === "dark" ? "text-slate-200" : "text-slate-700"
                                }`}
                            >
                                First Day of Leave <span className="text-red-500">*</span>
                            </Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={`w-full justify-start text-left font-normal ${
                                            theme === "dark"
                                                ? "border-gray-600 bg-gray-800 text-slate-200"
                                                : "border-slate-300 bg-white"
                                        } ${errors.firstDayOfLeave ? "border-red-500" : ""}`}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {formData.firstDayOfLeave
                                            ? dayjs(formData.firstDayOfLeave).format(dateFormat)
                                            : "Select date"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={
                                            formData.firstDayOfLeave
                                                ? new Date(formData.firstDayOfLeave)
                                                : undefined
                                        }
                                        onSelect={d =>
                                            d &&
                                            handleDateChange("firstDayOfLeave", d.toISOString())
                                        }
                                        initialFocus
                                        disabled={date =>
                                            isBackdateAllowed
                                                ? false
                                                : date < new Date(new Date().setHours(0, 0, 0, 0))
                                        }
                                    />
                                </PopoverContent>
                            </Popover>
                            {errors.firstDayOfLeave && (
                                <p className="text-sm text-red-500">{errors.firstDayOfLeave}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label
                                className={`text-sm font-semibold ${
                                    theme === "dark" ? "text-slate-200" : "text-slate-700"
                                }`}
                            >
                                Last Day of Leave <span className="text-red-500">*</span>
                            </Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={`w-full justify-start text-left font-normal ${
                                            theme === "dark"
                                                ? "border-gray-600 bg-gray-800 text-slate-200"
                                                : "border-slate-300 bg-white"
                                        } ${errors.lastDayOfLeave ? "border-red-500" : ""}`}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {formData.lastDayOfLeave
                                            ? dayjs(formData.lastDayOfLeave).format(dateFormat)
                                            : "Select date"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={
                                            formData.lastDayOfLeave
                                                ? new Date(formData.lastDayOfLeave)
                                                : undefined
                                        }
                                        onSelect={d =>
                                            d && handleDateChange("lastDayOfLeave", d.toISOString())
                                        }
                                        initialFocus
                                        disabled={date =>
                                            isBackdateAllowed
                                                ? false
                                                : date < new Date(new Date().setHours(0, 0, 0, 0))
                                        }
                                    />
                                </PopoverContent>
                            </Popover>
                            {errors.lastDayOfLeave && (
                                <p className="text-sm text-red-500">{errors.lastDayOfLeave}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label
                                className={`text-sm font-semibold ${
                                    theme === "dark" ? "text-slate-200" : "text-slate-700"
                                }`}
                            >
                                Date of Return
                            </Label>
                            <Input
                                value={formData.dateOfReturn}
                                disabled
                                className={`${theme === "dark" ? "bg-gray-800 text-slate-200" : "bg-gray-50"}`}
                            />
                        </div>
                    </div>

                    {/* Half-Day Option - Only show for same-day leaves */}
                    {isSameDay && (
                        <div
                            className={`p-6 rounded-lg border ${
                                theme === "dark"
                                    ? "bg-amber-900/20 border-amber-700"
                                    : "bg-amber-50 border-amber-200"
                            }`}
                        >
                            <div className="flex items-center gap-2 mb-4">
                                <Clock
                                    className={`h-5 w-5 ${theme === "dark" ? "text-amber-400" : "text-amber-600"}`}
                                />
                                <Label
                                    className={`text-sm font-semibold ${
                                        theme === "dark" ? "text-amber-300" : "text-amber-700"
                                    }`}
                                >
                                    Half-Day Option
                                </Label>
                            </div>
                            <RadioGroup
                                value={formData.halfDayOption || "none"}
                                onValueChange={handleHalfDayOptionChange}
                                className="flex gap-6"
                            >
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="none" id="full-day" />
                                    <Label
                                        htmlFor="full-day"
                                        className={`text-sm cursor-pointer ${
                                            theme === "dark" ? "text-slate-300" : "text-slate-700"
                                        }`}
                                    >
                                        Full Day
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="HDM" id="half-day-morning" />
                                    <Label
                                        htmlFor="half-day-morning"
                                        className={`text-sm cursor-pointer ${
                                            theme === "dark" ? "text-slate-300" : "text-slate-700"
                                        }`}
                                    >
                                        Half-day Morning (AM)
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="HDA" id="half-day-afternoon" />
                                    <Label
                                        htmlFor="half-day-afternoon"
                                        className={`text-sm cursor-pointer ${
                                            theme === "dark" ? "text-slate-300" : "text-slate-700"
                                        }`}
                                    >
                                        Half-day Afternoon (PM)
                                    </Label>
                                </div>
                            </RadioGroup>
                            <p
                                className={`text-xs mt-3 ${theme === "dark" ? "text-amber-400" : "text-amber-600"}`}
                            >
                                {formData.halfDayOption
                                    ? formData.halfDayOption === "HDM"
                                        ? "You'll be absent in the morning, working in the afternoon"
                                        : "You'll be absent in the afternoon, working in the morning"
                                    : "Select a half-day option or leave as full day"}
                            </p>
                        </div>
                    )}

                    {/* Leave Days Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div
                            className={`p-6 rounded-lg border ${
                                theme === "dark"
                                    ? "bg-blue-900/20 border-blue-700"
                                    : "bg-blue-50 border-blue-200"
                            }`}
                        >
                            <Label
                                className={`text-sm font-medium ${
                                    theme === "dark" ? "text-blue-300" : "text-blue-600"
                                }`}
                            >
                                Leave Days Requested
                            </Label>
                            <div className="flex items-center gap-2">
                                <p
                                    className={`text-3xl font-bold mt-2 ${
                                        theme === "dark" ? "text-blue-300" : "text-blue-700"
                                    }`}
                                >
                                    {formData.numberOfLeaveDaysRequested}
                                </p>
                                {formData.halfDayOption && (
                                    <Badge
                                        variant="outline"
                                        className="mt-2 bg-amber-50 text-amber-700 border-amber-200"
                                    >
                                        Half Day
                                    </Badge>
                                )}
                            </div>
                            <p
                                className={`text-xs mt-1 ${theme === "dark" ? "text-blue-400" : "text-blue-500"}`}
                            >
                                {formData.halfDayOption
                                    ? "0.5 days (half day)"
                                    : "Working days excluding weekends"}
                            </p>
                        </div>
                        <div
                            className={`p-6 rounded-lg border ${
                                theme === "dark"
                                    ? "bg-gray-800 border-gray-700"
                                    : "bg-slate-100 border-slate-300"
                            }`}
                        >
                            <Label
                                className={`text-sm font-medium ${
                                    theme === "dark" ? "text-slate-300" : "text-slate-600"
                                }`}
                            >
                                {formData.leaveType === "annual-paid-leave"
                                    ? "Balance Leave Days"
                                    : "Authorized Days"}
                            </Label>
                            <p
                                className={`text-3xl font-bold mt-2 ${
                                    theme === "dark" ? "text-slate-200" : "text-slate-700"
                                }`}
                            >
                                {formData.leaveType === "annual-paid-leave"
                                    ? userData?.balanceLeaveDays || 0
                                    : authorizedDays || 0}
                            </p>
                            <p
                                className={`text-xs mt-1 ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}
                            >
                                {formData.leaveType === "annual-paid-leave"
                                    ? "Remaining annual leave"
                                    : "Days authorized for this leave"}
                            </p>
                        </div>
                    </div>

                    {/* Reason */}
                    <div className="space-y-2">
                        <Label
                            htmlFor="reason"
                            className={`text-sm font-semibold ${theme === "dark" ? "text-slate-200" : "text-slate-700"}`}
                        >
                            Reason for Leave
                        </Label>
                        <Textarea
                            id="reason"
                            value={formData.reason}
                            onChange={e =>
                                setFormData(prev => ({ ...prev, reason: e.target.value }))
                            }
                            placeholder="Provide a reason for your leave..."
                            className={`${
                                theme === "dark"
                                    ? "border-gray-600 bg-gray-800"
                                    : "border-slate-300 bg-white"
                            } min-h-[100px]`}
                        />
                    </div>

                    {/* Attachments */}
                    <div className="space-y-4">
                        <Label
                            className={`text-sm font-medium ${
                                theme === "dark" ? "text-slate-300" : "text-slate-600"
                            }`}
                        >
                            Attachments
                        </Label>
                        <div
                            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                                theme === "dark"
                                    ? "border-gray-600 hover:border-blue-400"
                                    : "border-slate-300 hover:border-blue-400"
                            }`}
                        >
                            <input
                                type="file"
                                multiple
                                onChange={handleFileUpload}
                                className="hidden"
                                id="file-upload"
                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            />
                            <label htmlFor="file-upload" className="cursor-pointer">
                                <Upload className="h-10 w-10 text-blue-400 mx-auto mb-3" />
                                <p
                                    className={`text-sm font-medium ${
                                        theme === "dark" ? "text-slate-300" : "text-slate-500"
                                    }`}
                                >
                                    Click to upload files
                                </p>
                                <p
                                    className={`text-xs mt-1 ${theme === "dark" ? "text-slate-400" : "text-slate-400"}`}
                                >
                                    PDF, DOC, DOCX, JPG, PNG up to 10MB
                                </p>
                            </label>
                        </div>
                        {formData.attachments.length > 0 && (
                            <div className="space-y-3">
                                {formData.attachments.map((file, index) => (
                                    <div
                                        key={index}
                                        className={`flex items-center justify-between p-4 rounded-lg border ${
                                            theme === "dark"
                                                ? "bg-gray-800 border-gray-700"
                                                : "bg-slate-50 border-slate-200"
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <FileText className="h-5 w-5 text-blue-500" />
                                            <div>
                                                <span
                                                    className={`text-sm font-medium ${
                                                        theme === "dark"
                                                            ? "text-slate-200"
                                                            : "text-slate-600"
                                                    }`}
                                                >
                                                    {file.name}
                                                </span>
                                                <p
                                                    className={`text-xs ${
                                                        theme === "dark"
                                                            ? "text-slate-400"
                                                            : "text-slate-400"
                                                    }`}
                                                >
                                                    {(file.size / 1024).toFixed(1)} KB
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeFile(index)}
                                            className={`${
                                                theme === "dark"
                                                    ? "text-red-400 hover:text-red-300 hover:bg-red-900/20"
                                                    : "text-red-600 hover:text-red-700 hover:bg-red-50"
                                            }`}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {isBalanceExceeded && (
                        <div className="p-3 text-center rounded-lg bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-700">
                            <p className="text-sm text-red-700 dark:text-red-300 font-medium flex items-center justify-center gap-2">
                                <AlertCircle className="h-4 w-4" />
                                You cannot request more leave days than your available balance.
                            </p>
                        </div>
                    )}

                    <DialogFooter className="gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleCancel}
                            className={`rounded-xl ${
                                theme === "dark"
                                    ? "border-gray-600 bg-gray-800 text-slate-200 hover:bg-gray-700"
                                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                            }`}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Submitting..." : "Submit Request"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
