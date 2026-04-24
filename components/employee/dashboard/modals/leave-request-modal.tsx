"use client";

import type React from "react";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Upload, X, FileText, AlertCircle, User } from "lucide-react";
import { format } from "date-fns";
import { useData } from "@/context/app-data-context";
import { useAuth } from "@/context/authContext";
import randomUUID from "@/lib/util/randomUUID";

interface LeaveRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function LeaveRequestModal({ isOpen, onClose }: LeaveRequestModalProps) {
    const { userData } = useAuth();
    const { activeEmployees: allEmployees, leaveTypes: leaveTypeRecords } = useData();

    const [formData, setFormData] = useState<{
        leaveType: string;
        standIn: string;
        employee: string;
        startDate: Date | undefined;
        endDate: Date | undefined;
        returnDate: Date | undefined;
        reason: string;
        onBehalf: boolean;
        attachments: File[];
    }>({
        leaveType: "",
        standIn: "",
        employee: "",
        startDate: undefined as Date | undefined,
        endDate: undefined as Date | undefined,
        returnDate: undefined as Date | undefined,
        reason: "",
        onBehalf: false,
        attachments: [] as File[],
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [requestId] = useState<string>(() => `LR-${randomUUID().slice(0, 8).toUpperCase()}`);

    // Get leave types from Firebase
    const leaveTypes = leaveTypeRecords
        .filter(lt => lt.active === "Yes")
        .map(lt => ({
            value: lt.id,
            label: lt.name,
        }));

    // Get stand-in options from active employees
    const standInOptions = allEmployees
        .filter(emp => emp.uid !== userData?.uid)
        .map(emp => ({
            value: emp.uid,
            label: `${emp.firstName} ${emp.surname}`,
        }));

    // Get employees for on-behalf requests
    const employees = allEmployees.map(emp => ({
        value: emp.uid,
        label: `${emp.firstName} ${emp.surname}`,
        department: emp.department,
        position: emp.employmentPosition,
    }));

    const calculateLeaveDays = () => {
        if (formData.startDate && formData.endDate) {
            const diffTime = Math.abs(formData.endDate.getTime() - formData.startDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
            return diffDays;
        }
        return 0;
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

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.leaveType) newErrors.leaveType = "Leave type is required";
        if (!formData.startDate) newErrors.startDate = "Start date is required";
        if (!formData.endDate) newErrors.endDate = "End date is required";
        if (!formData.reason.trim()) newErrors.reason = "Reason is required";
        if (formData.onBehalf && !formData.employee)
            newErrors.employee = "Employee selection is required";
        if (formData.startDate && formData.endDate && formData.startDate > formData.endDate) {
            newErrors.endDate = "End date must be after start date";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validateForm()) {
            // Handle form submission
            onClose();
        }
    };

    const handleOnBehalfChange = (checked: boolean) => {
        setFormData(prev => ({
            ...prev,
            onBehalf: checked,
            employee: checked ? prev.employee : "", // Clear employee if unchecked
        }));
        // Clear employee error when unchecking
        if (!checked && errors.employee) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors.employee;
                return newErrors;
            });
        }
    };

    const selectedEmployee = employees.find(emp => emp.value === formData.employee);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-semibold text-primary-500 flex items-center gap-2">
                        <FileText className="h-6 w-6" />
                        Submit Leave Request
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 mt-6">
                    {/* Request ID */}
                    <div className="bg-secondary-50 p-4 rounded-lg border border-secondary-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <Label className="text-sm font-medium text-primary-500">
                                    Request ID
                                </Label>
                                <p className="text-lg font-mono text-primary-600 mt-1">
                                    {requestId}
                                </p>
                            </div>
                            <Badge className="bg-secondary-200 text-primary-700">Draft</Badge>
                        </div>
                    </div>

                    {/* On Behalf Checkbox */}
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="onBehalf"
                            checked={formData.onBehalf}
                            onCheckedChange={handleOnBehalfChange}
                        />
                        <Label htmlFor="onBehalf" className="text-sm text-primary-500">
                            Request leave on someone&apos;s behalf
                        </Label>
                    </div>

                    {/* Employee Selection (shown when on behalf is checked) */}
                    {formData.onBehalf && (
                        <div className="space-y-2 p-4 bg-primary-50 rounded-lg border border-primary-200">
                            <Label
                                htmlFor="employee"
                                className="text-sm font-medium text-primary-500 flex items-center gap-2"
                            >
                                <User className="h-4 w-4" />
                                Select Employee *
                            </Label>
                            <Select
                                value={formData.employee}
                                onValueChange={value =>
                                    setFormData(prev => ({ ...prev, employee: value }))
                                }
                            >
                                <SelectTrigger
                                    className={`border-secondary-300 focus:border-primary-500 bg-white ${errors.employee ? "border-accent-500" : ""}`}
                                >
                                    <SelectValue placeholder="Choose an employee" />
                                </SelectTrigger>
                                <SelectContent>
                                    {employees.map(employee => (
                                        <SelectItem key={employee.value} value={employee.value}>
                                            <div className="flex flex-col">
                                                <span className="font-medium">
                                                    {employee.label}
                                                </span>
                                                <span className="text-xs text-primary-400">
                                                    {employee.position} • {employee.department}
                                                </span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.employee && (
                                <p className="text-xs text-accent-600 flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    {errors.employee}
                                </p>
                            )}
                            {selectedEmployee && (
                                <div className="mt-2 p-3 bg-white rounded-md border border-secondary-200">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                                            <span className="text-white text-sm font-medium">
                                                {selectedEmployee.label
                                                    .split(" ")
                                                    .map(n => n[0])
                                                    .join("")}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="font-medium text-primary-600">
                                                {selectedEmployee.label}
                                            </p>
                                            <p className="text-xs text-primary-400">
                                                {selectedEmployee.position} •{" "}
                                                {selectedEmployee.department}
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
                                htmlFor="leaveType"
                                className="text-sm font-medium text-primary-500"
                            >
                                Leave Type *
                            </Label>
                            <Select
                                value={formData.leaveType}
                                onValueChange={value =>
                                    setFormData(prev => ({ ...prev, leaveType: value }))
                                }
                            >
                                <SelectTrigger
                                    className={`border-secondary-300 focus:border-primary-500 ${errors.leaveType ? "border-accent-500" : ""}`}
                                >
                                    <SelectValue placeholder="Select leave type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {leaveTypes.map(type => (
                                        <SelectItem key={type.value} value={type.value}>
                                            {type.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.leaveType && (
                                <p className="text-xs text-accent-600 flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    {errors.leaveType}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label
                                htmlFor="standIn"
                                className="text-sm font-medium text-primary-500"
                            >
                                Stand In
                            </Label>
                            <Select
                                value={formData.standIn}
                                onValueChange={value =>
                                    setFormData(prev => ({ ...prev, standIn: value }))
                                }
                            >
                                <SelectTrigger className="border-secondary-300 focus:border-primary-500">
                                    <SelectValue placeholder="Select stand-in person" />
                                </SelectTrigger>
                                <SelectContent>
                                    {standInOptions.map(person => (
                                        <SelectItem key={person.value} value={person.value}>
                                            {person.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Date Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-primary-500">
                                First Day of Leave *
                            </Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={`w-full justify-start text-left font-normal border-secondary-300 focus:border-primary-500 ${errors.startDate ? "border-accent-500" : ""}`}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {formData.startDate
                                            ? format(formData.startDate, "PPP")
                                            : "Select date"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={formData.startDate}
                                        onSelect={date =>
                                            setFormData(prev => ({ ...prev, startDate: date }))
                                        }
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                            {errors.startDate && (
                                <p className="text-xs text-accent-600 flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    {errors.startDate}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-primary-500">
                                Last Day of Leave *
                            </Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={`w-full justify-start text-left font-normal border-secondary-300 focus:border-primary-500 ${errors.endDate ? "border-accent-500" : ""}`}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {formData.endDate
                                            ? format(formData.endDate, "PPP")
                                            : "Select date"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={formData.endDate}
                                        onSelect={date =>
                                            setFormData(prev => ({ ...prev, endDate: date }))
                                        }
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                            {errors.endDate && (
                                <p className="text-xs text-accent-600 flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    {errors.endDate}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-primary-500">
                                Date of Return
                            </Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start text-left font-normal border-secondary-300 focus:border-primary-500 bg-transparent"
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {formData.returnDate
                                            ? format(formData.returnDate, "PPP")
                                            : "Select date"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={formData.returnDate}
                                        onSelect={date =>
                                            setFormData(prev => ({ ...prev, returnDate: date }))
                                        }
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    {/* Leave Days Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-primary-50 p-6 rounded-lg border border-primary-200">
                            <Label className="text-sm font-medium text-primary-500">
                                Leave Days Requested
                            </Label>
                            <p className="text-3xl font-bold text-primary-600 mt-2">
                                {calculateLeaveDays()}
                            </p>
                            <p className="text-xs text-primary-400 mt-1">
                                Total days including weekends
                            </p>
                        </div>
                        <div className="bg-secondary-100 p-6 rounded-lg border border-secondary-300">
                            <Label className="text-sm font-medium text-primary-500">
                                Balance Leave Days
                            </Label>
                            <p className="text-3xl font-bold text-primary-600 mt-2">
                                {formData.onBehalf && selectedEmployee
                                    ? allEmployees.find(e => e.uid === formData.employee)
                                        ?.balanceLeaveDays || 0
                                    : userData?.balanceLeaveDays || 0}
                            </p>
                            <p className="text-xs text-primary-400 mt-1">Remaining annual leave</p>
                        </div>
                    </div>

                    {/* Reason */}
                    <div className="space-y-2">
                        <Label htmlFor="reason" className="text-sm font-medium text-primary-500">
                            Reason for Leave *
                        </Label>
                        <Textarea
                            id="reason"
                            placeholder="Please provide a detailed reason for your leave request..."
                            value={formData.reason}
                            onChange={e =>
                                setFormData(prev => ({ ...prev, reason: e.target.value }))
                            }
                            className={`border-secondary-300 focus:border-primary-500 min-h-[120px] ${errors.reason ? "border-accent-500" : ""}`}
                        />
                        {errors.reason && (
                            <p className="text-xs text-accent-600 flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                {errors.reason}
                            </p>
                        )}
                    </div>

                    {/* Attachments */}
                    <div className="space-y-4">
                        <Label className="text-sm font-medium text-primary-500">Attachments</Label>

                        <div className="border-2 border-dashed border-secondary-300 rounded-lg p-8 text-center hover:border-primary-400 transition-colors">
                            <input
                                type="file"
                                multiple
                                onChange={handleFileUpload}
                                className="hidden"
                                id="file-upload"
                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            />
                            <label htmlFor="file-upload" className="cursor-pointer">
                                <Upload className="h-10 w-10 text-primary-400 mx-auto mb-3" />
                                <p className="text-sm text-primary-500 font-medium">
                                    Click to upload files
                                </p>
                                <p className="text-xs text-primary-400 mt-1">
                                    PDF, DOC, DOCX, JPG, PNG up to 10MB
                                </p>
                            </label>
                        </div>

                        {formData.attachments.length > 0 && (
                            <div className="space-y-3">
                                {formData.attachments.map((file, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-4 bg-secondary-50 rounded-lg border border-secondary-200"
                                    >
                                        <div className="flex items-center gap-3">
                                            <FileText className="h-5 w-5 text-primary-500" />
                                            <div>
                                                <span className="text-sm font-medium text-primary-600">
                                                    {file.name}
                                                </span>
                                                <p className="text-xs text-primary-400">
                                                    {(file.size / 1024).toFixed(1)} KB
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeFile(index)}
                                            className="text-accent-600 hover:text-accent-700 hover:bg-accent-50"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Form Actions */}
                    <div className="flex justify-end gap-4 pt-6 border-t border-secondary-200">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="border-secondary-300 bg-transparent px-6"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="bg-primary-500 hover:bg-primary-600 text-white px-8"
                        >
                            Submit Request
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
