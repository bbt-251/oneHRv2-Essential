"use client";

import { useTheme } from "@/components/theme-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFirestore } from "@/context/firestore-context";
import { HolidayModel, ShiftTypeModel } from "@/lib/backend/firebase/hrSettingsService";
import { AttendanceModel, DailyAttendance } from "@/lib/models/attendance";
import { dateFormat } from "@/lib/util/dayjs_format";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { AttendanceModal } from "./attendance-modal";
import { LeaveModel } from "@/lib/models/leave";
import { EmployeeModel } from "@/lib/models/employee";
import { calculatePWD } from "@/lib/backend/functions/returnPayslipData";
import { useAuth } from "@/context/authContext";

interface DayBubble {
    day: number;
    status:
        | "present"
        | "absent"
        | "half-present"
        | "holiday"
        | "weekend"
        | "future"
        | "leave"
        | "today"
        | "N/A";
    dailyAttendance: DailyAttendance;
}

interface MonthData {
    attendance: AttendanceModel;
    month: string;
    year: number;
    days: DayBubble[];
    stats: {
        workingDays: number;
        workedDays: number;
        absentDays: number;
        leaveDays: number;
    };
}

interface AttendanceCalendarProps {
    selectedMonth?: string;
    selectedStatus?: string[];
    attendance: AttendanceModel[];
}

const getStatusColor = (status: string, theme: string) => {
    const isDark = theme === "dark";
    switch (status) {
        case "present":
            return isDark
                ? "bg-green-900 text-green-200 border-green-700 hover:bg-green-800"
                : "bg-green-300 text-[#3f3d56] border-green-200 hover:bg-green-100";
        case "half-present":
            return isDark
                ? "bg-yellow-900 text-yellow-200 border-yellow-700 hover:bg-yellow-800"
                : "bg-yellow-300 text-[#3f3d56] border-yellow-200 hover:bg-yellow-400";
        case "absent":
            return isDark
                ? "bg-red-900 text-red-200 border-red-700 hover:bg-red-800"
                : "bg-red-50 text-[#3f3d56] border-red-200 hover:bg-red-100";
        case "holiday":
            return isDark
                ? "bg-yellow-900 text-yellow-100 border-yellow-700 hover:bg-yellow-800"
                : "bg-[#ffe6a7] text-[#3f3d56] border-yellow-200 hover:bg-yellow-200";
        case "weekend":
            return isDark
                ? "bg-blue-900 text-blue-200 border-blue-700 hover:bg-blue-800"
                : "bg-blue-50 text-[#3f3d56] border-blue-200 hover:bg-blue-100";
        case "leave":
            return isDark
                ? "bg-[#ed4ca2] text-white border-[#b93481] hover:bg-[#d0338f]"
                : "bg-[#f4a3cc] text-[#7a0f5a] border-[#e066b3] hover:bg-[#e066b3]";
        case "today":
            return isDark
                ? "bg-teal-800 text-teal-100 border-teal-600 hover:bg-teal-700"
                : "bg-teal-100 text-teal-900 border-teal-300 hover:bg-teal-200";
        case "future":
            return isDark
                ? "bg-gray-800 text-gray-500 border-gray-600 hover:bg-gray-700"
                : "bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100";
        default:
            return isDark
                ? "bg-gray-800 text-gray-500 border-gray-600"
                : "bg-gray-50 text-gray-400 border-gray-200";
    }
};

const generateMonthData = (
    employee: EmployeeModel | null,
    attendance: AttendanceModel,
    holidays: HolidayModel[],
    leaveManagements: LeaveModel[],
    shifts: ShiftTypeModel[],
): MonthData => {
    const { month, year, values } = attendance;
    const leaves = leaveManagements.filter(
        l => l.employeeID == attendance.uid && l.leaveStage == "Approved",
    );
    const days: DayBubble[] = [];
    let workedDays = 0;
    let absentDays = 0;
    let leaveDays = 0;

    // calculating period working days
    const employeeShift = shifts.find(doc => doc.id === employee?.shiftType);
    const wd = employeeShift?.workingDays?.map(workingDay => workingDay.dayOfTheWeek) ?? [];
    const workingDays = calculatePWD(dayjs().year(), month, wd);

    values.forEach(entry => {
        const date = dayjs(`${month} ${entry.day}, ${year}`);
        const dayOfWeek = date.day();
        let status: DayBubble["status"];

        const holiday = holidays.find(h => dayjs(h.date, dateFormat).isSame(dayjs(date), "day"));

        const leave = leaves.some(l => {
            const firstDay = dayjs(l.firstDayOfLeave);
            const lastDay = dayjs(l.lastDayOfLeave);
            return (
                (firstDay.isBefore(date, "day") || firstDay.isSame(date, "day")) &&
                (lastDay.isAfter(date, "day") || firstDay.isSame(date, "day")) &&
                !firstDay.isSame(lastDay, "day")
            );
        });

        if (dayOfWeek === 0 || dayOfWeek === 6) {
            status = "weekend";
        } else {
            if (date.isSame(dayjs(), "day")) {
                status = "today";
            } else if (holiday) {
                status = "holiday";
            } else if (leave) {
                status = "leave";
                leaveDays++;
            } else if (dayjs(date).isAfter(dayjs(), "day")) {
                status = "future";
            } else if (entry.value === "P") {
                status = "present";
                workedDays++;
            } else if (entry.value === "A") {
                status = "absent";
                absentDays++;
            } else if (entry.value === "H") {
                status = "half-present";
                workedDays++;
            } else {
                status = "N/A";
            }
        }

        days.push({ day: entry.day, status, dailyAttendance: entry });
    });

    return {
        attendance,
        month,
        year,
        days,
        stats: {
            workingDays,
            workedDays,
            absentDays,
            leaveDays,
        },
    };
};

