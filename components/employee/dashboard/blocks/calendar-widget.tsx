"use client";

import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAttendance } from "@/hooks/use-attendance";
import { AttendanceModel } from "@/lib/models/attendance";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

const weekDays = [
    { short: "S", full: "Sunday" },
    { short: "M", full: "Monday" },
    { short: "T", full: "Tuesday" },
    { short: "W", full: "Wednesday" },
    { short: "Th", full: "Thursday" },
    { short: "F", full: "Friday" },
    { short: "Sa", full: "Saturday" },
];

// Helper function to get days in a month
const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
};

// Helper function to get the first day of the month
const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
};

// Updated helper function to generate calendar data with attendance
const generateCalendarData = (
    year: number,
    month: number,
    attendance: AttendanceModel | undefined,
) => {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];

    const monthName = monthNames[month];
    const monthlyAttendance =
        attendance?.month === monthName && attendance?.year === year ? attendance : undefined;

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
        days.push(null);
    }

    // Add days of the month with attendance data
    for (let day = 1; day <= daysInMonth; day++) {
        const isToday =
            year === new Date().getFullYear() &&
            month === new Date().getMonth() &&
            day === new Date().getDate();
        const isWeekend =
            new Date(year, month, day).getDay() === 0 || new Date(year, month, day).getDay() === 6;

        // Find the attendance data for the specific day
        const attendanceDay = monthlyAttendance?.values.find(d => d.day === day);

        days.push({
            date: day,
            isToday,
            isWeekend,
            attendance: attendanceDay ? attendanceDay.value : null,
        });
    }

    return days;
};

const monthNames = [
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

export function CalendarWidget() {
    // Assuming useAttendance returns an array of AttendanceModel
    const { attendance = [] } = useAttendance({ role: "Employee" });
    const { theme } = useTheme();
    const currentDate = new Date();
    const [currentYear, setCurrentYear] = useState<number>(currentDate.getFullYear());
    const [currentMonth, setCurrentMonth] = useState<number>(currentDate.getMonth());

    const navigateMonth = (direction: "prev" | "next") => {
        if (direction === "prev") {
            if (currentMonth === 0) {
                setCurrentMonth(11);
                setCurrentYear(currentYear - 1);
            } else {
                setCurrentMonth(currentMonth - 1);
            }
        } else {
            if (currentMonth === 11) {
                setCurrentMonth(0);
                setCurrentYear(currentYear + 1);
            } else {
                setCurrentMonth(currentMonth + 1);
            }
        }
    };

    // Find attendance data for the current and next months
    const currentMonthAttendance = attendance.find(
        att => att.month === monthNames[currentMonth] && att.year === currentYear,
    );
    const nextMonthVal = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextYearVal = currentMonth === 11 ? currentYear + 1 : currentYear;
    const nextMonthAttendance = attendance.find(
        att => att.month === monthNames[nextMonthVal] && att.year === nextYearVal,
    );

    // Generate data for current month and next month
    const months = [
        {
            name: monthNames[currentMonth],
            year: currentYear,
            days: generateCalendarData(currentYear, currentMonth, currentMonthAttendance),
        },
        {
            name: monthNames[nextMonthVal],
            year: nextYearVal,
            days: generateCalendarData(nextYearVal, nextMonthVal, nextMonthAttendance),
        },
    ];

    return (
        <Card
            className={`shadow-sm font-montserrat ${theme === "dark" ? "bg-black border-gray-800" : ""}`}
        >
            <CardHeader className="pb-6 pt-6 px-6">
                <div className="flex items-center justify-between">
                    <CardTitle
                        className={`text-2xl font-bold ${theme === "dark" ? "text-slate-300" : "text-slate-600"}`}
                    >
                        Calendar Overview
                    </CardTitle>
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-warning-200 rounded-full"></div>
                                <span className="text-sm text-brand- font-medium">Half Day</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-danger-500 rounded-full"></div>
                                <span className="text-sm text-brand- font-medium">Absent</span>
                            </div>
                            {/* Restored the Meetings legend as well */}
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                <span className="text-sm text-brand-0 font-medium">Present</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 hover:bg-accent-100 rounded-full"
                                onClick={() => navigateMonth("prev")}
                            >
                                <ChevronLeft className="h-5 w-5 text-brand-500" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 hover:bg-accent-100 rounded-full"
                                onClick={() => navigateMonth("next")}
                            >
                                <ChevronRight className="h-5 w-5 text-brand-500" />
                            </Button>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="px-6 pb-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {months.map(month => (
                        <div key={`${month.name}-${month.year}`} className="space-y-6">
                            <h3
                                className={`font-bold text-xl text-center py-2 ${theme === "dark" ? "text-slate-300" : "text-slate-600"}`}
                            >
                                {month.name} {month.year}
                            </h3>
                            <div className="space-y-4">
                                <div className="grid grid-cols-7 gap-2">
                                    {weekDays.map(day => (
                                        <div
                                            key={day.full}
                                            className="text-center font-bold p-3 text-sm text-brand-600"
                                        >
                                            {day.short}
                                        </div>
                                    ))}
                                </div>
                                <div className="grid grid-cols-7 gap-2">
                                    {month.days.map((day, dayIndex) => (
                                        <div
                                            key={dayIndex}
                                            className={`
                                                text-center p-3 rounded-lg cursor-pointer transition-all duration-200 text-sm font-semibold h-12 flex items-center justify-center
                                                ${
                                        !day
                                            ? ""
                                            : day.isToday
                                                ? "bg-brand-500 text-white shadow-md ring-2 ring-brand-300"
                                                : // Style based on attendance value
                                                day.attendance === "H"
                                                    ? "bg-warning-200 text-warning-900 hover:bg-warning-300"
                                                    : day.attendance === "A"
                                                        ? "bg-danger-500 text-danger-900 hover:bg-danger-200"
                                                        : // Added a style for "Present"
                                                        day.attendance === "P"
                                                            ? "bg-green-100 text-green-900 hover:bg-green-200"
                                                            : day.isWeekend
                                                                ? "text-brand-400 hover:bg-gray-50"
                                                                : "text-brand-700 hover:bg-accent-50"
                                        }
                                            `}
                                        >
                                            {day?.date}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
