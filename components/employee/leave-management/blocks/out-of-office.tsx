"use client";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { useTheme } from "@/components/theme-provider";
import { Users, Search, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useData } from "@/context/app-data-context";
import { LeaveModel } from "@/lib/models/leave";
import { EmployeeModel } from "@/lib/models/employee";
import LeaveDetail from "@/components/manager/leave-management/modals/leave-detail";
import { useAuth } from "@/context/authContext";

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

interface OutOfOfficeModel {
    employee: string;
    department: string;
    section: string;
    leaves: LeaveModel[];
}

function transformLeaveRequestsToOutOfOfficeData(
    leaves: LeaveModel[],
    employees: EmployeeModel[],
): OutOfOfficeModel[] {
    const employeeMap = new Map<string, EmployeeModel>();
    employees.forEach(emp => employeeMap.set(emp.uid, emp));

    const grouped: Record<string, OutOfOfficeModel> = {};

    for (const leave of leaves) {
        const emp = employeeMap.get(leave.employeeID);
        if (!emp) continue;

        const employeeName =
            `${emp.firstName} ${emp.middleName ? emp.middleName + " " : ""}${emp.surname}`.trim();

        if (!grouped[leave.employeeID]) {
            grouped[leave.employeeID] = {
                employee: employeeName,
                department: emp.department,
                section: emp.section,
                leaves: [],
            };
        }

        grouped[leave.employeeID].leaves.push(leave);
    }

    return Object.values(grouped);
}

