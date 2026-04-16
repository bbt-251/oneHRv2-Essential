import { deleteDoc, doc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase/init";
import { trainingPathCollection } from "../../firebase/collections";
import { TrainingPathModel } from "@/lib/models/training-path";
import { createLog } from "../logCollection";
import { LogInfo } from "@/lib/log-descriptions/learning";

const collectionRef = trainingPathCollection;
const collectionName = collectionRef.id;

export async function createTrainingPath(
    data: Omit<TrainingPathModel, "id">,
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

export async function updateTrainingPath(
    data: Partial<TrainingPathModel> & { id: string },
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

export async function deleteTrainingPath(
    id: string,
    actionBy: string,
    logInfo?: LogInfo,
): Promise<boolean> {
    try {
        const docRef = doc(db, collectionName, id);
        await deleteDoc(docRef);

        // Log the deletion if logInfo is provided
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
