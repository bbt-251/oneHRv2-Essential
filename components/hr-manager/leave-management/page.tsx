"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Columns, Filter, X, Calendar, Users } from "lucide-react";
import { useFirestore } from "@/context/firestore-context";
import LeaveTable from "./blocks/leave-table";
import { useTheme } from "@/components/theme-provider";

// Helper hook to get effective theme (handles "system" option)
function useEffectiveTheme() {
    const { theme } = useTheme();
    const [effectiveTheme, setEffectiveTheme] = useState<"light" | "dark">("light");

    useEffect(() => {
        if (theme === "system") {
            const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
                ? "dark"
                : "light";
            setEffectiveTheme(systemTheme);

            const listener = (e: MediaQueryListEvent) => {
                setEffectiveTheme(e.matches ? "dark" : "light");
            };
            window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", listener);
            return () =>
                window
                    .matchMedia("(prefers-color-scheme: dark)")
                    .removeEventListener("change", listener);
        } else {
            setEffectiveTheme(theme as "light" | "dark");
        }
    }, [theme]);

    return effectiveTheme;
}

// Column definitions for HR view
const hrColumnDefinitions = [
    { key: "timestamp", label: "Timestamp", defaultVisible: true },
    { key: "employee", label: "Employee", defaultVisible: true },
    { key: "department", label: "Department", defaultVisible: true },
    { key: "leaveRequestId", label: "Request ID", defaultVisible: true },
    { key: "leaveState", label: "Leave State", defaultVisible: true },
    { key: "leaveStage", label: "Leave Stage", defaultVisible: true },
    { key: "leaveType", label: "Leave Type", defaultVisible: true },
    { key: "standIn", label: "Stand In", defaultVisible: true },
    { key: "authorizedDays", label: "Authorized Days", defaultVisible: true },
    { key: "firstDayOfLeave", label: "First Day", defaultVisible: true },
    { key: "lastDayOfLeave", label: "Last Day", defaultVisible: true },
    { key: "dateOfReturn", label: "Return Date", defaultVisible: true },
    { key: "numberOfLeaveDaysRequested", label: "Days Requested", defaultVisible: true },
    { key: "halfDayOption", label: "Half Day", defaultVisible: true },
    { key: "rollbackStatus", label: "Rollback Status", defaultVisible: false },
];

