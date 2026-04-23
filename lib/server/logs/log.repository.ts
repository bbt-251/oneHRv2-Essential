import { LogModel } from "@/lib/models/log";
import { getTimestamp } from "@/lib/util/dayjs_format";
import { getMongoCollection } from "@/lib/server/shared/db/mongo";
import { ObjectId } from "mongodb";

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
        const logsCollection = await getMongoCollection<Record<string, unknown> & { _id: string }>(
            "logs",
        );
        const id = new ObjectId().toHexString();
        const logData: LogModel = {
            id,
            timestamp: getTimestamp(),
            module: logInfo.module,
            title: logInfo.title,
            description: logInfo.description,
            status,
            actionBy,
        };
        await logsCollection.insertOne({
            _id: id,
            ...logData,
        });
        return true;
    } catch (error) {
        console.log("Error creating log", error);
        return false;
    }
}
