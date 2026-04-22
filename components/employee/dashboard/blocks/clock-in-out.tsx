"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAttendance } from "@/hooks/use-attendance";
import { AttendanceModel } from "@/lib/models/attendance";
import dayjs from "dayjs";
import { Clock } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ClockInModal } from "../../attendance-management/blocks/clock-in-modal";

interface ClockInOutProps {
    variant?: "header" | "card";
}

export function ClockInOut({ variant = "header" }: ClockInOutProps) {
    const { attendance: attendances } = useAttendance({ role: "Employee" });
    const [currentTime, setCurrentTime] = useState<Date>(new Date());
    const [isClocked] = useState<boolean>(false);
    const [clockInTime] = useState<Date | null>(null);
    const currentMonthAttendance = useMemo<AttendanceModel | null>(
        () => attendances.find(a => a.month == dayjs().format("MMMM")) ?? null,
        [attendances],
    );
    const [isClockInModalOpen, setIsClockInModalOpen] = useState<boolean>(false);

    // Update time every second
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Calculate worked hours
    const getWorkedHours = () => {
        if (!clockInTime) return "0:00";
        const diff = currentTime.getTime() - clockInTime.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}:${minutes.toString().padStart(2, "0")}`;
    };

    function getTimeDiff(lastClockInTimestamp: string): string {
        if (!lastClockInTimestamp) return "";

        const now = dayjs();
        const lastClockIn = dayjs(lastClockInTimestamp);

        const diffMinutes = now.diff(lastClockIn, "minute"); // total minutes
        const hours = Math.floor(diffMinutes / 60);
        const minutes = diffMinutes % 60;

        return `${hours}h ${minutes}m`;
    }

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });
    };

    if (variant === "header") {
        return (
            <>
                <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-accent-100 to-accent-200 dark:from-accent-900/20 dark:to-accent-800/20 rounded-xl border border-accent-300 dark:border-accent-700">
                    <div className="flex items-center gap-2">
                        <div
                            className={`p-2 rounded-lg ${isClocked ? "bg-success-100 dark:bg-success-900/30" : "bg-brand-100 dark:bg-brand-900/30"}`}
                        >
                            <Clock
                                className={`h-4 w-4 ${isClocked ? "text-success-600 dark:text-success-400 animate-pulse-clock" : "text-brand-600 dark:text-brand-400"}`}
                            />
                        </div>
                        <div className="text-sm">
                            <div className="font-semibold text-brand-800 dark:text-brand-200">
                                {formatTime(currentTime)}
                            </div>
                            {currentMonthAttendance?.lastClockInTimestamp && (
                                <div className="text-xs text-brand-600 dark:text-brand-400">
                                    Worked:{" "}
                                    {getTimeDiff(currentMonthAttendance?.lastClockInTimestamp)}
                                </div>
                            )}
                        </div>
                    </div>

                    <Button
                        size="sm"
                        onClick={() => setIsClockInModalOpen(true)}
                        className={`${
                            currentMonthAttendance?.lastClockInTimestamp
                                ? "bg-danger-500 hover:bg-danger-600 text-white"
                                : "bg-success-500 hover:bg-success-600 text-white"
                        } transition-all duration-300 shadow-sm`}
                    >
                        {currentMonthAttendance?.lastClockInTimestamp ? "Clock Out" : "Clock In"}
                    </Button>
                </div>

                {/* Clock In Modal */}
                <ClockInModal
                    currentMonthAttendance={currentMonthAttendance}
                    isOpen={isClockInModalOpen}
                    onClose={() => setIsClockInModalOpen(false)}
                />
            </>
        );
    }

    // Card variant for dashboard
    return (
        <Card className="border-accent-200 dark:border-accent-700 shadow-sm bg-white dark:bg-card hover:shadow-md transition-all duration-300">
            <CardContent className="p-6">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-lg text-brand-800 dark:text-brand-200">
                            Time Tracking
                        </h3>
                        <Badge
                            className={`${isClocked ? "bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-400" : "bg-secondary-100 text-secondary-700 dark:bg-secondary-900/30 dark:text-secondary-400"}`}
                        >
                            {isClocked ? "Clocked In" : "Clocked Out"}
                        </Badge>
                    </div>

                    <div className="text-center">
                        <div className="text-3xl font-bold text-brand-800 dark:text-brand-200 mb-2">
                            {formatTime(currentTime)}
                        </div>
                        {isClocked && (
                            <div className="text-sm text-brand-600 dark:text-brand-400">
                                Worked today: {getWorkedHours()}
                            </div>
                        )}
                    </div>

                    <Button
                        size="sm"
                        onClick={() => setIsClockInModalOpen(true)}
                        className={`${
                            currentMonthAttendance?.lastClockInTimestamp
                                ? "bg-danger-500 hover:bg-danger-600 text-white"
                                : "bg-success-500 hover:bg-success-600 text-white"
                        } transition-all duration-300 shadow-sm`}
                    >
                        {currentMonthAttendance?.lastClockInTimestamp ? "Clock Out" : "Clock In"}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
