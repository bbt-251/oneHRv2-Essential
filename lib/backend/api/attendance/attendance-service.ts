import { AttendanceModel } from "@/lib/models/attendance";
import { getTimestamp, monthNames } from "@/lib/util/dayjs_format";
import dayjs from "dayjs";
import { mutateCompactData, queryCompactData } from "@/lib/backend/client/data-client";
import { createLog } from "../logCollection";
import { LogInfo } from "@/lib/log-descriptions/attendance";

const daysInMonth = (month: number, year: number): number => {
    return new Date(year, month + 1, 0).getDate();
};

const logFailure = async (logInfo: LogInfo | undefined, actionBy: string) => {
    if (!logInfo) {
        return;
    }

    await createLog(
        {
            ...logInfo,
            title: `${logInfo.title} Failed`,
            description: `Failed to ${logInfo.description.toLowerCase()}`,
        },
        actionBy,
        "Failure",
    );
};

export async function createAttendance(
    data: Omit<AttendanceModel, "id">,
    actionBy: string,
    logInfo?: LogInfo,
): Promise<AttendanceModel | null> {
    try {
        const payload = await mutateCompactData<{ attendance: AttendanceModel | null }>({
            resource: "attendances",
            action: "create",
            payload: data as Record<string, unknown>,
        });

        if (logInfo) {
            await createLog(logInfo, actionBy, "Success");
        }

        return payload.attendance;
    } catch (error) {
        console.error("Error creating attendance:", error);
        await logFailure(logInfo, actionBy);
        return null;
    }
}

export async function generateAttendanceForEmployee(
    uid: string,
    shiftType: string,
    actionBy: string,
    logInfo?: LogInfo,
): Promise<{ success: boolean; records?: AttendanceModel[] }> {
    try {
        const attendanceDataList: Omit<AttendanceModel, "id">[] = [];
        const currentYear = dayjs().year();
        const currentMonth = dayjs().month();

        monthNames.forEach((month, index) => {
            const att: Omit<AttendanceModel, "id"> = {
                generatedAt: getTimestamp(),
                uid,
                month: month as AttendanceModel["month"],
                year: currentYear,
                state: "N/A" as AttendanceModel["state"],
                stage: "N/A" as AttendanceModel["stage"],
                associatedShiftType: shiftType,
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
                att.stage = "Closed";
            } else if (currentMonth === index) {
                att.stage = "Open";
                att.state = "In Progress";
            } else {
                att.state = "Draft";
                att.stage = "Incoming";
            }

            const daysInAMonth = daysInMonth(index, currentYear);
            for (let i = 1; i <= daysInAMonth; i++) {
                att.values.push({
                    id: crypto.randomUUID(),
                    day: i,
                    value: null,
                    timestamp: "N/A",
                    from: null,
                    to: null,
                    status: "N/A",
                    dailyWorkedHours: 0,
                    workedHours: [],
                });
            }

            attendanceDataList.push(att);
        });

        const createdRecords = await Promise.all(
            attendanceDataList.map(async attendance => {
                const created = await mutateCompactData<{ attendance: AttendanceModel | null }>({
                    resource: "attendances",
                    action: "create",
                    payload: attendance as Record<string, unknown>,
                });
                return created.attendance;
            }),
        );

        if (logInfo) {
            await createLog(logInfo, actionBy, "Success");
        }

        return {
            success: true,
            records: createdRecords.filter(
                (attendance): attendance is AttendanceModel => attendance !== null,
            ),
        };
    } catch (error) {
        console.error("Error generating attendance:", error);
        await logFailure(logInfo, actionBy);
        return { success: false };
    }
}

export async function getAttendanceByEmployee(uid: string): Promise<AttendanceModel[]> {
    const payload = await queryCompactData<{ attendances: AttendanceModel[] }>({
        resource: "attendances",
        filters: { uid },
    });
    return payload.attendances;
}

export async function getAttendanceByMonthAndYear(
    month: string,
    year: number,
): Promise<AttendanceModel[]> {
    const payload = await queryCompactData<{ attendances: AttendanceModel[] }>({
        resource: "attendances",
        filters: { month, year },
    });
    return payload.attendances;
}

