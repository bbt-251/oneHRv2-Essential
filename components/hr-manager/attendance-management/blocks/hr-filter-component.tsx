"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar, Users, Filter, ChevronDown, X, AlertCircle } from "lucide-react";
import { useState } from "react";
import { EmployeeModel } from "@/lib/models/employee";
import getFullName from "@/lib/util/getEmployeeFullName";
import { useFirestore } from "@/context/firestore-context";

interface HRManagerFilterProps {
    selectedEmployees: string[];
    selectedDepartments: string[];
    selectedStatuses: string[];
    selectedDateFrom: string;
    selectedDateTo: string;
    onEmployeesChange: (employees: string[]) => void;
    onDepartmentsChange: (departments: string[]) => void;
    onStatusesChange: (statuses: string[]) => void;
    onDateFromChange: (date: string) => void;
    onDateToChange: (date: string) => void;
    onClearFilters: () => void;
    employees: EmployeeModel[];
}

const statuses = [
    {
        value: "pending",
        label: "Pending",
        color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    },
    {
        value: "approved",
        label: "Approved",
        color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    },
    {
        value: "rejected",
        label: "Rejected",
        color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    },
];

export function HRManagerFilter({
    selectedEmployees,
    selectedDepartments,
    selectedStatuses,
    selectedDateFrom,
    selectedDateTo,
    onEmployeesChange,
    onDepartmentsChange,
    onStatusesChange,
    onDateFromChange,
    onDateToChange,
    onClearFilters,
    employees,
}: HRManagerFilterProps) {
    const { hrSettings } = useFirestore();
    const [employeePopoverOpen, setEmployeePopoverOpen] = useState<boolean>(false);
    const [employeeSearch, setEmployeeSearch] = useState<string>("");
    const [departmentPopoverOpen, setDepartmentPopoverOpen] = useState<boolean>(false);
    const [statusPopoverOpen, setStatusPopoverOpen] = useState<boolean>(false);
    const departments = hrSettings.departmentSettings;
    const normalizedEmployeeSearch = employeeSearch.trim().toLowerCase();
    const filteredEmployees = employees.filter(employee => {
        if (!normalizedEmployeeSearch) return true;
        const fullName = getFullName(employee).toLowerCase();
        const employeeId = employee.employeeID?.toLowerCase() ?? "";
        return (
            fullName.includes(normalizedEmployeeSearch) ||
            employeeId.includes(normalizedEmployeeSearch)
        );
    });

    // Event handlers
    const handleEmployeeToggle = (employeeId: string) => {
        if (selectedEmployees.includes(employeeId)) {
            onEmployeesChange(selectedEmployees.filter(id => id !== employeeId));
        } else {
            onEmployeesChange([...selectedEmployees, employeeId]);
        }
    };

    const handleDepartmentToggle = (department: string) => {
        if (selectedDepartments.includes(department)) {
            onDepartmentsChange(selectedDepartments.filter(d => d !== department));
        } else {
            onDepartmentsChange([...selectedDepartments, department]);
        }
    };

    const handleStatusToggle = (status: string) => {
        if (selectedStatuses.includes(status)) {
            onStatusesChange(selectedStatuses.filter(s => s !== status));
        } else {
            onStatusesChange([...selectedStatuses, status]);
        }
    };

    // Remove filter items
    const removeEmployee = (employeeId: string) => {
        onEmployeesChange(selectedEmployees.filter(id => id !== employeeId));
    };

    const removeDepartment = (department: string) => {
        onDepartmentsChange(selectedDepartments.filter(d => d !== department));
    };

    const removeStatus = (status: string) => {
        onStatusesChange(selectedStatuses.filter(s => s !== status));
    };

    const hasActiveFilters =
        selectedEmployees.length > 0 ||
        selectedDepartments.length > 0 ||
        selectedStatuses.length > 0 ||
        selectedDateFrom ||
        selectedDateTo;

    return (
        <Card className="w-full border-0 shadow-sm bg-white dark:bg-black dark:border">
            <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Filter className="h-5 w-5 text-[#3f3d56] dark:text-gray-200" />
                    <h3
                        className="text-lg font-semibold text-[#3f3d56] dark:text-gray-100"
                        style={{ fontFamily: "Montserrat, sans-serif" }}
                    >
                        Filter Requests
                    </h3>
                    {hasActiveFilters && (
                        <Badge className="bg-[#ffe6a7] text-[#3f3d56] hover:bg-[#ffe6a7] dark:bg-yellow-700 dark:text-gray-900">
                            <span style={{ fontFamily: "Montserrat, sans-serif" }}>
                                {selectedEmployees.length +
                                    selectedDepartments.length +
                                    selectedStatuses.length +
                                    (selectedDateFrom ? 1 : 0) +
                                    (selectedDateTo ? 1 : 0)}{" "}
                                active
                            </span>
                        </Badge>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
                    {/* Employee Filter */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-[#3f3d56] dark:text-gray-200">
                            <Users className="h-4 w-4 inline mr-2" />
                            Filter by Employees
                        </Label>
                        <Popover
                            open={employeePopoverOpen}
                            onOpenChange={open => {
                                setEmployeePopoverOpen(open);
                                if (!open) setEmployeeSearch("");
                            }}
                        >
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="w-full justify-between text-left font-normal bg-transparent dark:border-gray-700 dark:text-gray-200"
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
                            <PopoverContent
                                className="w-80 p-0 bg-white dark:bg-gray-800 border dark:border-gray-700"
                                align="start"
                            >
                                <div className="p-4 space-y-2">
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="font-medium text-[#3f3d56] dark:text-gray-100">
                                            Select Employees
                                        </h4>
                                        {selectedEmployees.length > 0 && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onEmployeesChange([])}
                                                className="text-xs text-[#3f3d56] dark:text-gray-200"
                                            >
                                                Clear All
                                            </Button>
                                        )}
                                    </div>
                                    <Input
                                        value={employeeSearch}
                                        onChange={e => setEmployeeSearch(e.target.value)}
                                        placeholder="Search employees..."
                                        className="mb-2 dark:border-gray-700 dark:bg-black dark:text-gray-200"
                                    />
                                    <div className="max-h-64 overflow-y-auto space-y-2">
                                        {filteredEmployees.length > 0 ? (
                                            filteredEmployees.map(employee => (
                                                <div
                                                    key={employee.uid}
                                                    className="flex items-center space-x-2"
                                                >
                                                    <Checkbox
                                                        id={employee.uid}
                                                        checked={selectedEmployees.includes(
                                                            employee.uid,
                                                        )}
                                                        onCheckedChange={() =>
                                                            handleEmployeeToggle(employee.uid)
                                                        }
                                                    />
                                                    <label
                                                        htmlFor={employee.uid}
                                                        className="text-sm font-medium leading-none cursor-pointer flex-1 text-gray-700 dark:text-gray-200"
                                                    >
                                                        {getFullName(employee)}
                                                    </label>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-sm text-[#3f3d56] opacity-70 dark:text-gray-300">
                                                No employees found.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>

                        {selectedEmployees.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                                {selectedEmployees.map(employeeUid => (
                                    <Badge
                                        key={employeeUid}
                                        variant="secondary"
                                        className="text-xs bg-[#3f3d56] text-white hover:bg-[#3f3d56]/90 dark:bg-black dark:text-gray-100"
                                    >
                                        <span>
                                            {getFullName(
                                                employees.find(emp => emp.uid === employeeUid) ??
                                                    ({} as EmployeeModel),
                                            )}
                                        </span>
                                        <X
                                            className="h-3 w-3 ml-1 cursor-pointer"
                                            onClick={() => removeEmployee(employeeUid)}
                                        />
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Department Filter */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-[#3f3d56] dark:text-gray-200">
                            <Users className="h-4 w-4 inline mr-2" />
                            Filter by Departments
                        </Label>
                        <Popover
                            open={departmentPopoverOpen}
                            onOpenChange={setDepartmentPopoverOpen}
                        >
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="w-full justify-between text-left font-normal bg-transparent dark:border-gray-700 dark:text-gray-200"
                                >
                                    <span className="truncate">
                                        {selectedDepartments.length === 0
                                            ? "Select departments..."
                                            : `${selectedDepartments.length} department${
                                                selectedDepartments.length > 1 ? "s" : ""
                                            } selected`}
                                    </span>
                                    <ChevronDown className="h-4 w-4 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent
                                className="w-80 p-0 bg-white dark:bg-gray-800 border dark:border-gray-700"
                                align="start"
                            >
                                <div className="p-4 space-y-2">
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="font-medium text-[#3f3d56] dark:text-gray-100">
                                            Select Departments
                                        </h4>
                                        {selectedDepartments.length > 0 && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onDepartmentsChange([])}
                                                className="text-xs text-[#3f3d56] dark:text-gray-200"
                                            >
                                                Clear All
                                            </Button>
                                        )}
                                    </div>
                                    {departments.map(department => (
                                        <div
                                            key={department.id}
                                            className="flex items-center space-x-2"
                                        >
                                            <Checkbox
                                                id={department.id}
                                                checked={selectedDepartments.includes(
                                                    department.id,
                                                )}
                                                onCheckedChange={() =>
                                                    handleDepartmentToggle(department.id)
                                                }
                                            />
                                            <label
                                                htmlFor={department.id}
                                                className="text-sm font-medium leading-none cursor-pointer flex-1 text-gray-700 dark:text-gray-200"
                                            >
                                                {department.name}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </PopoverContent>
                        </Popover>

                        {selectedDepartments.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                                {selectedDepartments.map(id => (
                                    <Badge
                                        key={id}
                                        variant="secondary"
                                        className="text-xs bg-[#3f3d56] text-white hover:bg-[#3f3d56]/90 dark:bg-black dark:text-gray-100"
                                    >
                                        <span>{departments.find(d => d.id == id)?.name ?? ""}</span>
                                        <X
                                            className="h-3 w-3 ml-1 cursor-pointer"
                                            onClick={() => removeDepartment(id)}
                                        />
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Status Filter */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-[#3f3d56] dark:text-gray-200">
                            <AlertCircle className="h-4 w-4 inline mr-2" />
                            Filter by Status
                        </Label>
                        <Popover open={statusPopoverOpen} onOpenChange={setStatusPopoverOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="w-full justify-between text-left font-normal bg-transparent dark:border-gray-700 dark:text-gray-200"
                                >
                                    <span className="truncate">
                                        {selectedStatuses.length === 0
                                            ? "Select statuses..."
                                            : `${selectedStatuses.length} status${
                                                selectedStatuses.length > 1 ? "es" : ""
                                            } selected`}
                                    </span>
                                    <ChevronDown className="h-4 w-4 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent
                                className="w-80 p-0 bg-white dark:bg-gray-800 border dark:border-gray-700"
                                align="start"
                            >
                                <div className="p-4 space-y-2">
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="font-medium text-[#3f3d56] dark:text-gray-100">
                                            Select Statuses
                                        </h4>
                                        {selectedStatuses.length > 0 && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onStatusesChange([])}
                                                className="text-xs text-[#3f3d56] dark:text-gray-200"
                                            >
                                                Clear All
                                            </Button>
                                        )}
                                    </div>
                                    {statuses.map(status => (
                                        <div
                                            key={status.value}
                                            className="flex items-center space-x-2"
                                        >
                                            <Checkbox
                                                id={status.value}
                                                checked={selectedStatuses.includes(status.value)}
                                                onCheckedChange={() =>
                                                    handleStatusToggle(status.value)
                                                }
                                            />
                                            <label
                                                htmlFor={status.value}
                                                className="text-sm font-medium leading-none cursor-pointer flex-1 flex items-center text-gray-700 dark:text-gray-200"
                                            >
                                                <Badge className={`${status.color} mr-2 text-xs`}>
                                                    {status.label}
                                                </Badge>
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </PopoverContent>
                        </Popover>

                        {selectedStatuses.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                                {selectedStatuses.map(status => {
                                    const statusObj = statuses.find(s => s.value === status);
                                    return (
                                        <Badge
                                            key={status}
                                            variant="secondary"
                                            className="text-xs bg-[#3f3d56] text-white hover:bg-[#3f3d56]/90 dark:bg-black dark:text-gray-100"
                                        >
                                            <span>{statusObj?.label || status}</span>
                                            <X
                                                className="h-3 w-3 ml-1 cursor-pointer"
                                                onClick={() => removeStatus(status)}
                                            />
                                        </Badge>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Date Range */}
                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-[#3f3d56] dark:text-gray-200">
                            <Calendar className="h-4 w-4 inline mr-2" />
                            Filter by Date Range
                        </Label>
                        <div className="grid grid-cols-1 gap-2">
                            <Input
                                type="date"
                                value={selectedDateFrom}
                                onChange={e => onDateFromChange(e.target.value)}
                                className="w-full text-sm dark:border-gray-700 dark:bg-black dark:text-gray-200"
                            />
                            <Input
                                type="date"
                                value={selectedDateTo}
                                onChange={e => onDateToChange(e.target.value)}
                                className="w-full text-sm dark:border-gray-700 dark:bg-black dark:text-gray-200"
                            />
                        </div>
                        {(selectedDateFrom || selectedDateTo) && (
                            <div className="flex flex-wrap gap-1 mt-2">
                                {selectedDateFrom && (
                                    <Badge
                                        variant="secondary"
                                        className="text-xs bg-[#3f3d56] text-white hover:bg-[#3f3d56]/90 dark:bg-black dark:border dark:text-gray-100"
                                    >
                                        <span>
                                            From: {new Date(selectedDateFrom).toLocaleDateString()}
                                        </span>
                                        <X
                                            className="h-3 w-3 ml-1 cursor-pointer"
                                            onClick={() => onDateFromChange("")}
                                        />
                                    </Badge>
                                )}
                                {selectedDateTo && (
                                    <Badge
                                        variant="secondary"
                                        className="text-xs bg-[#3f3d56] text-white hover:bg-[#3f3d56]/90 dark:bg-black dark:border dark:text-gray-100"
                                    >
                                        <span>
                                            To: {new Date(selectedDateTo).toLocaleDateString()}
                                        </span>
                                        <X
                                            className="h-3 w-3 ml-1 cursor-pointer"
                                            onClick={() => onDateToChange("")}
                                        />
                                    </Badge>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end mt-6">
                    <Button
                        variant="outline"
                        onClick={onClearFilters}
                        disabled={!hasActiveFilters}
                        className="text-[#3f3d56] dark:text-white border-gray-200 hover:bg-gray-50 bg-transparent disabled:opacity-50"
                        style={{ fontFamily: "Montserrat, sans-serif" }}
                    >
                        Clear All Filters
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
