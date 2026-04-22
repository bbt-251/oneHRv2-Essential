"use client";

import { DarkAwareSelect } from "@/components/darkAwareSelect";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AttendanceModel } from "@/lib/models/attendance";
import dayjs from "dayjs";
import { Clock } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ClockInModal } from "./clock-in-modal";

interface FilterProps {
    attendances: AttendanceModel[];
    selectedMonth: string;
    selectedStatus: string[];
    onMonthChange: (month: string) => void;
    onStatusChange: (status: string[]) => void;
    onClearFilters: () => void;
}

const months = [
    "All Months",
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
];

export function AttendanceFilter({
    attendances,
    selectedMonth,
    selectedStatus,
    onMonthChange,
    onStatusChange,
    onClearFilters,
}: FilterProps) {
    const { theme } = useTheme();
    const [currentTime, setCurrentTime] = useState<Date>(new Date());
    const [isClockInModalOpen, setIsClockInModalOpen] = useState<boolean>(false);
    const currentMonthAttendance = useMemo<AttendanceModel | null>(
        () => attendances.find(a => a.month == dayjs().format("MMMM")) ?? null,
        [attendances],
    );

    const statusOptions = [
        {
            value: "present",
            label: "Present",
            color:
                theme == "dark"
                    ? "bg-green-900 text-green-200 border-green-700 hover:bg-green-800"
                    : "bg-green-300 text-[#3f3d56] border-green-200 hover:bg-green-100",
        },
        {
            value: "half-present",
            label: "Half Present",
            color:
                theme == "dark"
                    ? "bg-yellow-900 text-yellow-200 border-yellow-700 hover:bg-yellow-800"
                    : "bg-yellow-300 text-[#3f3d56] border-yellow-200 hover:bg-yellow-400",
        },
        {
            value: "absent",
            label: "Absent",
            color:
                theme == "dark"
                    ? "bg-red-900 text-red-200 border-red-700 hover:bg-red-800"
                    : "bg-red-50 text-[#3f3d56] border-red-200 hover:bg-red-100",
        },
        {
            value: "leave",
            label: "Leave",
            color:
                theme == "dark"
                    ? "bg-[#ed4ca2] text-white border-[#b93481] hover:bg-[#d0338f]"
                    : "bg-[#f4a3cc] text-[#7a0f5a] border-[#e066b3] hover:bg-[#e066b3]",
        },
        {
            value: "holiday",
            label: "Holiday",
            color:
                theme == "dark"
                    ? "bg-yellow-900 text-yellow-100 border-yellow-700 hover:bg-yellow-800"
                    : "bg-[#ffe6a7] text-[#3f3d56] border-yellow-200 hover:bg-yellow-200",
        },
        {
            value: "weekend",
            label: "Weekend",
            color:
                theme == "dark"
                    ? "bg-blue-900 text-blue-200 border-blue-700 hover:bg-blue-800"
                    : "bg-blue-50 text-[#3f3d56] border-blue-200 hover:bg-blue-100",
        },
    ];

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const toggleStatus = (status: string) => {
        if (selectedStatus.includes(status)) {
            onStatusChange(selectedStatus.filter(s => s !== status));
        } else {
            onStatusChange([...selectedStatus, status]);
        }
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString("en-US", {
            hour12: true,
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });
    };

    return (
        <>
            <Card
                className={`w-full border border-gray-200 shadow-sm ${
                    theme === "dark" ? "bg-black border border-gray-800" : "bg-white"
                }`}
            >
                <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center">
                        {/* Month Filter */}
                        <div className="flex flex-col gap-2">
                            <label
                                className={`text-sm font-medium ${
                                    theme === "dark" ? "text-slate-300" : "text-[#3f3d56]"
                                }`}
                                style={{ fontFamily: "Montserrat, sans-serif" }}
                            >
                                Filter by Month
                            </label>
                            <DarkAwareSelect
                                items={months}
                                value={selectedMonth}
                                onChange={onMonthChange}
                                placeholder="Select month"
                            />
                        </div>

                        {/* Status Filter */}
                        <div className="flex flex-col gap-2 flex-1">
                            <label
                                className={`text-sm font-medium ${
                                    theme === "dark" ? "text-slate-300" : "text-[#3f3d56]"
                                }`}
                                style={{ fontFamily: "Montserrat, sans-serif" }}
                            >
                                Filter by Status
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {statusOptions.map(option => {
                                    const isSelected = selectedStatus.includes(option.value);
                                    return (
                                        <Button
                                            key={option.value}
                                            variant={isSelected ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => toggleStatus(option.value)}
                                            className={`
                                                ${
                                        isSelected
                                            ? "bg-[#3f3d56] text-white hover:bg-[#3f3d56]/90"
                                            : theme === "dark"
                                                ? "bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700"
                                                : "bg-white text-[#3f3d56] border-gray-200 hover:bg-gray-50"
                                        }
                                            `}
                                            style={{
                                                fontFamily: "Montserrat, sans-serif",
                                            }}
                                        >
                                            <div
                                                className={`w-3 h-3 rounded-full mr-2 border ${option.color}`}
                                            />
                                            {option.label}
                                        </Button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Clock-in + Clear */}
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-transparent">Actions</label>
                            <div className="flex items-center gap-3">
                                {/* Time */}
                                <div
                                    className={`flex items-center gap-2 ${
                                        theme === "dark" ? "text-slate-400" : "text-gray-600"
                                    }`}
                                >
                                    <Clock className="h-4 w-4" />
                                    <span
                                        className="text-sm font-mono w-22"
                                        style={{
                                            fontFamily: "Montserrat, sans-serif",
                                        }}
                                    >
                                        {formatTime(currentTime)}
                                    </span>
                                </div>

                                {/* Clock In */}
                                <Button
                                    onClick={() => setIsClockInModalOpen(true)}
                                    className={`${
                                        currentMonthAttendance?.lastClockInTimestamp
                                            ? "bg-danger-500 hover:bg-danger-600 text-white"
                                            : "bg-success-500 hover:bg-success-600 text-white"
                                    } transition-all duration-300 shadow-sm`}
                                    style={{
                                        fontFamily: "Montserrat, sans-serif",
                                    }}
                                >
                                    {currentMonthAttendance?.lastClockInTimestamp
                                        ? "Clock Out"
                                        : "Clock In"}
                                </Button>

                                {/* Clear */}
                                <Button
                                    variant="outline"
                                    size="default"
                                    onClick={onClearFilters}
                                    className={
                                        theme === "dark"
                                            ? "text-slate-200 border-slate-700 bg-slate-800 hover:bg-slate-700"
                                            : "text-[#3f3d56] border-gray-200 bg-transparent hover:bg-gray-50"
                                    }
                                    style={{
                                        fontFamily: "Montserrat, sans-serif",
                                    }}
                                >
                                    Clear Filters
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Clock In Modal */}
            <ClockInModal
                currentMonthAttendance={currentMonthAttendance}
                isOpen={isClockInModalOpen}
                onClose={() => setIsClockInModalOpen(false)}
            />
        </>
    );
}
