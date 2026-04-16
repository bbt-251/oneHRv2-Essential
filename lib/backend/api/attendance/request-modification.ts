import { doc, setDoc, updateDoc } from "firebase/firestore";
import dayjs from "dayjs";

import { requestedAttendanceModificationCollection } from "../../firebase/collections";
import { db } from "../../firebase/init";
import { AttendanceCommentModel, RequestModificationModel } from "@/lib/models/attendance";
import { getAttendanceById, updateAttendance } from "./attendance-service";

const collectionRef = requestedAttendanceModificationCollection;
const collectionName = collectionRef.id;

// add
export const requestAttendanceModification = async (data: Omit<RequestModificationModel, "id">) => {
    let result: boolean = false;

    const newData = doc(collectionRef);

    result = await setDoc(newData, { ...data, id: newData.id })
        .then(() => true)
        .catch(err => {
            console.log(err);
            return false;
        });

    return result;
};

// approve
export async function approveAttendanceModification(data: RequestModificationModel) {
    data.status = "Approved";

    let result: boolean = false;

    const docRef = doc(db, collectionName, `${data.id}`);

    result = await updateDoc(docRef, data as any)
        .then(() => true)
        .catch(err => {
            console.log(err);
            return false;
        });

    if (result) {
        const attendance = await getAttendanceById(data.parentAttendanceID);
        if (attendance) {
            let dailyWorkedHoursRM: number = 0;
            const oldMWH: number =
                attendance.monthlyWorkedHours - (attendance?.dailyWorkingHour ?? 0);

            for (let i = 0; i < data.workedHours.length - 1; i++) {
                const clockIn = dayjs(data.workedHours[i].hour, "h:mm A");
                const clockOut = dayjs(data.workedHours[i + 1].hour, "h:mm A");
                const difference: number =
                    Math.round(clockOut.diff(clockIn, "hours", true) * 100) / 100;
                dailyWorkedHoursRM += difference;
            }

            if (oldMWH >= 0) {
                attendance.monthlyWorkedHours = oldMWH + dailyWorkedHoursRM;
            }
            attendance.values[data.day - 1].value = data.newValue;
            attendance.values[data.day - 1].workedHours = data.workedHours;
            attendance.values[data.day - 1].dailyWorkedHours = dailyWorkedHoursRM;

            result = await updateAttendance(attendance)
                .then(() => true)
                .catch(err => {
                    console.log(err);
                    return false;
                });
        }
    }

    return result;
}

// refuse
export async function refuseAttendanceModification(data: RequestModificationModel) {
    data.status = "Refused";

    let result: boolean = false;

    const docRef = doc(db, collectionName, `${data.id}`);

    result = await updateDoc(docRef, data as any)
        .then(() => true)
        .catch(err => {
            console.log(err);
            return false;
        });

    return result;
}
