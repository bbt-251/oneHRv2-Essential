import dayjs from "dayjs";
import { ManualApiError } from "@/lib/server/shared/errors";
import { authorizeRequest } from "@/lib/server/shared/auth/authorization";
import { SessionClaims } from "@/lib/server/shared/types";
import { AttendanceModel, RequestModificationModel } from "@/lib/models/attendance";
import { AttendanceServerRepository } from "@/lib/server/attendance/attendance.repository";
import {
    AttendanceListFilters,
    AttendanceListPayload,
    AttendanceRecordPayload,
    CreateAttendanceInput,
    CreateLateComerInput,
    CreateOvertimeRequestInput,
    CreateRequestModificationInput,
    GenerateAttendanceInput,
    LateComerListPayload,
    OvertimeRequestRecordPayload,
    RequestModificationRecordPayload,
    UpdateAttendanceInput,
    UpdateOvertimeRequestInput,
    UpdateRequestModificationInput,
} from "@/lib/server/attendance/attendance.types";
import { getCurrentInstanceKey } from "@/lib/server/shared/config";
import { serviceSuccess } from "@/lib/server/shared/result";

const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
] as const;

const daysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();

export class AttendanceService {
    static async listAttendances(filters: AttendanceListFilters, session: SessionClaims | null) {
        const instanceKey = getCurrentInstanceKey();
        const authorizedSession = authorizeRequest({
            session,
            instanceKey,
            resource: "attendances",
            action: "read",
        });

        const attendances = await AttendanceServerRepository.list(
            filters,
            instanceKey,
            authorizedSession,
        );

        return serviceSuccess<AttendanceListPayload>("Attendance loaded successfully.", {
            attendances,
        });
    }

    static async getAttendanceById(id: string, session: SessionClaims | null) {
        const result = await this.listAttendances({ id }, session);
        const attendance = result.data.attendances[0] ?? null;
        if (!attendance) {
            throw new ManualApiError(404, "ATTENDANCE_NOT_FOUND", "Attendance was not found.");
        }

        return serviceSuccess<AttendanceRecordPayload>("Attendance loaded successfully.", {
            attendance,
        });
    }

    static async createAttendance(payload: CreateAttendanceInput, session: SessionClaims | null) {
        const instanceKey = getCurrentInstanceKey();
        authorizeRequest({
            session,
            instanceKey,
            resource: "attendances",
            action: "create",
            resourceOwnerUid: payload.uid,
        });

        const attendance = await AttendanceServerRepository.create(payload, instanceKey);
        return serviceSuccess<AttendanceRecordPayload>("Attendance created successfully.", {
            attendance,
        });
    }

    static async updateAttendance(payload: UpdateAttendanceInput, session: SessionClaims | null) {
        const instanceKey = getCurrentInstanceKey();
        authorizeRequest({
            session,
            instanceKey,
            resource: "attendances",
            action: "update",
            resourceOwnerUid: payload.uid,
        });

        const attendance = await AttendanceServerRepository.update(payload, instanceKey);
        if (!attendance) {
            throw new ManualApiError(
                404,
                "ATTENDANCE_NOT_FOUND",
                "Attendance could not be updated.",
            );
        }

        return serviceSuccess<AttendanceRecordPayload>("Attendance updated successfully.", {
            attendance,
        });
    }

    static async deleteAttendance(id: string, session: SessionClaims | null) {
        const instanceKey = getCurrentInstanceKey();
        const existing = await this.listAttendances({ id }, session);
        const attendance = existing.data.attendances[0] ?? null;

        authorizeRequest({
            session,
            instanceKey,
            resource: "attendances",
            action: "delete",
            resourceOwnerUid: attendance?.uid,
        });

        await AttendanceServerRepository.delete(id, instanceKey);
        return serviceSuccess("Attendance deleted successfully.", { deleted: true });
    }

