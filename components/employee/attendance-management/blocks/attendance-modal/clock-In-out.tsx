"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/authContext";
import { useFirestore } from "@/context/firestore-context";
import { useToast } from "@/context/toastContext";
import { calculateTotalWorkedHours } from "@/lib/backend/functions/calculateDuration";
import { DailyAttendance } from "@/lib/models/attendance";
import { OvertimeRequestModel } from "@/lib/models/overtime-request";
import { formatHour, getUserTimezone } from "@/lib/util/dayjs_format";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { Clock, DollarSign, Edit } from "lucide-react";
import React, { useEffect, useState } from "react";
dayjs.extend(customParseFormat);

interface AttendanceModalProps {
    day: {
        day: number;
        month: string;
        year: number;
        status: string;
        dailyAttendance: DailyAttendance;
    };
    filteredOTs: OvertimeRequestModel[];
    setShowChangeForm: (value: boolean) => void;
    setShowOvertimeForm: (value: boolean) => void;
}

export const calculateTotalOvertime = (overtimeRequests: OvertimeRequestModel[]): string => {
    let totalMinutes = 0;

    overtimeRequests.forEach(req => {
        const start = dayjs(req.overtimeStartTime, "hh:mm A");
        const end = dayjs(req.overtimeEndTime, "hh:mm A");

        if (start.isValid() && end.isValid()) {
            let diff = end.diff(start, "minute");
            if (diff < 0) {
                // handle overnight shifts
                diff = end.add(1, "day").diff(start, "minute");
            }
            totalMinutes += diff;
        }
    });

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return `${hours}h ${minutes}m`;
};

const getStatusColor = (status: string, theme: "dark" | "light" | "system") => {
    switch (status) {
        case "present":
            return theme == "dark"
                ? "bg-green-900 text-green-200 border-green-700 hover:bg-green-800"
                : "bg-green-300 text-[#3f3d56] border-green-200 hover:bg-green-100";
        case "half-present":
            return theme == "dark"
                ? "bg-yellow-900 text-yellow-200 border-yellow-700 hover:bg-yellow-800"
                : "bg-yellow-300 text-[#3f3d56] border-yellow-200 hover:bg-yellow-400";
        case "absent":
            return theme == "dark"
                ? "bg-red-900 text-red-200 border-red-700 hover:bg-red-800"
                : "bg-red-50 text-[#3f3d56] border-red-200 hover:bg-red-100";
        case "holiday":
            return theme == "dark"
                ? "bg-yellow-900 text-yellow-100 border-yellow-700 hover:bg-yellow-800"
                : "bg-[#ffe6a7] text-[#3f3d56] border-yellow-200 hover:bg-yellow-200";
        case "weekend":
            return theme == "dark"
                ? "bg-blue-900 text-blue-200 border-blue-700 hover:bg-blue-800"
                : "bg-blue-50 text-[#3f3d56] border-blue-200 hover:bg-blue-100";
        case "future":
            return theme == "dark"
                ? "bg-gray-800 text-gray-500 border-gray-600 hover:bg-gray-700"
                : "bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100";
        case "leave":
            return theme == "dark"
                ? "bg-purple-900 text-purple-200 border-purple-700 hover:bg-purple-800"
                : "bg-purple-50 text-[#3f3d56] border-purple-200 hover:bg-purple-100";
        default:
            return "text-gray-600 bg-gray-50";
    }
};

