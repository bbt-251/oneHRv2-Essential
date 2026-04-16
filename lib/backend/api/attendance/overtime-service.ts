import { getTimestamp } from "@/lib/util/dayjs_format";
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
import { overtimeRequestCollection } from "../../firebase/collections";
import { OvertimeRequestModel } from "@/lib/models/overtime-request";
import { db } from "../../firebase/init";
import { createLog } from "../logCollection";
import { OVERTIME_REQUEST_LOG_MESSAGES } from "@/lib/log-descriptions/manager-activities";

const collectionRef = overtimeRequestCollection;
const collectionName = collectionRef.id;

export async function createOvertimeRequest(
    data: Omit<OvertimeRequestModel, "id">,
    actionBy: string,
): Promise<boolean> {
    try {
        const docRef = doc(collectionRef);
        await setDoc(docRef, {
            ...data,
            id: docRef.id,
        });

        // Log the creation
        await createLog(
            OVERTIME_REQUEST_LOG_MESSAGES.CREATED({
                employeeUids: data.employeeUids,
                overtimeType: data.overtimeType,
                date: data.overtimeDate,
                requestedBy: actionBy,
            }),
            actionBy,
            "Success",
        );

        return true;
    } catch (e) {
        console.log(`Error`, e);

        // Log the failure
        await createLog(
            OVERTIME_REQUEST_LOG_MESSAGES.CREATED({
                employeeUids: data.employeeUids,
                overtimeType: data.overtimeType,
                date: data.overtimeDate,
                requestedBy: actionBy,
            }),
            actionBy,
            "Failure",
        );

        return false;
    }
}

export async function deleteOvertimeRequest(
    id: string,
    actionBy: string,
    employeeUids?: string[],
): Promise<boolean> {
    const docRef = doc(db, collectionName, id);
    try {
        await deleteDoc(docRef);

        // Log the deletion
        await createLog(
            OVERTIME_REQUEST_LOG_MESSAGES.DELETED({
                id,
                employeeUids: employeeUids || [],
                deletedBy: actionBy,
            }),
            actionBy,
            "Success",
        );

        return true;
    } catch (err) {
        console.error(err);

        // Log the failure
        await createLog(
            OVERTIME_REQUEST_LOG_MESSAGES.DELETED({
                id,
                employeeUids: employeeUids || [],
                deletedBy: actionBy,
            }),
            actionBy,
            "Failure",
        );

        return false;
    }
}

export async function updateOvertimeRequest(
    data: Partial<OvertimeRequestModel> & { id: string },
    actionBy?: string,
): Promise<boolean> {
    const docRef = doc(db, collectionName, data.id);
    try {
        await updateDoc(docRef, data as any);

        // Log manager actions specifically
        if (actionBy && data.status === "approved") {
            await createLog(
                OVERTIME_REQUEST_LOG_MESSAGES.APPROVED({
                    id: data.id,
                    employeeUids: data.employeeUids || [],
                    approvedBy: actionBy,
                    overtimeType: data.overtimeType || "Overtime",
                    hours: data.duration || 0,
                }),
                actionBy,
                "Success",
            );
        } else if (actionBy && data.status === "rejected") {
            await createLog(
                OVERTIME_REQUEST_LOG_MESSAGES.REJECTED({
                    id: data.id,
                    employeeUids: data.employeeUids || [],
                    rejectedBy: actionBy,
                    reason: data.hrComments || undefined,
                }),
                actionBy,
                "Success",
            );
        } else if (actionBy) {
            // Log general update
            await createLog(
                OVERTIME_REQUEST_LOG_MESSAGES.UPDATED({
                    id: data.id,
                    employeeUids: data.employeeUids || [],
                    updatedBy: actionBy,
                    overtimeType: data.overtimeType,
                }),
                actionBy,
                "Success",
            );
        }

        return true;
    } catch (err) {
        console.error(err);

        // Log manager action failures
        if (actionBy && data.status === "approved") {
            await createLog(
                OVERTIME_REQUEST_LOG_MESSAGES.APPROVED({
                    id: data.id,
                    employeeUids: data.employeeUids || [],
                    approvedBy: actionBy,
                    overtimeType: data.overtimeType || "Overtime",
                    hours: data.duration || 0,
                }),
                actionBy,
                "Failure",
            );
        } else if (actionBy && data.status === "rejected") {
            await createLog(
                OVERTIME_REQUEST_LOG_MESSAGES.REJECTED({
                    id: data.id,
                    employeeUids: data.employeeUids || [],
                    rejectedBy: actionBy,
                    reason: data.hrComments || undefined,
                }),
                actionBy,
                "Failure",
            );
        } else if (actionBy) {
            // Log general update failure
            await createLog(
                OVERTIME_REQUEST_LOG_MESSAGES.UPDATED({
                    id: data.id,
                    employeeUids: data.employeeUids || [],
                    updatedBy: actionBy,
                    overtimeType: data.overtimeType,
                }),
                actionBy,
                "Failure",
            );
        }

        return false;
    }
}
