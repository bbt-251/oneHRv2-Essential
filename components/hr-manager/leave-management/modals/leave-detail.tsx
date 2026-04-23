// LeaveDetail.tsx - Read-only view for HR Manager

"use client";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useData } from "@/context/app-data-context";
import { useTheme } from "@/components/theme-provider";
import { LeaveModel } from "@/lib/models/leave";
import { EmployeeModel } from "@/lib/models/employee";
import {
    annualLeaveType,
    unpaidLeaveType,
} from "@/components/employee/leave-management/modals/add-leave-request-modal";
import { ExternalLink, Paperclip, X } from "lucide-react";
import { StorageRepository } from "@/lib/repository/storage/storage.repository";

const DIRECT_URL_PREFIXES = [
    "https://firebasestorage.googleapis.com/",
    "https://storage.googleapis.com",
    "http://",
    "https://",
];

const isDirectAttachmentUrl = (value: string): boolean =>
    DIRECT_URL_PREFIXES.some(prefix => value.startsWith(prefix));

const getAttachmentLabel = (value: string): string => {
    const normalizedPath = value.split("?")[0] ?? value;
    const segments = normalizedPath.split("/");
    return segments[segments.length - 1] || value;
};

// Helper hook to get effective theme (handles "system" option)
function useEffectiveTheme() {
    const { theme } = useTheme();
    const isSystemDark =
        typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const [systemTheme, setSystemTheme] = useState<"light" | "dark">(
        isSystemDark ? "dark" : "light",
    );

    useEffect(() => {
        if (theme !== "system") {
            return;
        }

        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        const listener = (e: MediaQueryListEvent) => {
            setSystemTheme(e.matches ? "dark" : "light");
        };

        mediaQuery.addEventListener("change", listener);
        return () => mediaQuery.removeEventListener("change", listener);
    }, [theme]);

    return theme === "system" ? systemTheme : (theme as "light" | "dark");
}

interface LeaveDetailProps {
    selectedLeave: LeaveModel;
    setIsLeaveDetailModalOpen: (open: boolean) => void;
}

const getStatusColor = (status: string) => {
    switch (status) {
        case "Approved":
            return "bg-emerald-50 text-emerald-700 border-emerald-200";
        case "Open":
            return "bg-blue-50 text-blue-700 border-blue-200";
        case "Rollback":
            return "bg-amber-50 text-amber-700 border-amber-200";
        case "Rejected":
            return "bg-rose-50 text-rose-700 border-rose-200";
        default:
            return "bg-slate-50 text-slate-700 border-slate-200";
    }
};

