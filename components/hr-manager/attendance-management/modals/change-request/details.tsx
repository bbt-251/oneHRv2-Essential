"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
    User,
    Calendar,
    Clock,
    FileText,
    CheckCircle,
    XCircle,
    AlertCircle,
    Edit,
} from "lucide-react";
import { calculateTotalWorkedHours } from "@/lib/util/functions/calculateDuration";
import { AttendanceChangeRequest } from "../../page";
import { useData } from "@/context/app-data-context";
import getFullName from "@/lib/util/getEmployeeFullName";
import { EmployeeModel } from "@/lib/models/employee";

interface HRAttendanceDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    request: AttendanceChangeRequest | null;
}

export function HRAttendanceDetailModal({
    isOpen,
    onClose,
    request,
}: HRAttendanceDetailModalProps) {
    const { employees } = useData();
    if (!request) return null;

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "Approved":
                return (
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        <span style={{ fontFamily: "Montserrat, sans-serif" }}>Approved</span>
                    </Badge>
                );
            case "Refused":
                return (
                    <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                        <XCircle className="h-3 w-3 mr-1" />
                        <span style={{ fontFamily: "Montserrat, sans-serif" }}>Refused</span>
                    </Badge>
                );
            case "Requested":
                return (
                    <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        <span style={{ fontFamily: "Montserrat, sans-serif" }}>Requested</span>
                    </Badge>
                );
            default:
                return (
                    <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
                        <span style={{ fontFamily: "Montserrat, sans-serif" }}>Unknown</span>
                    </Badge>
                );
        }
    };

    const getChangeType = () => {
        if (request.oldValues.length === 0) {
            return {
                type: "Addition",
                color: "bg-green-50 text-green-700 border-green-200",
                description: "Adding new attendance record",
            };
        } else if (request.newValues.length === 0) {
            return {
                type: "Removal",
                color: "bg-red-50 text-red-700 border-red-200",
                description: "Removing attendance record",
            };
        } else {
            return {
                type: "Modification",
                color: "bg-blue-50 text-blue-700 border-blue-200",
                description: "Modifying existing attendance record",
            };
        }
    };

    const changeType = getChangeType();

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <DialogTitle
                            className="text-xl font-semibold text-[#3f3d56]dark:text-white"
                            style={{ fontFamily: "Montserrat, sans-serif" }}
                        >
                            HR Review - Attendance Change Request Details
                        </DialogTitle>
                    </div>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Header Information */}
                    <Card className="border-0 shadow-sm bg-gradient-to-r from-[#ffe6a7]/20 to-[#ffe6a7]/10 dark:from-black dark:to-black">
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h2
                                        className="text-2xl font-bold text-[#3f3d56] dark:text-white"
                                        style={{ fontFamily: "Montserrat, sans-serif" }}
                                    >
                                        Attendance Change Request #{request.requestId ?? ""}
                                    </h2>
                                    <p
                                        className="text-sm text-[#3f3d56] dark:text-white opacity-60 mt-1"
                                        style={{ fontFamily: "Montserrat, sans-serif" }}
                                    >
                                        Submitted on{" "}
                                        {new Date(request.timestamp).toLocaleDateString("en-US", {
                                            weekday: "long",
                                            year: "numeric",
                                            month: "long",
                                            day: "numeric",
                                        })}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    {getStatusBadge(request.status)}
                                    <div
                                        className={`px-3 py-1 rounded-full text-sm font-medium border ${changeType.color}`}
                                        style={{ fontFamily: "Montserrat, sans-serif" }}
                                    >
                                        {changeType.type}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-[#3f3d56] rounded-full flex items-center justify-center">
                                        <User className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <p
                                            className="text-sm font-medium text-[#3f3d56] dark:text-white opacity-70"
                                            style={{ fontFamily: "Montserrat, sans-serif" }}
                                        >
                                            Employee
                                        </p>
                                        <p
                                            className="font-semibold text-[#3f3d56] dark:text-white"
                                            style={{ fontFamily: "Montserrat, sans-serif" }}
                                        >
                                            {request.employeeName}
                                        </p>
                                        <p
                                            className="text-sm text-[#3f3d56] dark:text-white opacity-60"
                                            style={{ fontFamily: "Montserrat, sans-serif" }}
                                        >
                                            {request.employeeDepartment}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-[#3f3d56] rounded-full flex items-center justify-center">
                                        <Calendar className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <p
                                            className="text-sm font-medium text-[#3f3d56] dark:text-white opacity-70"
                                            style={{ fontFamily: "Montserrat, sans-serif" }}
                                        >
                                            Attendance Date
                                        </p>
                                        <p
                                            className="font-semibold text-[#3f3d56] dark:text-white"
                                            style={{ fontFamily: "Montserrat, sans-serif" }}
                                        >
                                            {new Date(request.date).toLocaleDateString("en-US", {
                                                weekday: "short",
                                                month: "short",
                                                day: "numeric",
                                                year: "numeric",
                                            })}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-[#3f3d56] rounded-full flex items-center justify-center">
                                        <Clock className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <p
                                            className="text-sm font-medium text-[#3f3d56] dark:text-white opacity-70"
                                            style={{ fontFamily: "Montserrat, sans-serif" }}
                                        >
                                            Old Worked Hours
                                        </p>
                                        <p
                                            className="font-semibold text-[#3f3d56] dark:text-white"
                                            style={{ fontFamily: "Montserrat, sans-serif" }}
                                        >
                                            {calculateTotalWorkedHours(request.oldValues)}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-[#3f3d56] rounded-full flex items-center justify-center">
                                        <Clock className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <p
                                            className="text-sm font-medium text-[#3f3d56] dark:text-white opacity-70"
                                            style={{ fontFamily: "Montserrat, sans-serif" }}
                                        >
                                            New Worked Hours
                                        </p>
                                        <p
                                            className="font-semibold text-[#3f3d56] dark:text-white"
                                            style={{ fontFamily: "Montserrat, sans-serif" }}
                                        >
                                            {calculateTotalWorkedHours(request.newValues)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Request Information */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="border-0 shadow-sm">
                            <CardContent className="p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <FileText className="h-5 w-5 text-[#3f3d56] dark:text-white" />
                                    <h3
                                        className="text-lg font-semibold text-[#3f3d56] dark:text-white"
                                        style={{ fontFamily: "Montserrat, sans-serif" }}
                                    >
                                        Request Information
                                    </h3>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <p
                                            className="text-sm font-medium text-[#3f3d56] dark:text-white opacity-70 mb-2"
                                            style={{ fontFamily: "Montserrat, sans-serif" }}
                                        >
                                            Request Timestamp
                                        </p>
                                        <p
                                            className="text-[#3f3d56] dark:text-white"
                                            style={{ fontFamily: "Montserrat, sans-serif" }}
                                        >
                                            {request.timestamp}
                                        </p>
                                    </div>

                                    <div>
                                        <p
                                            className="text-sm font-medium text-[#3f3d56] dark:text-white opacity-70 mb-2"
                                            style={{ fontFamily: "Montserrat, sans-serif" }}
                                        >
                                            Employee
                                        </p>
                                        <p
                                            className="text-[#3f3d56] dark:text-white font-mono text-sm"
                                            style={{ fontFamily: "Montserrat, sans-serif" }}
                                        >
                                            {request.employeeName}
                                        </p>
                                    </div>

                                    <div>
                                        <p
                                            className="text-sm font-medium text-[#3f3d56] dark:text-white opacity-70 mb-2"
                                            style={{ fontFamily: "Montserrat, sans-serif" }}
                                        >
                                            Change Type
                                        </p>
                                        <div
                                            className={`inline-flex px-3 py-2 rounded-lg text-sm font-medium border ${changeType.color}`}
                                            style={{ fontFamily: "Montserrat, sans-serif" }}
                                        >
                                            <Edit className="h-4 w-4 mr-2" />
                                            {changeType.type}
                                        </div>
                                        <p
                                            className="text-xs text-[#3f3d56] dark:text-white opacity-60 mt-1"
                                            style={{ fontFamily: "Montserrat, sans-serif" }}
                                        >
                                            {changeType.description}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Summary */}
                        <Card className="border-0 shadow-sm">
                            <CardContent className="p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <Clock className="h-5 w-5 text-[#3f3d56] dark:text-white" />
                                    <h3
                                        className="text-lg font-semibold text-[#3f3d56] dark:text-white"
                                        style={{ fontFamily: "Montserrat, sans-serif" }}
                                    >
                                        Change Summary
                                    </h3>
                                </div>

                                <div className="space-y-4">
                                    <div className="bg-gray-50 dark:bg-black p-4 rounded-lg">
                                        <p
                                            className="text-sm font-medium text-[#3f3d56] dark:text-white opacity-70 mb-2"
                                            style={{ fontFamily: "Montserrat, sans-serif" }}
                                        >
                                            Attendance Date
                                        </p>
                                        <p
                                            className="text-lg font-semibold text-[#3f3d56] dark:text-white"
                                            style={{ fontFamily: "Montserrat, sans-serif" }}
                                        >
                                            {new Date(request.date).toLocaleDateString("en-US", {
                                                weekday: "long",
                                                month: "long",
                                                day: "numeric",
                                                year: "numeric",
                                            })}
                                        </p>
                                    </div>

                                    <div>
                                        <p
                                            className="text-sm font-medium text-[#3f3d56] dark:text-white opacity-70 mb-2"
                                            style={{ fontFamily: "Montserrat, sans-serif" }}
                                        >
                                            Number of Changes
                                        </p>
                                        <div className="flex items-center gap-4">
                                            <div className="text-center">
                                                <p
                                                    className="text-lg font-bold text-red-600"
                                                    style={{ fontFamily: "Montserrat, sans-serif" }}
                                                >
                                                    {request.oldValues.length}
                                                </p>
                                                <p
                                                    className="text-xs text-[#3f3d56] dark:text-white opacity-60"
                                                    style={{ fontFamily: "Montserrat, sans-serif" }}
                                                >
                                                    Old entries
                                                </p>
                                            </div>
                                            <div className="text-center">
                                                <p
                                                    className="text-lg font-bold text-green-600"
                                                    style={{ fontFamily: "Montserrat, sans-serif" }}
                                                >
                                                    {request.newValues.length}
                                                </p>
                                                <p
                                                    className="text-xs text-[#3f3d56] dark:text-white opacity-60"
                                                    style={{ fontFamily: "Montserrat, sans-serif" }}
                                                >
                                                    New entries
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Attendance Changes Comparison */}
                    <Card className="border-0 shadow-sm">
                        <CardContent className="p-6">
                            <h3
                                className="text-lg font-semibold text-[#3f3d56] dark:text-white mb-4"
                                style={{ fontFamily: "Montserrat, sans-serif" }}
                            >
                                Attendance Changes Comparison
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Old Values */}
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-4 h-4 bg-red-500 dark:bg-red-950 rounded-full"></div>
                                        <p
                                            className="text-sm font-medium text-[#3f3d56] dark:text-white opacity-70"
                                            style={{ fontFamily: "Montserrat, sans-serif" }}
                                        >
                                            Previous Values
                                        </p>
                                    </div>
                                    <div className="bg-red-50 dark:bg-red-950 dark:border-gray-800 p-4 rounded-lg border border-red-200 min-h-[200px]">
                                        {request.oldValues.length > 0 ? (
                                            <div className="space-y-3">
                                                {request.oldValues.map((entry, index) => (
                                                    <div
                                                        key={index}
                                                        className="flex justify-between items-center bg-white dark:bg-red-800 p-3 rounded-lg"
                                                    >
                                                        <span
                                                            className="text-sm font-medium text-[#3f3d56] dark:text-white"
                                                            style={{
                                                                fontFamily:
                                                                    "Montserrat, sans-serif",
                                                            }}
                                                        >
                                                            {entry.type}
                                                        </span>
                                                        <span
                                                            className="text-sm font-bold text-[#3f3d56] dark:text-white"
                                                            style={{
                                                                fontFamily:
                                                                    "Montserrat, sans-serif",
                                                            }}
                                                        >
                                                            {entry.hour}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-center h-full">
                                                <p
                                                    className="text-sm text-[#3f3d56] dark:text-white opacity-60 text-center"
                                                    style={{ fontFamily: "Montserrat, sans-serif" }}
                                                >
                                                    No previous entries
                                                    <br />
                                                    <span className="text-xs">
                                                        (Employee was marked absent)
                                                    </span>
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* New Values */}
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                                        <p
                                            className="text-sm font-medium text-[#3f3d56] dark:text-white opacity-70"
                                            style={{ fontFamily: "Montserrat, sans-serif" }}
                                        >
                                            Requested Values
                                        </p>
                                    </div>
                                    <div className="bg-green-50 dark:bg-green-700 dark:border-gray-800 p-4 rounded-lg border border-green-200 min-h-[200px]">
                                        {request.newValues.length > 0 ? (
                                            <div className="space-y-3">
                                                {request.newValues.map((entry, index) => (
                                                    <div
                                                        key={index}
                                                        className="flex justify-between items-center bg-white dark:bg-green-500 p-3 rounded-lg"
                                                    >
                                                        <span
                                                            className="text-sm font-medium text-[#3f3d56] dark:text-white"
                                                            style={{
                                                                fontFamily:
                                                                    "Montserrat, sans-serif",
                                                            }}
                                                        >
                                                            {entry.type}
                                                        </span>
                                                        <span
                                                            className="text-sm font-bold text-[#3f3d56] dark:text-white"
                                                            style={{
                                                                fontFamily:
                                                                    "Montserrat, sans-serif",
                                                            }}
                                                        >
                                                            {entry.hour}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-center h-full">
                                                <p
                                                    className="text-sm text-[#3f3d56] dark:text-white opacity-60 text-center"
                                                    style={{ fontFamily: "Montserrat, sans-serif" }}
                                                >
                                                    No new entries
                                                    <br />
                                                    <span className="text-xs">
                                                        (Requesting removal of attendance)
                                                    </span>
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Employee Comment */}
                    <Card className="border-0 shadow-sm">
                        <CardContent className="p-6">
                            <h3
                                className="text-lg font-semibold text-[#3f3d56] dark:text-white mb-4"
                                style={{ fontFamily: "Montserrat, sans-serif" }}
                            >
                                Employee Justification
                            </h3>
                            <div className="bg-blue-50 dark:bg-black dark:border-gray-700 p-4 rounded-lg border border-blue-200">
                                <p
                                    className="text-[#3f3d56] dark:text-white leading-relaxed"
                                    style={{ fontFamily: "Montserrat, sans-serif" }}
                                >
                                    {request.comment}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* HR Review Information */}
                    {request.hrComments && (
                        <Card className="border-0 shadow-sm dark:bg-black bg-blue-50/50">
                            <CardContent className="p-6">
                                <h3
                                    className="text-lg font-semibold text-[#3f3d56] dark:text-white mb-4"
                                    style={{ fontFamily: "Montserrat, sans-serif" }}
                                >
                                    HR Review
                                </h3>
                                <div className="space-y-4">
                                    <div className="bg-white dark:bg-black dark:border-gray-700 p-4 rounded-lg border border-blue-200">
                                        <p
                                            className="text-sm font-medium text-[#3f3d56] dark:text-white opacity-70 mb-2"
                                            style={{ fontFamily: "Montserrat, sans-serif" }}
                                        >
                                            HR Comments
                                        </p>
                                        <p
                                            className="text-[#3f3d56] dark:text-white leading-relaxed"
                                            style={{ fontFamily: "Montserrat, sans-serif" }}
                                        >
                                            {request.hrComments}
                                        </p>
                                    </div>
                                    {request.reviewedDate && (
                                        <div className="flex items-center justify-between bg-white dark:bg-black dark:border-gray-700 p-4 rounded-lg border border-blue-200">
                                            <div>
                                                <p
                                                    className="text-sm font-medium text-[#3f3d56] dark:text-white opacity-70"
                                                    style={{ fontFamily: "Montserrat, sans-serif" }}
                                                >
                                                    Reviewed By
                                                </p>
                                                <p
                                                    className="text-[#3f3d56] dark:text-white font-semibold"
                                                    style={{ fontFamily: "Montserrat, sans-serif" }}
                                                >
                                                    {getFullName(
                                                        employees.find(
                                                            e => e.uid == request.reviewedBy,
                                                        ) ?? ({} as EmployeeModel),
                                                    )}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p
                                                    className="text-sm font-medium text-[#3f3d56] dark:text-white opacity-70"
                                                    style={{ fontFamily: "Montserrat, sans-serif" }}
                                                >
                                                    Review Date
                                                </p>
                                                <p
                                                    className="text-[#3f3d56] dark:text-white font-semibold"
                                                    style={{ fontFamily: "Montserrat, sans-serif" }}
                                                >
                                                    {new Date(
                                                        request.reviewedDate,
                                                    ).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Close Button */}
                    <div className="flex justify-end pt-4">
                        <Button
                            onClick={onClose}
                            className="bg-[#3f3d56] hover:bg-[#3f3d56]/90 text-white px-8"
                            style={{ fontFamily: "Montserrat, sans-serif" }}
                        >
                            Close Details
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
