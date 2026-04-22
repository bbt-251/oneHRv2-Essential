"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useTheme } from "@/components/theme-provider";
import { Calendar, Clock, FileText } from "lucide-react";

interface LeaveStatsProps {
    balanceDays: number;
    daysTaken: number;
    eligibleDays: number;
    accrualDays?: number;
    contractStartDate?: string;
    carryOverLimit?: number;
    onBalanceClick?: () => void;
}

export default function LeaveStats({
    balanceDays,
    daysTaken,
    eligibleDays,
    accrualDays = 0,
    contractStartDate: _contractStartDate,
    carryOverLimit,
    onBalanceClick,
}: LeaveStatsProps) {
    const { theme } = useTheme();

    // Only show balance as clickable if accrual is configured
    const isAccrualConfigured = carryOverLimit !== undefined && carryOverLimit > 0;

    // Total BLD = balanceLeaveDays + (isConfigured ? accrualLeaveDays : 0)
    const totalBalance = isAccrualConfigured ? balanceDays + accrualDays : balanceDays;

    const stats = [
        {
            title: "Balance Days",
            value: totalBalance,
            description: isAccrualConfigured ? "Click to view details" : "Current balance",
            icon: <Calendar className="w-6 h-6 text-white" />,
            isClickable: isAccrualConfigured,
        },
        {
            title: "Days Taken",
            value: daysTaken,
            description: "Used this year",
            icon: <Clock className="w-6 h-6 text-white" />,
        },
        {
            title: "Total Eligible",
            value: eligibleDays,
            description: "Annual entitlement",
            icon: <FileText className="w-6 h-6 text-white" />,
        },
    ];

    return (
        <div
            className={`grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 ${theme === "dark" ? "dark" : ""}`}
        >
            {stats.map((stat, index) => (
                <Card
                    key={index}
                    className={`group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${theme === "dark" ? "bg-black border-gray-800" : ""} ${stat.isClickable && onBalanceClick ? "cursor-pointer hover:ring-2 hover:ring-amber-500/50" : ""}`}
                    onClick={stat.isClickable && onBalanceClick ? onBalanceClick : undefined}
                >
                    <div
                        className={`absolute inset-0 ${
                            theme === "dark"
                                ? "bg-gradient-to-br from-black to-gray-900"
                                : "bg-gradient-to-br from-white to-slate-50"
                        }`}
                    ></div>
                    <CardContent className="relative p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div
                                className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300"
                                style={{
                                    backgroundColor: theme === "dark" ? "#1f2937" : "#3f3d56",
                                }}
                            >
                                {stat.icon}
                            </div>
                            <div
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: "#ffe6a7" }}
                            ></div>
                        </div>
                        <div className="space-y-1">
                            <h3
                                className={`text-xs font-semibold uppercase tracking-wider ${
                                    theme === "dark" ? "text-slate-300" : "text-slate-600"
                                }`}
                            >
                                {stat.title}
                            </h3>
                            <div
                                className="text-3xl font-bold tracking-tight"
                                style={{ color: theme === "dark" ? "#ffffff" : "#3f3d56" }}
                            >
                                {stat.value || 0}
                            </div>
                            <p
                                className={`text-sm font-medium ${
                                    theme === "dark" ? "text-slate-300" : "text-slate-500"
                                }`}
                            >
                                {stat.description}
                            </p>
                        </div>
                        <div
                            className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r"
                            style={{
                                background: `linear-gradient(90deg, ${theme === "dark" ? "#1f2937" : "#3f3d56"} 0%, #ffe6a7 100%)`,
                            }}
                        ></div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
