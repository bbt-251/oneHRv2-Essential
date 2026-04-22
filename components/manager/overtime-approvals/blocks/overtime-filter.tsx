"use client";

import { useState } from "react";
import { useTheme } from "@/components/theme-provider";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar, Clock, Users, Filter, ChevronDown, X } from "lucide-react";
import { EmployeeModel } from "@/lib/models/employee";
import getFullName from "@/lib/util/getEmployeeFullName";
import { OvertimeConfigurationModel } from "@/lib/backend/hr-settings-service";

interface ManagerOvertimeFilterProps {
    employees: EmployeeModel[];
    selectedEmployees: string[];
    selectedOvertimeTypes: string[];
    selectedDateFrom: string;
    selectedDateTo: string;
    selectedTimeFrom: string;
    selectedTimeTo: string;
    overtimeTypes: OvertimeConfigurationModel[];
    onEmployeesChange: (employees: string[]) => void;
    onOvertimeTypesChange: (types: string[]) => void;
    onDateFromChange: (date: string) => void;
    onDateToChange: (date: string) => void;
    onTimeFromChange: (time: string) => void;
    onTimeToChange: (time: string) => void;
    onClearFilters: () => void;
}

export function OvertimeFilter({
    employees,
    selectedEmployees,
    selectedOvertimeTypes,
    selectedDateFrom,
    selectedDateTo,
    selectedTimeFrom,
    selectedTimeTo,
    overtimeTypes,
    onEmployeesChange,
    onOvertimeTypesChange,
    onDateFromChange,
    onDateToChange,
    onTimeFromChange,
    onTimeToChange,
    onClearFilters,
}: ManagerOvertimeFilterProps) {
    const { theme } = useTheme();
    const [employeePopoverOpen, setEmployeePopoverOpen] = useState<boolean>(false);
    const [typePopoverOpen, setTypePopoverOpen] = useState<boolean>(false);

    const handleEmployeeToggle = (employeeUid: string) => {
        onEmployeesChange(
            selectedEmployees.includes(employeeUid)
                ? selectedEmployees.filter(uid => uid !== employeeUid)
                : [...selectedEmployees, employeeUid],
        );
    };

    const handleOvertimeTypeToggle = (type: string) => {
        onOvertimeTypesChange(
            selectedOvertimeTypes.includes(type)
                ? selectedOvertimeTypes.filter(t => t !== type)
                : [...selectedOvertimeTypes, type],
        );
    };

    const hasActiveFilters =
        selectedEmployees.length > 0 ||
        selectedOvertimeTypes.length > 0 ||
        selectedDateFrom ||
        selectedDateTo ||
        selectedTimeFrom ||
        selectedTimeTo;

    const textColor = theme === "dark" ? "text-slate-200" : "text-[#3f3d56]";
    const subTextColor = theme === "dark" ? "text-slate-400" : "text-[#3f3d56]/70";
    const badgeBg = theme === "dark" ? "bg-slate-800 text-white" : "bg-[#3f3d56] text-white";
    const cardBg = theme === "dark" ? "bg-gray-900" : "bg-white";
    const inputBg = theme === "dark" ? "bg-gray-800 text-white" : "bg-white text-[#3f3d56]";
    const popoverBg = theme === "dark" ? "bg-gray-900 text-white" : "bg-white text-[#3f3d56]";

    return (
        <Card className={`w-full border-0 shadow-sm ${cardBg}`}>
            <CardContent className="p-6">
                {/* Header */}
                <div className="flex items-center gap-2 mb-4">
                    <Filter className={`h-5 w-5 ${textColor}`} />
                    <h3
                        className={`text-lg font-semibold ${textColor}`}
                        style={{ fontFamily: "Montserrat, sans-serif" }}
                    >
                        Filter Overtime Requests
                    </h3>
                    {hasActiveFilters && (
                        <Badge className="bg-[#ffe6a7] text-[#3f3d56] hover:bg-[#ffe6a7]">
                            <span style={{ fontFamily: "Montserrat, sans-serif" }}>
                                {selectedEmployees.length +
                                    selectedOvertimeTypes.length +
                                    (selectedDateFrom ? 1 : 0) +
                                    (selectedDateTo ? 1 : 0) +
                                    (selectedTimeFrom ? 1 : 0) +
                                    (selectedTimeTo ? 1 : 0)}{" "}
                                active
                            </span>
                        </Badge>
                    )}
                </div>

                {/* Filters Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {/* EMPLOYEES FILTER */}
                    <div className="space-y-2">
                        <Label
                            className={`text-sm font-medium ${textColor}`}
                            style={{ fontFamily: "Montserrat, sans-serif" }}
                        >
                            <Users className="h-4 w-4 inline mr-2" />
                            Filter by Employees
                        </Label>
                        <Popover open={employeePopoverOpen} onOpenChange={setEmployeePopoverOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={`w-full justify-between text-left font-normal ${inputBg} border-gray-300`}
                                    style={{
                                        fontFamily: "Montserrat, sans-serif",
                                    }}
                                >
                                    <span className="truncate">
                                        {selectedEmployees.length === 0
                                            ? "Select employees..."
                                            : `${selectedEmployees.length} employee${
                                                selectedEmployees.length > 1 ? "s" : ""
                                            } selected`}
                                    </span>
                                    <ChevronDown className="h-4 w-4 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className={`w-80 p-0 ${popoverBg}`} align="start">
                                <div className="p-4 space-y-2">
                                    <div className="flex items-center justify-between mb-3">
                                        <h4
                                            className={`font-medium ${textColor}`}
                                            style={{
                                                fontFamily: "Montserrat, sans-serif",
                                            }}
                                        >
                                            Select Employees
                                        </h4>
                                        {selectedEmployees.length > 0 && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onEmployeesChange([])}
                                                className={`text-xs ${subTextColor}`}
                                                style={{
                                                    fontFamily: "Montserrat, sans-serif",
                                                }}
                                            >
                                                Clear All
                                            </Button>
                                        )}
                                    </div>
                                    {employees.map(employee => (
                                        <div
                                            key={employee.uid}
                                            className="flex items-center space-x-2"
                                        >
                                            <Checkbox
                                                id={employee.uid}
                                                checked={selectedEmployees.includes(employee.uid)}
                                                onCheckedChange={() =>
                                                    handleEmployeeToggle(employee.uid)
                                                }
                                            />
                                            <label
                                                htmlFor={employee.uid}
                                                className={`text-sm font-medium flex-1 cursor-pointer ${subTextColor}`}
                                                style={{
                                                    fontFamily: "Montserrat, sans-serif",
                                                }}
                                            >
                                                {getFullName(employee)}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </PopoverContent>
                        </Popover>
                        {/* Selected Tags */}
                        <div className="flex flex-wrap gap-1 mt-2">
                            {selectedEmployees.map(uid => (
                                <Badge
                                    key={uid}
                                    variant="secondary"
                                    className={`text-xs ${badgeBg}`}
                                >
                                    <span
                                        style={{
                                            fontFamily: "Montserrat, sans-serif",
                                        }}
                                    >
                                        {getFullName(
                                            employees.find(e => e.uid === uid) ??
                                                ({} as EmployeeModel),
                                        )}
                                    </span>
                                    <X
                                        className="h-3 w-3 ml-1 cursor-pointer"
                                        onClick={() => handleEmployeeToggle(uid)}
                                    />
                                </Badge>
                            ))}
                        </div>
                    </div>

                    {/* OVERTIME TYPES FILTER */}
                    <div className="space-y-2">
                        <Label
                            className={`text-sm font-medium ${textColor}`}
                            style={{ fontFamily: "Montserrat, sans-serif" }}
                        >
                            <Clock className="h-4 w-4 inline mr-2" />
                            Filter by Overtime Types
                        </Label>
                        <Popover open={typePopoverOpen} onOpenChange={setTypePopoverOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={`w-full justify-between text-left font-normal ${inputBg} border-gray-300`}
                                    style={{
                                        fontFamily: "Montserrat, sans-serif",
                                    }}
                                >
                                    <span className="truncate">
                                        {selectedOvertimeTypes.length === 0
                                            ? "Select overtime types..."
                                            : `${selectedOvertimeTypes.length} type${
                                                selectedOvertimeTypes.length > 1 ? "s" : ""
                                            } selected`}
                                    </span>
                                    <ChevronDown className="h-4 w-4 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className={`w-80 p-0 ${popoverBg}`} align="start">
                                <div className="p-4 space-y-2">
                                    <div className="flex items-center justify-between mb-3">
                                        <h4
                                            className={`font-medium ${textColor}`}
                                            style={{
                                                fontFamily: "Montserrat, sans-serif",
                                            }}
                                        >
                                            Select Overtime Types
                                        </h4>
                                        {selectedOvertimeTypes.length > 0 && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onOvertimeTypesChange([])}
                                                className={`text-xs ${subTextColor}`}
                                                style={{
                                                    fontFamily: "Montserrat, sans-serif",
                                                }}
                                            >
                                                Clear All
                                            </Button>
                                        )}
                                    </div>
                                    {overtimeTypes
                                        .filter(ot => ot.active == "Yes")
                                        .map(type => (
                                            <div
                                                key={type.id}
                                                className="flex items-center space-x-2"
                                            >
                                                <Checkbox
                                                    id={type.id}
                                                    checked={selectedOvertimeTypes.includes(
                                                        type.id,
                                                    )}
                                                    onCheckedChange={() =>
                                                        handleOvertimeTypeToggle(type.id)
                                                    }
                                                />
                                                <label
                                                    htmlFor={type.id}
                                                    className={`text-sm font-medium flex-1 cursor-pointer ${subTextColor}`}
                                                    style={{
                                                        fontFamily: "Montserrat, sans-serif",
                                                    }}
                                                >
                                                    {type.overtimeType}
                                                </label>
                                            </div>
                                        ))}
                                </div>
                            </PopoverContent>
                        </Popover>
                        {/* Selected Tags */}
                        <div className="flex flex-wrap gap-1 mt-2">
                            {selectedOvertimeTypes.map(type => (
                                <Badge
                                    key={type}
                                    variant="secondary"
                                    className={`text-xs ${badgeBg}`}
                                >
                                    <span
                                        style={{
                                            fontFamily: "Montserrat, sans-serif",
                                        }}
                                    >
                                        {overtimeTypes.find(ot => ot.id == type)?.overtimeType ??
                                            ""}
                                    </span>
                                    <X
                                        className="h-3 w-3 ml-1 cursor-pointer"
                                        onClick={() => handleOvertimeTypeToggle(type)}
                                    />
                                </Badge>
                            ))}
                        </div>
                    </div>

                    {/* DATE RANGE */}
                    <div className="space-y-2">
                        <Label
                            className={`text-sm font-medium ${textColor}`}
                            style={{ fontFamily: "Montserrat, sans-serif" }}
                        >
                            <Calendar className="h-4 w-4 inline mr-2" />
                            Filter by Date Range
                        </Label>
                        <div className="grid grid-cols-2 gap-2">
                            <Input
                                type="date"
                                value={selectedDateFrom}
                                onChange={e => onDateFromChange(e.target.value)}
                                className={`text-sm ${inputBg}`}
                                style={{ fontFamily: "Montserrat, sans-serif" }}
                            />
                            <Input
                                type="date"
                                value={selectedDateTo}
                                onChange={e => onDateToChange(e.target.value)}
                                className={`text-sm ${inputBg}`}
                                style={{ fontFamily: "Montserrat, sans-serif" }}
                            />
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                            {selectedDateFrom && (
                                <Badge variant="secondary" className={`text-xs ${badgeBg}`}>
                                    From: {new Date(selectedDateFrom).toLocaleDateString()}
                                    <X
                                        className="h-3 w-3 ml-1 cursor-pointer"
                                        onClick={() => onDateFromChange("")}
                                    />
                                </Badge>
                            )}
                            {selectedDateTo && (
                                <Badge variant="secondary" className={`text-xs ${badgeBg}`}>
                                    To: {new Date(selectedDateTo).toLocaleDateString()}
                                    <X
                                        className="h-3 w-3 ml-1 cursor-pointer"
                                        onClick={() => onDateToChange("")}
                                    />
                                </Badge>
                            )}
                        </div>
                    </div>

                    {/* TIME RANGE */}
                    <div className="space-y-2">
                        <Label
                            className={`text-sm font-medium ${textColor}`}
                            style={{ fontFamily: "Montserrat, sans-serif" }}
                        >
                            <Clock className="h-4 w-4 inline mr-2" />
                            Filter by Time Range
                        </Label>
                        <div className="grid grid-cols-2 gap-2">
                            <Input
                                type="time"
                                value={selectedTimeFrom}
                                onChange={e => onTimeFromChange(e.target.value)}
                                className={`text-sm ${inputBg}`}
                                style={{ fontFamily: "Montserrat, sans-serif" }}
                            />
                            <Input
                                type="time"
                                value={selectedTimeTo}
                                onChange={e => onTimeToChange(e.target.value)}
                                className={`text-sm ${inputBg}`}
                                style={{ fontFamily: "Montserrat, sans-serif" }}
                            />
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                            {selectedTimeFrom && (
                                <Badge variant="secondary" className={`text-xs ${badgeBg}`}>
                                    From:{" "}
                                    {new Date(`2000-01-01T${selectedTimeFrom}`).toLocaleTimeString(
                                        [],
                                        {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        },
                                    )}
                                    <X
                                        className="h-3 w-3 ml-1 cursor-pointer"
                                        onClick={() => onTimeFromChange("")}
                                    />
                                </Badge>
                            )}
                            {selectedTimeTo && (
                                <Badge variant="secondary" className={`text-xs ${badgeBg}`}>
                                    To:{" "}
                                    {new Date(`2000-01-01T${selectedTimeTo}`).toLocaleTimeString(
                                        [],
                                        {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        },
                                    )}
                                    <X
                                        className="h-3 w-3 ml-1 cursor-pointer"
                                        onClick={() => onTimeToChange("")}
                                    />
                                </Badge>
                            )}
                        </div>
                    </div>

                    {/* CLEAR BUTTON */}
                    <div className="space-y-2 flex flex-col justify-end">
                        <Label className="text-sm font-medium text-transparent">Clear</Label>
                        <Button
                            variant="outline"
                            onClick={onClearFilters}
                            disabled={!hasActiveFilters}
                            className={`w-full border border-gray-300 ${
                                theme === "dark"
                                    ? "text-white bg-gray-800 hover:bg-gray-700"
                                    : "text-[#3f3d56] bg-white hover:bg-gray-50"
                            } disabled:opacity-50`}
                            style={{ fontFamily: "Montserrat, sans-serif" }}
                        >
                            Clear All Filters
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