    static async generateAttendanceForEmployee(
        payload: GenerateAttendanceInput,
        session: SessionClaims | null,
    ) {
        const instanceKey = getCurrentInstanceKey();
        authorizeRequest({
            session,
            instanceKey,
            resource: "attendances",
            action: "create",
            resourceOwnerUid: payload.uid,
        });

        const currentYear = dayjs().year();
        const currentMonth = dayjs().month();
        const records: AttendanceModel[] = [];

        for (const [index, month] of monthNames.entries()) {
            const attendancePayload: CreateAttendanceInput = {
                generatedAt: dayjs().toISOString(),
                uid: payload.uid,
                month,
                year: currentYear,
                state: "N/A",
                stage: "N/A",
                associatedShiftType: payload.shiftType,
                values: [],
                comments: [],
                monthlyWorkedHours: 0,
                dailyWorkingHour: 0,
                periodWorkingDays: 0,
                workedDays: 0,
                absentDays: 0,
                claimedOvertimes: [],
                lastClockInTimestamp: null,
            };

            if (currentMonth > index) {
                attendancePayload.stage = "Closed";
            } else if (currentMonth === index) {
                attendancePayload.stage = "Open";
                attendancePayload.state = "In Progress";
            } else {
                attendancePayload.state = "Draft";
                attendancePayload.stage = "Incoming";
            }

            const totalDays = daysInMonth(index, currentYear);
            for (let day = 1; day <= totalDays; day += 1) {
                attendancePayload.values.push({
                    id: crypto.randomUUID(),
                    day,
                    value: null,
                    timestamp: "N/A",
                    from: null,
                    to: null,
                    status: "N/A",
                    dailyWorkedHours: 0,
                    workedHours: [],
                });
            }

            records.push(await AttendanceServerRepository.create(attendancePayload, instanceKey));
        }

        return serviceSuccess("Attendance generated successfully.", {
            success: true,
            records,
        });
    }

    static async createOvertimeRequest(
        payload: CreateOvertimeRequestInput,
        session: SessionClaims | null,
    ) {
        const instanceKey = getCurrentInstanceKey();
        authorizeRequest({
            session,
            instanceKey,
            resource: "overtimeRequests",
            action: "create",
            resourceOwnerUid: payload.employeeUids[0],
        });

        const overtimeRequest = await AttendanceServerRepository.createOvertimeRequest(
            payload,
            instanceKey,
        );
        return serviceSuccess<OvertimeRequestRecordPayload>(
            "Overtime request created successfully.",
            { overtimeRequest },
        );
    }

    static async updateOvertimeRequest(
        payload: UpdateOvertimeRequestInput,
        session: SessionClaims | null,
    ) {
        const instanceKey = getCurrentInstanceKey();
        authorizeRequest({
            session,
            instanceKey,
            resource: "overtimeRequests",
            action: "update",
            resourceOwnerUid: payload.employeeUids?.[0],
        });

        const overtimeRequest = await AttendanceServerRepository.updateOvertimeRequest(
            payload,
            instanceKey,
        );
        if (!overtimeRequest) {
            throw new ManualApiError(
                404,
                "OVERTIME_REQUEST_NOT_FOUND",
                "Overtime request could not be updated.",
            );
        }

        return serviceSuccess<OvertimeRequestRecordPayload>(
            "Overtime request updated successfully.",
            { overtimeRequest },
        );
    }

    static async deleteOvertimeRequest(
        id: string,
        employeeUid: string | undefined,
        session: SessionClaims | null,
    ) {
        const instanceKey = getCurrentInstanceKey();
        authorizeRequest({
            session,
            instanceKey,
            resource: "overtimeRequests",
            action: "delete",
            resourceOwnerUid: employeeUid,
        });

        await AttendanceServerRepository.deleteOvertimeRequest(id, instanceKey);
        return serviceSuccess("Overtime request deleted successfully.", { deleted: true });
    }

    static async requestAttendanceModification(
        payload: CreateRequestModificationInput,
        session: SessionClaims | null,
    ) {
        const instanceKey = getCurrentInstanceKey();
        authorizeRequest({
            session,
            instanceKey,
            resource: "requestModifications",
            action: "create",
            resourceOwnerUid: payload.uid,
        });

        const requestModification = await AttendanceServerRepository.createRequestModification(
            payload,
            instanceKey,
        );
        return serviceSuccess<RequestModificationRecordPayload>(
            "Attendance modification request created successfully.",
            { requestModification },
        );
    }

