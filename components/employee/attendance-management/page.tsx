import { useTheme } from "@/components/theme-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAttendance } from "@/hooks/use-attendance";
import { useEffect, useState } from "react";
import { AttendanceCalendar } from "./blocks/attendance-calendar";
import { AttendanceFilter } from "./blocks/attendance-filter";
import { AttendanceLegend } from "./blocks/attendance-legend";
import { useAuth } from "@/context/authContext";
import dayjs from "dayjs";
import { useAppData } from "@/context/app-data-context";

interface Summary {
    totalPresent: number;
    totalAbsent: number;
    totalLeave: number;
    attendanceRate: number;
}

export const AttendanceManagement = () => {
    const { userData } = useAuth();
    const { theme } = useTheme();
    const { attendance } = useAttendance({ role: "Employee" });
    const { leaveManagements } = useAppData();
    const [selectedMonth, setSelectedMonth] = useState<string>("All Months");
    const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
    const [summary, setSummary] = useState<Summary>({
        totalPresent: 0,
        totalAbsent: 0,
        totalLeave: 0,
        attendanceRate: 0,
    });

    useEffect(() => {
        if (!attendance || attendance.length === 0) return;
        let totalPresent = 0;
        let totalAbsent = 0;

        const leaves = leaveManagements.filter(
            l => l.employeeID == userData?.uid && l.leaveStage == "Approved",
        );

        const numberOfLeaveDays = leaves.reduce(
            (acc, l) => acc + dayjs(l.lastDayOfLeave).diff(dayjs(l.firstDayOfLeave), "day"),
            0,
        );

        attendance.forEach(record => {
            record.values.forEach(daily => {
                if (daily.value === "P" || daily.value === "H") {
                    totalPresent++;
                } else if (daily.value === "A") {
                    totalAbsent++;
                }
            });
        });

        const totalDays = totalPresent + totalAbsent;
        const attendanceRate = totalDays > 0 ? (totalPresent / totalDays) * 100 : 0;

        setSummary({
            totalPresent,
            totalAbsent,
            totalLeave: numberOfLeaveDays,
            attendanceRate: parseFloat(attendanceRate.toFixed(2)),
        });
    }, [attendance, leaveManagements, userData]);

    const handleClearFilters = () => {
        setSelectedMonth("All Months");
        setSelectedStatus([]);
    };

    return (
        <div className={`min-h-screen p-6 space-y-8 ${theme === "dark" ? "bg-black" : "bg-white"}`}>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    {
                        label: "Total Present",
                        value: summary.totalPresent,
                        subtitle: "Days this year",
                    },
                    {
                        label: "Total Absent",
                        value: summary.totalAbsent,
                        subtitle: "Days this year",
                    },
                    {
                        label: "Total Leave",
                        value: summary.totalLeave,
                        subtitle: "Days this year",
                    },
                    {
                        label: "Attendance Rate",
                        value: `${summary.attendanceRate}%`,
                        subtitle: "Overall rate",
                    },
                ].map(({ label, value, subtitle }, index) => (
                    <Card
                        key={index}
                        className={`border-0 shadow-sm ${
                            theme === "dark" ? "bg-black border border-gray-800" : "bg-white"
                        }`}
                    >
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle
                                    className={`text-sm font-medium ${
                                        theme === "dark"
                                            ? "text-slate-300"
                                            : "text-[#3f3d56] opacity-70"
                                    }`}
                                    style={{ fontFamily: "Montserrat, sans-serif" }}
                                >
                                    {label}
                                </CardTitle>
                                <div className="w-8 h-8 bg-[#ffe6a7] rounded-lg flex items-center justify-center">
                                    <div className="w-4 h-4 bg-[#3f3d56] rounded-full" />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div
                                className={`text-3xl font-bold mb-1 ${
                                    theme === "dark" ? "text-white" : "text-[#3f3d56]"
                                }`}
                                style={{ fontFamily: "Montserrat, sans-serif" }}
                            >
                                {value}
                            </div>
                            <p
                                className={`text-sm ${
                                    theme === "dark"
                                        ? "text-slate-400"
                                        : "text-[#3f3d56] opacity-60"
                                }`}
                                style={{ fontFamily: "Montserrat, sans-serif" }}
                            >
                                {subtitle}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Filter Bar */}
            <AttendanceFilter
                attendances={attendance}
                selectedMonth={selectedMonth}
                selectedStatus={selectedStatus}
                onMonthChange={setSelectedMonth}
                onStatusChange={setSelectedStatus}
                onClearFilters={handleClearFilters}
            />

            {/* Legend */}
            <AttendanceLegend />

            {/* Attendance Calendar */}
            <AttendanceCalendar
                selectedMonth={selectedMonth}
                selectedStatus={selectedStatus}
                attendance={attendance}
            />
        </div>
    );
};
