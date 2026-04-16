"use client";
import type React from "react";
import { useFirestore } from "@/context/firestore-context";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, X, Filter, CalendarIcon } from "lucide-react";
import { useTrainingSchedule } from "@/lib/util/learning/use-training-schedule";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import dayjs from "dayjs";
import { dateFormat } from "@/lib/util/dayjs_format";
import { Calendar } from "@/components/ui/calendar";

export const TrainingSchedule = () => {
    const { activeEmployees, trainingPaths, trainingMaterials } = useFirestore();
    const {
        currentWeekStart,
        scheduleFilters,
        setScheduleFilters,
        customDateRange,
        setCustomDateRange,
        scheduleData,
        summaryStats,
        handleWeekChange,
    } = useTrainingSchedule(activeEmployees, trainingPaths, trainingMaterials);

    return (
        <div>
            <Card className="border-accent-200 dark:border-border">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-xl font-semibold text-brand-800 dark:text-foreground">
                            Training Schedule Matrix
                        </CardTitle>
                        <div className="flex items-center gap-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleWeekChange("previous")}
                                className="flex items-center gap-2"
                            >
                                <ChevronLeft className="h-4 w-4" />
                                Previous Week
                            </Button>
                            <span className="text-sm font-medium text-brand-600 dark:text-muted-foreground">
                                {currentWeekStart.toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                })}{" "}
                                -{" "}
                                {new Date(
                                    currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000,
                                ).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                })}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleWeekChange("next")}
                                className="flex items-center gap-2"
                            >
                                Next Week
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="bg-gradient-to-r from-brand-50 to-brand-100 dark:from-brand-950 dark:to-brand-900 p-4 rounded-xl border border-brand-200 dark:border-brand-800 space-y-4 mt-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Filter className="h-5 w-5 text-brand-600" />
                            <span className="font-medium text-brand-800 dark:text-white">
                                Filter Training Schedule
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-brand-700 dark:text-brand-300">
                                    Training Type
                                </Label>
                                <Select
                                    value={scheduleFilters.trainingType}
                                    onValueChange={value =>
                                        setScheduleFilters({
                                            ...scheduleFilters,
                                            trainingType: value,
                                        })
                                    }
                                >
                                    <SelectTrigger className="bg-white dark:bg-brand-800">
                                        <SelectValue placeholder="All Types" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Types</SelectItem>
                                        <SelectItem value="material">Training Materials</SelectItem>
                                        <SelectItem value="path">Training Paths</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-brand-700 dark:text-brand-300">
                                    Employee
                                </Label>
                                <Select
                                    value={scheduleFilters.employee}
                                    onValueChange={value =>
                                        setScheduleFilters({ ...scheduleFilters, employee: value })
                                    }
                                >
                                    <SelectTrigger className="bg-white dark:bg-brand-800">
                                        <SelectValue placeholder="All Employees" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Employees</SelectItem>
                                        {activeEmployees.map(employee => (
                                            <SelectItem key={employee.id} value={employee.id}>
                                                {employee.firstName} {employee.surname}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-brand-700 dark:text-brand-300">
                                    Status
                                </Label>
                                <Select
                                    value={scheduleFilters.status}
                                    onValueChange={value =>
                                        setScheduleFilters({ ...scheduleFilters, status: value })
                                    }
                                >
                                    <SelectTrigger className="bg-white dark:bg-brand-800">
                                        <SelectValue placeholder="All Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                        <SelectItem value="in-progress">In Progress</SelectItem>
                                        <SelectItem value="scheduled">Scheduled</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-brand-700 dark:text-brand-300">
                                    Date Range
                                </Label>
                                <Select
                                    value={scheduleFilters.dateRange}
                                    onValueChange={value =>
                                        setScheduleFilters({ ...scheduleFilters, dateRange: value })
                                    }
                                >
                                    <SelectTrigger className="bg-white dark:bg-brand-800">
                                        <SelectValue placeholder="This Week" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="this-week">This Week</SelectItem>
                                        <SelectItem value="next-week">Next Week</SelectItem>
                                        <SelectItem value="this-month">This Month</SelectItem>
                                        <SelectItem value="next-month">Next Month</SelectItem>
                                        <SelectItem value="custom">Custom Range</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-end">
                                <Button
                                    variant="outline"
                                    onClick={() =>
                                        setScheduleFilters({
                                            trainingType: "all",
                                            employee: "all",
                                            status: "all",
                                            dateRange: "this-week",
                                        })
                                    }
                                    className="w-full bg-white dark:bg-brand-800 hover:bg-brand-50 dark:hover:bg-brand-700"
                                >
                                    <X className="h-4 w-4 mr-2" />
                                    Clear All
                                </Button>
                            </div>

                            {scheduleFilters.dateRange === "custom" && (
                                <div className="lg:col-span-5 md:col-span-2 col-span-1 grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-brand-50 dark:bg-brand-900/20 rounded-lg border border-brand-200 dark:border-brand-700">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-brand-600 dark:text-brand-400">
                                            Start Date
                                        </Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    className="w-full justify-start text-left font-normal bg-white dark:bg-brand-800"
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {customDateRange.startDate
                                                        ? dayjs(customDateRange.startDate).format(
                                                            dateFormat,
                                                        )
                                                        : "Select date"}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <Calendar
                                                    mode="single"
                                                    selected={
                                                        customDateRange.startDate
                                                            ? new Date(customDateRange.startDate)
                                                            : undefined
                                                    }
                                                    onSelect={date =>
                                                        setCustomDateRange({
                                                            ...customDateRange,
                                                            startDate:
                                                                date?.toISOString().split("T")[0] ||
                                                                "",
                                                        })
                                                    }
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-brand-600 dark:text-brand-400">
                                            End Date
                                        </Label>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    className="w-full justify-start text-left font-normal bg-white dark:bg-brand-800"
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {customDateRange.endDate
                                                        ? dayjs(customDateRange.endDate).format(
                                                            dateFormat,
                                                        )
                                                        : "Select date"}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <Calendar
                                                    mode="single"
                                                    selected={
                                                        customDateRange.endDate
                                                            ? new Date(customDateRange.endDate)
                                                            : undefined
                                                    }
                                                    onSelect={date =>
                                                        setCustomDateRange({
                                                            ...customDateRange,
                                                            endDate:
                                                                date?.toISOString().split("T")[0] ||
                                                                "",
                                                        })
                                                    }
                                                    disabled={
                                                        customDateRange.startDate
                                                            ? new Date(customDateRange.startDate)
                                                            : undefined
                                                    }
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-4 mt-4">
                        <div className="flex items-center gap-2">
                            <div
                                className="w-4 h-4 rounded"
                                style={{ backgroundColor: "#3f3d5625" }}
                            ></div>
                            <span className="text-sm text-brand-600 dark:text-muted-foreground">
                                Completed
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div
                                className="w-4 h-4 rounded"
                                style={{ backgroundColor: "#ffe6a7ff" }}
                            ></div>
                            <span className="text-sm text-brand-600 dark:text-muted-foreground">
                                In Progress
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div
                                className="w-4 h-4 rounded flex items-center justify-center text-xs font-medium text-white"
                                style={{ backgroundColor: "#3f3d56ff" }}
                            >
                                S
                            </div>
                            <span className="text-sm text-brand-600 dark:text-muted-foreground">
                                Scheduled
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-gray-300 rounded"></div>
                            <span className="text-sm text-brand-600 dark:text-muted-foreground">
                                No Training
                            </span>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <div className="min-w-full">
                            <div className="grid grid-cols-8 gap-1 mb-2">
                                <div className="p-3 font-semibold text-brand-800 dark:text-foreground bg-brand-50 dark:bg-brand-900 rounded">
                                    Employee
                                </div>
                                {Array.from({ length: 7 }, (_, i) => {
                                    const date = new Date(currentWeekStart);
                                    date.setDate(date.getDate() + i);
                                    const dayName = date.toLocaleDateString("en-US", {
                                        weekday: "short",
                                    });
                                    const dayNumber = date.getDate();
                                    return (
                                        <div
                                            key={i}
                                            className="p-3 font-semibold text-center text-brand-800 dark:text-foreground bg-brand-50 dark:bg-brand-900 rounded"
                                        >
                                            <div>{dayName}</div>
                                            <div className="text-xs text-brand-600 dark:text-brand-400">
                                                {dayNumber}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="space-y-2">
                                {scheduleData
                                    .filter(employee => {
                                        if (
                                            scheduleFilters.employee !== "all" &&
                                            employee.id !== scheduleFilters.employee
                                        ) {
                                            return false;
                                        }

                                        const hasMatchingTraining = Object.values(
                                            employee.schedule,
                                        ).some(training => {
                                            if (!training) return false;

                                            if (
                                                scheduleFilters.trainingType !== "all" &&
                                                training.type !== scheduleFilters.trainingType
                                            ) {
                                                return false;
                                            }

                                            if (
                                                scheduleFilters.status !== "all" &&
                                                training.status !== scheduleFilters.status
                                            ) {
                                                return false;
                                            }

                                            return true;
                                        });
                                        if (
                                            scheduleFilters.status === "all" &&
                                            scheduleFilters.trainingType === "all"
                                        ) {
                                            return true;
                                        }

                                        return hasMatchingTraining;
                                    })
                                    .map((employee, employeeIndex) => (
                                        <div key={employee.id} className="grid grid-cols-8 gap-1">
                                            <div className="p-3 font-medium text-brand-800 dark:text-foreground bg-white dark:bg-card border border-brand-200 dark:border-border rounded flex items-center">
                                                <div className="w-8 h-8 bg-brand-600 text-white rounded-full flex items-center justify-center text-sm font-semibold mr-3">
                                                    {employee.name
                                                        .split(" ")
                                                        .map(n => n[0])
                                                        .join("")}
                                                </div>
                                                <span className="truncate">{employee.name}</span>
                                            </div>

                                            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                                                (day, dayIndex) => {
                                                    const training =
                                                        employee.schedule[
                                                            day as keyof typeof employee.schedule
                                                        ];

                                                    const statusColors = {
                                                        completed:
                                                            "border border-gray-200 dark:border-gray-700",
                                                        "in-progress":
                                                            "border border-gray-200 dark:border-gray-700",
                                                        scheduled:
                                                            "border border-gray-200 dark:border-gray-700",
                                                    };

                                                    const statusDots = {
                                                        completed: "",
                                                        "in-progress": "",
                                                        scheduled: "",
                                                    };

                                                    const getStatusStyle = (status: string) => {
                                                        switch (status) {
                                                            case "completed":
                                                                return {
                                                                    backgroundColor: "#3f3d5625",
                                                                };
                                                            case "in-progress":
                                                                return {
                                                                    backgroundColor: "#ffe6a7ff",
                                                                };
                                                            case "scheduled":
                                                                return {
                                                                    backgroundColor: "#3f3d56ff",
                                                                };
                                                            default:
                                                                return {};
                                                        }
                                                    };

                                                    const getDotStyle = (status: string) => {
                                                        switch (status) {
                                                            case "completed":
                                                                return {
                                                                    backgroundColor: "#3f3d56",
                                                                };
                                                            case "in-progress":
                                                                return {
                                                                    backgroundColor: "#ffe6a7",
                                                                };
                                                            case "scheduled":
                                                                return {
                                                                    backgroundColor: "#3f3d56",
                                                                };
                                                            default:
                                                                return {};
                                                        }
                                                    };

                                                    if (!training) {
                                                        return (
                                                            <div
                                                                key={`${employee.id}-${dayIndex}`}
                                                                className="p-2 border-r border-b border-gray-200 dark:border-gray-700 min-h-[80px]"
                                                            >
                                                                <div className="text-xs text-gray-400 text-center mt-6">
                                                                    No Training
                                                                </div>
                                                            </div>
                                                        );
                                                    }

                                                    const shouldShow =
                                                        (scheduleFilters.trainingType === "all" ||
                                                            training.type ===
                                                                scheduleFilters.trainingType) &&
                                                        (scheduleFilters.status === "all" ||
                                                            training.status ===
                                                                scheduleFilters.status);

                                                    if (!shouldShow) {
                                                        return (
                                                            <div
                                                                key={`${employee.id}-${dayIndex}`}
                                                                className="p-2 border-r border-b border-gray-200 dark:border-gray-700 min-h-[80px]"
                                                            >
                                                                <div className="text-xs text-gray-400 text-center mt-6">
                                                                    Filtered
                                                                </div>
                                                            </div>
                                                        );
                                                    }

                                                    return (
                                                        <div
                                                            key={`${employee.id}-${dayIndex}`}
                                                            className={`p-2 border-r border-b border-gray-200 dark:border-gray-700 min-h-[80px] ${statusColors[training?.status as keyof typeof statusColors] || ""}`}
                                                            style={
                                                                training
                                                                    ? getStatusStyle(
                                                                        training.status,
                                                                    )
                                                                    : {}
                                                            }
                                                        >
                                                            {training && (
                                                                <div className="space-y-1">
                                                                    <div className="flex items-center gap-1">
                                                                        <div
                                                                            className={`w-2 h-2 rounded-full ${statusDots[training.status as keyof typeof statusDots]}`}
                                                                            style={getDotStyle(
                                                                                training.status,
                                                                            )}
                                                                        ></div>
                                                                        <div className="flex-1">
                                                                            <div className="text-xs font-medium text- dark:text-foreground mb-1">
                                                                                {training.type ===
                                                                                "material"
                                                                                    ? "📚"
                                                                                    : "🛤️"}{" "}
                                                                                {training.type ===
                                                                                "material"
                                                                                    ? "Material"
                                                                                    : "Path"}
                                                                            </div>
                                                                            <div className="text-xs tex0 dark:text-muted-foreground font-medium leading-tight">
                                                                                {training.title}
                                                                            </div>
                                                                            <div className="text-xs 0 dark:text-muted-foreground mt-1 capitalize">
                                                                                {training.status.replace(
                                                                                    "-",
                                                                                    " ",
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                },
                                            )}
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card className="border-brand-200 dark:border-border">
                            <CardContent className="p-4">
                                <div className="text-2xl font-bold text-green-600">
                                    {summaryStats.completed}
                                </div>
                                <div className="text-sm text-brand-600 dark:text-muted-foreground">
                                    Completed
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-brand-200 dark:border-border">
                            <CardContent className="p-4">
                                <div className="text-2xl font-bold text-blue-600">
                                    {summaryStats.inProgress}
                                </div>
                                <div className="text-sm text-brand-600 dark:text-muted-foreground">
                                    In Progress
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-brand-200 dark:border-border">
                            <CardContent className="p-4">
                                <div className="text-2xl font-bold text-orange-600">
                                    {summaryStats.scheduled}
                                </div>
                                <div className="text-sm text-brand-600 dark:text-muted-foreground">
                                    Scheduled
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="border-brand-200 dark:border-border">
                            <CardContent className="p-4">
                                <div className="text-2xl font-bold text-brand-600">
                                    {summaryStats.employees}
                                </div>
                                <div className="text-sm text-brand-600 dark:text-muted-foreground">
                                    Employees
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
