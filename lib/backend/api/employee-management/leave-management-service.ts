import {
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    query,
    setDoc,
    updateDoc,
    where,
} from "firebase/firestore";
import { leaveManagementCollection } from "../../firebase/collections";
import { LeaveModel } from "@/lib/models/leave";
import { db } from "../../firebase/init";
import { createLog } from "../logCollection";
import { LEAVE_REQUEST_LOG_MESSAGES } from "@/lib/log-descriptions/manager-activities";

const collectionRef = leaveManagementCollection;
const collectionName = collectionRef.id;

export async function createLeaveManagement(
    data: Omit<LeaveModel, "id">,
    actionBy?: string,
    employeeName?: string,
): Promise<LeaveModel | null> {
    try {
        const docRef = doc(collectionRef);
        await setDoc(docRef, {
            ...data,
            id: docRef.id,
        });
        // Log the creation
        await createLog(
            LEAVE_REQUEST_LOG_MESSAGES.CREATED({
                employeeName: employeeName || data.employeeID,
                leaveType: data.leaveType,
                createdBy: actionBy || "",
            }),
            actionBy ?? "",
            "Success",
        );
        return await getLeaveManagementById(docRef.id);
    } catch (error) {
        console.error("Error creating leave management:", error);
        // Log the failure
        await createLog(
            LEAVE_REQUEST_LOG_MESSAGES.CREATED({
                employeeName: employeeName || data.employeeID,
                leaveType: data.leaveType,
                createdBy: actionBy || "",
            }),
            actionBy ?? "",
            "Failure",
        );
        return null;
    }
}

export async function getLeaveManagementById(id: string): Promise<LeaveModel | null> {
    const docRef = doc(db, collectionName, id);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
        return { id: snapshot.id, ...snapshot.data() } as LeaveModel;
    }
    return null;
}
export async function updateLeaveManagement(
    data: Partial<LeaveModel> & { id: string },
    actionBy?: string,
    employeeName?: string,
): Promise<boolean> {
    const docRef = doc(db, collectionName, data.id);
    try {
        await updateDoc(docRef, data as any);

        // Log manager actions specifically
        if (actionBy && data.leaveStage === "Approved") {
            await createLog(
                LEAVE_REQUEST_LOG_MESSAGES.APPROVED({
                    id: data.id,
                    employeeName: employeeName || "Employee",
                    approvedBy: actionBy,
                    leaveType: data.leaveType || "Leave",
                }),
                actionBy,
                "Success",
            );
        } else if (actionBy && data.leaveStage === "Refused") {
            await createLog(
                LEAVE_REQUEST_LOG_MESSAGES.REJECTED({
                    id: data.id,
                    employeeName: employeeName || "Employee",
                    rejectedBy: actionBy,
                    reason: data.reason || undefined,
                }),
                actionBy,
                "Success",
            );
        } else if (actionBy && data.comments && data.comments.length > 0) {
            await createLog(
                LEAVE_REQUEST_LOG_MESSAGES.COMMENT_ADDED({
                    id: data.id,
                    employeeName: employeeName || "Employee",
                    commentBy: actionBy,
                }),
                actionBy,
                "Success",
            );
        } else if (actionBy) {
            // Log general update
            await createLog(
                LEAVE_REQUEST_LOG_MESSAGES.UPDATED({
                    id: data.id,
                    employeeName: employeeName || "Employee",
                    leaveType: data.leaveType,
                }),
                actionBy,
                "Success",
            );
        }
        return true;
    } catch (err) {
        console.error(err);

        // Log manager action failures
        if (actionBy && data.leaveStage === "Approved") {
            await createLog(
                LEAVE_REQUEST_LOG_MESSAGES.APPROVED({
                    id: data.id,
                    employeeName: employeeName || "Employee",
                    approvedBy: actionBy,
                    leaveType: data.leaveType || "Leave",
                }),
                actionBy,
                "Failure",
            );
        } else if (actionBy && data.leaveStage === "Refused") {
            await createLog(
                LEAVE_REQUEST_LOG_MESSAGES.REJECTED({
                    id: data.id,
                    employeeName: employeeName || "Employee",
                    rejectedBy: actionBy,
                    reason: data.reason || undefined,
                }),
                actionBy,
                "Failure",
            );
        } else if (actionBy) {
            // Log general update failure
            await createLog(
                LEAVE_REQUEST_LOG_MESSAGES.UPDATED({
                    id: data.id,
                    employeeName: employeeName || "Employee",
                    leaveType: data.leaveType,
                }),
                actionBy,
                "Failure",
            );
        }
        return false;
    }
}
export async function deleteLeaveManagement(
    id: string,
    actionBy?: string,
    employeeName?: string,
): Promise<boolean> {
    const docRef = doc(db, collectionName, id);
    try {
        await deleteDoc(docRef);
        // Log the deletion
        await createLog(
            LEAVE_REQUEST_LOG_MESSAGES.DELETED({
                id,
                employeeName: employeeName || "Employee",
            }),
            actionBy ?? "",
            "Success",
        );
        return true;
    } catch (err) {
        console.error(err);
        // Log the failure
        await createLog(
            LEAVE_REQUEST_LOG_MESSAGES.DELETED({
                id,
                employeeName: employeeName || "Employee",
            }),
            actionBy ?? "",
            "Failure",
        );
        return false;
    }
}
