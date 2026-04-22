// LeaveDetail.tsx

"use client";
import { useState } from "react";
import { CheckCircle, X, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAppData } from "@/context/app-data-context";
import { useTheme } from "@/components/theme-provider";
import { LeaveModel } from "@/lib/models/leave";
import { EmployeeModel } from "@/lib/models/employee";
import { useLeaveActions } from "@/lib/util/leave-request/use-leave-actions";
import {
    annualLeaveType,
    unpaidLeaveType,
} from "@/components/employee/leave-management/modals/add-leave-request-modal";

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
    const { theme } = useTheme();
    const { employees, ...hrSettings } = useAppData();
    const { sectionSettings, departmentSettings } = hrSettings;
    const leaveTypes = [...hrSettings.leaveTypes, annualLeaveType, unpaidLeaveType];

    const {
        isApproveLoading,
        isRefuseLeaveLoading,
        isAcceptRollbackLoading,
        isRefuseRollbackLoading,
        handleApproveLeave,
        handleRefuseLeaveRequest,
        handleAcceptRollbackRequest,
        handleRefuseRollbackRequest,
    } = useLeaveActions(selectedLeave, setIsLeaveDetailModalOpen);

    const [isRefuseLeaveDialogOpen, setIsRefuseLeaveDialogOpen] = useState<boolean>(false);
    const [isRefuseRollbackDialogOpen, setIsRefuseRollbackDialogOpen] = useState<boolean>(false);
    const [refuseRollbackComment, setRefuseRollbackComment] = useState<string>("");
    const [refuseLeaveComment, setRefuseLeaveComment] = useState<string>("");

    const employee = employees.find((emp: EmployeeModel) => emp.uid === selectedLeave.employeeID);
    const getSectionName = (id: string) =>
        sectionSettings.find(s => s.id === id)?.name || "Unknown";
    const getLeaveTypeName = (id: string) => leaveTypes.find(lt => lt.id === id)?.name || "Unknown";
    const getDepartmentName = (id: string) =>
        departmentSettings.find(d => d.id === id)?.name || "Unknown";

    // Dialog handlers
    const onRefuseLeave = () => {
        handleRefuseLeaveRequest(selectedLeave.id, refuseLeaveComment);
        setIsRefuseLeaveDialogOpen(false);
    };
    const onRefuseRollback = () => {
        handleRefuseRollbackRequest(selectedLeave.id, refuseRollbackComment);
        setIsRefuseRollbackDialogOpen(false);
    };

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

                    {selectedLeave?.leaveState === "Requested" && (
                        <div className="flex items-center justify-end gap-4 mb-8">
                            <Button
                                onClick={() => handleApproveLeave(selectedLeave)}
                                className="rounded-xl px-6 bg-emerald-600 hover:bg-emerald-700 text-white"
                                disabled={isApproveLoading}
                            >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                {isApproveLoading ? "Approving..." : "Approve"}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setIsRefuseLeaveDialogOpen(true)}
                                className="rounded-xl px-6 bg-rose-600 text-white border-rose-600"
                            >
                                <XCircle className="w-4 h-4 mr-2" />
                                Refuse
                            </Button>
                        </div>
                    )}

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
                                    {
                                        employees.find(
                                            (emp: EmployeeModel) =>
                                                emp.uid === selectedLeave?.standIn,
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
                                {selectedLeave.reason || ""}
                            </p>
                        </div>
                    </div>

                    {selectedLeave?.rollbackStatus && selectedLeave.rollbackStatus !== "N/A" && (
                        <>
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
                            {selectedLeave?.leaveStage === "Approved" &&
                                selectedLeave.rollbackStatus === "Requested" && (
                                <div className="flex items-center gap-3 mt-4">
                                    <Button
                                        onClick={() =>
                                            handleAcceptRollbackRequest(selectedLeave)
                                        }
                                        className={`rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white ${
                                            theme === "dark" ? "" : ""
                                        }`}
                                        disabled={isAcceptRollbackLoading}
                                    >
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        {isAcceptRollbackLoading
                                            ? "Accepting..."
                                            : "Accept Rollback"}
                                    </Button>

                                    <Button
                                        variant="outline"
                                        disabled={isRefuseRollbackLoading}
                                        onClick={() => setIsRefuseRollbackDialogOpen(true)}
                                        className={`rounded-xl border-rose-300 text-rose-600 hover:bg-rose-50 ${
                                            theme === "dark"
                                                ? "border-slate-700 text-slate-200"
                                                : ""
                                        }`}
                                    >
                                        <XCircle className="w-4 h-4 mr-2" />
                                            Refuse Rollback
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </Card>

            {/* Dialogs */}
            <Dialog open={isRefuseLeaveDialogOpen} onOpenChange={setIsRefuseLeaveDialogOpen}>
                <DialogContent
                    className={`sm:max-w-[425px] ${theme === "dark" ? "bg-slate-900 border-slate-800" : "bg-white"}`}
                >
                    <DialogHeader>
                        <DialogTitle className={theme === "dark" ? "text-white" : ""}>
                            Refuse Leave Request
                        </DialogTitle>
                        <DialogDescription className={theme === "dark" ? "text-slate-400" : ""}>
                            Are you sure you want to refuse this leave request?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <Label
                            htmlFor="refuseComment"
                            className={theme === "dark" ? "text-slate-300" : ""}
                        >
                            Reason for refusal (optional)
                        </Label>
                        <Textarea
                            id="refuseComment"
                            value={refuseLeaveComment}
                            onChange={e => setRefuseLeaveComment(e.target.value)}
                            className={
                                theme === "dark" ? "bg-slate-800 border-slate-700 text-white" : ""
                            }
                            placeholder="Enter reason for refusal..."
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsRefuseLeaveDialogOpen(false)}
                            className={theme === "dark" ? "border-slate-700 text-white" : ""}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={onRefuseLeave}
                            className="bg-rose-600 hover:bg-rose-700 text-white"
                            disabled={isRefuseLeaveLoading}
                        >
                            {isRefuseLeaveLoading ? "Refusing..." : "Confirm Refusal"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isRefuseRollbackDialogOpen} onOpenChange={setIsRefuseRollbackDialogOpen}>
                <DialogContent
                    className={`sm:max-w-[425px] ${theme === "dark" ? "bg-slate-900 border-slate-800" : "bg-white"}`}
                >
                    <DialogHeader>
                        <DialogTitle className={theme === "dark" ? "text-white" : ""}>
                            Refuse Rollback Request
                        </DialogTitle>
                        <DialogDescription className={theme === "dark" ? "text-slate-400" : ""}>
                            Are you sure you want to refuse this rollback request?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <Label
                            htmlFor="refuseRollbackComment"
                            className={theme === "dark" ? "text-slate-300" : ""}
                        >
                            Reason for refusal (optional)
                        </Label>
                        <Textarea
                            id="refuseRollbackComment"
                            value={refuseRollbackComment}
                            onChange={e => setRefuseRollbackComment(e.target.value)}
                            className={
                                theme === "dark" ? "bg-slate-800 border-slate-700 text-white" : ""
                            }
                            placeholder="Enter reason for refusal..."
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsRefuseRollbackDialogOpen(false)}
                            className={theme === "dark" ? "border-slate-700 text-white" : ""}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={onRefuseRollback}
                            className="bg-rose-600 hover:bg-rose-700 text-white"
                            disabled={isRefuseRollbackLoading}
                        >
                            {isRefuseRollbackLoading ? "Refusing..." : "Confirm Refusal"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
