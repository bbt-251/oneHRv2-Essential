import { deleteDoc, doc, getDoc, getDocs, query, setDoc, updateDoc } from "firebase/firestore";
import { announcementManagementCollection } from "../../firebase/collections";
import { db } from "../../firebase/init";
import { AnnouncementModel } from "@/lib/models/announcement";
import { createLog } from "../logCollection";
import { LogInfo } from "@/lib/log-descriptions/announcement";

const collectionRef = announcementManagementCollection;
const collectionName = collectionRef.id;

export async function createAnnouncement(
    data: Omit<AnnouncementModel, "id">,
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
        console.log("Error creating announcement", error);
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

export async function getAnnouncementById(id: string): Promise<AnnouncementModel | null> {
    const docRef = doc(db, collectionName, id);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
        return { id: snapshot.id, ...snapshot.data() } as AnnouncementModel;
    }
    return null;
}

export async function updateAnnouncement(
    data: Partial<AnnouncementModel> & { id: string },
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

export async function deleteAnnouncement(
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

export async function getAllAnnouncements(): Promise<AnnouncementModel[]> {
    const snapshot = await getDocs(collectionRef);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as AnnouncementModel);
}
