import { AttendanceLogicModel } from "@/lib/models/attendance-logic";
import { deleteDoc, doc, setDoc, updateDoc } from "firebase/firestore";
import { attendanceLogicCollection } from "../../firebase/collections";
import { db } from "../../firebase/init";
import { createLog } from "../logCollection";
import { ATTENDANCE_LOGIC_LOG_MESSAGES } from "@/lib/log-descriptions/attendance-management";

const collectionRef = attendanceLogicCollection;
const collectionName = collectionRef.id;

export async function createAttendanceLogic(
    data: Omit<AttendanceLogicModel, "id">,
    actionBy?: string,
): Promise<boolean> {
    try {
        // Save employee in Firestore
        const docRef = doc(collectionRef);
        await setDoc(docRef, {
            ...data,
            id: docRef.id,
        });

        // Log the creation if actionBy is provided
        if (actionBy) {
            await createLog(
                ATTENDANCE_LOGIC_LOG_MESSAGES.CREATED({
                    chosenLogic: data.chosenLogic,
                    halfPresentThreshold: data.halfPresentThreshold,
                    presentThreshold: data.presentThreshold,
                }),
                actionBy,
                "Success",
            );
        }

        return true;
    } catch (error) {
        console.log("Error", error);

        // Log the failure if actionBy is provided
        if (actionBy) {
            const createdLog = ATTENDANCE_LOGIC_LOG_MESSAGES.CREATED({
                chosenLogic: data.chosenLogic,
                halfPresentThreshold: data.halfPresentThreshold,
                presentThreshold: data.presentThreshold,
            });
            await createLog(
                {
                    ...createdLog,
                    title: `${createdLog.title} Failed`,
                    description: `Failed to ${createdLog.description.toLowerCase()}`,
                },
                actionBy,
                "Failure",
            );
        }

        return false;
    }
}

export async function updateAttendanceLogic(
    data: Partial<AttendanceLogicModel> & { id: string },
    actionBy?: string,
): Promise<boolean> {
    const docRef = doc(db, collectionName, data.id);
    try {
        await updateDoc(docRef, data as any);

        // Log the update if actionBy is provided
        if (actionBy) {
            await createLog(
                ATTENDANCE_LOGIC_LOG_MESSAGES.UPDATED({
                    id: data.id,
                    chosenLogic: data.chosenLogic,
                    halfPresentThreshold: data.halfPresentThreshold,
                    presentThreshold: data.presentThreshold,
                }),
                actionBy,
                "Success",
            );
        }

        return true;
    } catch (err) {
        console.error(err);

        // Log the failure if actionBy is provided
        if (actionBy) {
            const updatedLog = ATTENDANCE_LOGIC_LOG_MESSAGES.UPDATED({
                id: data.id,
                chosenLogic: data.chosenLogic,
                halfPresentThreshold: data.halfPresentThreshold,
                presentThreshold: data.presentThreshold,
            });
            await createLog(
                {
                    ...updatedLog,
                    title: `${updatedLog.title} Failed`,
                    description: `Failed to ${updatedLog.description.toLowerCase()}`,
                },
                actionBy,
                "Failure",
            );
        }

        return false;
    }
}

export async function deleteAttendanceLogic(id: string): Promise<boolean> {
    const docRef = doc(db, collectionName, id);
    try {
        await deleteDoc(docRef);
        return true;
    } catch (err) {
        console.error(err);
        return false;
    }
}
