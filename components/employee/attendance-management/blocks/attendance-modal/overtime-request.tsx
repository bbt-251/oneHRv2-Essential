"use client";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/context/authContext";
import { calculateDuration } from "@/lib/util/functions/calculateDuration";
import { OvertimeConfigurationModel } from "@/lib/models/hr-settings";
import { DailyAttendance } from "@/lib/models/attendance";
import { OvertimeRequestModel } from "@/lib/models/overtime-request";
import { AttendanceRepository } from "@/lib/repository/attendance";
import { useToast } from "@/context/toastContext";
import {
    AlertCircle,
    Calendar,
    CheckCircle,
    Clock,
    DollarSign,
    Edit,
    Eye,
    FileText,
    Plus,
    Trash2,
    XCircle,
} from "lucide-react";
import dayjs from "dayjs";
import { useState } from "react";

interface OvertimeRequestTabProps {
    day: {
        day: number;
        month: string;
        year: number;
        status: string;
        dailyAttendance: DailyAttendance;
    };
    overtimeRequests: OvertimeRequestModel[];
    overtimeTypes: OvertimeConfigurationModel[];
    onOpenCreate: () => void;
    onOpenEdit: (request: OvertimeRequestModel) => void;
}

function getStatusBadge(status: string) {
    switch (status) {
        case "approved":
            return (
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Approved
                </Badge>
            );
        case "rejected":
            return (
                <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                    <XCircle className="h-3 w-3 mr-1" />
                    Rejected
                </Badge>
            );
        case "pending":
            return (
                <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Pending
                </Badge>
            );
        default:
            return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Unknown</Badge>;
    }
}

