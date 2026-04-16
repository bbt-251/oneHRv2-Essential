import {
    addDoc,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    query,
    updateDoc,
    where,
    onSnapshot,
    orderBy,
    serverTimestamp,
} from "firebase/firestore";
import { dependentsCollection } from "../../firebase/collections";
import { DependentModel } from "@/lib/models/dependent";
import { createLog } from "../logCollection";
import { LogInfo } from "@/lib/log-descriptions/employee-management";

export async function addDependent(
    data: Omit<DependentModel, "id">,
    actionBy?: string,
    logInfo?: LogInfo,
): Promise<boolean> {
    try {
        // Generate dependentID if not provided
        const dependentID = data.dependentID || `DEP-${Date.now()}`;

        // Create the document
        const docRef = await addDoc(dependentsCollection, {
            ...data,
            dependentID,
            timestamp: serverTimestamp(),
        });

        // Log the creation if logInfo is provided
        if (logInfo) {
            await createLog(logInfo, actionBy ?? "", "Success");
        }

        return true;
    } catch (error) {
        console.error("Error adding dependent:", error);
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

export async function getDependentsByEmployee(employeeId: string): Promise<DependentModel[]> {
    try {
        const q = query(
            dependentsCollection,
            where("relatedTo", "==", employeeId),
            orderBy("timestamp", "desc"),
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as DependentModel);
    } catch (error) {
        console.error("Error getting dependents:", error);
        return [];
    }
}

export async function getDependentById(id: string): Promise<DependentModel | null> {
    try {
        const docRef = doc(dependentsCollection, id);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
            return { id: snapshot.id, ...snapshot.data() } as DependentModel;
        }
        return null;
    } catch (error) {
        console.error("Error getting dependent:", error);
        return null;
    }
}

export async function updateDependent(
    data: DependentModel,
    actionBy?: string,
    logInfo?: LogInfo,
): Promise<boolean> {
    if (!data.id) {
        console.error("Dependent ID is required for update");
        return false;
    }

    try {
        const docRef = doc(dependentsCollection, data.id);
        await updateDoc(docRef, {
            firstName: data.firstName,
            middleName: data.middleName,
            lastName: data.lastName,
            gender: data.gender,
            dateOfBirth: data.dateOfBirth,
            phoneNumber: data.phoneNumber,
            relationship: data.relationship,
            relatedTo: data.relatedTo,
        });

        // Log the update if logInfo is provided
        if (logInfo) {
            await createLog(logInfo, actionBy ?? "", "Success");
        }

        return true;
    } catch (error) {
        console.error("Error updating dependent:", error);
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

export async function deleteDependent(
    id: string,
    actionBy?: string,
    logInfo?: LogInfo,
): Promise<boolean> {
    try {
        const docRef = doc(dependentsCollection, id);
        await deleteDoc(docRef);

        // Log the deletion if logInfo is provided
        if (logInfo) {
            await createLog(logInfo, actionBy ?? "", "Success");
        }

        return true;
    } catch (error) {
        console.error("Error deleting dependent:", error);
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

/**
 * Set up real-time listener for dependents of a specific employee
 */
export function listenToDependents(
    employeeId: string,
    callback: (dependents: DependentModel[]) => void,
) {
    const q = query(
        dependentsCollection,
        where("relatedTo", "==", employeeId),
        orderBy("timestamp", "desc"),
    );

    return onSnapshot(q, snapshot => {
        const dependents = snapshot.docs.map(
            doc => ({ id: doc.id, ...doc.data() }) as DependentModel,
        );
        callback(dependents);
    });
}