export const ClockInOut: React.FC<AttendanceModalProps> = ({
    day,
    filteredOTs,
    setShowChangeForm,
    setShowOvertimeForm,
}) => {
    const [showProjectAllocation, setShowProjectAllocation] = useState(false);
    const [projectAllocations, setProjectAllocations] = useState<Record<string, number>>({});
    // Projects assigned to the current user from Firestore
    const { projects, employees } = useFirestore();
    const { userData } = useAuth();
    const { showToast } = useToast();
    const [isSaving, setIsSaving] = useState(false);

    // Get employee's stored timezone, fallback to current browser timezone
    const employeeData = employees.find(emp => emp.uid === userData?.uid);
    const userTimezone = employeeData?.timezone || getUserTimezone();

    const userProjects = React.useMemo(
        () =>
            (projects || [])
                .filter(p => (p.assignedMembers || []).includes(userData?.uid || ""))
                .map(p => ({
                    id: p.id,
                    name: p.name,
                    code: p.id,
                    allocation:
                        p.employeeAllocations?.find(a => a.uid == userData?.uid)?.allocation ?? 0,
                })),
        [projects, userData?.uid],
    );

    // Initialize project allocations
    useEffect(() => {
        if (userProjects.length > 0 && Object.keys(projectAllocations).length === 0) {
            const initialAllocations: Record<string, number> = {};
            userProjects.forEach(project => {
                initialAllocations[project.id] = project.allocation;
            });
            setProjectAllocations(initialAllocations);
        }
    }, [userProjects]);

    const handleProjectAllocationChange = (projectId: string, percentage: number) => {
        setProjectAllocations(prev => ({
            ...prev,
            [projectId]: Math.max(0, Math.min(100, percentage)),
        }));
    };

    const getTotalAllocation = () => {
        return Object.values(projectAllocations).reduce((sum, value) => sum + value, 0);
    };

    const getAllocationValidation = () => {
        const total = getTotalAllocation();
        if (total === 0) return { isValid: true, message: "" };
        if (total === 100) return { isValid: true, message: "Perfect allocation!" };
        if (total < 100)
            return {
                isValid: false,
                message: `${100 - total}% remaining to allocate`,
            };
        return { isValid: false, message: `${total - 100}% over allocation` };
    };

    const validation = getAllocationValidation();

    const handleSave = async () => {
        const total = getTotalAllocation();
        if (total !== 100) {
            showToast(
                `Total allocation must be 100%. Currently ${total}%.`,
                "Allocation Validation",
                "warning",
            );
            return;
        }
        if (!userData?.uid) {
            showToast("Unable to determine current user.", "Error", "error");
            return;
        }

        // Build a single batch update for all projects
        const updates = userProjects.map(proj => {
            const allocation = projectAllocations[proj.id] || 0;

            // Find current project to merge existing allocations
            const currentProject = (projects || []).find(p => p.id === proj.id);

            // Filter out current user's previous allocation
            const existingAllocations = (currentProject?.employeeAllocations || []).filter(
                (a: any) => a && a.uid !== userData.uid,
            );

            // If allocation > 0, upsert user's allocation; otherwise keep them removed
            const nextAllocations =
                allocation > 0
                    ? [...existingAllocations, { uid: userData.uid, allocation }]
                    : existingAllocations;

            return {
                id: proj.id,
                employeeAllocations: nextAllocations,
            };
        });

        setIsSaving(true);
        try {
            // Filter out no-op updates (no change)
            const updatesToApply = updates.filter(u => {
                const original =
                    (projects || []).find(p => p.id === u.id)?.employeeAllocations || [];
                const nextJson = JSON.stringify(
                    (u.employeeAllocations || []).sort((a: any, b: any) =>
                        a.uid.localeCompare(b.uid),
                    ),
                );
                const origJson = JSON.stringify(
                    (original || [])
                        .filter(Boolean)
                        .sort((a: any, b: any) => a.uid.localeCompare(b.uid)),
                );
                return nextJson !== origJson;
            });

            if (updatesToApply.length === 0) {
                showToast("No changes to save.", "Info", "default");
                return;
            }

            await updateProjectsBatch(updatesToApply);
            showToast("Allocations saved successfully.", "Success", "success");
        } catch (e) {
            console.error("Error saving allocations", e);
            showToast("Failed to save allocations.", "Error", "error");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Status Card */}
            <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p
                                className="text-sm font-medium text-[#3f3d56] opacity-70"
                                style={{ fontFamily: "Montserrat, sans-serif" }}
                            >
                                Status
                            </p>
                            <div
                                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(
                                    day.status,
                                    "light",
                                )}`}
                            >
                                {day.status}
                            </div>
                        </div>
                        <div className="text-right">
                            <p
                                className="text-sm font-medium text-[#3f3d56] opacity-70"
                                style={{ fontFamily: "Montserrat, sans-serif" }}
                            >
                                Total Hours
                            </p>
                            <p
                                className="text-lg font-semibold text-[#3f3d56]"
                                style={{ fontFamily: "Montserrat, sans-serif" }}
                            >
                                {calculateTotalWorkedHours(day?.dailyAttendance?.workedHours)}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Time Stamps */}
            {day?.dailyAttendance?.workedHours?.length ? (
                <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle
                            className="text-lg font-semibold text-[#3f3d56] flex items-center gap-2"
                            style={{ fontFamily: "Montserrat, sans-serif" }}
                        >
                            <Clock className="h-5 w-5" />
                            Time Stamps
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {day?.dailyAttendance?.workedHours?.map((stamp, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                            >
                                <p
                                    className="font-medium text-[#3f3d56]"
                                    style={{
                                        fontFamily: "Montserrat, sans-serif",
                                    }}
                                >
                                    {stamp.type}
                                </p>
                                <div
                                    className="text-lg font-semibold text-[#3f3d56]"
                                    style={{
                                        fontFamily: "Montserrat, sans-serif",
                                    }}
                                >
                                    {stamp.hour}
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            ) : (
                <Card className="border-0 shadow-sm">
                    <CardContent className="p-6 text-center">
                        <Clock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p
                            className="text-[#3f3d56] opacity-60"
                            style={{ fontFamily: "Montserrat, sans-serif" }}
                        >
                            No time stamps available for this day
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Project Allocation Section (Optional) */}
            <Card className="border-0 shadow-sm bg-white">
                <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-[#ffe6a7] rounded-lg flex items-center justify-center">
                                <div className="w-4 h-4 bg-[#3f3d56] rounded-sm"></div>
                            </div>
                            <div>
                                <h3
                                    className="text-lg font-semibold text-[#3f3d56]"
                                    style={{
                                        fontFamily: "Montserrat, sans-serif",
                                    }}
                                >
                                    Project Allocation
                                </h3>
                                <p
                                    className="text-sm text-[#3f3d56] opacity-60"
                                    style={{
                                        fontFamily: "Montserrat, sans-serif",
                                    }}
                                >
                                    Optional - Allocate your time across projects
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowProjectAllocation(!showProjectAllocation)}
                            className="text-[#3f3d56] border-gray-200 hover:bg-gray-50 bg-transparent"
                            style={{ fontFamily: "Montserrat, sans-serif" }}
                        >
                            {showProjectAllocation ? "Hide" : "Show"} Allocation
                        </Button>
                    </div>

                    {showProjectAllocation && (
                        <div className="space-y-4">
                            {/* Project List */}
                            <div className="space-y-3">
                                {userProjects.map(project => (
                                    <div
                                        key={project.id}
                                        className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
                                    >
                                        <div className="flex-1">
                                            <p
                                                className="font-medium text-[#3f3d56]"
                                                style={{
                                                    fontFamily: "Montserrat, sans-serif",
                                                }}
                                            >
                                                {project.name}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={projectAllocations[project.id] || 0}
                                                onChange={e =>
                                                    handleProjectAllocationChange(
                                                        project.id,
                                                        Number.parseInt(e.target.value) || 0,
                                                    )
                                                }
                                                className="w-20 text-center"
                                                placeholder="0"
                                            />
                                            <span
                                                className="text-sm font-medium text-[#3f3d56] opacity-70"
                                                style={{
                                                    fontFamily: "Montserrat, sans-serif",
                                                }}
                                            >
                                                %
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Allocation Summary */}
                            <div className="border-t border-gray-200 pt-4">
                                <div className="flex items-center justify-between mb-3">
                                    <span
                                        className="text-sm font-medium text-[#3f3d56] opacity-70"
                                        style={{
                                            fontFamily: "Montserrat, sans-serif",
                                        }}
                                    >
                                        Total Allocation:
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={`text-lg font-bold ${
                                                validation.isValid
                                                    ? "text-green-600"
                                                    : "text-red-600"
                                            }`}
                                            style={{
                                                fontFamily: "Montserrat, sans-serif",
                                            }}
                                        >
                                            {getTotalAllocation()}%
                                        </span>
                                        {validation.isValid && getTotalAllocation() === 100 && (
                                            <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                                                <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                                    <div
                                        className={`h-2 rounded-full transition-all duration-300 ${
                                            validation.isValid && getTotalAllocation() === 100
                                                ? "bg-green-500"
                                                : getTotalAllocation() > 100
                                                    ? "bg-red-500"
                                                    : "bg-blue-500"
                                        }`}
                                        style={{
                                            width: `${Math.min(getTotalAllocation(), 100)}%`,
                                        }}
                                    ></div>
                                </div>

                                {/* Validation Message */}
                                {validation.message && (
                                    <p
                                        className={`text-sm ${
                                            validation.isValid ? "text-green-600" : "text-red-600"
                                        }`}
                                        style={{
                                            fontFamily: "Montserrat, sans-serif",
                                        }}
                                    >
                                        {validation.message}
                                    </p>
                                )}

                                {/* Quick Actions */}
                                <div className="flex gap-2 mt-3">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            const equalAllocation = Math.floor(
                                                100 / userProjects.length,
                                            );
                                            const remainder =
                                                100 - equalAllocation * userProjects.length;
                                            const newAllocations: Record<string, number> = {};
                                            userProjects.forEach((project, index) => {
                                                newAllocations[project.id] =
                                                    equalAllocation + (index === 0 ? remainder : 0);
                                            });
                                            setProjectAllocations(newAllocations);
                                        }}
                                        className="text-[#3f3d56] border-gray-200 hover:bg-gray-50 bg-transparent text-xs"
                                        style={{
                                            fontFamily: "Montserrat, sans-serif",
                                        }}
                                    >
                                        Equal Split
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            const newAllocations: Record<string, number> = {};
                                            userProjects.forEach(project => {
                                                newAllocations[project.id] = 0;
                                            });
                                            setProjectAllocations(newAllocations);
                                        }}
                                        className="text-[#3f3d56] border-gray-200 hover:bg-gray-50 bg-transparent text-xs"
                                        style={{
                                            fontFamily: "Montserrat, sans-serif",
                                        }}
                                    >
                                        Clear All
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="text-[#3f3d56] border-gray-200 hover:bg-gray-50 bg-transparent text-xs"
                                        style={{
                                            fontFamily: "Montserrat, sans-serif",
                                        }}
                                    >
                                        {isSaving ? "Saving..." : "Save"}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Overtime Information */}
            {filteredOTs.length > 0 && (
                <Card className="border-0 shadow-sm bg-[#ffe6a7]/20">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p
                                    className="text-sm font-medium text-[#3f3d56] opacity-70"
                                    style={{
                                        fontFamily: "Montserrat, sans-serif",
                                    }}
                                >
                                    Overtime Hours
                                </p>
                                <p
                                    className="text-lg font-semibold text-[#3f3d56]"
                                    style={{
                                        fontFamily: "Montserrat, sans-serif",
                                    }}
                                >
                                    {calculateTotalOvertime(filteredOTs)}
                                </p>
                            </div>
                            <div
                                className="text-sm text-[#3f3d56] opacity-60"
                                style={{ fontFamily: "Montserrat, sans-serif" }}
                            >
                                Available for claim
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
                <Button
                    onClick={() => setShowChangeForm(true)}
                    className="flex-1 bg-[#3f3d56] hover:bg-[#3f3d56]/90 text-white"
                    style={{ fontFamily: "Montserrat, sans-serif" }}
                >
                    <Edit className="h-4 w-4 mr-2" />
                    Attendance Change Request
                </Button>

                <Button
                    onClick={() => setShowOvertimeForm(true)}
                    className="flex-1 bg-[#ffe6a7] hover:bg-[#ffe6a7]/80 text-[#3f3d56]"
                    style={{ fontFamily: "Montserrat, sans-serif" }}
                >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Claim Overtime
                </Button>
            </div>
        </div>
    );
};
