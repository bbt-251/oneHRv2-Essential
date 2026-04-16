import { AttendanceModel } from "@/lib/models/attendance";
import { getTimestamp, monthNames } from "@/lib/util/dayjs_format";
import dayjs from "dayjs";
import {
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    query,
    setDoc,
    updateDoc,
    where,
    writeBatch,
} from "firebase/firestore";
import { attendanceCollection } from "../../firebase/collections";
import { db } from "../../firebase/init";
import { createLog } from "../logCollection";
import { LogInfo } from "@/lib/log-descriptions/attendance";

const collectionRef = attendanceCollection;
const collectionName = collectionRef.id;

// Helper function to get days in a month
const daysInMonth = (month: number, year: number): number => {
    return new Date(year, month + 1, 0).getDate();
};

export async function createAttendance(
    data: Omit<AttendanceModel, "id">,
    actionBy: string,
    logInfo?: LogInfo,
): Promise<AttendanceModel | null> {
    try {
        const docRef = doc(collectionRef);
        await setDoc(docRef, {
            ...data,
            id: docRef.id,
        });
        // Log the creation if logInfo is provided
        if (logInfo) {
            await createLog(logInfo, actionBy, "Success");
        }
        return await getAttendanceById(docRef.id);
    } catch (error) {
        console.error("Error creating attendance:", error);
        // Log the failure if logInfo is provided
        if (logInfo) {
            await createLog(
                {
                    ...logInfo,
                    title: `${logInfo.title} Failed`,
                    description: `Failed to ${logInfo.description.toLowerCase()}`,
                },
                actionBy,
                "Failure",
            );
        }
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
                uid: uid,
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

            // Stage/state determination
            if (currentMonth > index) {
                att.stage = "Closed";
            } else if (currentMonth === index) {
                att.stage = "Open";
                att.state = "In Progress";
            } else {
                att.state = "Draft";
                att.stage = "Incoming";
            }

            // Generate daily attendance
            const daysInAMonth: number = daysInMonth(index, currentYear);
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

        // Batch write
        const batch = writeBatch(db);
        const createdRecords: AttendanceModel[] = [];

        attendanceDataList.forEach(attendance => {
            const docRef = doc(collectionRef);
            const attendanceWithId = { ...attendance, id: docRef.id };
            batch.set(docRef, attendanceWithId);
            createdRecords.push(attendanceWithId as AttendanceModel);
        });

        await batch.commit();

        // Log the generation if logInfo is provided
        if (logInfo) {
            await createLog(logInfo, actionBy, "Success");
        }

        return { success: true, records: createdRecords };
    } catch (error) {
        console.error("Error generating attendance:", error);
        // Log the failure if logInfo is provided
        if (logInfo) {
            await createLog(
                {
                    ...logInfo,
                    title: `${logInfo.title} Failed`,
                    description: `Failed to ${logInfo.description.toLowerCase()}`,
                },
                actionBy,
                "Failure",
            );
        }
        return { success: false };
    }
}

export async function getAttendanceByEmployee(uid: string): Promise<AttendanceModel[]> {
    const q = query(collectionRef, where("uid", "==", uid));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as AttendanceModel);
}

export async function getAttendanceByMonthAndYear(
    month: string,
    year: number,
): Promise<AttendanceModel[]> {
    const q = query(collectionRef, where("month", "==", month), where("year", "==", year));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as AttendanceModel);
}

export async function getAttendanceByEmployeeAndPeriod(
    uid: string,
    month: string,
    year: number,
): Promise<AttendanceModel | null> {
    const q = query(
        collectionRef,
        where("uid", "==", uid),
        where("month", "==", month),
        where("year", "==", year),
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() } as AttendanceModel;
    }
    return null;
}

export async function getAttendanceById(id: string): Promise<AttendanceModel | null> {
    const docRef = doc(db, collectionName, id);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
        return { id: snapshot.id, ...snapshot.data() } as AttendanceModel;
    }
    return null;
}

