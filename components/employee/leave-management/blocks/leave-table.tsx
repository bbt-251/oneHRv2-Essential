"use client";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
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
import { useTheme } from "@/components/theme-provider";
import { FileText, Plus, Columns, Filter, X, RotateCcw, Paperclip } from "lucide-react";
import { useData } from "@/context/app-data-context";
import { useAuth } from "@/context/authContext";
import LeaveDetail from "../modals/leave-detail";
import RollbackRequestModal from "../modals/rollback-request";
import ViewAttachment from "../modals/view-attachment";
import LeaveStats from "./leave-stats";
import BalanceDetailsModal from "../modals/balance-details-modal";
import { annualLeaveType, unpaidLeaveType } from "../modals/add-leave-request-modal";
import { LeaveModel } from "@/lib/models/leave";

interface LeaveTableFilters {
    leaveRequestId: string;
    leaveState: string;
    leaveStage: string;
    leaveType: string;
    standIn: string;
    startDate: string;
    endDate: string;
    minDays: string;
    maxDays: string;
    rollbackStatus: string;
}

// Column definitions
const columnDefinitions = [
    { key: "timestamp", label: "Timestamp", defaultVisible: true },
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

const getStatusColor = (status: string) => {
    switch (status) {
        case "Approved":
            return "bg-emerald-50 text-emerald-700 border-emerald-200";
        case "Open":
            return "bg-blue-50 text-blue-700 border-blue-200";
        case "Rollback":
            return "bg-amber-50 text-amber-700 border-amber-200";
        case "Rejected":
            return "bg-rose-50 text-rose-700 border-rose-200";
        default:
            return "bg-slate-50 text-slate-700 border-slate-200";
    }
};

export default function LeaveTable() {
    const { theme } = useTheme();
    const { userData } = useAuth();
    const {
        employees,
        leaveManagements,
        leaveTypes: baseLeaveTypes,
        accrualConfigurations,
    } = useData();

    const employeeLeaveRequests = useMemo(
        () =>
            leaveManagements
                .filter(leave => leave.employeeID === userData?.uid)
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
        [leaveManagements, userData?.uid],
    );

    const leaveTypes = [...baseLeaveTypes, annualLeaveType, unpaidLeaveType];

    const getLeaveTypeName = (leaveTypeId: string) => {
        const leaveType = leaveTypes.find(leaveType => leaveType.id === leaveTypeId);
        return leaveType?.name || "Unknown";
    };
    // Add new state for attachment and rollback functionality
    const [selectedAttachments, setSelectedAttachments] = useState<string[]>([]);
    const [isAttachmentModalOpen, setIsAttachmentModalOpen] = useState<boolean>(false);
    const [isRollbackModalOpen, setIsRollbackModalOpen] = useState<boolean>(false);

    // Column visibility state
    const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
        const initial: Record<string, boolean> = {};
        columnDefinitions.forEach(col => {
            initial[col.key] = col.defaultVisible;
        });
        return initial;
    });

    // Filter state
    const [tableFilters, setTableFilters] = useState<LeaveTableFilters>({
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

    const activeFiltersCount = Object.values(tableFilters).filter(value => value !== "").length;

    // Add this after the existing state declarations
    const [selectedLeave, setSelectedLeave] = useState<LeaveModel | null>(null);
    const [isLeaveModalOpen, setIsLeaveModalOpen] = useState<boolean>(false);
    const [isBalanceDetailsModalOpen, setIsBalanceDetailsModalOpen] = useState<boolean>(false);

    const approvedLeaveRequests = employeeLeaveRequests.filter(
        leave => leave.leaveStage === "Approved",
    );

    const dayTaken = approvedLeaveRequests.reduce(
        (sum, request) => sum + (request.numberOfLeaveDaysRequested || 0),
        0,
    );

    // Filter leave requests based on table filters
    const filteredLeaveRequests = useMemo(() => {
        return employeeLeaveRequests.filter(request => {
            const matchesRequestId =
                !tableFilters.leaveRequestId ||
                request.leaveRequestID
                    .toLowerCase()
                    .includes(tableFilters.leaveRequestId.toLowerCase());

            const matchesState =
                !tableFilters.leaveState || request.leaveState === tableFilters.leaveState;

            const matchesStage =
                !tableFilters.leaveStage ||
                request.leaveStage.toLowerCase().includes(tableFilters.leaveStage.toLowerCase());

            const matchesType =
                !tableFilters.leaveType || request.leaveType === tableFilters.leaveType;

            const matchesStandIn =
                !tableFilters.standIn ||
                request.standIn?.toLowerCase().includes(tableFilters.standIn.toLowerCase());

            const matchesStartDate =
                !tableFilters.startDate ||
                new Date(request.firstDayOfLeave) >= new Date(tableFilters.startDate);

            const matchesEndDate =
                !tableFilters.endDate ||
                new Date(request.lastDayOfLeave) <= new Date(tableFilters.endDate);

            const matchesMinDays =
                !tableFilters.minDays ||
                request.numberOfLeaveDaysRequested >= Number.parseInt(tableFilters.minDays);

            const matchesMaxDays =
                !tableFilters.maxDays ||
                request.numberOfLeaveDaysRequested <= Number.parseInt(tableFilters.maxDays);

            const matchesRollback =
                !tableFilters.rollbackStatus ||
                request.rollbackStatus
                    .toLowerCase()
                    .includes(tableFilters.rollbackStatus.toLowerCase());

            return (
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
    }, [employeeLeaveRequests, tableFilters]);

    // Toggle column visibility
    const toggleColumn = (columnKey: string) => {
        setVisibleColumns(prev => ({
            ...prev,
            [columnKey]: !prev[columnKey],
        }));
    };

    // Clear all filters
    const clearTableFilters = () => {
        setTableFilters({
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

    // Add this function after the navigation functions
    const handleOpenLeaveDetail = (leave: LeaveModel) => {
        setSelectedLeave(leave);
        setIsLeaveModalOpen(true);
    };

    // handle rollback request
    const handleRollbackRequest = (request: LeaveModel) => {
        setSelectedLeave(request);
        setIsRollbackModalOpen(true);
    };

    const handleViewAttachments = (request: LeaveModel) => {
        setSelectedAttachments(request.attachments);
        setIsAttachmentModalOpen(true);
    };

    return (
        <>
            {/* Employee View - Stats Grid */}
            <LeaveStats
                balanceDays={userData?.balanceLeaveDays || 0}
                daysTaken={dayTaken || 0}
                eligibleDays={userData?.eligibleLeaveDays || 0}
                accrualDays={userData?.accrualLeaveDays || 0}
                contractStartDate={userData?.contractStartingDate}
                carryOverLimit={accrualConfigurations?.[0]?.limitUnusedDays}
                onBalanceClick={
                    accrualConfigurations?.[0]?.limitUnusedDays
                        ? () => setIsBalanceDetailsModalOpen(true)
                        : undefined
                }
            />
            {/* Employee Leave Requests Table */}
            <Card
                className={`border-0 shadow-2xl overflow-hidden ${
                    theme === "dark" ? "bg-black border-gray-800" : ""
                }`}
            >
                <div className="p-8 pb-0">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2
                                className={`text-2xl font-bold ${
                                    theme === "dark" ? "text-slate-300" : "text-slate-600"
                                }`}
                            >
                                My Leave Requests
                            </h2>
                            <p
                                className={`text-slate-500 font-medium mt-1 ${
                                    theme === "dark" ? "text-slate-300" : "text-slate-500"
                                }`}
                            >
                                {filteredLeaveRequests.length} of {employeeLeaveRequests.length}{" "}
                                requests
                                {activeFiltersCount > 0 &&
                                    ` (${activeFiltersCount} filters applied)`}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            {/* Clear Filter Button */}
                            {activeFiltersCount > 0 && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={clearTableFilters}
                                    className="rounded-xl bg-transparent text-slate-500 hover:text-slate-700 border-slate-300"
                                >
                                    <X className="w-4 h-4 mr-2" />
                                    Clear Filters ({activeFiltersCount})
                                </Button>
                            )}

                            {/* Column Visibility Control */}
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className={`rounded-xl bg-transparent ${
                                            theme === "dark" ? "text-slate-300" : "text-slate-500"
                                        }`}
                                    >
                                        <Columns className="w-4 h-4 mr-2" />
                                        Columns
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80 p-4" align="end">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h4
                                                className={`font-semibold text-slate-700 ${
                                                    theme === "dark"
                                                        ? "text-slate-300"
                                                        : "text-slate-700"
                                                }`}
                                            >
                                                Show/Hide Columns
                                            </h4>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    const allVisible = Object.values(
                                                        visibleColumns,
                                                    ).every(v => v);
                                                    const newState: Record<string, boolean> = {};
                                                    columnDefinitions.forEach(col => {
                                                        newState[col.key] = !allVisible;
                                                    });
                                                    setVisibleColumns(newState);
                                                }}
                                                className="text-xs"
                                            >
                                                {Object.values(visibleColumns).every(v => v)
                                                    ? "Hide All"
                                                    : "Show All"}
                                            </Button>
                                        </div>
                                        <Separator />
                                        <div className="space-y-3 max-h-64 overflow-y-auto">
                                            {columnDefinitions.map(column => (
                                                <div
                                                    key={column.key}
                                                    className="flex items-center space-x-2"
                                                >
                                                    <Checkbox
                                                        id={column.key}
                                                        checked={visibleColumns[column.key]}
                                                        onCheckedChange={() =>
                                                            toggleColumn(column.key)
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
                                        className={`rounded-xl bg-transparent relative ${
                                            theme === "dark" ? "text-slate-300" : "text-slate-500"
                                        }`}
                                    >
                                        <Filter className="w-4 h-4 mr-2" />
                                        Filter
                                        {activeFiltersCount > 0 && (
                                            <Badge
                                                variant="secondary"
                                                className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                                                style={{
                                                    backgroundColor:
                                                        theme === "dark" ? "#3f3d56" : "#3f3d56",
                                                    color: "white",
                                                }}
                                            >
                                                {activeFiltersCount}
                                            </Badge>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[500px] p-6" align="end">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <h4
                                                className={`font-semibold text-slate-700 ${
                                                    theme === "dark"
                                                        ? "text-slate-300"
                                                        : "text-slate-700"
                                                }`}
                                            >
                                                Advanced Filters
                                            </h4>
                                            {activeFiltersCount > 0 && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={clearTableFilters}
                                                    className={`text-xs text-slate-500 hover:text-slate-700 ${
                                                        theme === "dark"
                                                            ? "text-slate-300"
                                                            : "text-slate-500"
                                                    }`}
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
                                                        Request ID
                                                    </label>
                                                    <Input
                                                        placeholder="Search ID..."
                                                        value={tableFilters.leaveRequestId}
                                                        onChange={e =>
                                                            setTableFilters(prev => ({
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
                                                        value={tableFilters.leaveState}
                                                        onValueChange={value =>
                                                            setTableFilters(prev => ({
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
                                                        value={tableFilters.leaveType}
                                                        onValueChange={value =>
                                                            setTableFilters(prev => ({
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
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-slate-600">
                                                        Stand In
                                                    </label>
                                                    <Input
                                                        placeholder="Search stand in..."
                                                        value={tableFilters.standIn}
                                                        onChange={e =>
                                                            setTableFilters(prev => ({
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
                                                        value={tableFilters.startDate}
                                                        onChange={e =>
                                                            setTableFilters(prev => ({
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
                                                        value={tableFilters.endDate}
                                                        onChange={e =>
                                                            setTableFilters(prev => ({
                                                                ...prev,
                                                                endDate: e.target.value,
                                                            }))
                                                        }
                                                        className="rounded-lg h-9"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-slate-600">
                                                        Min Days
                                                    </label>
                                                    <Input
                                                        type="number"
                                                        placeholder="0"
                                                        value={tableFilters.minDays}
                                                        onChange={e =>
                                                            setTableFilters(prev => ({
                                                                ...prev,
                                                                minDays: e.target.value,
                                                            }))
                                                        }
                                                        className="rounded-lg h-9"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium text-slate-600">
                                                        Max Days
                                                    </label>
                                                    <Input
                                                        type="number"
                                                        placeholder="30"
                                                        value={tableFilters.maxDays}
                                                        onChange={e =>
                                                            setTableFilters(prev => ({
                                                                ...prev,
                                                                maxDays: e.target.value,
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
                                                    value={tableFilters.leaveStage}
                                                    onChange={e =>
                                                        setTableFilters(prev => ({
                                                            ...prev,
                                                            leaveStage: e.target.value,
                                                        }))
                                                    }
                                                    className="rounded-lg h-9"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-slate-600">
                                                    Rollback Status
                                                </label>
                                                <Input
                                                    placeholder="Search rollback status..."
                                                    value={tableFilters.rollbackStatus}
                                                    onChange={e =>
                                                        setTableFilters(prev => ({
                                                            ...prev,
                                                            rollbackStatus: e.target.value,
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
                                className={`rounded-xl bg-transparent ${
                                    theme === "dark" ? "text-slate-300" : "text-slate-500"
                                }`}
                            >
                                Export
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-0 bg-slate-50/50">
                                {visibleColumns.timestamp && (
                                    <TableHead className="font-bold text-slate-700 py-6 px-8">
                                        Timestamp
                                    </TableHead>
                                )}
                                {visibleColumns.leaveRequestId && (
                                    <TableHead className="font-bold text-slate-700 py-6">
                                        Request ID
                                    </TableHead>
                                )}
                                {visibleColumns.leaveState && (
                                    <TableHead className="font-bold text-slate-700 py-6">
                                        Leave State
                                    </TableHead>
                                )}
                                {visibleColumns.leaveStage && (
                                    <TableHead className="font-bold text-slate-700 py-6">
                                        Leave Stage
                                    </TableHead>
                                )}
                                {visibleColumns.leaveType && (
                                    <TableHead className="font-bold text-slate-700 py-6">
                                        Leave Type
                                    </TableHead>
                                )}
                                {visibleColumns.standIn && (
                                    <TableHead className="font-bold text-slate-700 py-6">
                                        Stand In
                                    </TableHead>
                                )}
                                {visibleColumns.authorizedDays && (
                                    <TableHead className="font-bold text-slate-700 py-6">
                                        Authorized Days
                                    </TableHead>
                                )}
                                {visibleColumns.firstDayOfLeave && (
                                    <TableHead className="font-bold text-slate-700 py-6">
                                        First Day
                                    </TableHead>
                                )}
                                {visibleColumns.lastDayOfLeave && (
                                    <TableHead className="font-bold text-slate-700 py-6">
                                        Last Day
                                    </TableHead>
                                )}
                                {visibleColumns.dateOfReturn && (
                                    <TableHead className="font-bold text-slate-700 py-6">
                                        Return Date
                                    </TableHead>
                                )}
                                {visibleColumns.numberOfLeaveDaysRequested && (
                                    <TableHead className="font-bold text-slate-700 py-6">
                                        Days Requested
                                    </TableHead>
                                )}
                                {visibleColumns.halfDayOption && (
                                    <TableHead className="font-bold text-slate-700 py-6">
                                        Half Day
                                    </TableHead>
                                )}
                                {visibleColumns.rollbackStatus && (
                                    <TableHead className="font-bold text-slate-700 py-6">
                                        Rollback Status
                                    </TableHead>
                                )}
                                <TableHead className="font-bold text-slate-700 py-6">
                                    Actions
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredLeaveRequests.map((request, index) => (
                                <TableRow
                                    onClick={() => handleOpenLeaveDetail(request)}
                                    key={request.id}
                                    className="border-0 hover:bg-slate-50/50 transition-colors duration-200 cursor-pointer"
                                    style={{
                                        borderBottom:
                                            index !== filteredLeaveRequests.length - 1
                                                ? "1px solid #f1f5f9"
                                                : "none",
                                    }}
                                >
                                    {visibleColumns.timestamp && (
                                        <TableCell className="py-6 px-8 text-slate-600 font-medium">
                                            {new Date(request.timestamp).toLocaleDateString(
                                                "en-US",
                                                {
                                                    month: "short",
                                                    day: "numeric",
                                                    year: "numeric",
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                },
                                            )}
                                        </TableCell>
                                    )}
                                    {visibleColumns.leaveRequestId && (
                                        <TableCell
                                            className="font-bold py-6"
                                            style={{ color: "#3f3d56" }}
                                        >
                                            {request.leaveRequestID}
                                        </TableCell>
                                    )}
                                    {visibleColumns.leaveState && (
                                        <TableCell className="py-6">
                                            <Badge
                                                variant="outline"
                                                className={`font-semibold px-3 py-1 rounded-lg border-0 ${getStatusColor(request.leaveState)}`}
                                                style={{
                                                    backgroundColor: `hsl(var(--badge-${getStatusColor(request.leaveState)}))`,
                                                }}
                                            >
                                                {request.leaveState}
                                            </Badge>
                                        </TableCell>
                                    )}
                                    {visibleColumns.leaveStage && (
                                        <TableCell className="py-6 text-slate-600 font-medium">
                                            {request.leaveStage}
                                        </TableCell>
                                    )}
                                    {visibleColumns.leaveType && (
                                        <TableCell className="py-6">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-2 h-2 rounded-full"
                                                    style={{ backgroundColor: "#ffe6a7" }}
                                                ></div>
                                                <span className="font-medium text-slate-700">
                                                    {getLeaveTypeName(request.leaveType)}
                                                </span>
                                            </div>
                                        </TableCell>
                                    )}
                                    {visibleColumns.standIn && (
                                        <TableCell className="py-6 text-slate-600 font-medium">
                                            {
                                                employees.find(emp => emp.uid === request.standIn)
                                                    ?.firstName
                                            }
                                        </TableCell>
                                    )}
                                    {visibleColumns.authorizedDays && (
                                        <TableCell className="py-6">
                                            <div className="w-12 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                                                <span className="font-bold text-slate-700">
                                                    {request.authorizedDays}
                                                </span>
                                            </div>
                                        </TableCell>
                                    )}
                                    {visibleColumns.firstDayOfLeave && (
                                        <TableCell className="py-6 text-slate-600 font-medium">
                                            {new Date(request.firstDayOfLeave).toLocaleDateString(
                                                "en-US",
                                                {
                                                    month: "short",
                                                    day: "numeric",
                                                },
                                            )}
                                        </TableCell>
                                    )}
                                    {visibleColumns.lastDayOfLeave && (
                                        <TableCell className="py-6 text-slate-600 font-medium">
                                            {new Date(request.lastDayOfLeave).toLocaleDateString(
                                                "en-US",
                                                {
                                                    month: "short",
                                                    day: "numeric",
                                                },
                                            )}
                                        </TableCell>
                                    )}
                                    {visibleColumns.dateOfReturn && (
                                        <TableCell className="py-6 text-slate-600 font-medium">
                                            {new Date(request.dateOfReturn).toLocaleDateString(
                                                "en-US",
                                                {
                                                    month: "short",
                                                    day: "numeric",
                                                },
                                            )}
                                        </TableCell>
                                    )}
                                    {visibleColumns.numberOfLeaveDaysRequested && (
                                        <TableCell className="py-6">
                                            <div className="w-12 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                                                <span className="font-bold text-slate-700">
                                                    {request.numberOfLeaveDaysRequested}
                                                </span>
                                            </div>
                                        </TableCell>
                                    )}
                                    {visibleColumns.halfDayOption && (
                                        <TableCell className="py-6">
                                            {request.halfDayOption ? (
                                                <Badge
                                                    variant="outline"
                                                    className={`${theme === "dark" ? "bg-amber-900/50 text-amber-200 border-amber-700" : "bg-amber-50 text-amber-700 border-amber-200"}`}
                                                >
                                                    {request.halfDayOption === "HDM" ? "AM" : "PM"}
                                                </Badge>
                                            ) : (
                                                <span className="text-slate-400">-</span>
                                            )}
                                        </TableCell>
                                    )}
                                    {visibleColumns.rollbackStatus && (
                                        <TableCell className="py-6 text-slate-600 font-medium">
                                            {request.rollbackStatus}
                                        </TableCell>
                                    )}
                                    <TableCell className="py-6">
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                // onClick={() => handleAddAttachments(request)}
                                                className="rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                title="Add Attachments"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </Button>
                                            {request.attachments && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={e => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        handleViewAttachments(request);
                                                    }}
                                                    className="relative  rounded-lg text-slate-600 hover:text-slate-700 hover:bg-slate-50"
                                                    title="View Attachments"
                                                >
                                                    <Paperclip className="w-4 h-4" />
                                                </Button>
                                            )}
                                            {request.leaveStage === "Approved" && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={e => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        handleRollbackRequest(request);
                                                    }}
                                                    className="relative rounded-lg text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                                    title="Request Rollback"
                                                >
                                                    <RotateCcw className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* Empty State */}
                {filteredLeaveRequests.length === 0 && (
                    <div className="p-12 text-center">
                        <FileText className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                        <h3 className="text-xl font-semibold text-slate-600 mb-2">
                            No leave requests found
                        </h3>
                        <p className="text-slate-500">
                            {activeFiltersCount > 0
                                ? "Try adjusting your filters to see more results."
                                : "You haven't submitted any leave requests yet."}
                        </p>
                        {activeFiltersCount > 0 && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={clearTableFilters}
                                className="mt-4 rounded-lg bg-transparent"
                            >
                                Clear Filters
                            </Button>
                        )}
                    </div>
                )}
            </Card>
            {isLeaveModalOpen && (
                <LeaveDetail
                    theme={theme}
                    selectedLeave={selectedLeave}
                    setIsLeaveModalOpen={setIsLeaveModalOpen}
                />
            )}
            {isRollbackModalOpen && (
                <RollbackRequestModal
                    selectedLeave={selectedLeave}
                    setIsRollbackModalOpen={setIsRollbackModalOpen}
                    isRollbackModalOpen={isRollbackModalOpen}
                />
            )}
            {isAttachmentModalOpen && (
                <ViewAttachment
                    attachments={selectedAttachments}
                    setIsAttachmentModalOpen={setIsAttachmentModalOpen}
                />
            )}
            {isBalanceDetailsModalOpen && (
                <BalanceDetailsModal
                    isOpen={isBalanceDetailsModalOpen}
                    onClose={() => setIsBalanceDetailsModalOpen(false)}
                    theme={theme}
                    contractStartDate={userData?.contractStartingDate || ""}
                    balanceLeaveDays={userData?.balanceLeaveDays || 0}
                    accrualLeaveDays={userData?.accrualLeaveDays || 0}
                    eligibleLeaveDays={userData?.eligibleLeaveDays || 0}
                    carryOverLimit={accrualConfigurations?.[0]?.limitUnusedDays || 5}
                />
            )}
        </>
    );
}
