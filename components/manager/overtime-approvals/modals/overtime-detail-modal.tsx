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
    MoreHorizontal,
} from "lucide-react";
import { useState } from "react";
import { useFirestore } from "@/context/firestore-context";
import getFullName from "@/lib/util/getEmployeeFullName";
import { EmployeeModel } from "@/lib/models/employee";
import { calculateDuration } from "@/lib/backend/functions/calculateDuration";
import { OvertimeRequestModel } from "@/lib/models/overtime-request";
import EmployeesListModal from "@/components/common/modals/employees-list-modal";
import { OvertimeConfigurationModel } from "@/lib/backend/firebase/hrSettingsService";
import { getPrimaryOvertimeEmployee } from "@/lib/util/overtime-request-display";

interface ManagerOvertimeDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    request: OvertimeRequestModel | null;
    overtimeTypes: OvertimeConfigurationModel[];
}

export function OvertimeDetailModal({
    isOpen,
    onClose,
    request,
    overtimeTypes,
}: ManagerOvertimeDetailModalProps) {
    if (!request) return null;
    const { employees, hrSettings } = useFirestore();
    const departments = hrSettings.departmentSettings;
    const [isEmployeesModalOpen, setIsEmployeesModalOpen] = useState(false);
    const formatTime = (time: string) => {
        const [hours, minutes] = time.split(":");
        const hour = Number.parseInt(hours);
        const ampm = hour >= 12 ? "PM" : "AM";
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "approved":
                return (
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        <span style={{ fontFamily: "Montserrat, sans-serif" }}>Approved</span>
                    </Badge>
                );
            case "rejected":
                return (
                    <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                        <XCircle className="h-3 w-3 mr-1" />
                        <span style={{ fontFamily: "Montserrat, sans-serif" }}>Rejected</span>
                    </Badge>
                );
            case "pending":
                return (
                    <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        <span style={{ fontFamily: "Montserrat, sans-serif" }}>Pending</span>
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

    const getOvertimeTypeColor = (type: string) => {
        switch (type) {
            case "Emergency Overtime":
                return "bg-red-50 text-red-700 border-red-200";
            case "Project Deadline":
                return "bg-orange-50 text-orange-700 border-orange-200";
            case "Weekend Overtime":
                return "bg-blue-50 text-blue-700 border-blue-200";
            case "Holiday Overtime":
                return "bg-purple-50 text-purple-700 border-purple-200";
            case "Client Request":
                return "bg-green-50 text-green-700 border-green-200";
            default:
                return "bg-gray-50 text-gray-700 border-gray-200";
        }
    };
    const primaryEmployee = getPrimaryOvertimeEmployee(request, employees);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <DialogTitle
                            className="text-xl font-semibold text-[#3f3d56]"
                            style={{ fontFamily: "Montserrat, sans-serif" }}
                        >
                            Overtime Request Details
                        </DialogTitle>
                    </div>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Header Information */}
                    <Card className="border-0 shadow-sm bg-gradient-to-r from-[#ffe6a7]/20 to-[#ffe6a7]/10">
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h2
                                        className="text-2xl font-bold text-[#3f3d56]"
                                        style={{
                                            fontFamily: "Montserrat, sans-serif",
                                        }}
                                    >
                                        {request.overtimeId}
                                    </h2>
                                    <p
                                        className="text-sm text-[#3f3d56] opacity-60 mt-1"
                                        style={{
                                            fontFamily: "Montserrat, sans-serif",
                                        }}
                                    >
                                        Submitted on {request.timestamp}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    {getStatusBadge(request.status)}
                                    <div
                                        className={`px-3 py-1 rounded-full text-sm font-medium border ${getOvertimeTypeColor(
                                            request.overtimeType,
                                        )}`}
                                        style={{
                                            fontFamily: "Montserrat, sans-serif",
                                        }}
                                    >
                                        {overtimeTypes.find(ot => ot.id == request.overtimeType)
                                            ?.overtimeType ?? ""}
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-[#3f3d56] rounded-full flex items-center justify-center">
                                        <User className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-1">
                                            <p
                                                className="text-sm font-medium text-[#3f3d56] opacity-70"
                                                style={{
                                                    fontFamily: "Montserrat, sans-serif",
                                                }}
                                            >
                                                Employee
                                            </p>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 shrink-0"
                                                aria-label="View all employees on this request"
                                                onClick={() => setIsEmployeesModalOpen(true)}
                                            >
                                                <MoreHorizontal className="h-5 w-5 text-[#3f3d56]" />
                                            </Button>
                                        </div>
                                        <p
                                            className="font-semibold text-[#3f3d56]"
                                            style={{
                                                fontFamily: "Montserrat, sans-serif",
                                            }}
                                        >
                                            {primaryEmployee ? getFullName(primaryEmployee) : "—"}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-[#3f3d56] rounded-full flex items-center justify-center">
                                        <Calendar className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <p
                                            className="text-sm font-medium text-[#3f3d56] opacity-70"
                                            style={{
                                                fontFamily: "Montserrat, sans-serif",
                                            }}
                                        >
                                            Overtime Date
                                        </p>
                                        <p
                                            className="font-semibold text-[#3f3d56]"
                                            style={{
                                                fontFamily: "Montserrat, sans-serif",
                                            }}
                                        >
                                            {new Date(request.overtimeDate).toLocaleDateString(
                                                "en-US",
                                                {
                                                    weekday: "short",
                                                    month: "short",
                                                    day: "numeric",
                                                    year: "numeric",
                                                },
                                            )}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-[#3f3d56] rounded-full flex items-center justify-center">
                                        <Clock className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <p
                                            className="text-sm font-medium text-[#3f3d56] opacity-70"
                                            style={{
                                                fontFamily: "Montserrat, sans-serif",
                                            }}
                                        >
                                            Duration
                                        </p>
                                        <p
                                            className="font-semibold text-[#3f3d56]"
                                            style={{
                                                fontFamily: "Montserrat, sans-serif",
                                            }}
                                        >
                                            {calculateDuration(
                                                request.overtimeStartTime,
                                                request.overtimeEndTime,
                                            )}
                                        </p>
                                        <p
                                            className="text-sm text-[#3f3d56] opacity-60"
                                            style={{
                                                fontFamily: "Montserrat, sans-serif",
                                            }}
                                        >
                                            {request.overtimeStartTime} - {request.overtimeEndTime}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Detailed Information */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Request Details */}
                        <Card className="border-0 shadow-sm">
                            <CardContent className="p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <FileText className="h-5 w-5 text-[#3f3d56]" />
                                    <h3
                                        className="text-lg font-semibold text-[#3f3d56]"
                                        style={{
                                            fontFamily: "Montserrat, sans-serif",
                                        }}
                                    >
                                        Request Information
                                    </h3>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <p
                                            className="text-sm font-medium text-[#3f3d56] opacity-70 mb-2"
                                            style={{
                                                fontFamily: "Montserrat, sans-serif",
                                            }}
                                        >
                                            Request Timestamp
                                        </p>
                                        <p
                                            className="text-[#3f3d56]"
                                            style={{
                                                fontFamily: "Montserrat, sans-serif",
                                            }}
                                        >
                                            {request.timestamp}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Time Breakdown */}
                        <Card className="border-0 shadow-sm">
                            <CardContent className="p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <Clock className="h-5 w-5 text-[#3f3d56]" />
                                    <h3
                                        className="text-lg font-semibold text-[#3f3d56]"
                                        style={{
                                            fontFamily: "Montserrat, sans-serif",
                                        }}
                                    >
                                        Time Breakdown
                                    </h3>
                                </div>

                                <div className="space-y-4">
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p
                                                    className="text-sm font-medium text-[#3f3d56] opacity-70 mb-1"
                                                    style={{
                                                        fontFamily: "Montserrat, sans-serif",
                                                    }}
                                                >
                                                    Start Time
                                                </p>
                                                <p
                                                    className="text-lg font-semibold text-[#3f3d56]"
                                                    style={{
                                                        fontFamily: "Montserrat, sans-serif",
                                                    }}
                                                >
                                                    {formatTime(request.overtimeStartTime)}
                                                </p>
                                            </div>
                                            <div>
                                                <p
                                                    className="text-sm font-medium text-[#3f3d56] opacity-70 mb-1"
                                                    style={{
                                                        fontFamily: "Montserrat, sans-serif",
                                                    }}
                                                >
                                                    End Time
                                                </p>
                                                <p
                                                    className="text-lg font-semibold text-[#3f3d56]"
                                                    style={{
                                                        fontFamily: "Montserrat, sans-serif",
                                                    }}
                                                >
                                                    {formatTime(request.overtimeEndTime)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-[#ffe6a7]/20 p-4 rounded-lg border border-[#ffe6a7]/50">
                                        <p
                                            className="text-sm font-medium text-[#3f3d56] opacity-70 mb-1"
                                            style={{
                                                fontFamily: "Montserrat, sans-serif",
                                            }}
                                        >
                                            Total Overtime Duration
                                        </p>
                                        <p
                                            className="text-2xl font-bold text-[#3f3d56]"
                                            style={{
                                                fontFamily: "Montserrat, sans-serif",
                                            }}
                                        >
                                            {calculateDuration(
                                                request.overtimeStartTime,
                                                request.overtimeEndTime,
                                            )}
                                        </p>
                                    </div>

                                    <div>
                                        <p
                                            className="text-sm font-medium text-[#3f3d56] opacity-70 mb-2"
                                            style={{
                                                fontFamily: "Montserrat, sans-serif",
                                            }}
                                        >
                                            Overtime Type
                                        </p>
                                        <div
                                            className={`inline-flex px-3 py-2 rounded-lg text-sm font-medium border ${getOvertimeTypeColor(
                                                request.overtimeType,
                                            )}`}
                                            style={{
                                                fontFamily: "Montserrat, sans-serif",
                                            }}
                                        >
                                            {overtimeTypes.find(ot => ot.id == request.overtimeType)
                                                ?.overtimeType ?? ""}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Goals and Justification */}
                    <div className="space-y-4">
                        <Card className="border-0 shadow-sm">
                            <CardContent className="p-6">
                                <h3
                                    className="text-lg font-semibold text-[#3f3d56] mb-4"
                                    style={{
                                        fontFamily: "Montserrat, sans-serif",
                                    }}
                                >
                                    Overtime Goal
                                </h3>
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                    <p
                                        className="text-[#3f3d56] leading-relaxed"
                                        style={{
                                            fontFamily: "Montserrat, sans-serif",
                                        }}
                                    >
                                        {request.overtimeGoal}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-sm">
                            <CardContent className="p-6">
                                <h3
                                    className="text-lg font-semibold text-[#3f3d56] mb-4"
                                    style={{
                                        fontFamily: "Montserrat, sans-serif",
                                    }}
                                >
                                    Business Justification
                                </h3>
                                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                    <p
                                        className="text-[#3f3d56] leading-relaxed"
                                        style={{
                                            fontFamily: "Montserrat, sans-serif",
                                        }}
                                    >
                                        {request.overtimeJustification}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

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

            {/* Employees Modal */}
            <EmployeesListModal
                open={isEmployeesModalOpen}
                onOpenChange={setIsEmployeesModalOpen}
                employees={employees}
                employeeUids={request.employeeUids}
                title="Employee"
            />
        </Dialog>
    );
}
