import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LeaveModel } from "@/lib/models/leave";
import { X } from "lucide-react";
import { useData } from "@/context/app-data-context";
import { useState } from "react";
import { EditLeaveRequestModal } from "./edit-leave-request-modal";
import { Card } from "@/components/ui/card";
import { annualLeaveType, unpaidLeaveType } from "./add-leave-request-modal";
import { EmployeeModel } from "@/lib/models/employee";

interface LeaveDetailProps {
    theme: string;
    selectedLeave: LeaveModel;
    setIsLeaveModalOpen: (open: boolean) => void;
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
    theme,
    selectedLeave,
    setIsLeaveModalOpen,
}: LeaveDetailProps) {
    const { employees, ...hrSettings } = useData();

    const sections = hrSettings.sectionSettings;
    const leaveTypes = [...hrSettings.leaveTypes, annualLeaveType, unpaidLeaveType];

    const getSectionName = (sectionId: string) => {
        const section = sections.find(section => section.id === sectionId);
        return section?.name || "Unknown";
    };
    const getDepartmentName = (departmentId: string) => {
        const department = hrSettings.departmentSettings.find(
            department => department.id === departmentId,
        );
        return department?.name || "Unknown";
    };
    const getLeaveTypeName = (leaveTypeId: string) => {
        const leaveType = leaveTypes.find(leaveType => leaveType.id === leaveTypeId);
        return leaveType?.name || "Unknown";
    };
    const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);

    if (!selectedLeave) {
        return null;
    }
    const employee = employees.find((emp: EmployeeModel) => emp.uid === selectedLeave.employeeID);
    const handleEditLeave = () => {
        const canEdit = selectedLeave.leaveState === "Requested";
        if (canEdit) {
            setIsEditModalOpen(true);
        }
    };

    const handleEditSuccess = () => {
        setIsEditModalOpen(false);
        setIsLeaveModalOpen(false);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 !mt-0">
            <Card
                className={`border-0 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden ${theme === "dark" ? "bg-slate-900 text-white" : "bg-white text-slate-900"}`}
            >
                {/* Header */}
                <div
                    className={`p-6 border-b ${
                        theme === "dark" ? "border-slate-800" : "border-slate-200"
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div
                                className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold"
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
                                    Leave Request Details
                                </h2>
                                <p
                                    className={`${theme === "dark" ? "text-slate-300" : "text-slate-600"}`}
                                >
                                    {employee?.firstName} {employee?.surname} •{" "}
                                    {getDepartmentName(employee?.department || "")}
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsLeaveModalOpen(false)}
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
                    {/* Leave Status Badge */}
                    <div className="mb-8">
                        <Badge
                            variant="outline"
                            className={`${getStatusColor(selectedLeave.leaveState)} font-semibold px-4 py-2 text-lg rounded-xl border-0`}
                        >
                            {selectedLeave.leaveState}
                        </Badge>
                    </div>

                    {/* Leave Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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
                                        theme === "dark" ? "text-white" : ""
                                    }`}
                                    style={{ color: theme === "dark" ? "#ffffff" : "#3f3d56" }}
                                >
                                    {selectedLeave.leaveRequestID}
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
                                        {getLeaveTypeName(selectedLeave.leaveType)}
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
                                    {selectedLeave.leaveStage}
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
                                    {
                                        employees.find(
                                            employee => employee.id === selectedLeave.standIn,
                                        )?.firstName
                                    }
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
                                        {new Date(selectedLeave.firstDayOfLeave).toLocaleDateString(
                                            "en-US",
                                            {
                                                weekday: "long",
                                                year: "numeric",
                                                month: "long",
                                                day: "numeric",
                                            },
                                        )}
                                    </p>
                                    <p
                                        className={
                                            theme === "dark" ? "text-slate-400" : "text-slate-500"
                                        }
                                    >
                                        to
                                    </p>
                                    <p
                                        className={`text-lg font-medium ${
                                            theme === "dark" ? "text-slate-200" : "text-slate-700"
                                        }`}
                                    >
                                        {new Date(selectedLeave.lastDayOfLeave).toLocaleDateString(
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
                                    {new Date(selectedLeave.dateOfReturn).toLocaleDateString(
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
                                    {new Date(selectedLeave.timestamp).toLocaleDateString("en-US", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                    })}
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
                                {selectedLeave.reason || ""}
                            </p>
                        </div>
                    </div>

                    {/* Rollback Status (if applicable) */}
                    {selectedLeave.rollbackStatus && selectedLeave.rollbackStatus !== "N/A" && (
                        <div className="mb-8">
                            <label
                                className={`text-sm font-semibold uppercase tracking-wider ${
                                    theme === "dark" ? "text-slate-300" : "text-slate-600"
                                }`}
                            >
                                Rollback Status
                            </label>
                            <div
                                className={`mt-2 p-4 rounded-xl border ${
                                    theme === "dark"
                                        ? "bg-amber-900/50 border-amber-700"
                                        : "bg-amber-50 border-amber-200"
                                }`}
                            >
                                <p
                                    className={`font-medium ${
                                        theme === "dark" ? "text-amber-200" : "text-amber-800"
                                    }`}
                                >
                                    {selectedLeave.rollbackStatus}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div
                        className={`flex items-center justify-end gap-4 pt-6 border-t ${
                            theme === "dark" ? "border-gray-700" : "border-slate-200"
                        }`}
                    >
                        <Button
                            variant="outline"
                            onClick={() => setIsLeaveModalOpen(false)}
                            className={`rounded-xl px-6 ${
                                theme === "dark" ? "bg-gray-800 border-gray-700 text-slate-200" : ""
                            }`}
                        >
                            Close
                        </Button>
                        <Button
                            className={`rounded-xl px-6 text-white ${
                                theme === "dark" ? "bg-gray-700 hover:bg-gray-600" : ""
                            }`}
                            style={{ backgroundColor: theme === "dark" ? "#374151" : "#3f3d56" }}
                            onClick={handleEditLeave}
                            disabled={selectedLeave.leaveState !== "Requested"}
                        >
                            Edit Request
                        </Button>
                    </div>
                </div>
            </Card>
            {/* Edit Leave Modal */}
            <EditLeaveRequestModal
                open={isEditModalOpen}
                onOpenChange={setIsEditModalOpen}
                leaveRequest={selectedLeave}
                onSuccess={handleEditSuccess}
            />
        </div>
    );
}
