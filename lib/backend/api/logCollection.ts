import { LogModel } from "@/lib/models/log";
import { getTimestamp } from "@/lib/util/dayjs_format";
import { inMemoryStore, InMemoryRecord } from "@/lib/backend/persistence/in-memory-store";

export interface LogInfo {
    title: string;
    description: string;
    module: string;
}

export async function createLog(
    logInfo: LogInfo,
    actionBy: string,
    status: "Success" | "Failure",
): Promise<boolean> {
    try {
        const docRef = inMemoryStore.createDocument("logs", {});
        const logData: LogModel = {
            id: docRef.id,
            timestamp: getTimestamp(),
            module: logInfo.module,
            title: logInfo.title,
            description: logInfo.description,
            status,
            actionBy,
        };
        inMemoryStore.setDocument(`logs/${docRef.id}`, logData as unknown as InMemoryRecord);
        return true;
    } catch (error) {
        console.log("Error creating log", error);
        return false;
    }
}
