"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/authContext";
import { useData } from "@/context/app-data-context";
import { useToast } from "@/context/toastContext";
import {
    AttendanceModel,
    DailyAttendance,
    RequestModificationModel,
    WorkedHoursModel,
} from "@/lib/models/attendance";
import { OvertimeRequestModel } from "@/lib/models/overtime-request";
import { AttendanceRepository } from "@/lib/repository/attendance";
import {
    dateFormat,
    formatHour,
    getTimestamp,
    timestampFormat,
    getUserTimezone,
} from "@/lib/util/dayjs_format";
import generateID from "@/lib/util/generateID";
import getFullName from "@/lib/util/getEmployeeFullName";
import { getNotificationRecipients } from "@/lib/util/notification/recipients";
import { sendNotification } from "@/lib/util/notification/send-notification";
import randomUUID from "@/lib/util/randomUUID";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { useMemo, useState } from "react";
import { AttendanceChangeForm } from "./attendance-change-form";
import { ChangeRequest } from "./attendance-modal/change-request";
import { ClaimedOvertime } from "./attendance-modal/claimed-overtime";
import { ClockInOut } from "./attendance-modal/clock-In-out";
import { EmployeeOvertimeForm } from "./employee-overtime-form";
import { OvertimeRequestTab } from "./attendance-modal/overtime-request";
import { OvertimeClaimForm } from "./overtime-claim-form";
dayjs.extend(customParseFormat);

interface AttendanceModalProps {
    day: {
        day: number;
        month: string;
        year: number;
        status: string;
        dailyAttendance: DailyAttendance;
    };
    attendance: AttendanceModel | null;
    onClose: () => void;
}

