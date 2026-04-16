import { LogModel } from "@/lib/models/log";
import { getTimestamp } from "@/lib/util/dayjs_format";
import { doc, setDoc } from "firebase/firestore";
import { logCollection } from "../firebase/collections";

/**
 * LogInfo interface for creating activity logs
 */
export interface LogInfo {
    title: string;
    description: string;
    module: string;
}

const collectionRef = logCollection;

export async function createLog(
    logInfo: LogInfo,
    actionBy: string,
    status: "Success" | "Failure",
): Promise<boolean> {
    try {
        const docRef = doc(collectionRef);
        const logData: Omit<LogModel, "id"> = {
            timestamp: getTimestamp(),
            module: logInfo.module,
            title: logInfo.title,
            description: logInfo.description,
            status,
            actionBy,
        };
        await setDoc(docRef, logData);
        return true;
    } catch (error) {
        console.log("Error creating log", error);
        return false;
    }
}
