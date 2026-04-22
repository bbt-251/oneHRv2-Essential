"use client";

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
import { useTheme } from "@/components/theme-provider";
import { LeaveModel } from "@/lib/models/leave";
import { dateFormat } from "@/lib/util/dayjs_format";
import { CalendarIcon, Upload, X, FileText, AlertCircle, User, AlertTriangle } from "lucide-react";
import dayjs from "dayjs";
import { useLeaveRequestForm } from "@/lib/util/leave-request/use-leave-request-form";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/authContext";

interface EditLeaveRequestModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    leaveRequest: LeaveModel;
    onSuccess?: () => void;
}

export function EditLeaveRequestModal({
    open,
    onOpenChange,
    leaveRequest,
    onSuccess = () => {},
}: EditLeaveRequestModalProps) {
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
    } = useLeaveRequestForm({
        initialData: leaveRequest,
        isEditing: true,
        onSuccess,
        onOpenChange,
    });
    const { userData } = useAuth();

    const { leaveTypes, positions, departmentSettings, backdateCapabilities } = hrSettings;
    const annualLeaveType = {
        id: "annual-paid-leave",
        name: "Annual Paid Leave",
        authorizedDays: 0,
        active: "Yes",
    };
    const unpaidLeaveType = {
        id: "unpaid-leave",
        name: "Unpaid Leave",
        authorizedDays: 0,
        active: "Yes",
    };
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

    // Prevent editing if leave is not in requested state
    const canEdit = leaveRequest.leaveState === "Requested";
    if (!canEdit && open) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent
                    className={`sm:max-w-[500px] ${
                        theme === "dark" ? "bg-black border-gray-800" : "bg-white"
                    }`}
                >
                    <DialogHeader>
                        <DialogTitle
                            className={`text-2xl font-semibold flex items-center gap-2 ${
                                theme === "dark" ? "text-white" : "text-slate-900"
                            }`}
                        >
                            <AlertTriangle className="h-6 w-6 text-yellow-500" />
                            Cannot Edit Leave Request
                        </DialogTitle>
                        <DialogDescription
                            className={theme === "dark" ? "text-slate-300" : "text-slate-600"}
                        >
                            This leave request cannot be edited because it is{" "}
                            {leaveRequest.leaveState.toLowerCase()}. Only leave requests in
                            &quot;Requested&quot; state can be modified.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            onClick={() => onOpenChange(false)}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    }

    const availableBalance = userData?.balanceLeaveDays || 0;
    const isBalanceExceeded = formData.numberOfLeaveDaysRequested > availableBalance;

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
                        Edit Leave Request
                    </DialogTitle>
                    <DialogDescription
                        className={theme === "dark" ? "text-slate-300" : "text-slate-600"}
                    >
                        Update your leave request details. All fields marked with{" "}
                        <span className="text-red-500">*</span> are required.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Request ID and Status */}
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
                                        ? "bg-yellow-900/50 text-yellow-200 border-yellow-700"
                                        : "bg-yellow-100 text-yellow-800 border-yellow-300"
                                } border`}
                            >
                                {leaveRequest.leaveState}
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
                            {errors.standIn && (
                                <p className="text-sm text-red-500">{errors.standIn}</p>
                            )}
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
                            <p
                                className={`text-3xl font-bold mt-2 ${
                                    theme === "dark" ? "text-blue-300" : "text-blue-700"
                                }`}
                            >
                                {formData.numberOfLeaveDaysRequested}
                            </p>
                            <p
                                className={`text-xs mt-1 ${theme === "dark" ? "text-blue-400" : "text-blue-500"}`}
                            >
                                Working days excluding weekends
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
                                    : authorizedDays}
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
                            disabled={isSubmitting || !canEdit}
                        >
                            {isSubmitting ? "Updating..." : "Update Request"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