export default function LeaveDetail({
    selectedLeave,
    setIsLeaveDetailModalOpen,
}: LeaveDetailProps) {
    const theme = useEffectiveTheme();
    const {
        employees,
        sectionSettings,
        departmentSettings,
        leaveTypes: baseLeaveTypes,
    } = useData();
    const leaveTypes = [...baseLeaveTypes, annualLeaveType, unpaidLeaveType];

    const employee = employees.find((emp: EmployeeModel) => emp.uid === selectedLeave.employeeID);
    const standInEmployee = employees.find(
        (emp: EmployeeModel) => emp.uid === selectedLeave?.standIn,
    );
    const getSectionName = (id: string) =>
        sectionSettings.find(s => s.id === id)?.name || "Unknown";
    const getLeaveTypeName = (id: string) => leaveTypes.find(lt => lt.id === id)?.name || "Unknown";
    const getDepartmentName = (id: string) =>
        departmentSettings.find(d => d.id === id)?.name || "Unknown";
    const [attachmentUrls, setAttachmentUrls] = useState<Record<string, string>>({});
    const [attachmentErrors, setAttachmentErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        let active = true;
        const attachments = selectedLeave.attachments ?? [];

        setAttachmentUrls({});
        setAttachmentErrors({});

        attachments.forEach(attachment => {
            if (isDirectAttachmentUrl(attachment)) {
                setAttachmentUrls(previous => ({ ...previous, [attachment]: attachment }));
                return;
            }

            StorageRepository.getDownloadUrl(attachment)
                .then(downloadUrl => {
                    if (!active) {
                        return;
                    }

                    setAttachmentUrls(previous => ({ ...previous, [attachment]: downloadUrl }));
                })
                .catch(() => {
                    if (!active) {
                        return;
                    }

                    setAttachmentErrors(previous => ({
                        ...previous,
                        [attachment]: "Attachment unavailable",
                    }));
                });
        });

        return () => {
            active = false;
        };
    }, [selectedLeave.attachments]);

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card
                className={`border-0 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden ${theme === "dark" ? "bg-slate-900 text-white" : "bg-white text-slate-900"}`}
            >
                {/* Header */}
                <div
                    className={`p-6 border-b ${theme === "dark" ? "border-slate-800" : "border-slate-200"}`}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div
                                className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold"
                                style={{
                                    backgroundColor: theme === "dark" ? "#4b5563" : "#3f3d56",
                                }}
                            >
                                {employee?.firstName
                                    .split(" ")
                                    .map((n: string) => n[0])
                                    .join("")}
                            </div>
                            <div>
                                <h2
                                    className={`text-2xl font-bold ${theme === "dark" ? "text-white" : "text-slate-900"}`}
                                >
                                    {employee?.firstName} {employee?.surname}
                                </h2>
                                <p
                                    className={`${theme === "dark" ? "text-slate-300" : "text-slate-600"}`}
                                >
                                    {getDepartmentName(employee?.department || "")} •{" "}
                                    {getSectionName(employee?.section || "")}
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsLeaveDetailModalOpen(false)}
                            className={`rounded-full h-10 w-10 hover:bg-opacity-10 ${theme === "dark" ? "text-white hover:bg-white" : "text-slate-900 hover:bg-black"}`}
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="mb-8">
                        <Badge
                            variant="outline"
                            className={`${getStatusColor(selectedLeave?.leaveState)} font-semibold px-4 py-2 text-lg rounded-xl border-0`}
                        >
                            {selectedLeave?.leaveState}
                        </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        <div className="space-y-6">
                            <div>
                                <label
                                    className={`text-sm font-semibold uppercase tracking-wider ${
                                        theme === "dark" ? "text-slate-300" : "text-slate-600"
                                    }`}
                                >
                                    Request ID
                                </label>
                                <p
                                    className={`text-lg font-bold mt-1 ${
                                        theme === "dark" ? "text-white" : "text-slate-900"
                                    }`}
                                >
                                    {selectedLeave?.leaveRequestID}
                                </p>
                            </div>

                            <div>
                                <label
                                    className={`text-sm font-semibold uppercase tracking-wider ${
                                        theme === "dark" ? "text-slate-300" : "text-slate-600"
                                    }`}
                                >
                                    Leave Type
                                </label>
                                <div className="flex items-center gap-2 mt-1">
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: "#ffe6a7" }}
                                    ></div>
                                    <p
                                        className={`text-lg font-medium ${
                                            theme === "dark" ? "text-slate-200" : "text-slate-700"
                                        }`}
                                    >
                                        {getLeaveTypeName(selectedLeave?.leaveType)}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <label
                                    className={`text-sm font-semibold uppercase tracking-wider ${
                                        theme === "dark" ? "text-slate-300" : "text-slate-600"
                                    }`}
                                >
                                    Leave Stage
                                </label>
                                <p
                                    className={`text-lg font-medium mt-1 ${
                                        theme === "dark" ? "text-slate-200" : "text-slate-700"
                                    }`}
                                >
                                    {selectedLeave?.leaveStage}
                                </p>
                            </div>

                            <div>
                                <label
                                    className={`text-sm font-semibold uppercase tracking-wider ${
                                        theme === "dark" ? "text-slate-300" : "text-slate-600"
                                    }`}
                                >
                                    Stand In
                                </label>
                                <p
                                    className={`text-lg font-medium mt-1 ${
                                        theme === "dark" ? "text-slate-200" : "text-slate-700"
                                    }`}
                                >
                                    {standInEmployee?.firstName} {standInEmployee?.surname}
                                </p>
                            </div>

                            <div>
                                <label
                                    className={`text-sm font-semibold uppercase tracking-wider ${
                                        theme === "dark" ? "text-slate-300" : "text-slate-600"
                                    }`}
                                >
                                    Department • Section
                                </label>
                                <p
                                    className={`text-lg font-medium mt-1 ${
                                        theme === "dark" ? "text-slate-200" : "text-slate-700"
                                    }`}
                                >
                                    {getDepartmentName(employee?.department || "")} •{" "}
                                    {getSectionName(employee?.section || "")}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label
                                    className={`text-sm font-semibold uppercase tracking-wider ${
                                        theme === "dark" ? "text-slate-300" : "text-slate-600"
                                    }`}
                                >
                                    Leave Period
                                </label>
                                <div className="mt-1">
                                    <p
                                        className={`text-lg font-medium ${
                                            theme === "dark" ? "text-slate-200" : "text-slate-700"
                                        }`}
                                    >
                                        {selectedLeave?.firstDayOfLeave &&
                                            new Date(
                                                selectedLeave.firstDayOfLeave,
                                            ).toLocaleDateString("en-US", {
                                                weekday: "long",
                                                year: "numeric",
                                                month: "long",
                                                day: "numeric",
                                            })}
                                    </p>
                                    <p
                                        className={`text-slate-500 ${theme === "dark" ? "text-slate-400" : ""}`}
                                    >
                                        to
                                    </p>
                                    <p
                                        className={`text-lg font-medium ${
                                            theme === "dark" ? "text-slate-200" : "text-slate-700"
                                        }`}
                                    >
                                        {selectedLeave?.lastDayOfLeave &&
                                            new Date(
                                                selectedLeave.lastDayOfLeave,
                                            ).toLocaleDateString("en-US", {
                                                weekday: "long",
                                                year: "numeric",
                                                month: "long",
                                                day: "numeric",
                                            })}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <label
                                    className={`text-sm font-semibold uppercase tracking-wider ${
                                        theme === "dark" ? "text-slate-300" : "text-slate-600"
                                    }`}
                                >
                                    Return Date
                                </label>
                                <p
                                    className={`text-lg font-medium mt-1 ${
                                        theme === "dark" ? "text-slate-200" : "text-slate-700"
                                    }`}
                                >
                                    {selectedLeave?.dateOfReturn &&
                                        new Date(selectedLeave.dateOfReturn).toLocaleDateString(
                                            "en-US",
                                            {
                                                weekday: "long",
                                                year: "numeric",
                                                month: "long",
                                                day: "numeric",
                                            },
                                        )}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {selectedLeave.authorizedDays && (
                                    <div>
                                        <label
                                            className={`text-sm font-semibold uppercase tracking-wider ${
                                                theme === "dark"
                                                    ? "text-slate-300"
                                                    : "text-slate-600"
                                            }`}
                                        >
                                            Authorized Days
                                        </label>
                                        <div
                                            className={`w-16 h-12 rounded-xl flex items-center justify-center mt-2 ${
                                                theme === "dark" ? "bg-gray-800" : "bg-slate-100"
                                            }`}
                                        >
                                            <span
                                                className={`text-xl font-bold ${
                                                    theme === "dark"
                                                        ? "text-slate-200"
                                                        : "text-slate-700"
                                                }`}
                                            >
                                                {selectedLeave.authorizedDays}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {selectedLeave.numberOfLeaveDaysRequested && (
                                    <div>
                                        <label
                                            className={`text-sm font-semibold uppercase tracking-wider ${
                                                theme === "dark"
                                                    ? "text-slate-300"
                                                    : "text-slate-600"
                                            }`}
                                        >
                                            Days Requested
                                        </label>
                                        <div
                                            className={`w-16 h-12 rounded-xl flex items-center justify-center mt-2 ${
                                                theme === "dark" ? "bg-gray-800" : "bg-slate-100"
                                            }`}
                                        >
                                            <span
                                                className={`text-xl font-bold ${
                                                    theme === "dark"
                                                        ? "text-slate-200"
                                                        : "text-slate-700"
                                                }`}
                                            >
                                                {selectedLeave.numberOfLeaveDaysRequested}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Half-Day Option Display */}
                            {selectedLeave.halfDayOption && (
                                <div className="mt-4">
                                    <label
                                        className={`text-sm font-semibold uppercase tracking-wider ${
                                            theme === "dark" ? "text-slate-300" : "text-slate-600"
                                        }`}
                                    >
                                        Half-Day Option
                                    </label>
                                    <div className="mt-2">
                                        <Badge
                                            variant="outline"
                                            className={`${theme === "dark" ? "bg-amber-900/50 text-amber-200 border-amber-700" : "bg-amber-50 text-amber-700 border-amber-200"} px-3 py-1`}
                                        >
                                            {selectedLeave.halfDayOption === "HDM"
                                                ? "Half-day Morning (AM)"
                                                : "Half-day Afternoon (PM)"}
                                        </Badge>
                                    </div>
                                </div>
                            )}
                            <div>
                                <label
                                    className={`text-sm font-semibold uppercase tracking-wider ${
                                        theme === "dark" ? "text-slate-300" : "text-slate-600"
                                    }`}
                                >
                                    Submitted
                                </label>
                                <p
                                    className={`text-lg font-medium mt-1 ${
                                        theme === "dark" ? "text-slate-200" : "text-slate-700"
                                    }`}
                                >
                                    {selectedLeave?.timestamp &&
                                        new Date(selectedLeave.timestamp).toLocaleDateString(
                                            "en-US",
                                            {
                                                year: "numeric",
                                                month: "long",
                                                day: "numeric",
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            },
                                        )}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Reason Section */}
                    <div className="mb-8">
                        <label
                            className={`text-sm font-semibold uppercase tracking-wider ${
                                theme === "dark" ? "text-slate-300" : "text-slate-600"
                            }`}
                        >
                            Reason
                        </label>
                        <div
                            className={`mt-2 p-4 rounded-xl ${
                                theme === "dark" ? "bg-gray-800" : "bg-slate-50"
                            }`}
                        >
                            <p
                                className={`font-medium ${
                                    theme === "dark" ? "text-slate-200" : "text-slate-700"
                                }`}
                            >
                                {selectedLeave.reason || "No reason provided"}
                            </p>
                        </div>
                    </div>

                    {selectedLeave.attachments && selectedLeave.attachments.length > 0 && (
                        <div className="mb-8">
                            <label
                                className={`text-sm font-semibold uppercase tracking-wider ${
                                    theme === "dark" ? "text-slate-300" : "text-slate-600"
                                }`}
                            >
                                Attachments ({selectedLeave.attachments.length})
                            </label>
                            <div className="mt-2 space-y-3">
                                {selectedLeave.attachments.map(attachment => {
                                    const resolvedUrl = attachmentUrls[attachment];
                                    const attachmentError = attachmentErrors[attachment];

                                    return (
                                        <div
                                            key={attachment}
                                            className={`flex items-center justify-between gap-4 p-4 rounded-xl ${
                                                theme === "dark" ? "bg-gray-800" : "bg-slate-50"
                                            }`}
                                        >
                                            <div className="min-w-0 flex items-center gap-3">
                                                <Paperclip
                                                    className={`h-4 w-4 shrink-0 ${
                                                        theme === "dark"
                                                            ? "text-slate-400"
                                                            : "text-slate-500"
                                                    }`}
                                                />
                                                <div className="min-w-0">
                                                    <p
                                                        className={`truncate font-medium ${
                                                            theme === "dark"
                                                                ? "text-slate-200"
                                                                : "text-slate-700"
                                                        }`}
                                                    >
                                                        {getAttachmentLabel(attachment)}
                                                    </p>
                                                    {!resolvedUrl && (
                                                        <p
                                                            className={`text-sm ${
                                                                attachmentError
                                                                    ? "text-rose-500"
                                                                    : theme === "dark"
                                                                        ? "text-slate-400"
                                                                        : "text-slate-500"
                                                            }`}
                                                        >
                                                            {attachmentError ||
                                                                "Resolving attachment..."}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            {resolvedUrl && (
                                                <a
                                                    href={resolvedUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={`inline-flex items-center gap-2 text-sm font-medium ${
                                                        theme === "dark"
                                                            ? "text-sky-300 hover:text-sky-200"
                                                            : "text-sky-700 hover:text-sky-800"
                                                    }`}
                                                >
                                                    Open
                                                    <ExternalLink className="h-4 w-4" />
                                                </a>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Rollback Status Section */}
                    {selectedLeave?.rollbackStatus && selectedLeave.rollbackStatus !== "N/A" && (
                        <div className="mb-8">
                            <label
                                className={`text-sm font-semibold uppercase tracking-wider ${
                                    theme === "dark" ? "text-slate-300" : "text-slate-600"
                                }`}
                            >
                                Rollback Status
                            </label>
                            <div
                                className={`mt-2 p-4 bg-amber-50 rounded-xl border border-amber-200 ${
                                    theme === "dark" ? "bg-slate-800 border-slate-700" : ""
                                }`}
                            >
                                <p
                                    className={`text-amber-800 font-medium ${
                                        theme === "dark" ? "text-slate-200" : ""
                                    }`}
                                >
                                    {selectedLeave.rollbackStatus}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Comments Section */}
                    {selectedLeave?.comments && selectedLeave.comments.length > 0 && (
                        <div className="mb-8">
                            <label
                                className={`text-sm font-semibold uppercase tracking-wider ${
                                    theme === "dark" ? "text-slate-300" : "text-slate-600"
                                }`}
                            >
                                Comments ({selectedLeave.comments.length})
                            </label>
                            <div className="mt-2 space-y-3">
                                {selectedLeave.comments.map((comment, index) => (
                                    <div
                                        key={index}
                                        className={`p-4 rounded-xl ${
                                            theme === "dark" ? "bg-gray-800" : "bg-slate-50"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span
                                                className={`font-semibold ${
                                                    theme === "dark"
                                                        ? "text-slate-200"
                                                        : "text-slate-700"
                                                }`}
                                            >
                                                {comment.by}
                                            </span>
                                            <span
                                                className={`text-sm ${
                                                    theme === "dark"
                                                        ? "text-slate-400"
                                                        : "text-slate-500"
                                                }`}
                                            >
                                                {new Date(comment.date).toLocaleDateString(
                                                    "en-US",
                                                    {
                                                        year: "numeric",
                                                        month: "short",
                                                        day: "numeric",
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    },
                                                )}
                                            </span>
                                        </div>
                                        <p
                                            className={`${
                                                theme === "dark"
                                                    ? "text-slate-300"
                                                    : "text-slate-600"
                                            }`}
                                        >
                                            {comment.comment}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
}
