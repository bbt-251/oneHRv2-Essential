"use client";

import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/authContext";
import { useData } from "@/context/app-data-context";
import { useToast } from "@/context/toastContext";
import { AuthRepository } from "@/lib/repository/auth";
import { ShiftTypeModel } from "@/lib/models/hr-settings";
import { clockInOrOut } from "@/lib/util/functions/clockInOrOut";
import { AttendanceModel } from "@/lib/models/attendance";
import { EmployeeModel } from "@/lib/models/employee";
import getFullName from "@/lib/util/getEmployeeFullName";
import {
    GeoCoordinate,
    GeofenceValidationResult,
    validateWorkingAreaGeofenceForCurrentLocation,
} from "@/lib/util/geofence";
import { AlertTriangle, MapPin, Play } from "lucide-react";
import { useEffect, useState } from "react";

interface ClockInModalProps {
    currentMonthAttendance: AttendanceModel | null;
    isOpen: boolean;
    onClose: () => void;
}

export function ClockInModal({ currentMonthAttendance, isOpen, onClose }: ClockInModalProps) {
    const { userData } = useAuth();
    const { attendanceLogic, flexibilityParameter, shiftTypes, shiftHours } = useData();
    const flexParam = flexibilityParameter?.at(0) ?? null;
    const [currentTime, setCurrentTime] = useState<Date>(new Date());
    const { theme } = useTheme();
    const { showToast } = useToast();

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString("en-US", {
            hour12: true,
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString("en-US", {
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric",
        });
    };

    const isDark = theme === "dark";

    return (
        <Dialog
            open={isOpen}
            onOpenChange={open => {
                if (!open) {
                    onClose();
                }
            }}
        >
            <DialogContent
                className={`max-w-md p-0 gap-0 rounded-2xl border-0 shadow-xl ${
                    isDark ? "bg-slate-900" : "bg-white"
                }`}
            >
                <DialogTitle className="sr-only">
                    {currentMonthAttendance?.lastClockInTimestamp ? "Clock Out" : "Clock In"}
                </DialogTitle>
                {/* Header */}
                <div className="flex items-center justify-between p-6 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                            <div className="w-4 h-4 bg-orange-400 rounded-full"></div>
                        </div>
                        <h2
                            className={`text-xl font-semibold ${
                                isDark ? "text-slate-300" : "text-gray-900"
                            }`}
                            style={{ fontFamily: "Montserrat, sans-serif" }}
                        >
                            {currentMonthAttendance?.lastClockInTimestamp
                                ? "Clock Out"
                                : "Clock In"}
                        </h2>
                    </div>
                </div>

                {/* Time Display */}
                <div className="px-6 py-4 text-center">
                    <div
                        className={`text-5xl font-bold ${
                            isDark ? "text-slate-200" : "text-gray-900"
                        } mb-2`}
                        style={{ fontFamily: "Montserrat, sans-serif" }}
                    >
                        {formatTime(currentTime)}
                    </div>
                    <div
                        className={`${isDark ? "text-slate-400" : "text-gray-600"} text-base`}
                        style={{ fontFamily: "Montserrat, sans-serif" }}
                    >
                        {formatDate(currentTime)}
                    </div>
                </div>

                {/* Location */}
                <div className="px-6 py-4">
                    <div
                        className={`flex items-center justify-between p-4 rounded-lg ${
                            isDark ? "bg-slate-800" : "bg-gray-50"
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <MapPin
                                className={`h-5 w-5 ${isDark ? "text-gray-400" : "text-gray-500"}`}
                            />
                            <span
                                className={`font-medium ${
                                    isDark ? "text-slate-300" : "text-gray-700"
                                }`}
                                style={{ fontFamily: "Montserrat, sans-serif" }}
                            >
                                Location
                            </span>
                        </div>
                        <span
                            className="text-green-600 font-semibold"
                            style={{ fontFamily: "Montserrat, sans-serif" }}
                        >
                            Office - Main Building
                        </span>
                    </div>
                </div>

                {/* Clock In Button */}
                <div className="p-6 pt-2">
                    <PasswordConfirmDialog
                        type={
                            currentMonthAttendance?.lastClockInTimestamp ? "Clock Out" : "Clock In"
                        }
                        currentMonthAttendance={currentMonthAttendance}
                        onConfirm={async (type, payload) => {
                            const logic = attendanceLogic?.at(0);

                            if (logic?.presentThreshold && logic?.halfPresentThreshold) {
                                const match = await AuthRepository.confirmPassword(
                                    payload.password,
                                );

                                if (!match) {
                                    showToast("Incorrect password", "Warning", "warning");
                                    return;
                                }

                                const userTimezone =
                                    Intl.DateTimeFormat().resolvedOptions().timeZone;

                                const res = await clockInOrOut(
                                    type,
                                    currentMonthAttendance ?? ({} as AttendanceModel),
                                    shiftTypes.find(st => st.id == userData?.shiftType) ??
                                        ({} as ShiftTypeModel),
                                    logic,
                                    shiftHours,
                                    flexParam,
                                    userData?.uid ?? "",
                                    userData as EmployeeModel,
                                    getFullName(userData ?? ({} as EmployeeModel)),
                                    userTimezone,
                                    payload.location,
                                );

                                if (res?.status) {
                                    showToast(
                                        type == "Clock In"
                                            ? `You have clocked in`
                                            : `You have clocked out`,
                                        "Success",
                                        "success",
                                    );
                                } else {
                                    showToast(
                                        res.error ??
                                            `Something went wrong, check connection and please try again`,
                                        "Error",
                                        "error",
                                    );
                                }
                            } else {
                                showToast(
                                    "Attendance logic configuration is required, please contact HR Manager",
                                    "Warning",
                                    "warning",
                                );
                            }
                        }}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}

interface PasswordConfirmProps {
    type: "Clock In" | "Clock Out";
    currentMonthAttendance: AttendanceModel | null;
    onConfirm: (
        type: "Clock In" | "Clock Out",
        payload: { password: string; location: GeoCoordinate | null },
    ) => Promise<void>;
}

export function PasswordConfirmDialog({
    type,
    currentMonthAttendance,
    onConfirm,
}: PasswordConfirmProps) {
    const { userData } = useAuth();
    const { showToast } = useToast();
    const [open, setOpen] = useState<boolean>(false);
    const [password, setPassword] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [validatedLocation, setValidatedLocation] = useState<GeoCoordinate | null>(null);

    const handleConfirm = async () => {
        setLoading(true);
        await onConfirm(type, { password, location: validatedLocation });
        setLoading(false);
        setPassword("");
        setValidatedLocation(null);
        setOpen(false);
    };

    const showGeofenceFailureToast = (result: GeofenceValidationResult) => {
        if (result.reason === "location_unavailable") {
            showToast(
                `Couldn't get your current location, please enable it on your browser.`,
                "Warning",
                "warning",
            );
            return;
        }

        if (result.reason === "invalid_working_area") {
            showToast(
                "Your working area is invalid. Please contact HR Manager.",
                "Warning",
                "warning",
            );
            return;
        }

        showToast(`You must be around your work place`, "Warning", "warning");
    };

    const isWithinTheGeoFence = async () => {
        const result = await validateWorkingAreaGeofenceForCurrentLocation(userData?.workingArea);
        if (!result.ok) {
            showGeofenceFailureToast(result);
            return result;
        }

        setValidatedLocation(result.location);
        return result;
    };

    return (
        <>
            <Button
                onClick={async () => {
                    const geofenceResult = await isWithinTheGeoFence();
                    if (geofenceResult?.ok) {
                        setOpen(true);
                    }
                }}
                className={`${
                    currentMonthAttendance?.lastClockInTimestamp
                        ? "bg-danger-500 hover:bg-danger-600 text-white"
                        : "bg-success-500 hover:bg-success-600 text-white"
                } w-full transition-all duration-300 py-4 text-base font-semibold rounded-xl`}
                style={{ fontFamily: "Montserrat, sans-serif" }}
            >
                <Play className="h-5 w-5 mr-2" />
                {type} Now
            </Button>

            <Dialog
                open={open}
                onOpenChange={nextOpen => {
                    setOpen(nextOpen);
                    if (!nextOpen) {
                        setPassword("");
                        setValidatedLocation(null);
                    }
                }}
            >
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-yellow-500" />
                            Confirm Password
                        </DialogTitle>
                    </DialogHeader>

                    {/* Custom content (instead of ConfirmPasswordContent component) */}
                    <div className="space-y-4 py-2">
                        <Input
                            type="password"
                            placeholder="Enter password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />
                    </div>

                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleConfirm} disabled={loading}>
                            {loading ? "Processing..." : "Done"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