export async function getAttendanceByEmployeeAndPeriod(
    uid: string,
    month: string,
    year: number,
): Promise<AttendanceModel | null> {
    const payload = await queryCompactData<{ attendances: AttendanceModel[] }>({
        resource: "attendances",
        filters: { uid, month, year },
    });
    return payload.attendances[0] ?? null;
}

export async function getAttendanceById(id: string): Promise<AttendanceModel | null> {
    const payload = await queryCompactData<{ attendances: AttendanceModel[] }>({
        resource: "attendances",
        filters: { id },
    });
    return payload.attendances[0] ?? null;
}

export async function updateAttendance(
    data: Partial<AttendanceModel> & { id: string },
    actionBy: string,
    logInfo?: LogInfo,
): Promise<boolean> {
    try {
        await mutateCompactData({
            resource: "attendances",
            action: "update",
            targetId: data.id,
            payload: data as Record<string, unknown>,
        });
        if (logInfo) {
            await createLog(logInfo, actionBy, "Success");
        }
        return true;
    } catch (err) {
        console.error(err);
        await logFailure(logInfo, actionBy);
        return false;
    }
}

export async function deleteAttendance(
    id: string,
    actionBy: string,
    logInfo?: LogInfo,
): Promise<boolean> {
    try {
        await mutateCompactData({
            resource: "attendances",
            action: "delete",
            targetId: id,
        });
        if (logInfo) {
            await createLog(logInfo, actionBy, "Success");
        }
        return true;
    } catch (err) {
        console.error(err);
        await logFailure(logInfo, actionBy);
        return false;
    }
}

export async function getAttendanceByState(
    state: AttendanceModel["state"],
): Promise<AttendanceModel[]> {
    const payload = await queryCompactData<{ attendances: AttendanceModel[] }>({
        resource: "attendances",
    });
    return payload.attendances.filter(attendance => attendance.state === state);
}

export async function getAttendanceByStage(
    stage: AttendanceModel["stage"],
): Promise<AttendanceModel[]> {
    const payload = await queryCompactData<{ attendances: AttendanceModel[] }>({
        resource: "attendances",
    });
    return payload.attendances.filter(attendance => attendance.stage === stage);
}

export async function getAllAttendance(): Promise<AttendanceModel[]> {
    const payload = await queryCompactData<{ attendances: AttendanceModel[] }>({
        resource: "attendances",
    });
    return payload.attendances;
}

export async function updateAttendanceState(
    id: string,
    state: AttendanceModel["state"],
    actionBy: string,
    logInfo?: LogInfo,
): Promise<boolean> {
    try {
        await mutateCompactData({
            resource: "attendances",
            action: "update",
            targetId: id,
            payload: { state },
        });
        if (logInfo) {
            await createLog(logInfo, actionBy, "Success");
        }
        return true;
    } catch (err) {
        console.error(err);
        await logFailure(logInfo, actionBy);
        return false;
    }
}

export async function updateAttendanceStage(
    id: string,
    stage: AttendanceModel["stage"],
    actionBy: string,
    logInfo?: LogInfo,
): Promise<boolean> {
    try {
        await mutateCompactData({
            resource: "attendances",
            action: "update",
            targetId: id,
            payload: { stage },
        });
        if (logInfo) {
            await createLog(logInfo, actionBy, "Success");
        }
        return true;
    } catch (err) {
        console.error(err);
        await logFailure(logInfo, actionBy);
        return false;
    }
}

export async function updateLastClockInTimestamp(
    id: string,
    timestamp: string,
    actionBy: string,
    logInfo?: LogInfo,
): Promise<boolean> {
    try {
        await mutateCompactData({
            resource: "attendances",
            action: "update",
            targetId: id,
            payload: { lastClockInTimestamp: timestamp },
        });
        if (logInfo) {
            await createLog(logInfo, actionBy, "Success");
        }
        return true;
    } catch (err) {
        console.error(err);
        await logFailure(logInfo, actionBy);
        return false;
    }
}
