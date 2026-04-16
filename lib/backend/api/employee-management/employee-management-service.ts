import {
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    arrayUnion,
    query,
    setDoc,
    updateDoc,
    where,
    writeBatch,
} from "firebase/firestore";
import {
    attendanceCollection,
    disciplinaryActionCollection,
    employeeCollection,
    employeeCompensationCollection,
    employeeDocumentCollection,
    employeeLoanCollection,
    overtimeRequestCollection,
    talentAcquisitionCollection,
    transferCollection,
} from "../../firebase/collections";
import { db } from "../../firebase/init";
import { EmployeeModel } from "@/lib/models/employee";
import { createLog } from "../logCollection";
import { LogInfo } from "@/lib/log-descriptions/employee-management";
import { deleteCompensation } from "../compensation-benefit/compensation-service";
import { deleteLoan } from "../compensation-benefit/loan-services";
import { deleteDisciplinaryAction } from "../disciplinary-actions/disciplinary-actions-service";
import { getDependentsByEmployee, deleteDependent } from "./dependent-service";
import { deleteEmployeeDocument } from "./employee-document-service";

const collectionRef = employeeCollection;
const collectionName = collectionRef.id;

export async function createEmployee(
    data: Omit<EmployeeModel, "id">,
    actionBy?: string,
    logInfo?: LogInfo,
): Promise<boolean> {
    try {
        // Save employee in Firestore
        const docRef = doc(collectionRef);
        await setDoc(docRef, {
            ...data,
            id: docRef.id,
        });

        // Log the creation if logInfo is provided
        if (logInfo) {
            await createLog(logInfo, actionBy ?? "", "Success");
        }

        return true;
    } catch (error) {
        console.log("Error", error);
        // Log the failure if logInfo is provided
        if (logInfo) {
            await createLog(
                {
                    ...logInfo,
                    title: `${logInfo.title} Failed`,
                    description: `Failed to ${logInfo.description.toLowerCase()}`,
                },
                actionBy ?? "",
                "Failure",
            );
        }
        return false;
    }
}

export async function getEmployeesByDepartment(department: string): Promise<EmployeeModel[]> {
    const q = query(collectionRef, where("department", "==", department));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as EmployeeModel);
}

export async function getEmployeeById(id: string): Promise<EmployeeModel | null> {
    const docRef = doc(db, collectionName, id);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
        return { id: snapshot.id, ...snapshot.data() } as EmployeeModel;
    }
    return null;
}

export async function getEmployeeByUid(
    uid: string,
    dbOverride?: any,
): Promise<EmployeeModel | null> {
    // Query the collection for a document where the 'uid' field matches the provided uid
    const db = dbOverride || collectionRef.firestore;
    const snapshot = await db.collection("employee").where("uid", "==", uid).get();
    if (!snapshot.empty) {
        const docSnap = snapshot.docs[0];
        return { id: docSnap.id, ...docSnap.data() } as EmployeeModel;
    }
    return null;
}

export async function getEmployeesByUid(uids: string[]): Promise<EmployeeModel[]> {
    if (!uids.length) return [];
    const q = query(collectionRef, where("uid", "in", uids));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as EmployeeModel);
    }
    return [];
}

export async function updateEmployee(
    data: Partial<EmployeeModel> & { id: string },
    actionBy?: string,
    logInfo?: LogInfo,
): Promise<boolean> {
    const docRef = doc(db, collectionName, data.id);
    try {
        // Filter out undefined values to prevent Firebase errors
        const filteredData = Object.fromEntries(
            Object.entries(data).filter(([_, value]) => value !== undefined),
        );
        await updateDoc(docRef, filteredData as any);
        // Log the update if logInfo is provided
        if (logInfo) {
            await createLog(logInfo, actionBy ?? "", "Success");
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
                actionBy ?? "",
                "Failure",
            );
        }
        return false;
    }
}

export async function deleteEmployee(
    id: string,
    actionBy?: string,
    logInfo?: LogInfo,
): Promise<boolean> {
    const docRef = doc(db, collectionName, id);
    try {
        await deleteDoc(docRef);
        // Log the deletion if logInfo is provided
        if (logInfo) {
            await createLog(logInfo, actionBy ?? "", "Success");
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
                actionBy ?? "",
                "Failure",
            );
        }
        return false;
    }
}

export async function getEmployeeByEmail(email: string): Promise<EmployeeModel | null> {
    const q = query(collectionRef, where("personalEmail", "==", email));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() } as EmployeeModel;
    }
    return null;
}

export async function getEmployeeByCompanyEmail(email: string): Promise<EmployeeModel | null> {
    const q = query(collectionRef, where("companyEmail", "==", email));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() } as EmployeeModel;
    }
    return null;
}

export async function getAllEmployees(): Promise<EmployeeModel[]> {
    const snapshot = await getDocs(collectionRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as EmployeeModel);
}

export async function getEmployeeDocumentId(uid: string): Promise<string | null> {
    try {
        const q = query(collectionRef, where("uid", "==", uid));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
            return snapshot.docs[0].id;
        }
        return null;
    } catch (err) {
        console.error("Error finding employee document by UID:", err);
        return null;
    }
}

export async function batchUpdateEmployee(
    employees: (Partial<EmployeeModel> & { id: string })[],
): Promise<boolean> {
    const batch = writeBatch(db);

    try {
        employees.forEach(data => {
            const docRef = doc(db, collectionName, data.id);
            // Filter out undefined values to prevent Firebase errors
            const filteredData = Object.fromEntries(
                Object.entries(data).filter(([_, value]) => value !== undefined),
            );
            batch.update(docRef, filteredData as any);
        });

        await batch.commit();
        return true;
    } catch (error) {
        console.error("Batch update error:", error);
        return false;
    }
}

/**
 * Add an overtime request id to each employee's `claimedOvertimes` without overwriting.
 * Uses Firestore `arrayUnion` to be safe against stale client state.
 */
export async function addClaimedOvertimeToEmployees(
    employeeDocIds: string[],
    overtimeRequestId: string,
): Promise<boolean> {
    const batch = writeBatch(db);
    try {
        employeeDocIds.filter(Boolean).forEach(employeeDocId => {
            const docRef = doc(db, collectionName, employeeDocId);
            batch.update(docRef, {
                claimedOvertimes: arrayUnion(overtimeRequestId),
            } as any);
        });

        await batch.commit();
        return true;
    } catch (error) {
        console.error("addClaimedOvertimeToEmployees error:", error);
        return false;
    }
}
