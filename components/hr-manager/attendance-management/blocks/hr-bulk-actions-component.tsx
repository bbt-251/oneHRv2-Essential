"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Check, X, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/context/toastContext";

// Type definitions for request data
interface RequestData {
    id: string;
    status: "pending" | "approved" | "rejected";
    employeeName: string;
    overtimeId?: string;
    overtimeDate?: string;
    date?: string;
}

interface HRBulkActionsComponentProps {
    overtimeRequests: RequestData[];
    attendanceChangeRequests: RequestData[];
    onBulkApprove: (requestIds: string[], type: "overtime" | "attendance") => Promise<void>;
    onBulkReject: (
        requestIds: string[],
        type: "overtime" | "attendance",
        reason: string,
    ) => Promise<void>;
}

export function HRBulkActionsComponent({
    overtimeRequests,
    attendanceChangeRequests,
    onBulkApprove,
    onBulkReject,
}: HRBulkActionsComponentProps) {
    const [selectedOvertimeRequests, setSelectedOvertimeRequests] = useState<string[]>([]);
    const [selectedAttendanceRequests, setSelectedAttendanceRequests] = useState<string[]>([]);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const { showToast } = useToast();

    // Filter pending requests for bulk actions
    const pendingOvertimeRequests = overtimeRequests.filter(req => req.status === "pending");
    const pendingAttendanceRequests = attendanceChangeRequests.filter(
        req => req.status === "pending",
    );

    // Event handlers for bulk selection
    const handleSelectAllOvertime = (checked: boolean) => {
        if (checked) {
            setSelectedOvertimeRequests(pendingOvertimeRequests.map(req => req.id));
        } else {
            setSelectedOvertimeRequests([]);
        }
    };

    const handleSelectAllAttendance = (checked: boolean) => {
        if (checked) {
            setSelectedAttendanceRequests(pendingAttendanceRequests.map(req => req.id));
        } else {
            setSelectedAttendanceRequests([]);
        }
    };

    const handleOvertimeToggle = (requestId: string) => {
        setSelectedOvertimeRequests(prev =>
            prev.includes(requestId) ? prev.filter(id => id !== requestId) : [...prev, requestId],
        );
    };

    const handleAttendanceToggle = (requestId: string) => {
        setSelectedAttendanceRequests(prev =>
            prev.includes(requestId) ? prev.filter(id => id !== requestId) : [...prev, requestId],
        );
    };

    // Bulk approval handler
    const handleBulkApprove = async (type: "overtime" | "attendance") => {
        const selectedIds =
            type === "overtime" ? selectedOvertimeRequests : selectedAttendanceRequests;

        if (selectedIds.length === 0) {
            showToast("Please select requests to approve", "No Selection", "warning", 3000);
            return;
        }

        setIsProcessing(true);
        try {
            await onBulkApprove(selectedIds, type);
            showToast(
                `Successfully approved ${selectedIds.length} ${type} requests`,
                "Bulk Approval",
                "success",
                5000,
            );

            // Clear selections after successful operation
            if (type === "overtime") {
                setSelectedOvertimeRequests([]);
            } else {
                setSelectedAttendanceRequests([]);
            }
        } catch (error) {
            showToast(`Failed to approve ${type} requests`, "Bulk Approval Failed", "error", 5000);
        } finally {
            setIsProcessing(false);
        }
    };

    // Bulk rejection handler
    const handleBulkReject = async (type: "overtime" | "attendance") => {
        const selectedIds =
            type === "overtime" ? selectedOvertimeRequests : selectedAttendanceRequests;

        if (selectedIds.length === 0) {
            showToast("Please select requests to reject", "No Selection", "warning", 3000);
            return;
        }

        // Default rejection reason for bulk operations
        const defaultReason = "Bulk rejection by HR Manager";

        setIsProcessing(true);
        try {
            await onBulkReject(selectedIds, type, defaultReason);
            showToast(
                `Successfully rejected ${selectedIds.length} ${type} requests`,
                "Bulk Rejection",
                "success",
                5000,
            );

            // Clear selections after successful operation
            if (type === "overtime") {
                setSelectedOvertimeRequests([]);
            } else {
                setSelectedAttendanceRequests([]);
            }
        } catch (error) {
            showToast(`Failed to reject ${type} requests`, "Bulk Rejection Failed", "error", 5000);
        } finally {
            setIsProcessing(false);
        }
    };

    // Check if there are selections for UI state
    const hasOvertimeSelection = selectedOvertimeRequests.length > 0;
    const hasAttendanceSelection = selectedAttendanceRequests.length > 0;

    return (
        <div className="space-y-4">
            {/* Overtime Bulk Actions Section */}
            {pendingOvertimeRequests.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-blue-600" />
                            <h3
                                className="font-medium text-blue-800"
                                style={{ fontFamily: "Montserrat, sans-serif" }}
                            >
                                Overtime Requests ({pendingOvertimeRequests.length} pending)
                            </h3>
                        </div>
                        <div className="flex items-center gap-2">
                            <Checkbox
                                checked={
                                    selectedOvertimeRequests.length ===
                                        pendingOvertimeRequests.length &&
                                    pendingOvertimeRequests.length > 0
                                }
                                onCheckedChange={handleSelectAllOvertime}
                            />
                            <span
                                className="text-sm text-blue-700"
                                style={{ fontFamily: "Montserrat, sans-serif" }}
                            >
                                Select All
                            </span>
                        </div>
                    </div>

                    <div className="space-y-2 mb-4">
                        {pendingOvertimeRequests.map(request => (
                            <div
                                key={request.id}
                                className="flex items-center gap-3 p-2 bg-white rounded border"
                            >
                                <Checkbox
                                    checked={selectedOvertimeRequests.includes(request.id)}
                                    onCheckedChange={() => handleOvertimeToggle(request.id)}
                                />
                                <div className="flex-1">
                                    <p
                                        className="text-sm font-medium"
                                        style={{ fontFamily: "Montserrat, sans-serif" }}
                                    >
                                        {request.employeeName}
                                    </p>
                                    <p
                                        className="text-xs text-gray-600"
                                        style={{ fontFamily: "Montserrat, sans-serif" }}
                                    >
                                        {request.overtimeId} -{" "}
                                        {request.overtimeDate
                                            ? new Date(request.overtimeDate).toLocaleDateString()
                                            : "N/A"}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {hasOvertimeSelection && (
                        <div className="flex items-center gap-3">
                            <Badge className="bg-blue-100 text-blue-800">
                                <span style={{ fontFamily: "Montserrat, sans-serif" }}>
                                    {selectedOvertimeRequests.length} selected
                                </span>
                            </Badge>
                            <Button
                                size="sm"
                                onClick={() => handleBulkApprove("overtime")}
                                disabled={isProcessing}
                                className="bg-green-600 hover:bg-green-700 text-white"
                                style={{ fontFamily: "Montserrat, sans-serif" }}
                            >
                                <Check className="h-4 w-4 mr-1" />
                                Approve Selected
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleBulkReject("overtime")}
                                disabled={isProcessing}
                                className="border-red-200 text-red-600 hover:bg-red-50"
                                style={{ fontFamily: "Montserrat, sans-serif" }}
                            >
                                <X className="h-4 w-4 mr-1" />
                                Reject Selected
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {/* Attendance Bulk Actions Section */}
            {pendingAttendanceRequests.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-green-600" />
                            <h3
                                className="font-medium text-green-800"
                                style={{ fontFamily: "Montserrat, sans-serif" }}
                            >
                                Attendance Requests ({pendingAttendanceRequests.length} pending)
                            </h3>
                        </div>
                        <div className="flex items-center gap-2">
                            <Checkbox
                                checked={
                                    selectedAttendanceRequests.length ===
                                        pendingAttendanceRequests.length &&
                                    pendingAttendanceRequests.length > 0
                                }
                                onCheckedChange={handleSelectAllAttendance}
                            />
                            <span
                                className="text-sm text-green-700"
                                style={{ fontFamily: "Montserrat, sans-serif" }}
                            >
                                Select All
                            </span>
                        </div>
                    </div>

                    <div className="space-y-2 mb-4">
                        {pendingAttendanceRequests.map(request => (
                            <div
                                key={request.id}
                                className="flex items-center gap-3 p-2 bg-white rounded border"
                            >
                                <Checkbox
                                    checked={selectedAttendanceRequests.includes(request.id)}
                                    onCheckedChange={() => handleAttendanceToggle(request.id)}
                                />
                                <div className="flex-1">
                                    <p
                                        className="text-sm font-medium"
                                        style={{ fontFamily: "Montserrat, sans-serif" }}
                                    >
                                        {request.employeeName}
                                    </p>
                                    <p
                                        className="text-xs text-gray-600"
                                        style={{ fontFamily: "Montserrat, sans-serif" }}
                                    >
                                        Request #{request.id} -{" "}
                                        {request.date
                                            ? new Date(request.date).toLocaleDateString()
                                            : "N/A"}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {hasAttendanceSelection && (
                        <div className="flex items-center gap-3">
                            <Badge className="bg-green-100 text-green-800">
                                <span style={{ fontFamily: "Montserrat, sans-serif" }}>
                                    {selectedAttendanceRequests.length} selected
                                </span>
                            </Badge>
                            <Button
                                size="sm"
                                onClick={() => handleBulkApprove("attendance")}
                                disabled={isProcessing}
                                className="bg-green-600 hover:bg-green-700 text-white"
                                style={{ fontFamily: "Montserrat, sans-serif" }}
                            >
                                <Check className="h-4 w-4 mr-1" />
                                Approve Selected
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleBulkReject("attendance")}
                                disabled={isProcessing}
                                className="border-red-200 text-red-600 hover:bg-red-50"
                                style={{ fontFamily: "Montserrat, sans-serif" }}
                            >
                                <X className="h-4 w-4 mr-1" />
                                Reject Selected
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