export function AttendanceModal({ day, attendance, onClose }: AttendanceModalProps) {
    const { userData } = useAuth();
    const { showToast } = useToast();
    const { requestModifications, overtimeRequests, employees, overtimeTypes } = useData();
    const [activeTab, setActiveTab] = useState<string>("clockinout");
    const [showChangeForm, setShowChangeForm] = useState<boolean>(false);
    const [showOvertimeForm, setShowOvertimeForm] = useState<boolean>(false);
    const [showOTRequestForm, setShowOTRequestForm] = useState<boolean>(false);
    const [editingOTRequest, setEditingOTRequest] = useState<OvertimeRequestModel | null>(null);

    // Get employee's stored timezone, fallback to current browser timezone
    const employeeData = employees.find(emp => emp.uid === userData?.uid);
    const userTimezone = employeeData?.timezone || getUserTimezone();
    const attendanceDate = useMemo(
        () => dayjs(`${day.month} ${day.day}, ${day.year}`, "MMMM D, YYYY"),
        [day.day, day.month, day.year],
    );
    const filteredOTs = useMemo(
        () =>
            overtimeRequests.filter(
                ot =>
                    ot.employeeUids.includes(userData?.uid ?? "") &&
                    attendanceDate.isSame(dayjs(ot.overtimeDate, dateFormat), "day") &&
                    ot.status === "approved" &&
                    !userData?.claimedOvertimes?.includes(ot.id),
            ),
        [attendanceDate, overtimeRequests, userData?.claimedOvertimes, userData?.uid],
    );
    const claimedOTs = useMemo(
        () =>
            overtimeRequests.filter(
                ot =>
                    ot.employeeUids.includes(userData?.uid ?? "") &&
                    attendanceDate.isSame(dayjs(ot.overtimeDate, dateFormat), "day") &&
                    userData?.claimedOvertimes?.includes(ot.id),
            ),
        [attendanceDate, overtimeRequests, userData?.claimedOvertimes, userData?.uid],
    );
    const employeeOTRequests = useMemo(
        () =>
            overtimeRequests.filter(
                ot =>
                    ot.employeeUids.includes(userData?.uid ?? "") &&
                    attendanceDate.isSame(dayjs(ot.overtimeDate, dateFormat), "day"),
            ),
        [attendanceDate, overtimeRequests, userData?.uid],
    );
    const filteredRMs = useMemo(
        () => requestModifications.filter(rm => rm.day == day.day),
        [day.day, requestModifications],
    );

    const handleChangeRequestSubmit = async (values: WorkedHoursModel[], comment?: string) => {
        if (attendance) {
            const newWorkedHours = JSON.parse(JSON.stringify(values));
            const length = newWorkedHours?.length ?? 0;

            if (length > 1 && length % 2 == 0) {
                let dailyWorkedHoursRM: number = 0;

                for (let i = 0; i < length - 1; i++) {
                    const clockIn = dayjs(newWorkedHours[i].timestamp);
                    const clockOut = dayjs(newWorkedHours[i + 1].timestamp);
                    const difference: number =
                        Math.round(clockOut.diff(clockIn, "hours", true) * 100) / 100;
                    if (difference >= 0) {
                        dailyWorkedHoursRM += difference;
                    } else {
                        const clockInTime = formatHour(newWorkedHours[i].timestamp, userTimezone);
                        const clockOutTime = formatHour(
                            newWorkedHours[i + 1].timestamp,
                            userTimezone,
                        );
                        showToast(
                            `Clock Out(${clockOutTime}) can't come after Clock In(${clockInTime})!`,
                            "Warning",
                            "warning",
                        );
                        return;
                    }
                }

                newWorkedHours.forEach((workedHour: WorkedHoursModel & Record<string, unknown>) => {
                    const keys: string[] = Object.keys(workedHour);
                    keys.forEach(key => {
                        if (workedHour[key] === undefined) workedHour[key] = null;
                    });
                    workedHour.id = generateID();
                    workedHour.timestamp = dayjs().format(timestampFormat);
                });

                let newVal: "P" | "H" | "A" | null = null;

                if (attendance.dailyWorkingHour != null) {
                    newVal = attendance.dailyWorkingHour / 2 >= dailyWorkedHoursRM ? "H" : "P";
                }

                const newData: Omit<RequestModificationModel, "id"> = {
                    requestId: generateID(),
                    parentAttendanceID: `${attendance.id}`,
                    uid: userData?.uid ?? "",
                    status: "Requested",
                    date: `${attendance.month} ${day.day}, ${day.year}`,
                    day: day.day,
                    oldValue: day.status,
                    workedHours: newWorkedHours,
                    oldWorkedHours: day?.dailyAttendance?.workedHours ?? [],
                    timestamp: dayjs().format(timestampFormat),
                    newValue: newVal,
                    comment: comment
                        ? {
                            id: randomUUID(),
                            commentBy: userData?.uid ?? "",
                            timestamp: getTimestamp(),
                            text: comment,
                        }
                        : null,
                    reviewedBy: null,
                    reviewedDate: null,
                    hrComments: null,
                };

                await AttendanceRepository.requestAttendanceModification(newData)
                    .then(async result => {
                        if (result.success) {
                            showToast("Change requested successfully", "Success", "success");

                            setShowChangeForm(false);

                            // send notification using the new notification system
                            const validRecipients = getNotificationRecipients(
                                employees,
                                [userData?.uid ?? ""],
                                "both", // Send to both managers and HR managers
                            );

                            if (validRecipients.length > 0) {
                                await sendNotification({
                                    users: validRecipients,
                                    channels: ["telegram", "inapp"],
                                    messageKey: "ATTENDANCE_CHANGE_REQUEST_SUBMITTED",
                                    payload: {
                                        employeeName: userData ? getFullName(userData) : "",
                                        date: newData.date,
                                    },
                                    title: "Attendance Change Request Submitted",
                                    getCustomMessage: (recipientType, payload) => {
                                        if (recipientType === "manager") {
                                            // Message for Managers
                                            return {
                                                telegram: `${payload.employeeName} submitted an attendance change request for ${payload.date}.`,
                                                inapp: `${payload.employeeName} submitted an attendance change request for ${payload.date}.`,
                                                email: {
                                                    subject: `Attendance Change Request by ${payload.employeeName}`,
                                                    body: `${payload.employeeName} submitted an attendance change request for ${payload.date}.`,
                                                },
                                            };
                                        } else if (recipientType === "hr") {
                                            // Message for HR Managers
                                            return {
                                                telegram: `Attendance change request submitted by ${payload.employeeName} for ${payload.date} is pending review.`,
                                                inapp: `Attendance change request submitted by ${payload.employeeName} for ${payload.date} is pending review.`,
                                                email: {
                                                    subject: `Attendance Change Request by ${payload.employeeName}`,
                                                    body: `Attendance change request submitted by ${payload.employeeName} for ${payload.date} is pending review.`,
                                                },
                                            };
                                        }
                                        return {};
                                    },
                                });
                            }
                        }

                        if (!result.success) {
                            showToast(
                                result.message || "Something went wrong, please try again",
                                "Error",
                                "error",
                            );
                            return;
                        }
                    })
                    .catch(() => {
                        showToast("Something went wrong, please try again", "Error", "error");
                    });
            } else if (length > 1 && length % 2 != 0) {
                showToast("Your worked hours must end by Clock Out!", "Warning", "warning");
            } else {
                showToast("At least two Worked Hours are required!", "Warning", "warning");
            }
        } else {
            showToast("No Attendance associated", "Error", "error");
        }
    };

    return (
        <Dialog
            open={true}
            onOpenChange={open => {
                if (!open) {
                    onClose();
                }
            }}
        >
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <DialogTitle
                            className="text-xl font-semibold text-[#3f3d56]"
                            style={{ fontFamily: "Montserrat, sans-serif" }}
                        >
                            Attendance Details - {day.month} {day.day}, {day.year}
                        </DialogTitle>
                    </div>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger
                            value="clockinout"
                            className="text-sm"
                            style={{ fontFamily: "Montserrat, sans-serif" }}
                        >
                            Clock-in/out
                        </TabsTrigger>
                        <TabsTrigger
                            value="requests"
                            className="text-sm"
                            style={{ fontFamily: "Montserrat, sans-serif" }}
                        >
                            Attendance Change Requests
                        </TabsTrigger>
                        <TabsTrigger
                            value="overtimerequest"
                            className="text-sm"
                            style={{ fontFamily: "Montserrat, sans-serif" }}
                        >
                            Overtime Request
                        </TabsTrigger>
                        <TabsTrigger
                            value="overtimes"
                            className="text-sm"
                            style={{ fontFamily: "Montserrat, sans-serif" }}
                        >
                            Claimed Overtimes
                        </TabsTrigger>
                    </TabsList>

                    {/* Clock-in/out Tab */}
                    <TabsContent value="clockinout" className="space-y-6 mt-6">
                        <ClockInOut
                            day={day}
                            filteredOTs={filteredOTs}
                            setShowChangeForm={setShowChangeForm}
                            setShowOvertimeForm={setShowOvertimeForm}
                        />
                    </TabsContent>

                    {/* Attendance Change Requests Tab */}
                    <TabsContent value="requests" className="space-y-4 mt-6">
                        <ChangeRequest day={day} requestModifications={filteredRMs} />
                    </TabsContent>

                    {/* Overtime Request Tab */}
                    <TabsContent value="overtimerequest" className="space-y-4 mt-6">
                        <OvertimeRequestTab
                            day={day}
                            overtimeRequests={employeeOTRequests}
                            overtimeTypes={overtimeTypes}
                            onOpenCreate={() => {
                                setEditingOTRequest(null);
                                setShowOTRequestForm(true);
                            }}
                            onOpenEdit={req => {
                                setEditingOTRequest(req);
                                setShowOTRequestForm(true);
                            }}
                        />
                    </TabsContent>

                    {/* Overtimes Tab */}
                    <TabsContent value="overtimes" className="space-y-4 mt-6">
                        <ClaimedOvertime
                            day={day}
                            overtimeTypes={overtimeTypes}
                            claimedOTs={claimedOTs}
                        />
                    </TabsContent>
                </Tabs>

                {/* Form Modals */}
                {showChangeForm && (
                    <AttendanceChangeForm
                        day={day}
                        onClose={() => setShowChangeForm(false)}
                        onSubmit={handleChangeRequestSubmit}
                    />
                )}

                {showOvertimeForm && (
                    <OvertimeClaimForm
                        day={day}
                        overtimeRequests={filteredOTs}
                        overtimeTypes={overtimeTypes}
                        onClose={() => setShowOvertimeForm(false)}
                    />
                )}

                {showOTRequestForm && (
                    <EmployeeOvertimeForm
                        day={day}
                        overtimeTypes={overtimeTypes}
                        editingRequest={editingOTRequest}
                        onClose={() => {
                            setShowOTRequestForm(false);
                            setEditingOTRequest(null);
                        }}
                        onSuccess={() => {
                            setShowOTRequestForm(false);
                            setEditingOTRequest(null);
                        }}
                    />
                )}
            </DialogContent>
        </Dialog>
    );
}
