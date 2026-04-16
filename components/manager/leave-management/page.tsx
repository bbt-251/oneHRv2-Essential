"use client";

import { useState, useMemo } from "react";
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
import { Columns, Filter, X } from "lucide-react";
import { useFirestore } from "@/context/firestore-context";
import LeaveTable from "./blocks/leave-table";
import { useTheme } from "@/components/theme-provider";
import { useAuth } from "@/context/authContext";
import { useDelegation } from "@/hooks/use-delegation";

// Column definitions for manager view
const managerColumnDefinitions = [
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

export default function ManagerLeaveManagement() {
    const { user } = useAuth();

    const { theme } = useTheme();
    const { leaveManagements, employees } = useFirestore();

    // Use the delegation hook to get delegated reportees
    const { allReportees, delegatedReportees } = useDelegation();

    const getReporteeIds = (managerId: string): string[] => {
        const directReports = employees.filter(emp => emp.reportingLineManager === managerId);

        return [...directReports.map(r => r.uid)];
    };
    const myReportees = user?.uid ? getReporteeIds(user.uid) : [];

    // Combine own reportees with delegated reportees
    const combinedReportees = useMemo(() => {
        const allReporteeSet = new Set([...myReportees, ...allReportees]);
        return Array.from(allReporteeSet);
    }, [myReportees, allReportees]);

    const leaveRequests = leaveManagements.filter(request =>
        combinedReportees.includes(request.employeeID),
    );

    const [managerFilters, setManagerFilters] = useState({
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
    // Clear all filters for manager view
    const clearManagerFilters = () => {
        setManagerFilters({
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

    // Column visibility state for manager view
    const [managerVisibleColumns, setManagerVisibleColumns] = useState(() => {
        const initial: Record<string, boolean> = {};
        managerColumnDefinitions.forEach(col => {
            initial[col.key] = col.defaultVisible;
        });
        return initial;
    });

    // Toggle column visibility for manager view
    const toggleManagerColumn = (columnKey: string) => {
        setManagerVisibleColumns(prev => ({
            ...prev,
            [columnKey]: !prev[columnKey],
        }));
    };

    // Filter all leave requests for manager view
    const filteredManagerRequests = useMemo(() => {
        return leaveRequests.filter(request => {
            const matchesEmployee =
                !managerFilters.employee ||
                employees
                    .find((emp: any) => emp.id === request.employeeID)
                    ?.firstName.toLowerCase()
                    .includes(managerFilters.employee.toLowerCase());

            const matchesDepartment =
                !managerFilters.department ||
                managerFilters.department === "all" ||
                employees
                    .find((emp: any) => emp.id === request.employeeID)
                    ?.department.toLowerCase()
                    .includes(managerFilters.department.toLowerCase());

            const matchesRequestId =
                !managerFilters.leaveRequestId ||
                request.leaveRequestID
                    .toLowerCase()
                    .includes(managerFilters.leaveRequestId.toLowerCase());

            const matchesState =
                !managerFilters.leaveState || request.leaveState === managerFilters.leaveState;

            const matchesStage =
                !managerFilters.leaveStage ||
                request.leaveStage.toLowerCase().includes(managerFilters.leaveStage.toLowerCase());

            const matchesType =
                !managerFilters.leaveType || request.leaveType === managerFilters.leaveType;

            const matchesStandIn =
                !managerFilters.standIn ||
                request.standIn?.toLowerCase().includes(managerFilters.standIn.toLowerCase());

            const matchesStartDate =
                !managerFilters.startDate ||
                new Date(request.firstDayOfLeave) >= new Date(managerFilters.startDate);

            const matchesEndDate =
                !managerFilters.endDate ||
                new Date(request.lastDayOfLeave) <= new Date(managerFilters.endDate);

            const matchesMinDays =
                !managerFilters.minDays ||
                request.numberOfLeaveDaysRequested >= Number.parseInt(managerFilters.minDays);

            const matchesMaxDays =
                !managerFilters.maxDays ||
                request.numberOfLeaveDaysRequested <= Number.parseInt(managerFilters.maxDays);

            const matchesRollback =
                !managerFilters.rollbackStatus ||
                request.rollbackStatus
                    .toLowerCase()
                    .includes(managerFilters.rollbackStatus.toLowerCase());

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
    }, [managerFilters, myReportees, leaveManagements]);
    // Count active filters for manager view
    const activeManagerFiltersCount = Object.values(managerFilters).filter(
        value => value !== "" && value !== "all",
    ).length;

    return (
        <>
            {/* Manager View - All Employee Leave Requests */}
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
                                {filteredManagerRequests.length} of {leaveRequests.length} requests
                                {delegatedReportees.length > 0 && (
                                    <span className="ml-2 text-blue-600">
                                        ({delegatedReportees.length} delegated reportees)
                                    </span>
                                )}
                                {activeManagerFiltersCount > 0 &&
                                    ` (${activeManagerFiltersCount} filters applied)`}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            {/* Clear Filter Button */}
                            {activeManagerFiltersCount > 0 && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={clearManagerFilters}
                                    className="rounded-xl bg-transparent text-slate-500 hover:text-slate-700 border-slate-300"
                                >
                                    <X className="w-4 h-4 mr-2" />
                                    Clear Filters ({activeManagerFiltersCount})
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
                                                        managerVisibleColumns,
                                                    ).every(v => v);
                                                    const newState: Record<string, boolean> = {};
                                                    managerColumnDefinitions.forEach(col => {
                                                        newState[col.key] = !allVisible;
                                                    });
                                                    setManagerVisibleColumns(newState);
                                                }}
                                                className="text-xs"
                                            >
                                                {Object.values(managerVisibleColumns).every(v => v)
                                                    ? "Hide All"
                                                    : "Show All"}
                                            </Button>
                                        </div>
                                        <Separator />
                                        <div className="space-y-3 max-h-64 overflow-y-auto">
                                            {managerColumnDefinitions.map(column => (
                                                <div
                                                    key={column.key}
                                                    className="flex items-center space-x-2"
                                                >
                                                    <Checkbox
                                                        id={column.key}
                                                        checked={managerVisibleColumns[column.key]}
                                                        onCheckedChange={() =>
                                                            toggleManagerColumn(column.key)
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
                                        {activeManagerFiltersCount > 0 && (
                                            <Badge
                                                variant="secondary"
                                                className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                                                style={{
                                                    backgroundColor: "#3f3d56",
                                                    color: "white",
                                                }}
                                            >
                                                {activeManagerFiltersCount}
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
                                            {activeManagerFiltersCount > 0 && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={clearManagerFilters}
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
                                                        value={managerFilters.employee}
                                                        onChange={e =>
                                                            setManagerFilters(prev => ({
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
                                                        value={managerFilters.department}
                                                        onValueChange={value =>
                                                            setManagerFilters(prev => ({
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
                                                            <SelectItem value="HR">HR</SelectItem>
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
                                                            <SelectItem value="IT">IT</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-slate-600">
                                                        Request ID
                                                    </label>
                                                    <Input
                                                        placeholder="Search ID..."
                                                        value={managerFilters.leaveRequestId}
                                                        onChange={e =>
                                                            setManagerFilters(prev => ({
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
                                                        value={managerFilters.leaveState}
                                                        onValueChange={value =>
                                                            setManagerFilters(prev => ({
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
                                                        value={managerFilters.leaveType}
                                                        onValueChange={value =>
                                                            setManagerFilters(prev => ({
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
                                                        value={managerFilters.standIn}
                                                        onChange={e =>
                                                            setManagerFilters(prev => ({
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
                                                        value={managerFilters.startDate}
                                                        onChange={e =>
                                                            setManagerFilters(prev => ({
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
                                                        value={managerFilters.endDate}
                                                        onChange={e =>
                                                            setManagerFilters(prev => ({
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
                                                    value={managerFilters.leaveStage}
                                                    onChange={e =>
                                                        setManagerFilters(prev => ({
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

                            <Button
                                variant="outline"
                                size="sm"
                                className={`rounded-xl bg-transparent ${theme === "dark" ? "text-white" : "text-slate-500"}`}
                            >
                                Export
                            </Button>
                        </div>
                    </div>
                </div>

                <LeaveTable
                    filteredManagerRequests={filteredManagerRequests}
                    managerVisibleColumns={managerVisibleColumns}
                />
            </Card>
        </>
    );
}
