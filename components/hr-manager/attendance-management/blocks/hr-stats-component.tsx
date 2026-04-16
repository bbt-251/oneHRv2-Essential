"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Edit, CheckCircle, XCircle } from "lucide-react";

// Type definitions for request data
interface RequestDataRM {
    status: "Requested" | "Approved" | "Refused";
}

interface RequestDataOT {
    status: "pending" | "approved" | "rejected";
    approvalStage?: "manager" | "hr" | "completed";
}

interface HRStatsComponentProps {
    overtimeRequests: RequestDataOT[];
    attendanceChangeRequests: RequestDataRM[];
}

export function HRStatsComponent({
    overtimeRequests,
    attendanceChangeRequests,
}: HRStatsComponentProps) {
    // Calculate statistics for dashboard
    const pendingOvertime = overtimeRequests.filter(
        req => req.status === "pending" && req.approvalStage !== "manager",
    ).length;
    const pendingAttendance = attendanceChangeRequests.filter(
        req => req.status === "Requested",
    ).length;
    const totalApproved = [...overtimeRequests, ...attendanceChangeRequests].filter(req =>
        ["Approved", "approved"].includes(req.status),
    ).length;
    const totalRejected = [...overtimeRequests, ...attendanceChangeRequests].filter(req =>
        ["Refused", "rejected"].includes(req.status),
    ).length;

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Pending Overtime Requests Card */}
            <Card className="border-0 shadow-sm bg-white dark:bg-black dark:border">
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <CardTitle
                            className="text-sm font-medium text-[#3f3d56] dark:text-white opacity-70"
                            style={{ fontFamily: "Montserrat, sans-serif" }}
                        >
                            Pending Overtime
                        </CardTitle>
                        <div className="w-8 h-8 bg-[#ffe6a7] rounded-lg flex items-center justify-center">
                            <DollarSign className="h-4 w-4 text-[#3f3d56]" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-0">
                    <div
                        className="text-3xl font-bold text-[#3f3d56] dark:text-white mb-1"
                        style={{ fontFamily: "Montserrat, sans-serif" }}
                    >
                        {pendingOvertime}
                    </div>
                    <p
                        className="text-sm text-[#3f3d56] dark:text-white opacity-60"
                        style={{ fontFamily: "Montserrat, sans-serif" }}
                    >
                        Awaiting review
                    </p>
                </CardContent>
            </Card>

            {/* Pending Attendance Requests Card */}
            <Card className="border-0 shadow-sm bg-white dark:border dark:bg-black">
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <CardTitle
                            className="text-sm font-medium text-[#3f3d56] dark:text-white opacity-70"
                            style={{ fontFamily: "Montserrat, sans-serif" }}
                        >
                            Pending Attendance
                        </CardTitle>
                        <div className="w-8 h-8 bg-[#ffe6a7] rounded-lg flex items-center justify-center">
                            <Edit className="h-4 w-4 text-[#3f3d56]" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-0">
                    <div
                        className="text-3xl font-bold text-[#3f3d56] dark:text-white mb-1"
                        style={{ fontFamily: "Montserrat, sans-serif" }}
                    >
                        {pendingAttendance}
                    </div>
                    <p
                        className="text-sm text-[#3f3d56] dark:text-white opacity-60"
                        style={{ fontFamily: "Montserrat, sans-serif" }}
                    >
                        Awaiting review
                    </p>
                </CardContent>
            </Card>

            {/* Total Approved Requests Card */}
            <Card className="border-0 shadow-sm bg-white dark:bg-black dark:border">
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <CardTitle
                            className="text-sm font-medium text-[#3f3d56] dark:text-white opacity-70"
                            style={{ fontFamily: "Montserrat, sans-serif" }}
                        >
                            Total Approved
                        </CardTitle>
                        <div className="w-8 h-8 bg-[#ffe6a7] rounded-lg flex items-center justify-center">
                            <CheckCircle className="h-4 w-4 text-[#3f3d56]" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-0">
                    <div
                        className="text-3xl font-bold text-[#3f3d56] dark:text-white mb-1"
                        style={{ fontFamily: "Montserrat, sans-serif" }}
                    >
                        {totalApproved}
                    </div>
                    <p
                        className="text-sm text-[#3f3d56] dark:text-white opacity-60"
                        style={{ fontFamily: "Montserrat, sans-serif" }}
                    >
                        This month
                    </p>
                </CardContent>
            </Card>

            {/* Total Rejected Requests Card */}
            <Card className="border-0 shadow-sm bg-white dark:bg-black">
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <CardTitle
                            className="text-sm font-medium text-[#3f3d56] dark:text-white opacity-70"
                            style={{ fontFamily: "Montserrat, sans-serif" }}
                        >
                            Total Rejected
                        </CardTitle>
                        <div className="w-8 h-8 bg-[#ffe6a7] rounded-lg flex items-center justify-center">
                            <XCircle className="h-4 w-4 text-[#3f3d56]" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-0">
                    <div
                        className="text-3xl font-bold text-[#3f3d56] dark:text-white mb-1"
                        style={{ fontFamily: "Montserrat, sans-serif" }}
                    >
                        {totalRejected}
                    </div>
                    <p
                        className="text-sm text-[#3f3d56] dark:text-white opacity-60"
                        style={{ fontFamily: "Montserrat, sans-serif" }}
                    >
                        This month
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
