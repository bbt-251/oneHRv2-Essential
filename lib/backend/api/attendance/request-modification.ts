import dayjs from "dayjs";
import { mutateCompactData } from "@/lib/backend/client/data-client";

import { RequestModificationModel } from "@/lib/models/attendance";
import { getAttendanceById, updateAttendance } from "./attendance-service";

export const requestAttendanceModification = async (data: Omit<RequestModificationModel, "id">) => {
    return mutateCompactData({
        resource: "requestModifications",
        action: "create",
        payload: data as Record<string, unknown>,
    })
        .then(() => true)
        .catch(err => {
            console.log(err);
            return false;
        });
};

export async function approveAttendanceModification(data: RequestModificationModel) {
    data.status = "Approved";

    let result = await mutateCompactData({
        resource: "requestModifications",
        action: "update",
        targetId: data.id,
        payload: data as Record<string, unknown>,
    })
        .then(() => true)
        .catch(err => {
            console.log(err);
            return false;
        });

    if (result) {
        const attendance = await getAttendanceById(data.parentAttendanceID);
        if (attendance) {
            let dailyWorkedHoursRM = 0;
            const oldMWH = attendance.monthlyWorkedHours - (attendance?.dailyWorkingHour ?? 0);

            for (let i = 0; i < data.workedHours.length - 1; i++) {
                const clockIn = dayjs(data.workedHours[i].hour, "h:mm A");
                const clockOut = dayjs(data.workedHours[i + 1].hour, "h:mm A");
                const difference = Math.round(clockOut.diff(clockIn, "hours", true) * 100) / 100;
                dailyWorkedHoursRM += difference;
            }

            if (oldMWH >= 0) {
                attendance.monthlyWorkedHours = oldMWH + dailyWorkedHoursRM;
            }
            attendance.values[data.day - 1].value = data.newValue;
            attendance.values[data.day - 1].workedHours = data.workedHours;
            attendance.values[data.day - 1].dailyWorkedHours = dailyWorkedHoursRM;

            result = await updateAttendance(attendance, "")
                .then(() => true)
                .catch(err => {
                    console.log(err);
                    return false;
                });
        }
    }

    return result;
}

export async function refuseAttendanceModification(data: RequestModificationModel) {
    data.status = "Refused";

    return mutateCompactData({
        resource: "requestModifications",
        action: "update",
        targetId: data.id,
        payload: data as Record<string, unknown>,
    })
        .then(() => true)
        .catch(err => {
            console.log(err);
            return false;
        });
}
