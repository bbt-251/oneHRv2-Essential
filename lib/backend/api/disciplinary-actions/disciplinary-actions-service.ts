import { deleteDoc, doc, setDoc, updateDoc, where, orderBy } from "firebase/firestore";
import { disciplinaryActionCollection } from "../../firebase/collections";
import { db } from "../../firebase/init";
import { DisciplinaryActionModel } from "@/lib/models/disciplinary-action";
import { createLog } from "../logCollection";
import { LogInfo } from "@/lib/log-descriptions/disciplinary-actions";

const collectionRef = disciplinaryActionCollection;
const collectionName = collectionRef.id;

export async function createDisciplinaryAction(
    data: Omit<DisciplinaryActionModel, "id">,
    actionBy: string,
    logInfo?: LogInfo,
): Promise<boolean> {
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
        return true;
    } catch (error) {
        console.log("Error creating disciplinary action", error);
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

export async function updateDisciplinaryAction(
    data: Partial<DisciplinaryActionModel> & { id: string },
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
        console.error("Error updating disciplinary action", err);
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

export async function deleteDisciplinaryAction(
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
        console.error("Error deleting disciplinary action", err);
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
