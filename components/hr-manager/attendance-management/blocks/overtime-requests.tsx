import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { calculateDuration } from "@/lib/backend/functions/calculateDuration";
import { EmployeeModel } from "@/lib/models/employee";
import getFullName from "@/lib/util/getEmployeeFullName";
import {
    getOvertimeManagerDisplayName,
    getPrimaryOvertimeEmployee,
    calculateOvertimeCost,
} from "@/lib/util/overtime-request-display";
import {
    AlertCircle,
    Check,
    CheckCircle,
    DollarSign,
    X,
    XCircle,
    MoreHorizontal,
    MoreVertical,
    Trash2,
    Undo2,
} from "lucide-react";
import { Dispatch, SetStateAction, useState } from "react";
import { ModalState } from "../page";
import { OvertimeConfigurationModel } from "@/lib/backend/firebase/hrSettingsService";
import EmployeesListModal from "@/components/common/modals/employees-list-modal";
import { OvertimeRequestModel } from "@/lib/models/overtime-request";
import { useAuth } from "@/context/authContext";
import { useToast } from "@/context/toastContext";
import {
    deleteOvertimeRequest,
    updateOvertimeRequest,
} from "@/lib/backend/api/attendance/overtime-service";
import { batchUpdateEmployee } from "@/lib/backend/api/employee-management/employee-management-service";

interface Props {
    overtimeRequests: OvertimeRequestModel[];
    filteredOvertimeRequests: OvertimeRequestModel[];
    employees: EmployeeModel[];
    overtimeTypes: OvertimeConfigurationModel[];
    setModalState: Dispatch<SetStateAction<ModalState>>;
}

