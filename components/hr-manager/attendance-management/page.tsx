"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppData } from "@/context/app-data-context";
import { getEmployeesByUid } from "@/lib/backend/api/employee-management/employee-management-service";
import { RequestModificationModel } from "@/lib/models/attendance";
import { dateFormat, timestampFormat } from "@/lib/util/dayjs_format";
import getFullName from "@/lib/util/getEmployeeFullName";
import dayjs from "dayjs";
import { AlertCircle, DollarSign, Edit } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ChangeRequest } from "./blocks/change-request";
import { HRManagerFilter } from "./blocks/hr-filter-component";
import { HRStatsComponent } from "./blocks/hr-stats-component";
import { OvertimeRequests } from "./blocks/overtime-requests";
import { HRAttendanceApproveModal } from "./modals/change-request/approve";
import { HRAttendanceDetailModal } from "./modals/change-request/details";
import { HRAttendanceRefuseModal } from "./modals/change-request/refuse";
import { HROvertimeApproveModal } from "./modals/overtime-request/approve";
import { HROvertimeDetailModal } from "./modals/overtime-request/detail";
import { HROvertimeRefuseModal } from "./modals/overtime-request/refuse";
import { LateComersModal } from "./modals/late-comers-modal";
import { OvertimeRequestModel } from "@/lib/models/overtime-request";

export interface AttendanceChangeRequest {
    id: string;
    timestamp: string;
    requestId: string;
    date: string;
    workedHours: string;
    employeeId: string;
    employeeUid: string;
    employeeName: string;
    employeeDepartment: string;
    oldValues: Array<{ type: string; hour: string }>;
    newValues: Array<{ type: string; hour: string }>;
    status: "Requested" | "Approved" | "Refused";
    comment: string;
    reviewedDate: string | null;
    reviewedBy: string | null;
    hrComments: string | null;
}

// Filter state interface
interface FilterState {
    selectedEmployees: string[];
    selectedDepartments: string[];
    selectedStatuses: string[];
    selectedDateFrom: string;
    selectedDateTo: string;
}

// Modal state interface
export interface ModalState {
    selectedOvertimeForDetail: OvertimeRequestModel | null;
    selectedAttendanceForDetail: AttendanceChangeRequest | null;
    selectedOvertimeForAction: OvertimeRequestModel | null;
    selectedAttendanceForAction: AttendanceChangeRequest | null;
    requestData: RequestModificationModel | null;
    isOvertimeDetailModalOpen: boolean;
    isAttendanceDetailModalOpen: boolean;
    isOvertimeApproveModalOpen: boolean;
    isOvertimeRefuseModalOpen: boolean;
    isAttendanceApproveModalOpen: boolean;
    isAttendanceRefuseModalOpen: boolean;
}

