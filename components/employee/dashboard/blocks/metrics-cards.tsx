"use client";

import { useTheme } from "@/components/theme-provider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/authContext";
import { useData } from "@/context/app-data-context";
import { Bell, Calendar, Sun } from "lucide-react";
import { useMemo, useState } from "react";
import { MetricDetailModal } from "../modals/metric-detail-modal";
import BalanceDetailsModal from "../../leave-management/modals/balance-details-modal";

export function MetricsCards() {
    const { notifications, holidays, accrualConfigurations } = useData();
    const { userData } = useAuth();
    const { theme } = useTheme();
    const [activeModal, setActiveModal] = useState<string | null>(null);
    const [isBalanceDetailsOpen, setIsBalanceDetailsOpen] = useState<boolean>(false);

    const upcomingHolidays = holidays
        .filter(holiday => new Date(holiday.date) >= new Date() && holiday.active === "Yes")
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const myNotifications = notifications.filter(
        notification => notification.uid === userData?.uid,
    );

    const upcomingHoliday = useMemo(
        () => (upcomingHolidays.length > 0 ? upcomingHolidays[0] : null),
        [upcomingHolidays],
    );

    const metrics = [
        {
            id: "holidays",
            title: "Upcoming Holidays",
            value: upcomingHolidays.length,
            subtitle: upcomingHoliday ? `Next: ${upcomingHoliday.name}` : "No upcoming holidays",
            icon: Sun,
        },
        {
            id: "leave",
            title: "Leave Balance",
            value: accrualConfigurations?.[0]?.limitUnusedDays
                ? (userData?.balanceLeaveDays || 0) + (userData?.accrualLeaveDays || 0)
                : userData?.balanceLeaveDays || 0,
            subtitle: "Days remaining",
            icon: Calendar,
        },
        {
            id: "notifications",
            title: "Notifications",
            value: myNotifications.length,
            subtitle: "Recent messages",
            icon: Bell,
        },
    ];

    return (
        <>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {metrics.map(metric => (
                    <Card
                        key={metric.id}
                        className={`cursor-pointer shadow-sm transition-all duration-300 hover:scale-105 hover:shadow-lg ${theme === "dark" ? "bg-black border-gray-800" : ""}`}
                        onClick={() => {
                            if (metric.id === "leave") {
                                if (accrualConfigurations?.[0]?.limitUnusedDays) {
                                    setIsBalanceDetailsOpen(true);
                                }
                                return;
                            }
                            setActiveModal(metric.id);
                        }}
                    >
                        <CardHeader className="pb-4 pt-6">
                            <div className="flex items-center justify-between">
                                <CardTitle
                                    className={`text-sm font-semibold ${theme === "dark" ? "text-slate-300" : "text-slate-600"}`}
                                >
                                    {metric.title}
                                </CardTitle>
                                <metric.icon
                                    className={`h-5 w-5 ${theme === "dark" ? "text-slate-400" : "text-slate-600"}`}
                                />
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3 pb-6">
                            <div
                                className={`text-3xl font-bold ${theme === "dark" ? "text-slate-300" : "text-slate-600"}`}
                            >
                                {metric.value}
                            </div>
                            <div
                                className={`text-sm font-medium ${theme === "dark" ? "text-slate-300" : "text-slate-600"}`}
                            >
                                {metric.subtitle}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <MetricDetailModal
                isOpen={activeModal === "holidays"}
                onClose={() => setActiveModal(null)}
                type="holidays"
            />
            <MetricDetailModal
                isOpen={activeModal === "notifications"}
                onClose={() => setActiveModal(null)}
                type="notifications"
            />
            <BalanceDetailsModal
                isOpen={isBalanceDetailsOpen}
                onClose={() => setIsBalanceDetailsOpen(false)}
                theme={theme}
                contractStartDate={userData?.contractStartingDate || ""}
                balanceLeaveDays={userData?.balanceLeaveDays || 0}
                accrualLeaveDays={userData?.accrualLeaveDays || 0}
                eligibleLeaveDays={userData?.eligibleLeaveDays || 0}
                carryOverLimit={accrualConfigurations?.[0]?.limitUnusedDays}
            />
        </>
    );
}