export const OvertimeRequests = ({
    overtimeRequests,
    filteredOvertimeRequests,
    employees,
    overtimeTypes,
    setModalState,
}: Props) => {
    const { userData } = useAuth();
    const { showToast } = useToast();
    const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
    const [confirmAction, setConfirmAction] = useState<{
        type: "delete" | "rollback";
        request: OvertimeRequestModel | null;
    }>({ type: "delete", request: null });

    const handleOvertimeApprove = (request: OvertimeRequestModel) => {
        setModalState(prev => ({
            ...prev,
            selectedOvertimeForAction: request,
            isOvertimeApproveModalOpen: true,
        }));
    };

    const handleOvertimeRefuse = (request: OvertimeRequestModel) => {
        setModalState(prev => ({
            ...prev,
            selectedOvertimeForAction: request,
            isOvertimeRefuseModalOpen: true,
        }));
    };

    const handleViewOvertimeDetails = (request: OvertimeRequestModel) => {
        setModalState(prev => ({
            ...prev,
            selectedOvertimeForDetail: request,
            isOvertimeDetailModalOpen: true,
        }));
    };

    const [isEmployeesModalOpen, setIsEmployeesModalOpen] = useState(false);
    const [employeesModalRequest, setEmployeesModalRequest] = useState<OvertimeRequestModel | null>(
        null,
    );

    const canHRDelete = (request: OvertimeRequestModel) =>
        request.status === "pending" && request.approvalStage === "hr";

    const canHRRollback = (request: OvertimeRequestModel) =>
        request.status === "approved" && request.approvalStage === "completed";

    const canHRApprove = (request: OvertimeRequestModel) =>
        request.status === "pending" && request.approvalStage !== "manager";

    const canHRReject = (request: OvertimeRequestModel) =>
        request.status === "pending" && request.approvalStage !== "manager";

    const removeClaimedOvertimeFromEmployees = async (request: OvertimeRequestModel) => {
        const targetEmployees = employees.filter(employee =>
            request.employeeUids.includes(employee.uid),
        );

        const updates = targetEmployees
            .filter(employee => Boolean(employee.id))
            .map(employee => ({
                id: employee.id as string,
                claimedOvertimes: (employee.claimedOvertimes ?? []).filter(
                    otId => otId !== request.id,
                ),
            }));

        if (updates.length === 0) return true;
        return batchUpdateEmployee(updates);
    };

    const handleHRDelete = async (request: OvertimeRequestModel) => {
        if (!userData?.uid) {
            showToast(
                "User is not authenticated, refresh and please try again",
                "User Authentication",
                "warning",
            );
            return;
        }
        setActionLoadingId(request.id);
        const res = await deleteOvertimeRequest(request.id, userData.uid, request.employeeUids);

        if (!res) {
            showToast("Failed to delete overtime request. Please try again.", "Error", "error");
        } else {
            showToast("Overtime request deleted successfully.", "Success", "success");
        }
        setActionLoadingId(null);
    };

    const handleHRRollback = async (request: OvertimeRequestModel) => {
        if (!userData?.uid) {
            showToast(
                "User is not authenticated, refresh and please try again",
                "User Authentication",
                "warning",
            );
            return;
        }
        setActionLoadingId(request.id);
        const res = await updateOvertimeRequest(
            {
                id: request.id,
                status: "pending",
                approvalStage: "hr",
                reviewedBy: null,
                reviewedDate: null,
                hrComments: null,
            },
            userData.uid,
        );

        if (res) {
            const syncResult = await removeClaimedOvertimeFromEmployees(request);
            if (!syncResult) {
                showToast(
                    "Request rolled back, but OT claim sync failed. Please retry.",
                    "Sync Warning",
                    "warning",
                );
            } else {
                showToast(
                    "Overtime request rolled back to HR pending review.",
                    "Success",
                    "success",
                );
            }
        } else {
            showToast("Failed to rollback overtime request. Please try again.", "Error", "error");
        }
        setActionLoadingId(null);
    };

    const handleConfirmAction = async () => {
        if (!confirmAction.request) return;
        const request = confirmAction.request;
        const actionType = confirmAction.type;
        setConfirmAction(prev => ({ ...prev, request: null }));
        if (actionType === "delete") {
            await handleHRDelete(request);
            return;
        }
        await handleHRRollback(request);
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "approved":
                return (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        <span style={{ fontFamily: "Montserrat, sans-serif" }}>Approved</span>
                    </Badge>
                );
            case "rejected":
                return (
                    <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                        <XCircle className="h-3 w-3 mr-1" />
                        <span style={{ fontFamily: "Montserrat, sans-serif" }}>Rejected</span>
                    </Badge>
                );
            case "pending":
                return (
                    <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        <span style={{ fontFamily: "Montserrat, sans-serif" }}>Pending</span>
                    </Badge>
                );
            default:
                return (
                    <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                        <span style={{ fontFamily: "Montserrat, sans-serif" }}>Unknown</span>
                    </Badge>
                );
        }
    };

    const getStageBadge = (request: OvertimeRequestModel) => {
        const stage = request.approvalStage ?? "hr";
        if (stage === "manager") {
            return (
                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    <span style={{ fontFamily: "Montserrat, sans-serif" }}>Manager Review</span>
                </Badge>
            );
        }
        if (stage === "hr") {
            return (
                <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                    <span style={{ fontFamily: "Montserrat, sans-serif" }}>HR Review</span>
                </Badge>
            );
        }
        return (
            <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                <span style={{ fontFamily: "Montserrat, sans-serif" }}>Completed</span>
            </Badge>
        );
    };

    return (
        <>
            <EmployeesListModal
                open={isEmployeesModalOpen}
                onOpenChange={open => {
                    if (!open) {
                        setIsEmployeesModalOpen(false);
                        setEmployeesModalRequest(null);
                    } else {
                        setIsEmployeesModalOpen(true);
                    }
                }}
                employees={employees}
                employeeUids={employeesModalRequest?.employeeUids ?? []}
                title="Employee"
            />
            {filteredOvertimeRequests.length > 0 ? (
                <div className="space-y-4">
                    {filteredOvertimeRequests.map(request => {
                        const type = overtimeTypes.find(ot => ot.id == request.overtimeType);
                        const employee = getPrimaryOvertimeEmployee(request, employees);
                        return (
                            <Card
                                key={request.id}
                                className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-black cursor-pointer hover:shadow-md transition-shadow duration-200"
                                onClick={e => {
                                    if ((e.target as HTMLElement).closest("button")) return;
                                    handleViewOvertimeDetails(request);
                                }}
                            >
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h3
                                                className="font-semibold text-[#3f3d56] dark:text-gray-100 text-lg"
                                                style={{
                                                    fontFamily: "Montserrat, sans-serif",
                                                }}
                                            >
                                                {request.overtimeId}
                                            </h3>
                                            <p
                                                className="text-sm text-[#3f3d56] dark:text-gray-400 opacity-60"
                                                style={{
                                                    fontFamily: "Montserrat, sans-serif",
                                                }}
                                            >
                                                Submitted on {request.timestamp}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {getStatusBadge(request.status)}
                                            {getStageBadge(request)}
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={e => e.stopPropagation()}
                                                        className="h-8 w-8 p-0"
                                                    >
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent
                                                    align="end"
                                                    onClick={e => e.stopPropagation()}
                                                >
                                                    <DropdownMenuItem
                                                        disabled={!canHRApprove(request)}
                                                        onClick={e => {
                                                            e.stopPropagation();
                                                            handleOvertimeApprove(request);
                                                        }}
                                                        className="cursor-pointer hover:bg-gray-100 focus:bg-gray-100 dark:hover:bg-gray-800 dark:focus:bg-gray-800 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50"
                                                    >
                                                        <Check className="h-4 w-4 mr-2 text-green-600" />
                                                        Approve
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        disabled={!canHRReject(request)}
                                                        onClick={e => {
                                                            e.stopPropagation();
                                                            handleOvertimeRefuse(request);
                                                        }}
                                                        className="cursor-pointer hover:bg-gray-100 focus:bg-gray-100 dark:hover:bg-gray-800 dark:focus:bg-gray-800 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50"
                                                    >
                                                        <X className="h-4 w-4 mr-2 text-red-600" />
                                                        Reject
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        disabled={
                                                            !canHRRollback(request) ||
                                                            actionLoadingId === request.id
                                                        }
                                                        onClick={e => {
                                                            e.stopPropagation();
                                                            setConfirmAction({
                                                                type: "rollback",
                                                                request,
                                                            });
                                                        }}
                                                        className="cursor-pointer hover:bg-gray-100 focus:bg-gray-100 dark:hover:bg-gray-800 dark:focus:bg-gray-800 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50"
                                                    >
                                                        <Undo2 className="h-4 w-4 mr-2" />
                                                        Rollback
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        disabled={
                                                            !canHRDelete(request) ||
                                                            actionLoadingId === request.id
                                                        }
                                                        onClick={e => {
                                                            e.stopPropagation();
                                                            setConfirmAction({
                                                                type: "delete",
                                                                request,
                                                            });
                                                        }}
                                                        className="text-red-600 cursor-pointer hover:bg-red-50 focus:bg-red-50 dark:hover:bg-red-900/30 dark:focus:bg-red-900/30 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50"
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                        <div>
                                            <div className="flex items-center gap-1">
                                                <p
                                                    className="text-sm font-medium text-[#3f3d56] dark:text-gray-300 opacity-70"
                                                    style={{
                                                        fontFamily: "Montserrat, sans-serif",
                                                    }}
                                                >
                                                    Employee
                                                </p>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 shrink-0"
                                                    aria-label="View all employees on this request"
                                                    onClick={e => {
                                                        e.stopPropagation();
                                                        setEmployeesModalRequest(request);
                                                        setIsEmployeesModalOpen(true);
                                                    }}
                                                >
                                                    <MoreHorizontal className="h-5 w-5" />
                                                </Button>
                                            </div>
                                            <p
                                                className="text-[#3f3d56] dark:text-gray-100"
                                                style={{
                                                    fontFamily: "Montserrat, sans-serif",
                                                }}
                                            >
                                                {employee ? getFullName(employee) : "—"}
                                            </p>
                                        </div>
                                        <div>
                                            <p
                                                className="text-sm font-medium text-[#3f3d56] dark:text-gray-300 opacity-70"
                                                style={{
                                                    fontFamily: "Montserrat, sans-serif",
                                                }}
                                            >
                                                Manager
                                            </p>
                                            <p
                                                className="text-[#3f3d56] dark:text-gray-100"
                                                style={{
                                                    fontFamily: "Montserrat, sans-serif",
                                                }}
                                            >
                                                {getOvertimeManagerDisplayName(request, employees)}
                                            </p>
                                        </div>
                                        <div>
                                            <p
                                                className="text-sm font-medium text-[#3f3d56] dark:text-gray-300 opacity-70"
                                                style={{
                                                    fontFamily: "Montserrat, sans-serif",
                                                }}
                                            >
                                                Date & Duration
                                            </p>
                                            <p
                                                className="text-[#3f3d56] dark:text-gray-100"
                                                style={{
                                                    fontFamily: "Montserrat, sans-serif",
                                                }}
                                            >
                                                {request.overtimeDate}
                                            </p>
                                            <p
                                                className="text-sm text-[#3f3d56] dark:text-gray-400 opacity-60"
                                                style={{
                                                    fontFamily: "Montserrat, sans-serif",
                                                }}
                                            >
                                                {calculateDuration(
                                                    request.overtimeStartTime,
                                                    request.overtimeEndTime,
                                                )}
                                            </p>
                                        </div>
                                        <div>
                                            <p
                                                className="text-sm font-medium text-[#3f3d56] dark:text-gray-300 opacity-70"
                                                style={{
                                                    fontFamily: "Montserrat, sans-serif",
                                                }}
                                            >
                                                Type & Time
                                            </p>
                                            <p
                                                className="text-[#3f3d56] dark:text-gray-100"
                                                style={{
                                                    fontFamily: "Montserrat, sans-serif",
                                                }}
                                            >
                                                {overtimeTypes.find(
                                                    ot => ot.id == request.overtimeType,
                                                )?.overtimeType ?? ""}
                                            </p>
                                            <p
                                                className="text-sm text-[#3f3d56] dark:text-gray-400 opacity-60"
                                                style={{
                                                    fontFamily: "Montserrat, sans-serif",
                                                }}
                                            >
                                                {request.overtimeStartTime} -{" "}
                                                {request.overtimeEndTime}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div>
                                            <p
                                                className="text-sm font-medium text-[#3f3d56] dark:text-gray-300 opacity-70 mb-2"
                                                style={{
                                                    fontFamily: "Montserrat, sans-serif",
                                                }}
                                            >
                                                Overtime Cost
                                            </p>
                                            <p
                                                className="text-sm text-[#3f3d56] dark:text-gray-200 bg-gray-50 dark:bg-black dark:border p-3 rounded-lg"
                                                style={{
                                                    fontFamily: "Montserrat, sans-serif",
                                                }}
                                            >
                                                {calculateOvertimeCost(
                                                    request.duration,
                                                    overtimeTypes.find(
                                                        ot => ot.id == request.overtimeType,
                                                    )?.overtimeRate ?? 0,
                                                    employee?.hourlyWage ?? 0,
                                                ).toFixed(2)}
                                            </p>
                                        </div>
                                        <div>
                                            <p
                                                className="text-sm font-medium text-[#3f3d56] dark:text-gray-300 opacity-70 mb-2"
                                                style={{
                                                    fontFamily: "Montserrat, sans-serif",
                                                }}
                                            >
                                                Overtime Goal
                                            </p>
                                            <p
                                                className="text-sm text-[#3f3d56] dark:text-gray-200 bg-gray-50 dark:bg-black dark:border p-3 rounded-lg"
                                                style={{
                                                    fontFamily: "Montserrat, sans-serif",
                                                }}
                                            >
                                                {request.overtimeGoal}
                                            </p>
                                        </div>
                                        <div>
                                            <p
                                                className="text-sm font-medium text-[#3f3d56] dark:text-gray-300 opacity-70 mb-2"
                                                style={{
                                                    fontFamily: "Montserrat, sans-serif",
                                                }}
                                            >
                                                Justification
                                            </p>
                                            <p
                                                className="text-sm text-[#3f3d56] dark:text-gray-200 bg-gray-50 dark:bg-black dark:border p-3 rounded-lg"
                                                style={{
                                                    fontFamily: "Montserrat, sans-serif",
                                                }}
                                            >
                                                {request.overtimeJustification}
                                            </p>
                                        </div>
                                        {request.hrComments && (
                                            <div>
                                                <p
                                                    className="text-sm font-medium text-[#3f3d56] dark:text-gray-300 opacity-70 mb-2"
                                                    style={{
                                                        fontFamily: "Montserrat, sans-serif",
                                                    }}
                                                >
                                                    HR Comments
                                                </p>
                                                <p
                                                    className="text-sm text-[#3f3d56] dark:text-gray-200 bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg border border-blue-200 dark:border-blue-700"
                                                    style={{
                                                        fontFamily: "Montserrat, sans-serif",
                                                    }}
                                                >
                                                    {request.hrComments}
                                                </p>
                                                {request.reviewedDate && (
                                                    <p
                                                        className="text-xs text-[#3f3d56] dark:text-gray-400 opacity-50 mt-1"
                                                        style={{
                                                            fontFamily: "Montserrat, sans-serif",
                                                        }}
                                                    >
                                                        Reviewed on {request.reviewedDate} by{" "}
                                                        {getFullName(
                                                            employees.find(
                                                                e => e.uid == request.reviewedBy,
                                                            ) ?? ({} as EmployeeModel),
                                                        )}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            ) : (
                <Card className="border-0 shadow-sm bg-white dark:bg-black">
                    <CardContent className="p-8 text-center">
                        <DollarSign className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
                        <p
                            className="text-[#3f3d56] dark:text-gray-400 opacity-60"
                            style={{ fontFamily: "Montserrat, sans-serif" }}
                        >
                            {overtimeRequests.length === 0
                                ? "No overtime requests to review"
                                : "No requests match the current filters"}
                        </p>
                    </CardContent>
                </Card>
            )}
            <AlertDialog
                open={!!confirmAction.request}
                onOpenChange={open => {
                    if (!open) {
                        setConfirmAction(prev => ({ ...prev, request: null }));
                    }
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {confirmAction.type === "delete"
                                ? "Delete Overtime Request"
                                : "Rollback Overtime Request"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {confirmAction.type === "delete"
                                ? "Delete this overtime request? This action cannot be undone."
                                : "Rollback this overtime request to HR pending review?"}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel
                            disabled={
                                !!confirmAction.request &&
                                actionLoadingId === confirmAction.request.id
                            }
                        >
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmAction}
                            disabled={
                                !!confirmAction.request &&
                                actionLoadingId === confirmAction.request.id
                            }
                            className={
                                confirmAction.type === "delete" ? "bg-red-600 hover:bg-red-700" : ""
                            }
                        >
                            {confirmAction.type === "delete" ? "Delete" : "Rollback"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};
