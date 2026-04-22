"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/components/theme-provider";

import { FileText, Eye, CheckCircle, XCircle } from "lucide-react";
import { useAppData } from "@/context/app-data-context";

import { LeaveModel } from "@/lib/models/leave";
import { EmployeeModel } from "@/lib/models/employee";
import LeaveDetail from "../modals/leave-detail";
import RollbackRequestModal from "../../../employee/leave-management/modals/rollback-request";
import {
    annualLeaveType,
    unpaidLeaveType,
} from "@/components/employee/leave-management/modals/add-leave-request-modal";

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

interface LeaveTableProps {
    filteredManagerRequests: LeaveModel[];
    managerVisibleColumns: Record<string, boolean>;
}

export default function LeaveTable({
    filteredManagerRequests,
    managerVisibleColumns,
}: LeaveTableProps) {
    const { theme } = useTheme();
    const { employees, ...hrSettings } = useAppData();
    const leaveTypes = [...hrSettings.leaveTypes, annualLeaveType, unpaidLeaveType];

    const departments = hrSettings.departmentSettings;
    const getLeaveTypeName = (leaveTypeId: string) => {
        const leaveType = leaveTypes.find(leaveType => leaveType.id === leaveTypeId);
        return leaveType?.name || "Unknown";
    };
    const getDepartmentName = (departmentId: string) => {
        const department = departments.find(department => department.id === departmentId);
        return department?.name || "Unknown";
    };
    const getEmployee = (employeeId: string): EmployeeModel | undefined =>
        employees.find(employee => employee.uid === employeeId);

    const [selectedLeave, setSelectedLeave] = useState<LeaveModel | null>(null);
    const [isLeaveDetailModalOpen, setIsLeaveDetailModalOpen] = useState<boolean>(false);

    const [isRollbackModalOpen, setIsRollbackModalOpen] = useState<boolean>(false);

    const [managerFilters, setManagerFilters] = useState<Record<string, string>>({
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

    const activeManagerFiltersCount = Object.values(managerFilters).filter(
        value => value !== "" && value !== "all",
    ).length;

    // Handle opening leave detail
    const handleOpenLeaveDetail = (leave: LeaveModel) => {
        setSelectedLeave(leave);
        setIsLeaveDetailModalOpen(true);
    };

    return (
        <>
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow className="border-0 bg-slate-50/50">
                            {managerVisibleColumns.timestamp && (
                                <TableHead className="font-bold text-slate-700 py-6 px-8">
                                    Timestamp
                                </TableHead>
                            )}
                            {managerVisibleColumns.employee && (
                                <TableHead className="font-bold text-slate-700 py-6">
                                    Employee
                                </TableHead>
                            )}
                            {managerVisibleColumns.department && (
                                <TableHead className="font-bold text-slate-700 py-6">
                                    Department
                                </TableHead>
                            )}
                            {managerVisibleColumns.leaveRequestId && (
                                <TableHead className="font-bold text-slate-700 py-6">
                                    Request ID
                                </TableHead>
                            )}
                            {managerVisibleColumns.leaveState && (
                                <TableHead className="font-bold text-slate-700 py-6">
                                    Leave State
                                </TableHead>
                            )}
                            {managerVisibleColumns.leaveStage && (
                                <TableHead className="font-bold text-slate-700 py-6">
                                    Leave Stage
                                </TableHead>
                            )}
                            {managerVisibleColumns.leaveType && (
                                <TableHead className="font-bold text-slate-700 py-6">
                                    Leave Type
                                </TableHead>
                            )}
                            {managerVisibleColumns.standIn && (
                                <TableHead className="font-bold text-slate-700 py-6">
                                    Stand In
                                </TableHead>
                            )}
                            {managerVisibleColumns.authorizedDays && (
                                <TableHead className="font-bold text-slate-700 py-6">
                                    Authorized Days
                                </TableHead>
                            )}
                            {managerVisibleColumns.firstDayOfLeave && (
                                <TableHead className="font-bold text-slate-700 py-6">
                                    First Day
                                </TableHead>
                            )}
                            {managerVisibleColumns.lastDayOfLeave && (
                                <TableHead className="font-bold text-slate-700 py-6">
                                    Last Day
                                </TableHead>
                            )}
                            {managerVisibleColumns.dateOfReturn && (
                                <TableHead className="font-bold text-slate-700 py-6">
                                    Return Date
                                </TableHead>
                            )}
                            {managerVisibleColumns.numberOfLeaveDaysRequested && (
                                <TableHead className="font-bold text-slate-700 py-6">
                                    Days Requested
                                </TableHead>
                            )}
                            {managerVisibleColumns.halfDayOption && (
                                <TableHead className="font-bold text-slate-700 py-6">
                                    Half Day
                                </TableHead>
                            )}
                            {managerVisibleColumns.rollbackStatus && (
                                <TableHead className="font-bold text-slate-700 py-6">
                                    Rollback Status
                                </TableHead>
                            )}
                            <TableHead className="font-bold text-slate-700 py-6">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredManagerRequests.map((request, index) => (
                            <TableRow
                                key={request.id}
                                className="border-0 hover:bg-slate-50/50 transition-colors duration-200 cursor-pointer"
                                style={{
                                    borderBottom:
                                        index !== filteredManagerRequests.length - 1
                                            ? "1px solid #f1f5f9"
                                            : "none",
                                }}
                                onClick={() => handleOpenLeaveDetail(request)}
                            >
                                {managerVisibleColumns.timestamp && (
                                    <TableCell className="py-6 px-8 text-slate-600 font-medium">
                                        {new Date(request.timestamp).toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                            year: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </TableCell>
                                )}
                                {managerVisibleColumns.employee && (
                                    <TableCell className="py-6">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                                style={{ backgroundColor: "#3f3d56" }}
                                            >
                                                {getEmployee(request.employeeID)
                                                    ?.firstName.split(" ")
                                                    .map(n => n[0])
                                                    .join("")}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-slate-800">
                                                    {getEmployee(request.employeeID)?.firstName}
                                                </div>
                                                <div className="text-xs text-slate-500">
                                                    {getDepartmentName(
                                                        getEmployee(request.employeeID)
                                                            ?.department || "",
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>
                                )}
                                {managerVisibleColumns.department && (
                                    <TableCell className="py-6 text-slate-600 font-medium">
                                        {getDepartmentName(
                                            getEmployee(request.employeeID)?.department || "",
                                        )}
                                    </TableCell>
                                )}
                                {managerVisibleColumns.leaveRequestId && (
                                    <TableCell
                                        className="font-bold py-6"
                                        style={{ color: "#3f3d56" }}
                                    >
                                        {request.leaveRequestID}
                                    </TableCell>
                                )}
                                {managerVisibleColumns.leaveState && (
                                    <TableCell className="py-6">
                                        <Badge
                                            variant="outline"
                                            className={`${getStatusColor(request.leaveState)} font-semibold px-3 py-1 rounded-lg border-0`}
                                        >
                                            {request.leaveState}
                                        </Badge>
                                    </TableCell>
                                )}
                                {managerVisibleColumns.leaveStage && (
                                    <TableCell className="py-6 text-slate-600 font-medium">
                                        {request.leaveStage}
                                    </TableCell>
                                )}
                                {managerVisibleColumns.leaveType && (
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
                                {managerVisibleColumns.standIn && (
                                    <TableCell className="py-6 text-slate-600 font-medium">
                                        {getEmployee(request.standIn)?.firstName}
                                    </TableCell>
                                )}
                                {managerVisibleColumns.authorizedDays && (
                                    <TableCell className="py-6">
                                        <div className="w-12 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                                            <span className="font-bold text-slate-700">
                                                {request.authorizedDays}
                                            </span>
                                        </div>
                                    </TableCell>
                                )}
                                {managerVisibleColumns.firstDayOfLeave && (
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
                                {managerVisibleColumns.lastDayOfLeave && (
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
                                {managerVisibleColumns.dateOfReturn && (
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
                                {managerVisibleColumns.numberOfLeaveDaysRequested && (
                                    <TableCell className="py-6">
                                        <div className="w-12 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                                            <span className="font-bold text-slate-700">
                                                {request.numberOfLeaveDaysRequested}
                                            </span>
                                        </div>
                                    </TableCell>
                                )}
                                {managerVisibleColumns.halfDayOption && (
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
                                {managerVisibleColumns.rollbackStatus && (
                                    <TableCell className="py-6 text-slate-600 font-medium">
                                        {request.rollbackStatus}
                                    </TableCell>
                                )}
                                <TableCell className="py-6">
                                    <div className="flex items-center gap-2">
                                        {request.leaveStage === "Open" && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                // onClick={() => handleRollbackRequest(request)}
                                                className="rounded-lg"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                        )}
                                        {request.leaveStage === "Open" && (
                                            <>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    // onClick={() => handleRollbackRequest(request)}

                                                    className="rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                                >
                                                    <CheckCircle className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleOpenLeaveDetail(request)}
                                                    className="rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                                >
                                                    <XCircle className="w-4 h-4" />
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Empty State */}
            {filteredManagerRequests.length === 0 && (
                <div className="p-12 text-center">
                    <FileText className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                    <h3 className="text-xl font-semibold text-slate-600 mb-2">
                        No leave requests found
                    </h3>
                    <p className="text-slate-500">
                        {activeManagerFiltersCount > 0
                            ? "Try adjusting your filters to see more results."
                            : "No employee leave requests available."}
                    </p>
                    {activeManagerFiltersCount > 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={clearManagerFilters}
                            className="mt-4 rounded-lg bg-transparent"
                        >
                            Clear Filters
                        </Button>
                    )}
                </div>
            )}
            {/* Leave Detail Modal */}
            {isLeaveDetailModalOpen && selectedLeave && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <LeaveDetail
                        selectedLeave={selectedLeave}
                        setIsLeaveDetailModalOpen={setIsLeaveDetailModalOpen}
                    />
                </div>
            )}
            {/* Rollback Request Modal */}
            {isRollbackModalOpen && selectedLeave && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <RollbackRequestModal
                        selectedLeave={selectedLeave}
                        isRollbackModalOpen={isRollbackModalOpen}
                        setIsRollbackModalOpen={setIsRollbackModalOpen}
                    />
                </div>
            )}
        </>
    );
}
