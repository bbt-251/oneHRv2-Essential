"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, User, Megaphone, Bell } from "lucide-react";
import { useFirestore } from "@/context/firestore-context";
import { useAuth } from "@/context/authContext";
import { useTheme } from "@/components/theme-provider";
import { HolidayModel } from "@/lib/backend/firebase/hrSettingsService";
import dayjs from "dayjs";
import { timestampFormat } from "@/lib/util/dayjs_format";

interface MetricDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: "announcements" | "holidays" | "leave" | "notifications";
}

export function MetricDetailModal({ isOpen, onClose, type }: MetricDetailModalProps) {
    const { notifications, leaveManagements, hrSettings } = useFirestore();
    const { userData } = useAuth();
    const myNotifications = notifications
        .filter(not => not.uid === userData?.uid)
        .sort(
            (a, b) =>
                dayjs(b.timestamp, timestampFormat).valueOf() -
                dayjs(a.timestamp, timestampFormat).valueOf(),
        )
        .slice(0, 10);
    const { theme } = useTheme();
    const leaveBalanceDetails = leaveManagements.filter(
        (leave: any) => leave.employeeID === userData?.uid,
    );
    const upcomingHolidays = hrSettings.holidays
        .filter(
            (holiday: HolidayModel) =>
                new Date(holiday.date) >= new Date() && holiday.active === "Yes",
        )
        .sort(
            (a: HolidayModel, b: HolidayModel) =>
                new Date(a.date).getTime() - new Date(b.date).getTime(),
        );
    const leaveTypes = hrSettings.leaveTypes;
    const reasons = hrSettings.reasonOfLeaving;
    const getLeaveTypeName = (leaveTypeId: string) => {
        const leaveType = leaveTypes.find(leaveType => leaveType.id === leaveTypeId);
        return leaveType?.name || "Unknown";
    };
    const getReasonName = (reasonId: string) => {
        const reason = reasons.find(reason => reason.id === reasonId);
        return reason?.name || "Unknown";
    };
    const content = {
        announcements: {
            title: "Recent Announcements",
            items: [],
        },
        holidays: {
            title: "Upcoming Holidays",
            items: upcomingHolidays,
        },
        leave: {
            title: "Leave Balance Details",
            items: leaveBalanceDetails,
        },
        notifications: {
            title: "Recent Notifications",
            items: myNotifications,
        },
    }[type];

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle
                        className={`text-xl font-semibold ${theme === "dark" ? "text-white" : "text-navy-900"}`}
                    >
                        {content.title}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 mt-4">
                    {type === "announcements" && (
                        <div className="space-y-3">
                            {content.items?.length === 0 ? (
                                <div className="text-center py-8">
                                    <Megaphone className="mx-auto h-12 w-12 text-gray-400" />
                                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                                        No announcements yet
                                    </h3>
                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                        Check back later for new updates and announcements.
                                    </p>
                                </div>
                            ) : (
                                content.items?.map((item: any, index: number) => (
                                    <div
                                        key={index}
                                        className={`p-4 border rounded-lg ${theme === "dark" ? "bg-black" : "bg-white"}`}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <h3
                                                className={`font-semibold ${theme === "dark" ? "text-white" : "text-navy-900"}`}
                                            >
                                                {item.title}
                                            </h3>
                                            <Badge
                                                variant={
                                                    item.priority === "high"
                                                        ? "destructive"
                                                        : "secondary"
                                                }
                                                className={
                                                    item.priority === "high"
                                                        ? "bg-accent-100 text-accent-700"
                                                        : item.priority === "medium"
                                                            ? "bg-primary-100 text-primary-700"
                                                            : "bg-secondary-100 text-secondary-700"
                                                }
                                            >
                                                {item.priority}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-secondary-600 mb-3">
                                            {item.description}
                                        </p>
                                        <div className="flex items-center gap-4 text-xs text-secondary-500">
                                            <div className="flex items-center gap-1">
                                                <User className="h-3 w-3" />
                                                <span>{item.author}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                <span>{item.date}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {type === "holidays" && (
                        <div className="space-y-3">
                            {content.items?.length === 0 ? (
                                <div className="text-center py-8">
                                    <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                                        No upcoming holidays
                                    </h3>
                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                        Check back later for updates on upcoming holidays.
                                    </p>
                                </div>
                            ) : (
                                content.items?.map((item: any, index: number) => (
                                    <div
                                        key={index}
                                        className={`p-4 border rounded-lg ${theme === "dark" ? "bg-black" : "bg-primary-50"}`}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <h3
                                                className={`font-semibold ${theme === "dark" ? "text-white" : "text-navy-900"}`}
                                            >
                                                {item.name}
                                            </h3>
                                        </div>
                                        <div className="flex items-center gap-1 text-xs text-secondary-500">
                                            <Calendar className="h-3 w-3" />
                                            <span>{item.date}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {type === "leave" && (
                        <div className="space-y-3">
                            {content.items?.map((item: any, index: number) => (
                                <div
                                    key={index}
                                    className={`p-4 border rounded-lg mb-4 ${
                                        theme === "dark"
                                            ? "bg-black border-slate-700"
                                            : "bg-white border-slate-200"
                                    }`}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h3
                                                className={`font-semibold ${theme === "dark" ? "text-white" : "text-slate-900"}`}
                                            >
                                                {getLeaveTypeName(item.leaveType)}
                                            </h3>
                                            <p
                                                className={`text-sm mt-1 ${
                                                    theme === "dark"
                                                        ? "text-slate-400"
                                                        : "text-slate-500"
                                                }`}
                                            >
                                                {new Date(
                                                    item.firstDayOfLeave,
                                                ).toLocaleDateString()}{" "}
                                                -{" "}
                                                {new Date(item.lastDayOfLeave).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <span
                                            className={`px-2 py-1 text-xs rounded-full ${
                                                item.leaveStage === "Approved"
                                                    ? "bg-green-100 text-green-800"
                                                    : item.leaveStage === "Requested"
                                                        ? "bg-blue-100 text-blue-800"
                                                        : "bg-gray-100 text"
                                            } ${theme === "dark" ? "!bg-opacity-20" : ""}`}
                                        >
                                            {item.leaveStage}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p
                                                className={
                                                    theme === "dark"
                                                        ? "text-slate-400"
                                                        : "text-slate-500"
                                                }
                                            >
                                                Days Requested
                                            </p>
                                            <p
                                                className={
                                                    theme === "dark"
                                                        ? "text-white"
                                                        : "text-slate-900"
                                                }
                                            >
                                                {item.numberOfLeaveDaysRequested} days
                                            </p>
                                        </div>
                                        <div>
                                            <p
                                                className={
                                                    theme === "dark"
                                                        ? "text-slate-400"
                                                        : "text-slate-500"
                                                }
                                            >
                                                Balance
                                            </p>
                                            <p
                                                className={
                                                    theme === "dark"
                                                        ? "text-white"
                                                        : "text-slate-900"
                                                }
                                            >
                                                {item.balanceLeaveDays.toFixed(1)} days
                                            </p>
                                        </div>
                                    </div>

                                    {item.reason && (
                                        <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                                            <p
                                                className={`text-sm ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}
                                            >
                                                Reason:{" "}
                                                <span
                                                    className={
                                                        theme === "dark"
                                                            ? "text-slate-300"
                                                            : "text-slate-700"
                                                    }
                                                >
                                                    {getReasonName(item.reason)}
                                                </span>
                                            </p>
                                        </div>
                                    )}

                                    {item.rollbackStatus && item.rollbackStatus !== "N/A" && (
                                        <div className="mt-2">
                                            <span
                                                className={`text-xs px-2 py-1 rounded ${
                                                    theme === "dark"
                                                        ? "bg-amber-900/30 text-amber-400"
                                                        : "bg-amber-100 text-amber-800"
                                                }`}
                                            >
                                                Rollback {item.rollbackStatus}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {type === "notifications" && (
                        <div className="space-y-3">
                            {content.items?.length === 0 ? (
                                <div className="text-center py-8">
                                    <Bell className="mx-auto h-12 w-12 text-gray-400" />
                                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                                        No notifications yet
                                    </h3>
                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                        You're all caught up! New notifications will appear here.
                                    </p>
                                </div>
                            ) : (
                                content.items?.map((item: any, index: number) => (
                                    <div
                                        key={index}
                                        className={[
                                            "p-4 border rounded-lg",
                                            item.read
                                                ? `border-${theme === "dark" ? "white" : "primary-200"} bg-${theme === "dark" ? "primary-900" : "primary-50"}`
                                                : `border-${theme === "dark" ? "secondary-800" : "secondary-200"} bg-${theme === "dark" ? "secondary-900" : "white"}`,
                                        ].join(" ")}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <h3
                                                className={`font-semibold ${theme === "dark" ? "text-white" : "text-navy-900"}`}
                                            >
                                                {item.title}
                                            </h3>
                                        </div>
                                        <p
                                            className={`text-sm mb-3 ${theme === "dark" ? "text-white" : "text-secondary-600"}`}
                                        >
                                            {item.message}
                                        </p>
                                        <div
                                            className={`flex items-center gap-1 text-xs ${theme === "dark" ? "text-white" : "text-secondary-500"}`}
                                        >
                                            <Clock className="h-3 w-3" />
                                            <span>
                                                {dayjs(item.timestamp, timestampFormat).format(
                                                    timestampFormat,
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                <div
                    className={`flex justify-end gap-2 mt-6 pt-4 border-t ${theme === "dark" ? "border-gray-800" : "border-secondary-200"}`}
                >
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