export default function HRLeaveManagement() {
    const theme = useEffectiveTheme();
    const { leaveManagements, employees } = useFirestore();

    // HR sees all leave requests, sorted by timestamp (latest first)
    const leaveRequests = useMemo(() => {
        return [...leaveManagements].sort(
            (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        );
    }, [leaveManagements]);

    const [hrFilters, setHrFilters] = useState({
        employee: "",
        department: "",
        leaveRequestId: "",
        leaveState: "",
        leaveStage: "",
        leaveType: "",
        standIn: "",
        startDate: "",
        endDate: "",
        minDays: "",
        maxDays: "",
        rollbackStatus: "",
    });

    // Clear all filters for HR view
    const clearHrFilters = () => {
        setHrFilters({
            employee: "",
            department: "",
            leaveRequestId: "",
            leaveState: "",
            leaveStage: "",
            leaveType: "",
            standIn: "",
            startDate: "",
            endDate: "",
            minDays: "",
            maxDays: "",
            rollbackStatus: "",
        });
    };

    // Column visibility state for HR view
    const [hrVisibleColumns, setHrVisibleColumns] = useState(() => {
        const initial: Record<string, boolean> = {};
        hrColumnDefinitions.forEach(col => {
            initial[col.key] = col.defaultVisible;
        });
        return initial;
    });

    // Toggle column visibility for HR view
    const toggleHrColumn = (columnKey: string) => {
        setHrVisibleColumns(prev => ({
            ...prev,
            [columnKey]: !prev[columnKey],
        }));
    };

    // Filter all leave requests for HR view
    const filteredHrRequests = useMemo(() => {
        return leaveRequests.filter(request => {
            const employee = employees.find((emp: any) => emp.uid === request.employeeID);

            const matchesEmployee =
                !hrFilters.employee ||
                employee?.firstName?.toLowerCase().includes(hrFilters.employee.toLowerCase()) ||
                employee?.surname?.toLowerCase().includes(hrFilters.employee.toLowerCase());

            const matchesDepartment =
                !hrFilters.department ||
                hrFilters.department === "all" ||
                employee?.department?.toLowerCase().includes(hrFilters.department.toLowerCase());

            const matchesRequestId =
                !hrFilters.leaveRequestId ||
                request.leaveRequestID
                    .toLowerCase()
                    .includes(hrFilters.leaveRequestId.toLowerCase());

            const matchesState =
                !hrFilters.leaveState || request.leaveState === hrFilters.leaveState;

            const matchesStage =
                !hrFilters.leaveStage ||
                request.leaveStage.toLowerCase().includes(hrFilters.leaveStage.toLowerCase());

            const matchesType = !hrFilters.leaveType || request.leaveType === hrFilters.leaveType;

            const matchesStandIn =
                !hrFilters.standIn ||
                request.standIn?.toLowerCase().includes(hrFilters.standIn.toLowerCase());

            const matchesStartDate =
                !hrFilters.startDate ||
                new Date(request.firstDayOfLeave) >= new Date(hrFilters.startDate);

            const matchesEndDate =
                !hrFilters.endDate ||
                new Date(request.lastDayOfLeave) <= new Date(hrFilters.endDate);

            const matchesMinDays =
                !hrFilters.minDays ||
                request.numberOfLeaveDaysRequested >= Number.parseInt(hrFilters.minDays);

            const matchesMaxDays =
                !hrFilters.maxDays ||
                request.numberOfLeaveDaysRequested <= Number.parseInt(hrFilters.maxDays);

            const matchesRollback =
                !hrFilters.rollbackStatus ||
                request.rollbackStatus
                    .toLowerCase()
                    .includes(hrFilters.rollbackStatus.toLowerCase());

            return (
                matchesEmployee &&
                matchesDepartment &&
                matchesRequestId &&
                matchesState &&
                matchesStage &&
                matchesType &&
                matchesStandIn &&
                matchesStartDate &&
                matchesEndDate &&
                matchesMinDays &&
                matchesMaxDays &&
                matchesRollback
            );
        });
    }, [hrFilters, leaveManagements, employees]);

    // Count active filters for HR view
    const activeHrFiltersCount = Object.values(hrFilters).filter(
        value => value !== "" && value !== "all",
    ).length;

    return (
        <div
            className={`min-h-screen font-sans ${
                theme === "dark"
                    ? "bg-slate-950"
                    : "bg-gradient-to-br from-slate-50 via-white to-slate-100"
            }`}
        >
            <div className="w-full mx-auto p-8 space-y-8">
                {/* Modern Header */}
                <div className="flex items-center justify-between mb-12">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div
                                className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
                                style={{ backgroundColor: "#3f3d56" }}
                            >
                                <Calendar className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1
                                    className={`text-4xl font-bold tracking-tight ${
                                        theme === "dark" ? "text-white" : ""
                                    }`}
                                    style={{ color: theme === "dark" ? "#ffffff" : "#3f3d56" }}
                                >
                                    Leave Management
                                </h1>
                                <p
                                    className={`font-medium ${
                                        theme === "dark" ? "text-slate-300" : "text-slate-500"
                                    }`}
                                >
                                    View all employee leave requests across the organization
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* HR View - All Employee Leave Requests */}
                <Card
                    className={`border-0 shadow-2xl overflow-hidden ${theme === "dark" ? "bg-black" : "bg-white"}`}
                >
                    <div className="p-8 pb-0">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2
                                    className="text-2xl font-bold"
                                    style={{ color: theme === "dark" ? "#ffffff" : "#3f3d56" }}
                                >
                                    All Employee Leave Requests
                                </h2>
                                <p className="text-slate-500 font-medium mt-1">
                                    {filteredHrRequests.length} of {leaveRequests.length} requests
                                    {activeHrFiltersCount > 0 &&
                                        ` (${activeHrFiltersCount} filters applied)`}
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                {/* Clear Filter Button */}
                                {activeHrFiltersCount > 0 && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={clearHrFilters}
                                        className="rounded-xl bg-transparent text-slate-500 hover:text-slate-700 border-slate-300"
                                    >
                                        <X className="w-4 h-4 mr-2" />
                                        Clear Filters ({activeHrFiltersCount})
                                    </Button>
                                )}

                                {/* Column Visibility Control */}
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className={`rounded-xl bg-transparent ${theme === "dark" ? "text-white" : "text-slate-500"}`}
                                        >
                                            <Columns className="w-4 h-4 mr-2" />
                                            Columns
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent
                                        className={`w-80 p-4 ${theme === "dark" ? "bg-black" : "bg-white"}`}
                                        align="end"
                                    >
                                        <div
                                            className={`space-y-4 ${theme === "dark" ? "text-white" : "text-slate-500"}`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <h4 className="font-semibold text-slate-700">
                                                    Show/Hide Columns
                                                </h4>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        const allVisible = Object.values(
                                                            hrVisibleColumns,
                                                        ).every(v => v);
                                                        const newState: Record<string, boolean> =
                                                            {};
                                                        hrColumnDefinitions.forEach(col => {
                                                            newState[col.key] = !allVisible;
                                                        });
                                                        setHrVisibleColumns(newState);
                                                    }}
                                                    className="text-xs"
                                                >
                                                    {Object.values(hrVisibleColumns).every(v => v)
                                                        ? "Hide All"
                                                        : "Show All"}
                                                </Button>
                                            </div>
                                            <Separator />
                                            <div className="space-y-3 max-h-64 overflow-y-auto">
                                                {hrColumnDefinitions.map(column => (
                                                    <div
                                                        key={column.key}
                                                        className="flex items-center space-x-2"
                                                    >
                                                        <Checkbox
                                                            id={column.key}
                                                            checked={hrVisibleColumns[column.key]}
                                                            onCheckedChange={() =>
                                                                toggleHrColumn(column.key)
                                                            }
                                                        />
                                                        <label
                                                            htmlFor={column.key}
                                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                                        >
                                                            {column.label}
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </PopoverContent>
                                </Popover>

                                {/* Advanced Filter Control */}
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className={`rounded-xl bg-transparent relative ${theme === "dark" ? "text-white" : "text-slate-500"}`}
                                        >
                                            <Filter className="w-4 h-4 mr-2" />
                                            Filter
                                            {activeHrFiltersCount > 0 && (
                                                <Badge
                                                    variant="secondary"
                                                    className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                                                    style={{
                                                        backgroundColor: "#3f3d56",
                                                        color: "white",
                                                    }}
                                                >
                                                    {activeHrFiltersCount}
                                                </Badge>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent
                                        className={`w-[500px] p-6 ${theme === "dark" ? "bg-black" : "bg-white"}`}
                                        align="end"
                                    >
                                        <div
                                            className={`space-y-4 ${theme === "dark" ? "text-white" : "text-slate-500"}`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <h4 className="font-semibold text-slate-700">
                                                    Advanced Filters
                                                </h4>
                                                {activeHrFiltersCount > 0 && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={clearHrFilters}
                                                        className="text-xs text-slate-500 hover:text-slate-700"
                                                    >
                                                        <X className="w-3 h-3 mr-1" />
                                                        Clear All
                                                    </Button>
                                                )}
                                            </div>
                                            <Separator />

                                            <div className="space-y-4">
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium text-slate-600">
                                                            Employee Name
                                                        </label>
                                                        <Input
                                                            placeholder="Search employee..."
                                                            value={hrFilters.employee}
                                                            onChange={e =>
                                                                setHrFilters(prev => ({
                                                                    ...prev,
                                                                    employee: e.target.value,
                                                                }))
                                                            }
                                                            className="rounded-lg h-9"
                                                        />
                                                    </div>

                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium text-slate-600">
                                                            Department
                                                        </label>
                                                        <Select
                                                            value={hrFilters.department}
                                                            onValueChange={value =>
                                                                setHrFilters(prev => ({
                                                                    ...prev,
                                                                    department: value,
                                                                }))
                                                            }
                                                        >
                                                            <SelectTrigger className="rounded-lg h-9">
                                                                <SelectValue placeholder="All departments" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="all">
                                                                    All Departments
                                                                </SelectItem>
                                                                <SelectItem value="HR">
                                                                    HR
                                                                </SelectItem>
                                                                <SelectItem value="Engineering">
                                                                    Engineering
                                                                </SelectItem>
                                                                <SelectItem value="Finance">
                                                                    Finance
                                                                </SelectItem>
                                                                <SelectItem value="Marketing">
                                                                    Marketing
                                                                </SelectItem>
                                                                <SelectItem value="Operations">
                                                                    Operations
                                                                </SelectItem>
                                                                <SelectItem value="IT">
                                                                    IT
                                                                </SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium text-slate-600">
                                                            Request ID
                                                        </label>
                                                        <Input
                                                            placeholder="Search ID..."
                                                            value={hrFilters.leaveRequestId}
                                                            onChange={e =>
                                                                setHrFilters(prev => ({
                                                                    ...prev,
                                                                    leaveRequestId: e.target.value,
                                                                }))
                                                            }
                                                            className="rounded-lg h-9"
                                                        />
                                                    </div>

                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium text-slate-600">
                                                            Leave State
                                                        </label>
                                                        <Select
                                                            value={hrFilters.leaveState}
                                                            onValueChange={value =>
                                                                setHrFilters(prev => ({
                                                                    ...prev,
                                                                    leaveState: value,
                                                                }))
                                                            }
                                                        >
                                                            <SelectTrigger className="rounded-lg h-9">
                                                                <SelectValue placeholder="All states" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="all">
                                                                    All states
                                                                </SelectItem>
                                                                <SelectItem value="Open">
                                                                    Open
                                                                </SelectItem>
                                                                <SelectItem value="Approved">
                                                                    Approved
                                                                </SelectItem>
                                                                <SelectItem value="Rollback">
                                                                    Rollback
                                                                </SelectItem>
                                                                <SelectItem value="Rejected">
                                                                    Rejected
                                                                </SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium text-slate-600">
                                                            Leave Type
                                                        </label>
                                                        <Select
                                                            value={hrFilters.leaveType}
                                                            onValueChange={value =>
                                                                setHrFilters(prev => ({
                                                                    ...prev,
                                                                    leaveType: value,
                                                                }))
                                                            }
                                                        >
                                                            <SelectTrigger className="rounded-lg h-9">
                                                                <SelectValue placeholder="All types" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="all">
                                                                    All types
                                                                </SelectItem>
                                                                <SelectItem value="Annual Leave">
                                                                    Annual Leave
                                                                </SelectItem>
                                                                <SelectItem value="Sick Leave">
                                                                    Sick Leave
                                                                </SelectItem>
                                                                <SelectItem value="Personal Leave">
                                                                    Personal Leave
                                                                </SelectItem>
                                                                <SelectItem value="Emergency Leave">
                                                                    Emergency Leave
                                                                </SelectItem>
                                                                <SelectItem value="Study Leave">
                                                                    Study Leave
                                                                </SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>

                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium text-slate-600">
                                                            Stand In
                                                        </label>
                                                        <Input
                                                            placeholder="Search stand in..."
                                                            value={hrFilters.standIn}
                                                            onChange={e =>
                                                                setHrFilters(prev => ({
                                                                    ...prev,
                                                                    standIn: e.target.value,
                                                                }))
                                                            }
                                                            className="rounded-lg h-9"
                                                        />
                                                    </div>

                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium text-slate-600">
                                                            Start Date From
                                                        </label>
                                                        <Input
                                                            type="date"
                                                            value={hrFilters.startDate}
                                                            onChange={e =>
                                                                setHrFilters(prev => ({
                                                                    ...prev,
                                                                    startDate: e.target.value,
                                                                }))
                                                            }
                                                            className="rounded-lg h-9"
                                                        />
                                                    </div>

                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium text-slate-600">
                                                            End Date To
                                                        </label>
                                                        <Input
                                                            type="date"
                                                            value={hrFilters.endDate}
                                                            onChange={e =>
                                                                setHrFilters(prev => ({
                                                                    ...prev,
                                                                    endDate: e.target.value,
                                                                }))
                                                            }
                                                            className="rounded-lg h-9"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-slate-600">
                                                        Leave Stage
                                                    </label>
                                                    <Input
                                                        placeholder="Search stage..."
                                                        value={hrFilters.leaveStage}
                                                        onChange={e =>
                                                            setHrFilters(prev => ({
                                                                ...prev,
                                                                leaveStage: e.target.value,
                                                            }))
                                                        }
                                                        className="rounded-lg h-9"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>
                    </div>

                    <LeaveTable
                        filteredHrRequests={filteredHrRequests}
                        hrVisibleColumns={hrVisibleColumns}
                    />
                </Card>
            </div>
        </div>
    );
}