export function AttendanceManagementHR() {
    const {
        requestModifications,
        overtimeRequests: overtimeRequestsData,
        loading,
        activeEmployees,
        hrSettings,
    } = useAppData();
    const overtimeTypes = hrSettings.overtimeTypes;
    const [error] = useState<string | null>(null);
    const [isLateComersModalOpen, setIsLateComersModalOpen] = useState<boolean>(false);

    // Filter states
    const [filterState, setFilterState] = useState<FilterState>({
        selectedEmployees: [],
        selectedDepartments: [],
        selectedStatuses: [],
        selectedDateFrom: "",
        selectedDateTo: "",
    });

    // Modal states
    const [modalState, setModalState] = useState<ModalState>({
        selectedOvertimeForDetail: null,
        selectedAttendanceForDetail: null,
        selectedOvertimeForAction: null,
        selectedAttendanceForAction: null,
        requestData: null,
        isOvertimeDetailModalOpen: false,
        isAttendanceDetailModalOpen: false,
        isOvertimeApproveModalOpen: false,
        isOvertimeRefuseModalOpen: false,
        isAttendanceApproveModalOpen: false,
        isAttendanceRefuseModalOpen: false,
    });

    // Request data states
    const [overtimeRequests, setOvertimeRequests] = useState<OvertimeRequestModel[]>([]);
    const [attendanceChangeRequests, setAttendanceChangeRequests] = useState<
        AttendanceChangeRequest[]
    >([]);

    // transform attendance request modification.
    useEffect(() => {
        (async () => {
            const employeeUids = requestModifications.map(rm => rm.uid).filter(Boolean);
            const employees = employeeUids.length ? await getEmployeesByUid(employeeUids) : [];

            const adoptedData = requestModifications.map(rm => {
                const employee = employees.find(e => e.uid == rm.uid);
                const changeRequest: AttendanceChangeRequest = {
                    id: rm.id,
                    timestamp: rm.timestamp,
                    date: rm.date,
                    workedHours: "",
                    employeeId: employee?.employeeID ?? "",
                    employeeUid: employee?.uid ?? "",
                    employeeName: employee ? getFullName(employee) : "",
                    employeeDepartment: "",
                    oldValues: rm.oldWorkedHours ?? [],
                    newValues: rm.workedHours ?? [],
                    status: rm.status,
                    comment: rm.comment?.text ?? "",
                    reviewedBy: rm.reviewedBy,
                    reviewedDate: rm.reviewedDate,
                    hrComments: rm.hrComments,
                    requestId: rm.requestId,
                };
                return changeRequest;
            });
            setAttendanceChangeRequests(adoptedData);
        })();
    }, [requestModifications]);

    useEffect(() => {
        setOvertimeRequests(overtimeRequestsData);
    }, [overtimeRequestsData]);

    // Event handlers for modals

    const handleCloseOvertimeDetailModal = () => {
        setModalState(prev => ({
            ...prev,
            isOvertimeDetailModalOpen: false,
            selectedOvertimeForDetail: null,
        }));
    };

    const handleCloseAttendanceDetailModal = () => {
        setModalState(prev => ({
            ...prev,
            isAttendanceDetailModalOpen: false,
            selectedAttendanceForDetail: null,
        }));
    };

    // Action modal handlers

    const handleCloseOvertimeApproveModal = () => {
        setModalState(prev => ({
            ...prev,
            isOvertimeApproveModalOpen: false,
            selectedOvertimeForAction: null,
        }));
    };

    const handleCloseOvertimeRefuseModal = () => {
        setModalState(prev => ({
            ...prev,
            isOvertimeRefuseModalOpen: false,
            selectedOvertimeForAction: null,
        }));
    };

    const handleCloseAttendanceApproveModal = () => {
        setModalState(prev => ({
            ...prev,
            isAttendanceApproveModalOpen: false,
            selectedAttendanceForAction: null,
        }));
    };

    const handleCloseAttendanceRefuseModal = () => {
        setModalState(prev => ({
            ...prev,
            isAttendanceRefuseModalOpen: false,
            selectedAttendanceForAction: null,
        }));
    };

    // Filter logic for overtime requests
    const filteredOvertimeRequests = useMemo(() => {
        const getRequestOvertimeDate = (request: OvertimeRequestModel) => {
            const parsedFormattedDate = dayjs(request.overtimeDate, dateFormat, true);
            if (parsedFormattedDate.isValid()) return parsedFormattedDate;

            const parsedLooseDate = dayjs(request.overtimeDate);
            if (parsedLooseDate.isValid()) return parsedLooseDate;

            return null;
        };

        const getSortableRequestTimestamp = (request: OvertimeRequestModel) => {
            const parsedOvertimeDate = getRequestOvertimeDate(request);
            if (parsedOvertimeDate) return parsedOvertimeDate.valueOf();

            const parsedTimestamp = dayjs(request.timestamp, timestampFormat);
            if (parsedTimestamp.isValid()) return parsedTimestamp.valueOf();

            const fallbackTimestamp = dayjs(request.timestamp);
            if (fallbackTimestamp.isValid()) return fallbackTimestamp.valueOf();

            return 0;
        };

        return overtimeRequests
            .filter(request => {
                // Only show pending requests to HR once they have passed
                // the manager review stage (or for legacy requests with no stage set).
                if (request.status === "pending" && request.approvalStage === "manager") {
                    return false;
                }
                if (
                    filterState.selectedEmployees.length > 0 &&
                    !filterState.selectedEmployees.some(e => request.employeeUids.includes(e))
                ) {
                    return false;
                }
                if (
                    filterState.selectedDepartments.length > 0 &&
                    !activeEmployees
                        .filter(e => request.employeeUids.includes(e.uid))
                        .some(emp => filterState.selectedDepartments.includes(emp.department))
                ) {
                    return false;
                }
                if (
                    filterState.selectedStatuses.length > 0 &&
                    !filterState.selectedStatuses.includes(request.status)
                ) {
                    return false;
                }
                if (
                    filterState.selectedDateFrom &&
                    (() => {
                        const overtimeDate = getRequestOvertimeDate(request);
                        return overtimeDate
                            ? overtimeDate.isBefore(dayjs(filterState.selectedDateFrom), "day")
                            : false;
                    })()
                ) {
                    return false;
                }
                if (
                    filterState.selectedDateTo &&
                    (() => {
                        const overtimeDate = getRequestOvertimeDate(request);
                        return overtimeDate
                            ? overtimeDate.isAfter(dayjs(filterState.selectedDateTo), "day")
                            : false;
                    })()
                ) {
                    return false;
                }
                return true;
            })
            .sort((a, b) => getSortableRequestTimestamp(b) - getSortableRequestTimestamp(a));
    }, [activeEmployees, overtimeRequests, filterState]);

    // Filter logic for attendance change requests
    const filteredAttendanceRequests = useMemo(() => {
        return attendanceChangeRequests.filter(request => {
            if (
                filterState.selectedEmployees.length > 0 &&
                !filterState.selectedEmployees.includes(request.employeeUid)
            ) {
                return false;
            }
            if (
                filterState.selectedDepartments.length > 0 &&
                !filterState.selectedDepartments.includes(request.employeeDepartment)
            ) {
                return false;
            }
            if (
                filterState.selectedStatuses.length > 0 &&
                !filterState.selectedStatuses.includes(request.status)
            ) {
                return false;
            }
            return true;
        });
    }, [attendanceChangeRequests, filterState]);

    const handleClearFilters = () => {
        setFilterState({
            selectedEmployees: [],
            selectedDepartments: [],
            selectedStatuses: [],
            selectedDateFrom: "",
            selectedDateTo: "",
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2
                        className="text-2xl font-bold text-[#3f3d56] dark:text-white"
                        style={{ fontFamily: "Montserrat, sans-serif" }}
                    >
                        HR Manager Dashboard
                    </h2>
                    <p
                        className="text-[#3f3d56] opacity-70 dark:text-white"
                        style={{ fontFamily: "Montserrat, sans-serif" }}
                    >
                        Review and manage overtime requests and attendance modifications
                    </p>
                </div>
                <button
                    onClick={() => setIsLateComersModalOpen(true)}
                    className="px-4 py-2 bg-[#3f3d56] text-white rounded-lg hover:bg-[#2d2a3d] transition-colors"
                    style={{ fontFamily: "Montserrat, sans-serif" }}
                >
                    Late Comers
                </button>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3f3d56] mx-auto mb-4"></div>
                        <p
                            className="text-[#3f3d56] opacity-70 dark:text-white"
                            style={{ fontFamily: "Montserrat, sans-serif" }}
                        >
                            Loading attendance data...
                        </p>
                    </div>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                        <p
                            className="text-red-800 dark:text-red-500"
                            style={{ fontFamily: "Montserrat, sans-serif" }}
                        >
                            {error}
                        </p>
                    </div>
                </div>
            )}

            {/* Content */}
            {!loading && !error && (
                <>
                    {/* Stats Cards */}
                    <HRStatsComponent
                        overtimeRequests={overtimeRequests}
                        attendanceChangeRequests={attendanceChangeRequests}
                    />

                    {/* Filter Bar */}
                    <HRManagerFilter
                        selectedEmployees={filterState.selectedEmployees}
                        selectedDepartments={filterState.selectedDepartments}
                        selectedStatuses={filterState.selectedStatuses}
                        selectedDateFrom={filterState.selectedDateFrom}
                        selectedDateTo={filterState.selectedDateTo}
                        onEmployeesChange={employees =>
                            setFilterState(prev => ({
                                ...prev,
                                selectedEmployees: employees,
                            }))
                        }
                        onDepartmentsChange={departments =>
                            setFilterState(prev => ({
                                ...prev,
                                selectedDepartments: departments,
                            }))
                        }
                        onStatusesChange={statuses =>
                            setFilterState(prev => ({
                                ...prev,
                                selectedStatuses: statuses,
                            }))
                        }
                        onDateFromChange={date =>
                            setFilterState(prev => ({
                                ...prev,
                                selectedDateFrom: date,
                            }))
                        }
                        onDateToChange={date =>
                            setFilterState(prev => ({
                                ...prev,
                                selectedDateTo: date,
                            }))
                        }
                        onClearFilters={handleClearFilters}
                        employees={activeEmployees}
                    />

                    {/* Bulk Actions */}
                    {/* <HRBulkActionsComponent
                        overtimeRequests={overtimeRequests}
                        attendanceChangeRequests={attendanceChangeRequests}
                        onBulkApprove={handleBulkApprove}
                        onBulkReject={handleBulkReject}
                    /> */}

                    {/* Export Reports */}
                    {/* <HRExportComponent
                        overtimeRequests={overtimeRequests}
                        attendanceChangeRequests={attendanceChangeRequests}
                        selectedDateFrom={filterState.selectedDateFrom}
                        selectedDateTo={filterState.selectedDateTo}
                    /> */}

                    {/* Main Content Tabs */}
                    <Tabs defaultValue="overtime" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-100 dark:bg-black rounded-lg">
                            <TabsTrigger
                                value="overtime"
                                className="text-base data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 
                 data-[state=active]:text-gray-900 dark:data-[state=active]:text-gray-100
                 text-gray-700 dark:text-gray-300"
                                style={{ fontFamily: "Montserrat, sans-serif" }}
                            >
                                <DollarSign className="h-4 w-4 mr-2" />
                                Overtime Requests ({filteredOvertimeRequests.length})
                            </TabsTrigger>

                            <TabsTrigger
                                value="attendance"
                                className="text-base data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 
                 data-[state=active]:text-gray-900 dark:data-[state=active]:text-gray-100
                 text-gray-700 dark:text-gray-300"
                                style={{ fontFamily: "Montserrat, sans-serif" }}
                            >
                                <Edit className="h-4 w-4 mr-2" />
                                Attendance Changes ({filteredAttendanceRequests.length})
                            </TabsTrigger>
                        </TabsList>

                        {/* Overtime Requests Tab */}
                        <TabsContent value="overtime" className="space-y-4">
                            <OvertimeRequests
                                overtimeRequests={overtimeRequests}
                                filteredOvertimeRequests={filteredOvertimeRequests}
                                employees={activeEmployees}
                                overtimeTypes={overtimeTypes}
                                setModalState={setModalState}
                            />
                        </TabsContent>

                        {/* Attendance Change Requests Tab */}
                        <TabsContent value="attendance" className="space-y-4">
                            <ChangeRequest
                                employees={activeEmployees}
                                attendanceChangeRequests={attendanceChangeRequests}
                                requestModifications={requestModifications}
                                filteredAttendanceRequests={filteredAttendanceRequests}
                                setModalState={setModalState}
                            />
                        </TabsContent>
                    </Tabs>

                    {/* Detail Modals */}
                    <HROvertimeDetailModal
                        isOpen={modalState.isOvertimeDetailModalOpen}
                        onClose={handleCloseOvertimeDetailModal}
                        request={modalState.selectedOvertimeForDetail}
                        overtimeTypes={overtimeTypes}
                        employees={activeEmployees}
                    />

                    <HRAttendanceDetailModal
                        isOpen={modalState.isAttendanceDetailModalOpen}
                        onClose={handleCloseAttendanceDetailModal}
                        request={modalState.selectedAttendanceForDetail}
                    />

                    {/* Action Modals */}
                    <HROvertimeApproveModal
                        isOpen={modalState.isOvertimeApproveModalOpen}
                        onClose={handleCloseOvertimeApproveModal}
                        request={modalState.selectedOvertimeForAction}
                    />

                    <HROvertimeRefuseModal
                        isOpen={modalState.isOvertimeRefuseModalOpen}
                        onClose={handleCloseOvertimeRefuseModal}
                        request={modalState.selectedOvertimeForAction}
                    />

                    <HRAttendanceApproveModal
                        isOpen={modalState.isAttendanceApproveModalOpen}
                        onClose={handleCloseAttendanceApproveModal}
                        requestData={modalState.requestData}
                        request={modalState.selectedAttendanceForAction}
                    />

                    <HRAttendanceRefuseModal
                        isOpen={modalState.isAttendanceRefuseModalOpen}
                        requestData={modalState.requestData}
                        onClose={handleCloseAttendanceRefuseModal}
                        request={modalState.selectedAttendanceForAction}
                    />

                    <LateComersModal
                        isOpen={isLateComersModalOpen}
                        onClose={() => setIsLateComersModalOpen(false)}
                    />
                </>
            )}
        </div>
    );
}