export async function updateAttendance(
    data: Partial<AttendanceModel> & { id: string },
    actionBy: string,
    logInfo?: LogInfo,
): Promise<boolean> {
    const docRef = doc(db, collectionName, data.id);
    try {
        await updateDoc(docRef, data as any);
        // Log the update if logInfo is provided
        if (logInfo) {
            await createLog(logInfo, actionBy, "Success");
        }
        return true;
    } catch (err) {
        console.error(err);
        // Log the failure if logInfo is provided
        if (logInfo) {
            await createLog(
                {
                    ...logInfo,
                    title: `${logInfo.title} Failed`,
                    description: `Failed to ${logInfo.description.toLowerCase()}`,
                },
                actionBy,
                "Failure",
            );
        }
        return false;
    }
}

export async function deleteAttendance(
    id: string,
    actionBy: string,
    logInfo?: LogInfo,
): Promise<boolean> {
    const docRef = doc(db, collectionName, id);
    try {
        await deleteDoc(docRef);
        // Log the deletion if logInfo is provided
        if (logInfo) {
            await createLog(logInfo, actionBy, "Success");
        }
        return true;
    } catch (err) {
        console.error(err);
        // Log the failure if logInfo is provided
        if (logInfo) {
            await createLog(
                {
                    ...logInfo,
                    title: `${logInfo.title} Failed`,
                    description: `Failed to ${logInfo.description.toLowerCase()}`,
                },
                actionBy,
                "Failure",
            );
        }
        return false;
    }
}

export async function getAttendanceByState(
    state: AttendanceModel["state"],
): Promise<AttendanceModel[]> {
    const q = query(collectionRef, where("state", "==", state));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as AttendanceModel);
}

export async function getAttendanceByStage(
    stage: AttendanceModel["stage"],
): Promise<AttendanceModel[]> {
    const q = query(collectionRef, where("stage", "==", stage));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as AttendanceModel);
}

export async function getAllAttendance(): Promise<AttendanceModel[]> {
    const snapshot = await getDocs(collectionRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as AttendanceModel);
}

export async function updateAttendanceState(
    id: string,
    state: AttendanceModel["state"],
    actionBy: string,
    logInfo?: LogInfo,
): Promise<boolean> {
    const docRef = doc(db, collectionName, id);
    try {
        await updateDoc(docRef, { state });
        // Log the state update if logInfo is provided
        if (logInfo) {
            await createLog(logInfo, actionBy, "Success");
        }
        return true;
    } catch (err) {
        console.error(err);
        // Log the failure if logInfo is provided
        if (logInfo) {
            await createLog(
                {
                    ...logInfo,
                    title: `${logInfo.title} Failed`,
                    description: `Failed to ${logInfo.description.toLowerCase()}`,
                },
                actionBy,
                "Failure",
            );
        }
        return false;
    }
}

export async function updateAttendanceStage(
    id: string,
    stage: AttendanceModel["stage"],
    actionBy: string,
    logInfo?: LogInfo,
): Promise<boolean> {
    const docRef = doc(db, collectionName, id);
    try {
        await updateDoc(docRef, { stage });
        // Log the stage update if logInfo is provided
        if (logInfo) {
            await createLog(logInfo, actionBy, "Success");
        }
        return true;
    } catch (err) {
        console.error(err);
        // Log the failure if logInfo is provided
        if (logInfo) {
            await createLog(
                {
                    ...logInfo,
                    title: `${logInfo.title} Failed`,
                    description: `Failed to ${logInfo.description.toLowerCase()}`,
                },
                actionBy,
                "Failure",
            );
        }
        return false;
    }
}

export async function updateLastClockInTimestamp(
    id: string,
    timestamp: string,
    actionBy: string,
    logInfo?: LogInfo,
): Promise<boolean> {
    const docRef = doc(db, collectionName, id);
    try {
        await updateDoc(docRef, { lastClockInTimestamp: timestamp });
        // Log the timestamp update if logInfo is provided
        if (logInfo) {
            await createLog(logInfo, actionBy, "Success");
        }
        return true;
    } catch (err) {
        console.error(err);
        // Log the failure if logInfo is provided
        if (logInfo) {
            await createLog(
                {
                    ...logInfo,
                    title: `${logInfo.title} Failed`,
                    description: `Failed to ${logInfo.description.toLowerCase()}`,
                },
                actionBy,
                "Failure",
            );
        }
        return false;
    }
}