    static async approveAttendanceModification(
        payload: UpdateRequestModificationInput,
        session: SessionClaims | null,
    ) {
        const instanceKey = getCurrentInstanceKey();
        authorizeRequest({
            session,
            instanceKey,
            resource: "requestModifications",
            action: "update",
            resourceOwnerUid: payload.uid,
        });

        const requestModification = await AttendanceServerRepository.updateRequestModification(
            {
                ...payload,
                status: "Approved",
            },
            instanceKey,
        );

        if (!requestModification) {
            throw new ManualApiError(
                404,
                "REQUEST_MODIFICATION_NOT_FOUND",
                "Attendance modification request could not be updated.",
            );
        }

        const attendanceResult = await this.getAttendanceById(payload.parentAttendanceID!, session);
        const attendance = attendanceResult.data.attendance;
        const updatedAttendance = this.applyAttendanceModification(attendance, requestModification);
        await AttendanceServerRepository.update(updatedAttendance, instanceKey);

        return serviceSuccess<RequestModificationRecordPayload>(
            "Attendance modification approved successfully.",
            { requestModification },
        );
    }

    static async refuseAttendanceModification(
        payload: UpdateRequestModificationInput,
        session: SessionClaims | null,
    ) {
        const instanceKey = getCurrentInstanceKey();
        authorizeRequest({
            session,
            instanceKey,
            resource: "requestModifications",
            action: "update",
            resourceOwnerUid: payload.uid,
        });

        const requestModification = await AttendanceServerRepository.updateRequestModification(
            {
                ...payload,
                status: "Refused",
            },
            instanceKey,
        );

        if (!requestModification) {
            throw new ManualApiError(
                404,
                "REQUEST_MODIFICATION_NOT_FOUND",
                "Attendance modification request could not be updated.",
            );
        }

        return serviceSuccess<RequestModificationRecordPayload>(
            "Attendance modification refused successfully.",
            { requestModification },
        );
    }

    static async listLateComers(
        filters: { month?: string; year?: number; uid?: string },
        session: SessionClaims | null,
    ) {
        const instanceKey = getCurrentInstanceKey();
        const authorizedSession = authorizeRequest({
            session,
            instanceKey,
            resource: "lateComers",
            action: "read",
        });

        const lateComers = await AttendanceServerRepository.listLateComers(
            filters,
            instanceKey,
            authorizedSession,
        );

        return serviceSuccess<LateComerListPayload>("Late comers loaded successfully.", {
            lateComers,
        });
    }

    static async createLateComer(payload: CreateLateComerInput, session: SessionClaims | null) {
        const instanceKey = getCurrentInstanceKey();
        authorizeRequest({
            session,
            instanceKey,
            resource: "lateComers",
            action: "create",
            resourceOwnerUid: payload.employeeUID,
        });

        const lateComer = await AttendanceServerRepository.createLateComer(payload, instanceKey);
        return serviceSuccess("Late comer created successfully.", { lateComer });
    }

    private static applyAttendanceModification(
        attendance: AttendanceModel,
        modification: RequestModificationModel,
    ): UpdateAttendanceInput {
        let dailyWorkedHours = 0;
        for (let index = 0; index < modification.workedHours.length - 1; index += 2) {
            const clockIn = dayjs(modification.workedHours[index].hour, "h:mm A");
            const clockOut = dayjs(modification.workedHours[index + 1].hour, "h:mm A");
            dailyWorkedHours += Math.round(clockOut.diff(clockIn, "hours", true) * 100) / 100;
        }

        const previousDailyHours = attendance.values[modification.day - 1]?.dailyWorkedHours ?? 0;
        const monthlyWorkedHours = Math.max(
            0,
            attendance.monthlyWorkedHours - previousDailyHours + dailyWorkedHours,
        );

        const values = [...attendance.values];
        values[modification.day - 1] = {
            ...values[modification.day - 1],
            value: modification.newValue,
            workedHours: modification.workedHours,
            dailyWorkedHours,
        };

        return {
            ...attendance,
            id: attendance.id,
            values,
            monthlyWorkedHours,
        };
    }
}
