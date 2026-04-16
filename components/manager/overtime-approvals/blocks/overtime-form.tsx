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
import { EmployeeModel } from "@/lib/models/employee";
import { timestampFormat } from "@/lib/util/dayjs_format";
import getFullName from "@/lib/util/getEmployeeFullName";
import dayjs from "dayjs";
import { Calendar, Check, ChevronsUpDown, Clock, Loader } from "lucide-react";
import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { OvertimeConfigurationModel } from "@/lib/backend/firebase/hrSettingsService";

interface ManagerOvertimeFormProps {
    isOpen: boolean;
    isRequestLoading: boolean;
    reportees: EmployeeModel[];
    overtimeTypes: OvertimeConfigurationModel[];
    onClose: () => void;
    onSubmit: (data: any) => Promise<boolean>;
}

export interface OvertimeFormData {
    timestamp: string;
    overtimeDate: string;
    overtimeStartTime: string;
    overtimeEndTime: string;
    overtimeType: string;
    employees: string[];
    overtimeGoal: string;
    overtimeJustification: string;
}

export function OvertimeForm({
    isOpen,
    isRequestLoading,
    reportees,
    overtimeTypes,
    onClose,
    onSubmit,
}: ManagerOvertimeFormProps) {
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const [open, setOpen] = useState(false);

    const [formData, setFormData] = useState<OvertimeFormData>({
        timestamp: dayjs().format(timestampFormat),
        overtimeDate: "",
        overtimeStartTime: "",
        overtimeEndTime: "",
        overtimeType: "",
        employees: [],
        overtimeGoal: "",
        overtimeJustification: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await onSubmit(formData);
        if (res) {
            setFormData({
                timestamp: dayjs().format(timestampFormat),
                overtimeDate: "",
                overtimeStartTime: "",
                overtimeEndTime: "",
                overtimeType: "",
                employees: [],
                overtimeGoal: "",
                overtimeJustification: "",
            });
        }
    };

    const handleInputChange = (field: string, value: string | string[]) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const toggleSelection = (uid: string) => {
        let updated: string[];
        if (formData.employees.includes(uid)) {
            updated = formData.employees.filter(id => id !== uid);
        } else {
            updated = [...formData.employees, uid];
        }
        // setSelected(updated);
        handleInputChange("employees", updated); // keep your form in sync
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent
                className={`max-w-4xl max-h-[90vh] overflow-y-auto ${
                    isDark ? "bg-gray-900 text-white" : "bg-white"
                }`}
            >
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <DialogTitle
                            className={`text-xl font-semibold ${
                                isDark ? "text-white" : "text-[#3f3d56]"
                            }`}
                            style={{ fontFamily: "Montserrat, sans-serif" }}
                        >
                            Submit Overtime Request
                        </DialogTitle>
                    </div>
                </DialogHeader>

                <Card
                    className={`border-0 shadow-sm ${
                        isDark ? "bg-gray-800 text-white" : "bg-white"
                    }`}
                >
                    <CardContent className="p-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Date, Start Time, End Time Fields */}
                                {[
                                    {
                                        id: "overtimeDate",
                                        label: "Overtime Date",
                                        type: "date",
                                        icon: (
                                            <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        ),
                                    },
                                    {
                                        id: "overtimeStartTime",
                                        label: "Overtime Start Time",
                                        type: "time",
                                        icon: (
                                            <Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        ),
                                    },
                                    {
                                        id: "overtimeEndTime",
                                        label: "Overtime End Time",
                                        type: "time",
                                        icon: (
                                            <Clock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        ),
                                    },
                                ].map(({ id, label, type, icon }) => (
                                    <div key={id} className="space-y-2">
                                        <Label
                                            htmlFor={id}
                                            className={`text-sm font-medium flex items-center gap-1 ${
                                                isDark ? "text-slate-300" : "text-[#3f3d56]"
                                            }`}
                                            style={{
                                                fontFamily: "Montserrat, sans-serif",
                                            }}
                                        >
                                            <span className="text-red-500">*</span>
                                            {label} :
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                id={id}
                                                type={type}
                                                value={(formData as any)[id]}
                                                onChange={e =>
                                                    handleInputChange(id, e.target.value)
                                                }
                                                className={`w-full pr-10 ${
                                                    isDark ? "bg-gray-700 text-white" : ""
                                                }`}
                                                required
                                            />
                                            {icon}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Overtime Type */}
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="overtimeType"
                                        className={`text-sm font-medium flex items-center gap-1 ${
                                            isDark ? "text-slate-300" : "text-[#3f3d56]"
                                        }`}
                                        style={{
                                            fontFamily: "Montserrat, sans-serif",
                                        }}
                                    >
                                        <span className="text-red-500">*</span>
                                        Overtime Type :
                                    </Label>
                                    <Select
                                        value={formData.overtimeType}
                                        onValueChange={value =>
                                            handleInputChange("overtimeType", value)
                                        }
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select overtime type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {overtimeTypes
                                                .filter(ot => ot.active == "Yes")
                                                .map(type => (
                                                    <SelectItem key={type.id} value={type.id}>
                                                        {type.overtimeType}
                                                    </SelectItem>
                                                ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Employee */}
                                {/* <div className="space-y-2">
                                    <Label
                                        htmlFor="employee"
                                        className={`text-sm font-medium flex items-center gap-1 ${
                                            isDark
                                                ? "text-slate-300"
                                                : "text-[#3f3d56]"
                                        }`}
                                        style={{
                                            fontFamily:
                                                "Montserrat, sans-serif",
                                        }}
                                    >
                                        <span className="text-red-500">*</span>
                                        Employees :
                                    </Label> */}
                                <div className="space-y-2">
                                    <Label
                                        htmlFor="employee"
                                        className={cn(
                                            "text-sm font-medium flex items-center gap-1",
                                            isDark ? "text-slate-300" : "text-[#3f3d56]",
                                        )}
                                        style={{
                                            fontFamily: "Montserrat, sans-serif",
                                        }}
                                    >
                                        <span className="text-red-500">*</span>
                                        Employees :
                                    </Label>

                                    <Popover open={open} onOpenChange={setOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                className="w-full justify-between"
                                            >
                                                {formData.employees.length > 0
                                                    ? `${formData.employees.length} selected`
                                                    : "Select employees"}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>

                                        <PopoverContent className="w-[300px] p-0">
                                            <Command>
                                                <CommandList>
                                                    <CommandGroup>
                                                        {reportees.map(
                                                            (employee: any, index: number) => (
                                                                <CommandItem
                                                                    key={index}
                                                                    onSelect={() =>
                                                                        toggleSelection(
                                                                            employee.uid,
                                                                        )
                                                                    }
                                                                >
                                                                    <Check
                                                                        className={cn(
                                                                            "mr-2 h-4 w-4",
                                                                            formData.employees.includes(
                                                                                employee.uid,
                                                                            )
                                                                                ? "opacity-100"
                                                                                : "opacity-0",
                                                                        )}
                                                                    />
                                                                    {getFullName(employee)}
                                                                </CommandItem>
                                                            ),
                                                        )}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                {/* </div> */}
                            </div>

                            {/* Goal & Justification */}
                            {[
                                {
                                    id: "overtimeGoal",
                                    label: "Overtime Goal",
                                    placeholder:
                                        "Describe the goal and objectives for this overtime work...",
                                },
                                {
                                    id: "overtimeJustification",
                                    label: "Overtime Justification",
                                    placeholder:
                                        "Provide justification for why this overtime is necessary...",
                                },
                            ].map(({ id, label, placeholder }) => (
                                <div key={id} className="space-y-2">
                                    <Label
                                        htmlFor={id}
                                        className={`text-sm font-medium flex items-center gap-1 ${
                                            isDark ? "text-slate-300" : "text-[#3f3d56]"
                                        }`}
                                        style={{
                                            fontFamily: "Montserrat, sans-serif",
                                        }}
                                    >
                                        <span className="text-red-500">*</span>
                                        {label} :
                                    </Label>
                                    <Textarea
                                        id={id}
                                        placeholder={placeholder}
                                        value={(formData as any)[id]}
                                        onChange={e => handleInputChange(id, e.target.value)}
                                        className={`w-full min-h-[120px] resize-none ${
                                            isDark ? "bg-gray-700 text-white" : ""
                                        }`}
                                        required
                                    />
                                </div>
                            ))}

                            {/* Buttons */}
                            <div className="flex flex-col sm:flex-row gap-3 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={onClose}
                                    className={`flex-1 ${
                                        isDark
                                            ? "border-gray-700 text-slate-200 hover:bg-gray-800"
                                            : "border-gray-200 text-[#3f3d56] hover:bg-gray-50"
                                    }`}
                                    style={{
                                        fontFamily: "Montserrat, sans-serif",
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isRequestLoading}
                                    className="flex-1 bg-[#3f3d56] hover:bg-[#3f3d56]/90 text-white flex items-center justify-center gap-2"
                                    style={{
                                        fontFamily: "Montserrat, sans-serif",
                                    }}
                                >
                                    {isRequestLoading ? (
                                        <>
                                            <Loader className="animate-spin w-4 h-4" />
                                            Submitting...
                                        </>
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
