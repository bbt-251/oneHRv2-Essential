import { TrainingCertificationModel } from "@/lib/models/training-certificate";
import { deleteDoc, doc, setDoc, updateDoc } from "firebase/firestore";
import { TrainingMaterialCertificationCollection } from "../../firebase/collections";
import { db } from "../../firebase/init";
import { createLog } from "../logCollection";
import { LogInfo } from "@/lib/log-descriptions/learning";

const collectionRef = TrainingMaterialCertificationCollection;
const collectionName = collectionRef.id;

export async function createTrainingCertificate(
    data: Omit<TrainingCertificationModel, "id">,
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
        console.log("Error", error);
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

export async function updateTrainingCertificate(
    data: Partial<TrainingCertificationModel> & { id: string },
    actionBy: string,
    logInfo?: LogInfo,
): Promise<boolean> {
    try {
        const docRef = doc(db, collectionName, data.id);
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

export async function deleteTrainingCertificate(
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
