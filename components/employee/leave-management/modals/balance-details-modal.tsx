"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, Calendar, Info } from "lucide-react";
import {
    calculateLeaveBalanceBreakdown,
    BalanceBreakdownResult,
} from "@/lib/util/functions/calculateLeaveBalanceBreakdown";

interface BalanceDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    theme: string;
    contractStartDate: string;
    balanceLeaveDays: number;
    accrualLeaveDays: number;
    eligibleLeaveDays: number;
    carryOverLimit?: number;
}

export default function BalanceDetailsModal({
    isOpen,
    onClose,
    theme,
    contractStartDate,
    balanceLeaveDays,
    accrualLeaveDays,
    eligibleLeaveDays,
    carryOverLimit,
}: BalanceDetailsModalProps) {
    // Calculate the balance breakdown using actual accrual data
    const breakdown: BalanceBreakdownResult = useMemo(() => {
        return calculateLeaveBalanceBreakdown(
            contractStartDate,
            balanceLeaveDays,
            accrualLeaveDays,
            eligibleLeaveDays,
            carryOverLimit,
        );
    }, [contractStartDate, balanceLeaveDays, accrualLeaveDays, eligibleLeaveDays, carryOverLimit]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 !mt-0">
            <Card
                className={`border-0 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden ${theme === "dark" ? "bg-slate-900 text-white" : "bg-white text-slate-900"}`}
            >
                {/* Header */}
                <div
                    className={`p-6 border-b ${theme === "dark" ? "border-slate-800" : "border-slate-200"}`}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div
                                className="w-12 h-12 rounded-full flex items-center justify-center text-white"
                                style={{
                                    backgroundColor: theme === "dark" ? "#4b5563" : "#3f3d56",
                                }}
                            >
                                <Calendar className="w-6 h-6" />
                            </div>
                            <div>
                                <h2
                                    className={`text-2xl font-bold ${theme === "dark" ? "text-white" : "text-slate-900"}`}
                                >
                                    Leave Balance Details
                                </h2>
                                <p
                                    className={`${theme === "dark" ? "text-slate-300" : "text-slate-600"}`}
                                >
                                    Breakdown of your balance leave days
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className={`rounded-full h-10 w-10 hover:bg-opacity-10 ${
                                theme === "dark"
                                    ? "text-white hover:bg-white"
                                    : "text-slate-900 hover:bg-black"
                            }`}
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Total Balance Display */}
                    <div
                        className={`mb-8 p-6 rounded-2xl ${theme === "dark" ? "bg-slate-800" : "bg-gradient-to-br from-slate-50 to-slate-100"}`}
                    >
                        <div className="text-center">
                            <p
                                className={`text-sm font-semibold uppercase tracking-wider ${theme === "dark" ? "text-slate-400" : "text-slate-600"} mb-2`}
                            >
                                Total Balance
                            </p>
                            <div
                                className={`text-5xl font-bold ${theme === "dark" ? "text-white" : "text-slate-900"}`}
                                style={{ color: theme === "dark" ? "#ffffff" : "#3f3d56" }}
                            >
                                {breakdown.totalBalance}
                            </div>
                            <p
                                className={`text-sm font-medium mt-2 ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}
                            >
                                days remaining
                            </p>
                        </div>
                    </div>

                    {/* Balance Breakdown Table */}
                    <div className="mb-8">
                        <h3
                            className={`text-lg font-semibold mb-4 ${theme === "dark" ? "text-white" : "text-slate-900"}`}
                        >
                            Balance Breakdown
                        </h3>
                        <div className="space-y-3">
                            {breakdown.breakdown.length === 0 ? (
                                <p
                                    className={`text-center py-4 ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}
                                >
                                    No balance breakdown available
                                </p>
                            ) : (
                                breakdown.breakdown.map((item, index) => (
                                    <div
                                        key={index}
                                        className={`flex items-center justify-between p-4 rounded-xl border ${
                                            theme === "dark"
                                                ? "bg-slate-800 border-slate-700"
                                                : "bg-white border-slate-200"
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={`w-3 h-3 rounded-full ${
                                                    item.type === "carried"
                                                        ? "bg-amber-500"
                                                        : "bg-emerald-500"
                                                }`}
                                            />
                                            <div>
                                                <p
                                                    className={`font-semibold ${theme === "dark" ? "text-white" : "text-slate-900"}`}
                                                >
                                                    {item.year}{" "}
                                                    {item.type === "carried"
                                                        ? "(Carried)"
                                                        : "(Current Year)"}
                                                </p>
                                                <p
                                                    className={`text-sm ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}
                                                >
                                                    {item.description}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span
                                                className={`text-2xl font-bold ${
                                                    item.type === "carried"
                                                        ? "text-amber-600"
                                                        : "text-emerald-600"
                                                }`}
                                            >
                                                {item.days}
                                            </span>
                                            <span
                                                className={`text-sm ml-1 ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}
                                            >
                                                days
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Info Section */}
                    <div
                        className={`p-4 rounded-xl ${theme === "dark" ? "bg-blue-900/30 border border-blue-800" : "bg-blue-50 border border-blue-200"}`}
                    >
                        <div className="flex items-start gap-3">
                            <Info
                                className={`w-5 h-5 mt-0.5 ${theme === "dark" ? "text-blue-400" : "text-blue-600"}`}
                            />
                            <div
                                className={`text-sm ${theme === "dark" ? "text-blue-200" : "text-blue-800"}`}
                            >
                                <p className="font-semibold mb-1">Leave Year Information</p>
                                <ul
                                    className={`space-y-1 ${theme === "dark" ? "text-blue-300" : "text-blue-700"}`}
                                >
                                    <li>
                                        • Work Anniversary:{" "}
                                        <strong>{breakdown.workAnniversary}</strong>
                                    </li>
                                    <li>
                                        • Next Anniversary:{" "}
                                        <strong>{breakdown.nextAnniversary}</strong>
                                    </li>
                                    <li>
                                        • Years of Service:{" "}
                                        <strong>{breakdown.yearsOfService}</strong>
                                    </li>
                                    <li>
                                        • Annual Entitlement:{" "}
                                        <strong>{breakdown.eligibleLeaveDays} days</strong>
                                    </li>
                                    {breakdown.isConfigured && (
                                        <li>
                                            • Carry Over Limit:{" "}
                                            <strong>{breakdown.carryOverLimit} days</strong>
                                        </li>
                                    )}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div
                    className={`p-6 border-t ${theme === "dark" ? "border-slate-800" : "border-slate-200"}`}
                >
                    <div className="flex items-center justify-end">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            className={`rounded-xl px-6 ${theme === "dark" ? "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700" : ""}`}
                        >
                            Close
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}
