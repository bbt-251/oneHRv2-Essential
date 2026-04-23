import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RequestModificationModel } from "@/lib/models/attendance";
import { AlertCircle, Check, CheckCircle, Edit, X, XCircle } from "lucide-react";
import { AttendanceChangeRequest, ModalState } from "../page";
import { Dispatch, SetStateAction } from "react";
import getFullName from "@/lib/util/getEmployeeFullName";
import { EmployeeModel } from "@/lib/models/employee";
import { calculateTotalWorkedHours } from "@/lib/util/functions/calculateDuration";

interface Props {
    employees: EmployeeModel[];
    attendanceChangeRequests: AttendanceChangeRequest[];
    requestModifications: RequestModificationModel[];
    filteredAttendanceRequests: AttendanceChangeRequest[];
    setModalState: Dispatch<SetStateAction<ModalState>>;
}

export const ChangeRequest = ({
    employees,
    attendanceChangeRequests,
    requestModifications,
    filteredAttendanceRequests,
    setModalState,
}: Props) => {
    const getStatusBadgeChangeReq = (status: "Requested" | "Approved" | "Refused") => {
        switch (status) {
            case "Approved":
                return (
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        <span style={{ fontFamily: "Montserrat, sans-serif" }}>Approved</span>
                    </Badge>
                );
            case "Refused":
                return (
                    <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                        <XCircle className="h-3 w-3 mr-1" />
                        <span style={{ fontFamily: "Montserrat, sans-serif" }}>Refused</span>
                    </Badge>
                );
            case "Requested":
                return (
                    <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        <span style={{ fontFamily: "Montserrat, sans-serif" }}>Requested</span>
                    </Badge>
                );
            default:
                return (
                    <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">
                        <span style={{ fontFamily: "Montserrat, sans-serif" }}>Unknown</span>
                    </Badge>
                );
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case "clockIn":
                return "Clock In";
            case "clockOut":
                return "Clock Out";
            case "breakOut":
                return "Break Out";
            case "breakIn":
                return "Break In";
            default:
                return type;
        }
    };

    const handleAttendanceApprove = (
        request: AttendanceChangeRequest,
        requestData: RequestModificationModel,
    ) => {
        setModalState(prev => ({
            ...prev,
            selectedAttendanceForAction: request,
            isAttendanceApproveModalOpen: true,
            requestData,
        }));
    };

    const handleAttendanceRefuse = (
        request: AttendanceChangeRequest,
        requestData: RequestModificationModel,
    ) => {
        setModalState(prev => ({
            ...prev,
            selectedAttendanceForAction: request,
            isAttendanceRefuseModalOpen: true,
            requestData,
        }));
    };

    const handleViewAttendanceDetails = (request: AttendanceChangeRequest) => {
        setModalState(prev => ({
            ...prev,
            selectedAttendanceForDetail: request,
            isAttendanceDetailModalOpen: true,
        }));
    };

    return (
        <>
            {filteredAttendanceRequests.length > 0 ? (
                <div className="space-y-4">
                    {filteredAttendanceRequests.map(request => (
                        <Card
                            key={request.id}
                            className="border cursor-pointer hover:shadow-md transition-shadow duration-200"
                            onClick={e => {
                                if ((e.target as HTMLElement).closest("button")) return;
                                handleViewAttendanceDetails(request);
                            }}
                        >
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3
                                            className="font-semibold text-[#3f3d56] dark:text-white text-lg"
                                            style={{
                                                fontFamily: "Montserrat, sans-serif",
                                            }}
                                        >
                                            Attendance Change Request #{request.requestId ?? ""}
                                        </h3>
                                        <p
                                            className="text-sm text-[#3f3d56] dark:text-white opacity-60"
                                            style={{
                                                fontFamily: "Montserrat, sans-serif",
                                            }}
                                        >
                                            Submitted on {request.timestamp}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {getStatusBadgeChangeReq(request.status)}
                                        {request.status == "Requested" && (
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    onClick={() =>
                                                        handleAttendanceApprove(
                                                            request,
                                                            requestModifications.find(
                                                                rm => rm.id == request.id,
                                                            ) as RequestModificationModel,
                                                        )
                                                    }
                                                    className="bg-green-600 hover:bg-green-700 text-white"
                                                    style={{
                                                        fontFamily: "Montserrat, sans-serif",
                                                    }}
                                                >
                                                    <Check className="h-4 w-4 mr-1" />
                                                    Approve
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() =>
                                                        handleAttendanceRefuse(
                                                            request,
                                                            requestModifications.find(
                                                                rm => rm.id == request.id,
                                                            ) as RequestModificationModel,
                                                        )
                                                    }
                                                    className="border-red-200 text-red-600 hover:bg-red-50"
                                                    style={{
                                                        fontFamily: "Montserrat, sans-serif",
                                                    }}
                                                >
                                                    <X className="h-4 w-4 mr-1" />
                                                    Reject
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                    <div>
                                        <p
                                            className="text-sm font-medium text-[#3f3d56] dark:text-white opacity-70"
                                            style={{
                                                fontFamily: "Montserrat, sans-serif",
                                            }}
                                        >
                                            Employee
                                        </p>
                                        <p
                                            className="text-[#3f3d56] dark:text-white font-medium"
                                            style={{
                                                fontFamily: "Montserrat, sans-serif",
                                            }}
                                        >
                                            {request.employeeName}
                                        </p>
                                        <p
                                            className="text-sm text-[#3f3d56] dark:text-white opacity-60"
                                            style={{
                                                fontFamily: "Montserrat, sans-serif",
                                            }}
                                        >
                                            {request.employeeDepartment}
                                        </p>
                                    </div>
                                    <div>
                                        <p
                                            className="text-sm font-medium text-[#3f3d56] dark:text-white opacity-70"
                                            style={{
                                                fontFamily: "Montserrat, sans-serif",
                                            }}
                                        >
                                            Date
                                        </p>
                                        <p
                                            className="text-[#3f3d56] dark:text-white"
                                            style={{
                                                fontFamily: "Montserrat, sans-serif",
                                            }}
                                        >
                                            {request.date}
                                        </p>
                                    </div>
                                    <div>
                                        <p
                                            className="text-sm font-medium text-[#3f3d56] dark:text-white opacity-70"
                                            style={{
                                                fontFamily: "Montserrat, sans-serif",
                                            }}
                                        >
                                            Old Worked Hours
                                        </p>
                                        <p
                                            className="text-[#3f3d56] dark:text-white"
                                            style={{
                                                fontFamily: "Montserrat, sans-serif",
                                            }}
                                        >
                                            {calculateTotalWorkedHours(request.oldValues)}
                                        </p>
                                    </div>
                                    <div>
                                        <p
                                            className="text-sm font-medium text-[#3f3d56] dark:text-white opacity-70"
                                            style={{
                                                fontFamily: "Montserrat, sans-serif",
                                            }}
                                        >
                                            New Worked Hours
                                        </p>
                                        <p
                                            className="text-[#3f3d56] dark:text-white"
                                            style={{
                                                fontFamily: "Montserrat, sans-serif",
                                            }}
                                        >
                                            {calculateTotalWorkedHours(request.newValues)}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <p
                                            className="text-sm font-medium text-[#3f3d56] dark:text-white opacity-70 mb-2"
                                            style={{
                                                fontFamily: "Montserrat, sans-serif",
                                            }}
                                        >
                                            Old Values
                                        </p>
                                        <div className="bg-red-50 p-3 rounded-lg border dark:bg-red-950">
                                            {request.oldValues.length > 0 ? (
                                                <div className="space-y-2">
                                                    {request.oldValues.map((entry, index) => (
                                                        <div
                                                            key={index}
                                                            className="flex justify-between items-center"
                                                        >
                                                            <span
                                                                className="text-sm text-[#3f3d56] dark:text-white opacity-70"
                                                                style={{
                                                                    fontFamily:
                                                                        "Montserrat, sans-serif",
                                                                }}
                                                            >
                                                                {getTypeLabel(entry.type)}:
                                                            </span>
                                                            <span
                                                                className="text-sm font-medium text-[#3f3d56] dark:text-white"
                                                                style={{
                                                                    fontFamily:
                                                                        "Montserrat, sans-serif",
                                                                }}
                                                            >
                                                                {entry.hour}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p
                                                    className="text-sm text-[#3f3d56] dark:text-white opacity-60 text-center"
                                                    style={{
                                                        fontFamily: "Montserrat, sans-serif",
                                                    }}
                                                >
                                                    No entries (Absent)
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <p
                                            className="text-sm font-medium text-[#3f3d56] dark:text-white opacity-70 mb-2"
                                            style={{
                                                fontFamily: "Montserrat, sans-serif",
                                            }}
                                        >
                                            New Values
                                        </p>
                                        <div className="bg-green-50 p-3 rounded-lg border dark:bg-green-900">
                                            <div className="space-y-2">
                                                {request.newValues.map((entry, index) => (
                                                    <div
                                                        key={index}
                                                        className="flex justify-between items-center"
                                                    >
                                                        <span
                                                            className="text-sm text-[#3f3d56] dark:text-white opacity-70"
                                                            style={{
                                                                fontFamily:
                                                                    "Montserrat, sans-serif",
                                                            }}
                                                        >
                                                            {getTypeLabel(entry.type)}:
                                                        </span>
                                                        <span
                                                            className="text-sm font-medium text-[#3f3d56] dark:text-white"
                                                            style={{
                                                                fontFamily:
                                                                    "Montserrat, sans-serif",
                                                            }}
                                                        >
                                                            {entry.hour}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div>
                                        <p
                                            className="text-sm font-medium text-[#3f3d56] dark:text-white opacity-70 mb-2"
                                            style={{
                                                fontFamily: "Montserrat, sans-serif",
                                            }}
                                        >
                                            Employee Comment
                                        </p>
                                        <p
                                            className="text-sm text-[#3f3d56] dark:text-white bg-gray-50 dark:bg-black dark:border p-3 rounded-lg"
                                            style={{
                                                fontFamily: "Montserrat, sans-serif",
                                            }}
                                        >
                                            {request.comment}
                                        </p>
                                    </div>
                                    {request.hrComments && (
                                        <div>
                                            <p
                                                className="text-sm font-medium text-[#3f3d56] dark:text-white opacity-70 mb-2"
                                                style={{
                                                    fontFamily: "Montserrat, sans-serif",
                                                }}
                                            >
                                                HR Comments
                                            </p>
                                            <p
                                                className="text-sm text-[#3f3d56] dark:text-white bg-blue-50 dark:bg-black p-3 rounded-lg border border-blue-200 dark:border-gray-800"
                                                style={{
                                                    fontFamily: "Montserrat, sans-serif",
                                                }}
                                            >
                                                {request.hrComments}
                                            </p>
                                            {request.reviewedDate && (
                                                <p
                                                    className="text-xs text-[#3f3d56] dark:text-white opacity-50 mt-1"
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
                    ))}
                </div>
            ) : (
                <Card className="border-0 shadow-sm bg-white">
                    <CardContent className="p-8 text-center">
                        <Edit className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p
                            className="text-[#3f3d56] opacity-60"
                            style={{
                                fontFamily: "Montserrat, sans-serif",
                            }}
                        >
                            {attendanceChangeRequests.length === 0
                                ? "No attendance change requests to review"
                                : "No requests match the current filters"}
                        </p>
                    </CardContent>
                </Card>
            )}
        </>
    );
};