export function AttendanceCalendar({
    selectedMonth = "All Months",
    selectedStatus = [],
    attendance,
}: AttendanceCalendarProps) {
    const { userData } = useAuth();
    const { theme } = useTheme();
    const { hrSettings, leaveManagements } = useFirestore();
    const holidays = hrSettings.holidays;
    const shifts = hrSettings.shiftTypes;
    const [selectedDay, setSelectedDay] = useState<{
        day: number;
        month: string;
        year: number;
        status: string;
        dailyAttendance: DailyAttendance;
    } | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [monthsData, setMonthsData] = useState<MonthData[]>([]);
    const [selectedAttendance, setSelectedAttendance] = useState<AttendanceModel | null>(null);

    const handleDayClick = (
        day: number,
        month: string,
        year: number,
        status: string,
        dailyAttendance: DailyAttendance,
    ) => {
        setSelectedDay({ day, month, year, status, dailyAttendance });
        setIsModalOpen(true);
    };

    useEffect(() => {
        console.log("Attendance in AttendanceCalendar:", attendance);
        console.log("UserData:", userData);
        if (!attendance || attendance.length === 0) return;
        const generated = attendance.map(a =>
            generateMonthData(userData, a, holidays, leaveManagements, shifts),
        );
        console.log("Generated monthsData:", generated);
        setMonthsData(generated);
    }, [attendance, userData, leaveManagements, shifts, holidays]);

    const filteredMonthsData = monthsData
        .filter(monthData => {
            if (selectedMonth !== "All Months" && monthData.month !== selectedMonth) return false;
            return true;
        })
        .map(monthData => {
            if (selectedStatus.length > 0) {
                return {
                    ...monthData,
                    days: monthData.days.filter(day => selectedStatus.includes(day.status)),
                };
            }
            return monthData;
        })
        .filter(monthData => monthData.days.length > 0);

    console.log("Filtered monthsData:", filteredMonthsData);

    return (
        <div className="space-y-6">
            {filteredMonthsData.map(monthData => (
                <Card
                    key={`${monthData.month}-${monthData.year}`}
                    className={`w-full border border-gray-200 dark:border-gray-700 shadow-sm ${dayjs(monthData.month, "MMMM").isSame(dayjs(), "month") ? "!border-[#fcecc3] dark:!border-[#fad77e] border-[4px]" : ""} ${
                        theme === "dark" ? "bg-black border" : "bg-white"
                    }`}
                >
                    <CardHeader className="pb-4">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                            <CardTitle
                                className={`text-xl font-semibold ${
                                    theme === "dark" ? "text-white" : "text-[#3f3d56]"
                                }`}
                                style={{ fontFamily: "Montserrat, sans-serif" }}
                            >
                                {monthData.month} {monthData.year}
                            </CardTitle>

                            {/* Month Statistics */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                                {[
                                    {
                                        label: "Working Days",
                                        value: monthData.stats.workingDays,
                                        color:
                                            theme === "dark" ? "text-slate-300" : "text-[#3f3d56]",
                                    },
                                    {
                                        label: "Worked Days",
                                        value: monthData.stats.workedDays,
                                        color: "text-green-600",
                                    },
                                    {
                                        label: "Absent Days",
                                        value: monthData.stats.absentDays,
                                        color: "text-red-600",
                                    },
                                    {
                                        label: "Leave Days",
                                        value: monthData.stats.leaveDays,
                                        color: "text-purple-600",
                                    },
                                ].map((stat, idx) => (
                                    <div className="text-center" key={idx}>
                                        <p
                                            className={`opacity-60 ${
                                                theme === "dark"
                                                    ? "text-slate-400"
                                                    : "text-[#3f3d56]"
                                            }`}
                                            style={{
                                                fontFamily: "Montserrat, sans-serif",
                                            }}
                                        >
                                            {stat.label}
                                        </p>
                                        <p
                                            className={`font-semibold ${stat.color}`}
                                            style={{
                                                fontFamily: "Montserrat, sans-serif",
                                            }}
                                        >
                                            {stat.value}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {monthData.days.map(day => (
                                <div
                                    key={day.day}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium border cursor-pointer transition-all duration-200 hover:scale-105 ${getStatusColor(
                                        day.status,
                                        theme,
                                    )}`}
                                    style={{
                                        fontFamily: "Montserrat, sans-serif",
                                    }}
                                    title={`Day ${day.day} - ${day.status}`}
                                    onClick={() => {
                                        handleDayClick(
                                            day.day,
                                            monthData.month,
                                            monthData.year,
                                            day.status,
                                            day.dailyAttendance,
                                        );
                                        setSelectedAttendance(monthData.attendance);
                                    }}
                                >
                                    {day.day}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            ))}

            {isModalOpen && selectedDay && (
                <AttendanceModal
                    attendance={selectedAttendance}
                    day={selectedDay}
                    onClose={() => setIsModalOpen(false)}
                />
            )}
        </div>
    );
}