export function OvertimeRequestTab({
    day,
    overtimeRequests,
    overtimeTypes,
    onOpenCreate,
    onOpenEdit,
}: OvertimeRequestTabProps) {
    const { userData } = useAuth();
    const { showToast } = useToast();
    const [viewingRequest, setViewingRequest] = useState<OvertimeRequestModel | null>(null);
    const [deletingRequest, setDeletingRequest] = useState<OvertimeRequestModel | null>(null);
    const [isDeleting, setIsDeleting] = useState<boolean>(false);

    const canEditOrDelete = (req: OvertimeRequestModel) =>
        req.status === "pending" && req.requestedBy === userData?.uid;

    // Helper function to get duration in hours from start and end times
    // This properly handles overnight shifts (e.g., 5PM to 2AM = 9 hours)
    const getDurationHours = (startTime: string, endTime: string): number => {
        const start = dayjs(startTime, "hh:mm A");
        const end = dayjs(endTime, "hh:mm A");
        let diff = end.diff(start, "hour", true);
        if (diff < 0) {
            diff += 24; // Add 24 hours for overnight shifts
        }
        return diff;
    };

    // Calculate total OT hours requested and approved
    // Use stored duration if available, otherwise calculate from start/end times
    const totalHoursRequested = overtimeRequests.reduce((sum, req) => {
        const hours = req.duration ?? getDurationHours(req.overtimeStartTime, req.overtimeEndTime);
        return sum + hours;
    }, 0);
    const totalHoursApproved = overtimeRequests
        .filter(req => req.status === "approved")
        .reduce((sum, req) => {
            const hours =
                req.duration ?? getDurationHours(req.overtimeStartTime, req.overtimeEndTime);
            return sum + hours;
        }, 0);

    const handleDelete = async () => {
        if (!deletingRequest || !userData?.uid) return;
        setIsDeleting(true);
        const res = await AttendanceRepository.deleteOvertimeRequest(
            deletingRequest.id,
            deletingRequest.employeeUids,
        );
        setIsDeleting(false);
        setDeletingRequest(null);
        if (res.success) {
            showToast("Overtime request deleted.", "Success", "success");
        } else {
            showToast("Failed to delete request.", "Error", "error");
        }
    };

    return (
        <>
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-[#3f3d56]" />
                    <h3
                        className="text-lg font-semibold text-[#3f3d56]"
                        style={{ fontFamily: "Montserrat, sans-serif" }}
                    >
                        Overtime Requests - {day.month} {day.day}, {day.year}
                    </h3>
                </div>
                <Button
                    onClick={onOpenCreate}
                    className="bg-[#3f3d56] hover:bg-[#3f3d56]/90 text-white"
                    style={{ fontFamily: "Montserrat, sans-serif" }}
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Overtime Request
                </Button>
            </div>

            {/* OT Hours Metrics */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                        <Clock className="h-4 w-4 text-amber-600" />
                        <span
                            className="text-sm font-medium text-amber-800"
                            style={{ fontFamily: "Montserrat, sans-serif" }}
                        >
                            Total OT Hours Requested
                        </span>
                    </div>
                    <p
                        className="text-2xl font-bold text-amber-900"
                        style={{ fontFamily: "Montserrat, sans-serif" }}
                    >
                        {totalHoursRequested.toFixed(1)} hrs
                    </p>
                </div>
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-1">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span
                            className="text-sm font-medium text-green-800"
                            style={{ fontFamily: "Montserrat, sans-serif" }}
                        >
                            Total OT Hours Approved
                        </span>
                    </div>
                    <p
                        className="text-2xl font-bold text-green-900"
                        style={{ fontFamily: "Montserrat, sans-serif" }}
                    >
                        {totalHoursApproved.toFixed(1)} hrs
                    </p>
                </div>
            </div>

            {overtimeRequests.length > 0 ? (
                <div className="space-y-4">
                    {overtimeRequests.map(request => (
                        <Card key={request.id} className="border-0 shadow-sm">
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <p
                                            className="font-semibold text-[#3f3d56]"
                                            style={{ fontFamily: "Montserrat, sans-serif" }}
                                        >
                                            {request.overtimeId}
                                        </p>
                                        <p
                                            className="text-sm text-[#3f3d56] opacity-60"
                                            style={{ fontFamily: "Montserrat, sans-serif" }}
                                        >
                                            Submitted {request.timestamp}
                                        </p>
                                    </div>
                                    {getStatusBadge(request.status)}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-[#3f3d56] opacity-60" />
                                        <span
                                            className="text-sm text-[#3f3d56]"
                                            style={{ fontFamily: "Montserrat, sans-serif" }}
                                        >
                                            {request.overtimeDate}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-[#3f3d56] opacity-60" />
                                        <span
                                            className="text-sm text-[#3f3d56]"
                                            style={{ fontFamily: "Montserrat, sans-serif" }}
                                        >
                                            {request.overtimeStartTime} - {request.overtimeEndTime}{" "}
                                            (
                                            {calculateDuration(
                                                request.overtimeStartTime,
                                                request.overtimeEndTime,
                                            )}
                                            )
                                        </span>
                                    </div>
                                    <div
                                        className="text-sm text-[#3f3d56] opacity-70"
                                        style={{ fontFamily: "Montserrat, sans-serif" }}
                                    >
                                        {overtimeTypes.find(ot => ot.id === request.overtimeType)
                                            ?.overtimeType ?? request.overtimeType}
                                    </div>
                                </div>
                                {request.overtimeGoal && (
                                    <p
                                        className="text-sm text-[#3f3d56] opacity-80 mb-2 line-clamp-2"
                                        style={{ fontFamily: "Montserrat, sans-serif" }}
                                    >
                                        <strong>Goal:</strong> {request.overtimeGoal}
                                    </p>
                                )}
                                <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-[#3f3d56] border-gray-200 hover:bg-gray-50"
                                        style={{ fontFamily: "Montserrat, sans-serif" }}
                                        onClick={() => setViewingRequest(request)}
                                    >
                                        <Eye className="h-3 w-3 mr-1" />
                                        View
                                    </Button>
                                    {canEditOrDelete(request) && (
                                        <>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-[#3f3d56] border-gray-200 hover:bg-gray-50"
                                                style={{ fontFamily: "Montserrat, sans-serif" }}
                                                onClick={() => onOpenEdit(request)}
                                            >
                                                <Edit className="h-3 w-3 mr-1" />
                                                Edit
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-red-600 border-red-200 hover:bg-red-50"
                                                style={{ fontFamily: "Montserrat, sans-serif" }}
                                                onClick={() => setDeletingRequest(request)}
                                            >
                                                <Trash2 className="h-3 w-3 mr-1" />
                                                Delete
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card className="border-0 shadow-sm">
                    <CardContent className="p-6 text-center">
                        <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p
                            className="text-[#3f3d56] opacity-60 mb-4"
                            style={{ fontFamily: "Montserrat, sans-serif" }}
                        >
                            No overtime requests for this day.
                        </p>
                        <Button
                            onClick={onOpenCreate}
                            className="bg-[#3f3d56] hover:bg-[#3f3d56]/90 text-white"
                            style={{ fontFamily: "Montserrat, sans-serif" }}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Create Overtime Request
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* View detail modal */}
            <Dialog open={!!viewingRequest} onOpenChange={() => setViewingRequest(null)}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle
                            className="text-xl font-semibold text-[#3f3d56]"
                            style={{ fontFamily: "Montserrat, sans-serif" }}
                        >
                            Overtime Request Details
                        </DialogTitle>
                    </DialogHeader>
                    {viewingRequest && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="font-mono text-[#3f3d56]">
                                    {viewingRequest.overtimeId}
                                </span>
                                {getStatusBadge(viewingRequest.status)}
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-[#3f3d56] opacity-70">Date</p>
                                    <p className="font-medium text-[#3f3d56]">
                                        {viewingRequest.overtimeDate}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[#3f3d56] opacity-70">Time</p>
                                    <p className="font-medium text-[#3f3d56]">
                                        {viewingRequest.overtimeStartTime} -{" "}
                                        {viewingRequest.overtimeEndTime}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[#3f3d56] opacity-70">Duration</p>
                                    <p className="font-medium text-[#3f3d56]">
                                        {calculateDuration(
                                            viewingRequest.overtimeStartTime,
                                            viewingRequest.overtimeEndTime,
                                        )}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[#3f3d56] opacity-70">Type</p>
                                    <p className="font-medium text-[#3f3d56]">
                                        {overtimeTypes.find(
                                            ot => ot.id === viewingRequest.overtimeType,
                                        )?.overtimeType ?? viewingRequest.overtimeType}
                                    </p>
                                </div>
                            </div>
                            <div>
                                <p className="text-[#3f3d56] opacity-70 flex items-center gap-1 mb-1">
                                    <FileText className="h-4 w-4" /> Overtime Goal
                                </p>
                                <p
                                    className="text-[#3f3d56] bg-gray-50 p-3 rounded-lg"
                                    style={{ fontFamily: "Montserrat, sans-serif" }}
                                >
                                    {viewingRequest.overtimeGoal}
                                </p>
                            </div>
                            <div>
                                <p className="text-[#3f3d56] opacity-70 flex items-center gap-1 mb-1">
                                    Overtime Justification
                                </p>
                                <p
                                    className="text-[#3f3d56] bg-gray-50 p-3 rounded-lg"
                                    style={{ fontFamily: "Montserrat, sans-serif" }}
                                >
                                    {viewingRequest.overtimeJustification}
                                </p>
                            </div>
                            {viewingRequest.hrComments && (
                                <div>
                                    <p className="text-[#3f3d56] opacity-70 mb-1">HR Comments</p>
                                    <p
                                        className="text-[#3f3d56] bg-blue-50 p-3 rounded-lg border border-blue-100"
                                        style={{ fontFamily: "Montserrat, sans-serif" }}
                                    >
                                        {viewingRequest.hrComments}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete confirmation */}
            <AlertDialog
                open={!!deletingRequest}
                onOpenChange={() => !isDeleting && setDeletingRequest(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle style={{ fontFamily: "Montserrat, sans-serif" }}>
                            Delete Overtime Request
                        </AlertDialogTitle>
                        <AlertDialogDescription style={{ fontFamily: "Montserrat, sans-serif" }}>
                            Are you sure you want to delete this overtime request? This action
                            cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {isDeleting ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