export default function OutOfOffice() {
    const { theme } = useTheme();
    const { user } = useAuth();
    const { employees, leaveManagements, ...hrSettings } = useData();

    const getReporteeIds = (managerId: string): string[] => {
        const directReports = employees.filter(emp => emp.reportingLineManager === managerId);

        return [...directReports.map(r => r.uid)];
    };
    const myReportees = user?.uid ? getReporteeIds(user.uid) : [];

    const leaveRequests = leaveManagements.filter(request => {
        // Define the statuses that should be visible on the calendar
        const visibleStatuses = ["Open", "Approved", "Requested"];

        // Check if the request is for a reportee and has a visible status
        const isVisible =
            visibleStatuses.includes(request.leaveStage) || request.rollbackStatus === "Requested";

        return myReportees.includes(request.employeeID) && isVisible;
    });

    const sections = hrSettings.sectionSettings;

    const departments = hrSettings.departmentSettings;

    const getSectionName = (sectionId: string) => {
        const section = sections.find(section => section.id === sectionId);
        return section?.name || "Unknown";
    };
    const getDepartmentName = (departmentId: string) => {
        const department = departments.find(department => department.id === departmentId);
        return department?.name || "Unknown";
    };
    const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());

    // Matrix filters
    const [matrixFilters, setMatrixFilters] = useState<{
        employeeName: string;
        department: string;
        section: string;
        leaveStatus: string;
        startDate: string;
        endDate: string;
    }>({
        employeeName: "",
        department: "",
        section: "",
        leaveStatus: "",
        startDate: "",
        endDate: "",
    });

    // Add this after the existing state declarations
    const [selectedLeave, setSelectedLeave] = useState<LeaveModel | null>(null);
    const [isLeaveDetailModalOpen, setIsLeaveDetailModalOpen] = useState<boolean>(false);

    // Generate date range for the selected month
    const dateRange = useMemo(() => {
        const dates = [];
        const year = currentYear;
        const month = selectedMonth;
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        for (let day = 1; day <= daysInMonth; day++) {
            dates.push(new Date(year, month, day));
        }
        return dates;
    }, [currentYear, selectedMonth]);

    const filteredEmployees = useMemo(() => {
        const outOfOfficeData = transformLeaveRequestsToOutOfOfficeData(leaveRequests, employees);

        return outOfOfficeData.filter(employee => {
            const matchesName =
                !matrixFilters.employeeName ||
                employee.employee.toLowerCase().includes(matrixFilters.employeeName.toLowerCase());

            const matchesDepartment =
                !matrixFilters.department ||
                matrixFilters.department === "all" ||
                employee.department === matrixFilters.department;

            const matchesSection =
                !matrixFilters.section ||
                matrixFilters.section === "all" ||
                employee.section === matrixFilters.section;

            const matchesLeaveStatus =
                !matrixFilters.leaveStatus ||
                matrixFilters.leaveStatus === "all" ||
                employee.leaves.some(leave => leave.leaveStage === matrixFilters.leaveStatus);

            return matchesName && matchesDepartment && matchesSection && matchesLeaveStatus;
        });
    }, [leaveRequests, employees, matrixFilters]);

    const getLeaveForDate = (employee: OutOfOfficeModel, date: Date) => {
        const currentDate = new Date(date);
        currentDate.setHours(0, 0, 0, 0);

        return employee.leaves.find((leave: LeaveModel) => {
            const startDate = new Date(leave.firstDayOfLeave);
            const endDate = new Date(leave.lastDayOfLeave);

            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(0, 0, 0, 0);

            return (
                currentDate.getTime() >= startDate.getTime() &&
                currentDate.getTime() <= endDate.getTime()
            );
        });
    };

    // Add this function after clearTableFilters function:
    const clearMatrixFilters = () => {
        setMatrixFilters({
            employeeName: "",
            department: "",
            section: "",
            leaveStatus: "",
            startDate: "",
            endDate: "",
        });
    };

    // Count active matrix filters
    const activeMatrixFiltersCount = Object.values(matrixFilters).filter(
        value => value !== "" && value !== "all",
    ).length;

    // Navigation functions
    const goToPreviousMonth = () => {
        if (selectedMonth === 0) {
            setSelectedMonth(11);
            setCurrentYear(currentYear - 1);
        } else {
            setSelectedMonth(selectedMonth - 1);
        }
    };

    const goToNextMonth = () => {
        if (selectedMonth === 11) {
            setSelectedMonth(0);
            setCurrentYear(currentYear + 1);
        } else {
            setSelectedMonth(selectedMonth + 1);
        }
    };

    const goToToday = () => {
        const today = new Date();
        setCurrentYear(today.getFullYear());
        setSelectedMonth(today.getMonth());
    };

    // Add this function after the navigation functions
    const handleLeaveClick = (leave: LeaveModel) => {
        setSelectedLeave(leave);
        setIsLeaveDetailModalOpen(true);
    };

    return (
        <>
            {/* Out of Office Matrix View */}
            {/* Filter Bar */}
            <Card
                className={`border-0 shadow-xl mb-8 ${
                    theme === "dark" ? "bg-black border-gray-800" : ""
                }`}
            >
                <CardContent className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Name..."
                                value={matrixFilters.employeeName}
                                onChange={e =>
                                    setMatrixFilters({
                                        ...matrixFilters,
                                        employeeName: e.target.value,
                                    })
                                }
                                className="pl-10 rounded-xl border-slate-200 h-9"
                            />
                        </div>
                        <Select
                            value={matrixFilters.department}
                            onValueChange={value =>
                                setMatrixFilters({ ...matrixFilters, department: value })
                            }
                        >
                            <SelectTrigger className="rounded-xl border-slate-200 h-9">
                                <SelectValue placeholder="Department:" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Departments</SelectItem>
                                {departments.map(department => (
                                    <SelectItem key={department.id} value={department.id}>
                                        {department.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select
                            value={matrixFilters.section}
                            onValueChange={value =>
                                setMatrixFilters({ ...matrixFilters, section: value })
                            }
                        >
                            <SelectTrigger className="rounded-xl border-slate-200 h-9">
                                <SelectValue placeholder="Section:" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Sections</SelectItem>
                                {sections.map(section => (
                                    <SelectItem key={section.id} value={section.id}>
                                        {section.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {/* Add Leave Status Filter */}
                        <Select
                            value={matrixFilters.leaveStatus || ""}
                            onValueChange={value =>
                                setMatrixFilters({ ...matrixFilters, leaveStatus: value })
                            }
                        >
                            <SelectTrigger className="rounded-xl border-slate-200 h-9">
                                <SelectValue placeholder="Leave Status:" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="Open">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded bg-blue-500"></div>
                                        Open
                                    </div>
                                </SelectItem>
                                <SelectItem value="Approved">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded bg-emerald-500"></div>
                                        Approved
                                    </div>
                                </SelectItem>
                                <SelectItem value="Rollback">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded bg-amber-500"></div>
                                        Rollback
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        <div className="flex gap-2">
                            <Input
                                type="date"
                                placeholder="Start date"
                                value={matrixFilters.startDate}
                                onChange={e =>
                                    setMatrixFilters({
                                        ...matrixFilters,
                                        startDate: e.target.value,
                                    })
                                }
                                className="rounded-xl border-slate-200 h-9"
                            />
                            <Input
                                type="date"
                                placeholder="End date"
                                value={matrixFilters.endDate}
                                onChange={e =>
                                    setMatrixFilters({ ...matrixFilters, endDate: e.target.value })
                                }
                                className="rounded-xl border-slate-200 h-9"
                            />
                        </div>
                    </div>

                    {/* Color Codes */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <span className="text-sm font-semibold text-slate-600">
                                Color Codes:
                            </span>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded bg-blue-500"></div>
                                <span className="text-sm font-medium text-slate-600">Open</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded bg-amber-500"></div>
                                <span className="text-sm font-medium text-slate-600">Rollback</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded bg-emerald-500"></div>
                                <span className="text-sm font-medium text-slate-600">Approved</span>
                            </div>
                        </div>

                        {/* Clear Matrix Filters Button */}
                        {activeMatrixFiltersCount > 0 && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={clearMatrixFilters}
                                className="rounded-xl bg-transparent text-slate-500 hover:text-slate-700 border-slate-300"
                            >
                                <X className="w-4 h-4 mr-2" />
                                Clear Filters ({activeMatrixFiltersCount})
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Modern Month Navigation */}
            <Card
                className={`border-0 shadow-xl mb-8 ${
                    theme === "dark" ? "bg-black border-gray-800" : ""
                }`}
            >
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={goToPreviousMonth}
                                className={`rounded-xl border-slate-200 ${
                                    theme === "dark"
                                        ? "bg-slate-700 hover:bg-slate-600 border-slate-600 text-slate-200"
                                        : "bg-white hover:bg-slate-50"
                                }`}
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </Button>

                            <div className="text-center">
                                <h2
                                    className={`text-2xl font-bold ${
                                        theme === "dark" ? "text-white" : ""
                                    }`}
                                    style={{ color: theme === "dark" ? "#ffffff" : "#3f3d56" }}
                                >
                                    {monthNames[selectedMonth]} {currentYear}
                                </h2>
                                <p
                                    className={`text-sm mt-1 ${
                                        theme === "dark" ? "text-slate-300" : "text-slate-500"
                                    }`}
                                >
                                    {dateRange.length} days • {filteredEmployees.length} employees
                                </p>
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={goToNextMonth}
                                className={`rounded-xl border-slate-200 ${
                                    theme === "dark"
                                        ? "bg-slate-700 hover:bg-slate-600 border-slate-600 text-slate-200"
                                        : "bg-white hover:bg-slate-50"
                                }`}
                            >
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={goToToday}
                                className={`rounded-xl ${
                                    theme === "dark"
                                        ? "bg-slate-700 hover:bg-slate-600 border-slate-600 text-slate-200"
                                        : "bg-white hover:bg-slate-50"
                                }`}
                            >
                                Today
                            </Button>

                            <Select
                                value={selectedMonth.toString()}
                                onValueChange={value => setSelectedMonth(Number.parseInt(value))}
                            >
                                <SelectTrigger
                                    className={`w-32 rounded-xl border-slate-200 h-9 ${
                                        theme === "dark"
                                            ? "bg-slate-700 hover:bg-slate-600 border-slate-600 text-slate-200"
                                            : "bg-white hover:bg-slate-50"
                                    }`}
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent
                                    className={`rounded-xl ${
                                        theme === "dark"
                                            ? "bg-slate-700 hover:bg-slate-600 border-slate-600 text-slate-200"
                                            : "bg-white hover:bg-slate-50"
                                    }`}
                                >
                                    {monthNames.map((month, index) => (
                                        <SelectItem key={index} value={index.toString()}>
                                            {month}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select
                                value={currentYear.toString()}
                                onValueChange={value => setCurrentYear(Number.parseInt(value))}
                            >
                                <SelectTrigger
                                    className={`w-20 rounded-xl border-slate-200 h-9 ${
                                        theme === "dark"
                                            ? "bg-slate-700 hover:bg-slate-600 border-slate-600 text-slate-200"
                                            : "bg-white hover:bg-slate-50"
                                    }`}
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent
                                    className={`rounded-xl ${
                                        theme === "dark"
                                            ? "bg-slate-700 hover:bg-slate-600 border-slate-600 text-slate-200"
                                            : "bg-white hover:bg-slate-50"
                                    }`}
                                >
                                    {[2023, 2024, 2025, 2026].map(year => (
                                        <SelectItem key={year} value={year.toString()}>
                                            {year}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Modern Matrix Grid */}
            <Card
                className={`border-0 shadow-2xl overflow-hidden ${
                    theme === "dark" ? "bg-black border-gray-800" : ""
                }`}
            >
                <div className="overflow-x-auto">
                    <div className="min-w-max">
                        {/* Header Row */}
                        <div
                            className={`flex border-b-2 ${
                                theme === "dark"
                                    ? "bg-gray-900 border-gray-700"
                                    : "bg-white border-slate-200"
                            }`}
                        >
                            <div
                                className={`w-64 p-6 font-bold border-r-2 flex-shrink-0 ${
                                    theme === "dark"
                                        ? "text-slate-200 border-gray-700 bg-gray-900"
                                        : "text-slate-700 border-slate-200 bg-slate-50"
                                }`}
                            >
                                <div className="flex items-center gap-2">
                                    <Users className="w-5 h-5" />
                                    Employee
                                </div>
                            </div>
                            {dateRange.map(date => (
                                <div
                                    key={date.toISOString()}
                                    className={`w-12 p-3 text-center text-xs font-medium border-r flex-shrink-0 ${
                                        theme === "dark"
                                            ? "text-slate-300 border-gray-700 bg-gray-900"
                                            : "text-slate-600 border-slate-200 bg-slate-50"
                                    }`}
                                >
                                    <div className="font-semibold">{date.getDate()}</div>
                                    <div
                                        className={`text-xs mt-1 ${
                                            theme === "dark" ? "text-slate-400" : "text-slate-400"
                                        }`}
                                    >
                                        {date.toLocaleDateString("en-US", { weekday: "short" })}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Employee Rows */}
                        {filteredEmployees.map((employee, employeeIndex) => (
                            <div
                                key={employee.employee}
                                className={`flex transition-colors duration-200 border-b ${
                                    theme === "dark"
                                        ? employeeIndex % 2 === 0
                                            ? "bg-black"
                                            : "bg-gray-900"
                                        : employeeIndex % 2 === 0
                                            ? "bg-white"
                                            : "bg-slate-50/30"
                                } ${
                                    theme === "dark"
                                        ? "hover:bg-gray-800 border-gray-700"
                                        : "hover:bg-blue-50/30 border-slate-100"
                                }`}
                            >
                                <div
                                    className={`w-64 p-6 font-medium border-r-2 flex items-center flex-shrink-0 ${
                                        theme === "dark"
                                            ? "text-slate-200 border-gray-700"
                                            : "text-slate-700 border-slate-200"
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                                            style={{
                                                backgroundColor:
                                                    theme === "dark" ? "#475569" : "#3f3d56",
                                            }}
                                        >
                                            {employee.employee
                                                .split(" ")
                                                .map(n => n[0])
                                                .join("")}
                                        </div>
                                        <div>
                                            <div
                                                className={`font-semibold ${
                                                    theme === "dark"
                                                        ? "text-slate-200"
                                                        : "text-slate-800"
                                                }`}
                                            >
                                                {employee.employee}
                                            </div>
                                            <div
                                                className={`text-xs ${
                                                    theme === "dark"
                                                        ? "text-slate-400"
                                                        : "text-slate-500"
                                                }`}
                                            >
                                                {getDepartmentName(employee.department)} •{" "}
                                                {getSectionName(employee.section)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {dateRange.map(date => {
                                    const leave = getLeaveForDate(employee, date);

                                    const isWeekend = date.getDay() === 0 || date.getDay() === 6;

                                    return (
                                        <div
                                            key={date.toISOString()}
                                            className={`w-12 h-16 border-r flex items-center justify-center relative group cursor-pointer flex-shrink-0 ${
                                                theme === "dark"
                                                    ? "border-gray-700"
                                                    : "border-slate-200"
                                            } ${
                                                isWeekend
                                                    ? theme === "dark"
                                                        ? "bg-gray-800/50"
                                                        : "bg-slate-100/50"
                                                    : ""
                                            }`}
                                            style={{
                                                backgroundColor: leave
                                                    ? leave.leaveStage === "Approved"
                                                        ? "#10b981"
                                                        : leave.rollbackStatus === "Requested"
                                                            ? "#f59e0b"
                                                            : leave.leaveStage === "Open"
                                                                ? "#3b82f6"
                                                                : "transparent"
                                                    : "transparent",
                                            }}
                                            onClick={() => leave && handleLeaveClick(leave)}
                                            title={
                                                leave
                                                    ? `${employee.employee}\n${leave.leaveType}\nStatus: ${leave.leaveState}\nDays: ${leave.numberOfLeaveDaysRequested}\nClick for details`
                                                    : `${employee.employee}\n${date.toLocaleDateString(
                                                        "en-US",
                                                        {
                                                            weekday: "long",
                                                            month: "long",
                                                            day: "numeric",
                                                        },
                                                    )}`
                                            }
                                        >
                                            {leave && (
                                                <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-200">
                                                    <div className="w-3 h-3 rounded-full bg-white"></div>
                                                </div>
                                            )}
                                            {isWeekend && !leave && (
                                                <div className="w-2 h-2 rounded-full bg-slate-300 opacity-50"></div>
                                            )}

                                            {/* Enhanced Hover tooltip */}
                                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                                                {leave ? (
                                                    <div>
                                                        <div className="font-semibold">
                                                            {employee.employee}
                                                        </div>
                                                        <div>{leave.leaveType}</div>
                                                        <div>Status: {leave.leaveState}</div>
                                                        <div>
                                                            Days: {leave.numberOfLeaveDaysRequested}
                                                        </div>
                                                        <div className="text-yellow-300 mt-1">
                                                            Click for details
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <div className="font-semibold">
                                                            {employee.employee}
                                                        </div>
                                                        <div>
                                                            {date.toLocaleDateString("en-US", {
                                                                weekday: "long",
                                                                month: "long",
                                                                day: "numeric",
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                </div>
            </Card>
            {isLeaveDetailModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <LeaveDetail
                        selectedLeave={selectedLeave}
                        setIsLeaveDetailModalOpen={setIsLeaveDetailModalOpen}
                    />
                </div>
            )}
        </>
    );
}
