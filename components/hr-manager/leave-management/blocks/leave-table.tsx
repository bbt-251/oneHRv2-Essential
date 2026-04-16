"use client";

import { useState, useEffect } from "react";
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

import { FileText, Eye } from "lucide-react";
import { useFirestore } from "@/context/firestore-context";

import { LeaveModel } from "@/lib/models/leave";
import LeaveDetail from "../modals/leave-detail";
import {
    annualLeaveType,
    unpaidLeaveType,
} from "@/components/employee/leave-management/modals/add-leave-request-modal";

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
    filteredHrRequests: LeaveModel[];
    hrVisibleColumns: Record<string, boolean>;
}

export default function LeaveTable({ filteredHrRequests, hrVisibleColumns }: LeaveTableProps) {
    const theme = useEffectiveTheme();
    const { employees, hrSettings } = useFirestore();
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

    const [selectedLeave, setSelectedLeave] = useState<LeaveModel | null>(null);
    const [isLeaveDetailModalOpen, setIsLeaveDetailModalOpen] = useState<boolean>(false);

    // Handle opening leave detail
    const handleOpenLeaveDetail = (leave: LeaveModel) => {
        setSelectedLeave(leave);
        setIsLeaveDetailModalOpen(true);
    };

    // Count active filters for empty state message
    const activeHrFiltersCount = 0; // This is passed from parent, simplified here

    return (
        <>
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow
                            className={`border-0 ${theme === "dark" ? "bg-slate-800/50" : "bg-slate-50/50"}`}
                        >
                            {hrVisibleColumns.timestamp && (
                                <TableHead
                                    className={`font-bold py-6 px-8 ${theme === "dark" ? "text-slate-200" : "text-slate-700"}`}
                                >
                                    Timestamp
                                </TableHead>
                            )}
                            {hrVisibleColumns.employee && (
                                <TableHead
                                    className={`font-bold py-6 ${theme === "dark" ? "text-slate-200" : "text-slate-700"}`}
                                >
                                    Employee
                                </TableHead>
                            )}
                            {hrVisibleColumns.department && (
                                <TableHead
                                    className={`font-bold py-6 ${theme === "dark" ? "text-slate-200" : "text-slate-700"}`}
                                >
                                    Department
                                </TableHead>
                            )}
                            {hrVisibleColumns.leaveRequestId && (
                                <TableHead
                                    className={`font-bold py-6 ${theme === "dark" ? "text-slate-200" : "text-slate-700"}`}
                                >
                                    Request ID
                                </TableHead>
                            )}
                            {hrVisibleColumns.leaveState && (
                                <TableHead
                                    className={`font-bold py-6 ${theme === "dark" ? "text-slate-200" : "text-slate-700"}`}
                                >
                                    Leave State
                                </TableHead>
                            )}
                            {hrVisibleColumns.leaveStage && (
                                <TableHead
                                    className={`font-bold py-6 ${theme === "dark" ? "text-slate-200" : "text-slate-700"}`}
                                >
                                    Leave Stage
                                </TableHead>
                            )}
                            {hrVisibleColumns.leaveType && (
                                <TableHead
                                    className={`font-bold py-6 ${theme === "dark" ? "text-slate-200" : "text-slate-700"}`}
                                >
                                    Leave Type
                                </TableHead>
                            )}
                            {hrVisibleColumns.standIn && (
                                <TableHead
                                    className={`font-bold py-6 ${theme === "dark" ? "text-slate-200" : "text-slate-700"}`}
                                >
                                    Stand In
                                </TableHead>
                            )}
                            {hrVisibleColumns.authorizedDays && (
                                <TableHead
                                    className={`font-bold py-6 ${theme === "dark" ? "text-slate-200" : "text-slate-700"}`}
                                >
                                    Authorized Days
                                </TableHead>
                            )}
                            {hrVisibleColumns.firstDayOfLeave && (
                                <TableHead
                                    className={`font-bold py-6 ${theme === "dark" ? "text-slate-200" : "text-slate-700"}`}
                                >
                                    First Day
                                </TableHead>
                            )}
                            {hrVisibleColumns.lastDayOfLeave && (
                                <TableHead
                                    className={`font-bold py-6 ${theme === "dark" ? "text-slate-200" : "text-slate-700"}`}
                                >
                                    Last Day
                                </TableHead>
                            )}
                            {hrVisibleColumns.dateOfReturn && (
                                <TableHead
                                    className={`font-bold py-6 ${theme === "dark" ? "text-slate-200" : "text-slate-700"}`}
                                >
                                    Return Date
                                </TableHead>
                            )}
                            {hrVisibleColumns.numberOfLeaveDaysRequested && (
                                <TableHead
                                    className={`font-bold py-6 ${theme === "dark" ? "text-slate-200" : "text-slate-700"}`}
                                >
                                    Days Requested
                                </TableHead>
                            )}
                            {hrVisibleColumns.halfDayOption && (
                                <TableHead
                                    className={`font-bold py-6 ${theme === "dark" ? "text-slate-200" : "text-slate-700"}`}
                                >
                                    Half Day
                                </TableHead>
                            )}
                            {hrVisibleColumns.rollbackStatus && (
                                <TableHead
                                    className={`font-bold py-6 ${theme === "dark" ? "text-slate-200" : "text-slate-700"}`}
                                >
                                    Rollback Status
                                </TableHead>
                            )}
                            <TableHead
                                className={`font-bold py-6 ${theme === "dark" ? "text-slate-200" : "text-slate-700"}`}
                            >
                                Actions
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredHrRequests.map((request, index) => (
                            <TableRow
                                key={request.id}
                                className={`border-0 transition-colors duration-200 cursor-pointer ${theme === "dark" ? "hover:bg-slate-900/50" : "hover:bg-slate-50/50"}`}
                                style={{
                                    borderBottom:
                                        index !== filteredHrRequests.length - 1
                                            ? theme === "dark"
                                                ? "1px solid #1e293b"
                                                : "1px solid #f1f5f9"
                                            : "none",
                                }}
                                onClick={() => handleOpenLeaveDetail(request)}
                            >
                                {hrVisibleColumns.timestamp && (
                                    <TableCell
                                        className={`py-6 px-8 font-medium ${theme === "dark" ? "text-slate-300" : "text-slate-600"}`}
                                    >
                                        {new Date(request.timestamp).toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                            year: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })}
                                    </TableCell>
                                )}
                                {hrVisibleColumns.employee && (
                                    <TableCell className="py-6">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                                style={{ backgroundColor: "#3f3d56" }}
                                            >
                                                {employees
                                                    .find(
                                                        (emp: any) =>
                                                            emp.uid === request.employeeID,
                                                    )
                                                    ?.firstName.split(" ")
                                                    .map((n: string) => n[0])
                                                    .join("")}
                                            </div>
                                            <div>
                                                <div
                                                    className={`font-semibold ${theme === "dark" ? "text-slate-100" : "text-slate-800"}`}
                                                >
                                                    {
                                                        employees.find(
                                                            (emp: any) =>
                                                                emp.uid === request.employeeID,
                                                        )?.firstName
                                                    }{" "}
                                                    {
                                                        employees.find(
                                                            (emp: any) =>
                                                                emp.uid === request.employeeID,
                                                        )?.surname
                                                    }
                                                </div>
                                                <div
                                                    className={`text-xs ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}
                                                >
                                                    {getDepartmentName(
                                                        employees.find(
                                                            (emp: any) =>
                                                                emp.uid === request.employeeID,
                                                        )?.department || "",
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>
                                )}
                                {hrVisibleColumns.department && (
                                    <TableCell
                                        className={`py-6 font-medium ${theme === "dark" ? "text-slate-300" : "text-slate-600"}`}
                                    >
                                        {getDepartmentName(
                                            employees.find(
                                                (emp: any) => emp.uid === request.employeeID,
                                            )?.department || "",
                                        )}
                                    </TableCell>
                                )}
                                {hrVisibleColumns.leaveRequestId && (
                                    <TableCell
                                        className="font-bold py-6"
                                        style={{ color: theme === "dark" ? "#a5b4fc" : "#3f3d56" }}
                                    >
                                        {request.leaveRequestID}
                                    </TableCell>
                                )}
                                {hrVisibleColumns.leaveState && (
                                    <TableCell className="py-6">
                                        <Badge
                                            variant="outline"
                                            className={`${getStatusColor(request.leaveState)} font-semibold px-3 py-1 rounded-lg border-0`}
                                        >
                                            {request.leaveState}
                                        </Badge>
                                    </TableCell>
                                )}
                                {hrVisibleColumns.leaveStage && (
                                    <TableCell
                                        className={`py-6 font-medium ${theme === "dark" ? "text-slate-300" : "text-slate-600"}`}
                                    >
                                        {request.leaveStage}
                                    </TableCell>
                                )}
                                {hrVisibleColumns.leaveType && (
                                    <TableCell className="py-6">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-2 h-2 rounded-full"
                                                style={{ backgroundColor: "#ffe6a7" }}
                                            ></div>
                                            <span
                                                className={`font-medium ${theme === "dark" ? "text-slate-200" : "text-slate-700"}`}
                                            >
                                                {getLeaveTypeName(request.leaveType)}
                                            </span>
                                        </div>
                                    </TableCell>
                                )}
                                {hrVisibleColumns.standIn && (
                                    <TableCell
                                        className={`py-6 font-medium ${theme === "dark" ? "text-slate-300" : "text-slate-600"}`}
                                    >
                                        {
                                            employees.find(
                                                (emp: any) => emp.uid === request.standIn,
                                            )?.firstName
                                        }{" "}
                                        {
                                            employees.find(
                                                (emp: any) => emp.uid === request.standIn,
                                            )?.surname
                                        }
                                    </TableCell>
                                )}
                                {hrVisibleColumns.authorizedDays && (
                                    <TableCell className="py-6">
                                        <div
                                            className={`w-12 h-8 rounded-lg flex items-center justify-center ${theme === "dark" ? "bg-slate-800" : "bg-slate-100"}`}
                                        >
                                            <span
                                                className={`font-bold ${theme === "dark" ? "text-slate-200" : "text-slate-700"}`}
                                            >
                                                {request.authorizedDays}
                                            </span>
                                        </div>
                                    </TableCell>
                                )}
                                {hrVisibleColumns.firstDayOfLeave && (
                                    <TableCell
                                        className={`py-6 font-medium ${theme === "dark" ? "text-slate-300" : "text-slate-600"}`}
                                    >
                                        {new Date(request.firstDayOfLeave).toLocaleDateString(
                                            "en-US",
                                            {
                                                month: "short",
                                                day: "numeric",
                                            },
                                        )}
                                    </TableCell>
                                )}
                                {hrVisibleColumns.lastDayOfLeave && (
                                    <TableCell
                                        className={`py-6 font-medium ${theme === "dark" ? "text-slate-300" : "text-slate-600"}`}
                                    >
                                        {new Date(request.lastDayOfLeave).toLocaleDateString(
                                            "en-US",
                                            {
                                                month: "short",
                                                day: "numeric",
                                            },
                                        )}
                                    </TableCell>
                                )}
                                {hrVisibleColumns.dateOfReturn && (
                                    <TableCell
                                        className={`py-6 font-medium ${theme === "dark" ? "text-slate-300" : "text-slate-600"}`}
                                    >
                                        {new Date(request.dateOfReturn).toLocaleDateString(
                                            "en-US",
                                            {
                                                month: "short",
                                                day: "numeric",
                                            },
                                        )}
                                    </TableCell>
                                )}
                                {hrVisibleColumns.numberOfLeaveDaysRequested && (
                                    <TableCell className="py-6">
                                        <div
                                            className={`w-12 h-8 rounded-lg flex items-center justify-center ${theme === "dark" ? "bg-slate-800" : "bg-slate-100"}`}
                                        >
                                            <span
                                                className={`font-bold ${theme === "dark" ? "text-slate-200" : "text-slate-700"}`}
                                            >
                                                {request.numberOfLeaveDaysRequested}
                                            </span>
                                        </div>
                                    </TableCell>
                                )}
                                {hrVisibleColumns.halfDayOption && (
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
                                {hrVisibleColumns.rollbackStatus && (
                                    <TableCell
                                        className={`py-6 font-medium ${theme === "dark" ? "text-slate-300" : "text-slate-600"}`}
                                    >
                                        {request.rollbackStatus}
                                    </TableCell>
                                )}
                                <TableCell className="py-6">
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={e => {
                                                e.stopPropagation();
                                                handleOpenLeaveDetail(request);
                                            }}
                                            className="rounded-lg"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Empty State */}
            {filteredHrRequests.length === 0 && (
                <div className="p-12 text-center">
                    <FileText
                        className={`w-16 h-16 mx-auto mb-4 ${theme === "dark" ? "text-slate-600" : "text-slate-300"}`}
                    />
                    <h3
                        className={`text-xl font-semibold mb-2 ${theme === "dark" ? "text-slate-300" : "text-slate-600"}`}
                    >
                        No leave requests found
                    </h3>
                    <p className={theme === "dark" ? "text-slate-400" : "text-slate-500"}>
                        {activeHrFiltersCount > 0
                            ? "Try adjusting your filters to see more results."
                            : "No employee leave requests available."}
                    </p>
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
        </>
    );
}
