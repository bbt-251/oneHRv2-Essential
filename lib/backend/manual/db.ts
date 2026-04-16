import { manualEnv } from "@/lib/backend/manual/env";

interface ManualDatabaseConnection {
    uri: string;
}

let connectionPromise: Promise<ManualDatabaseConnection> | null = null;

export const connectManualDatabase = async (): Promise<ManualDatabaseConnection | null> => {
    if (!manualEnv.mongoUri) {
        return null;
    }

    if (!connectionPromise) {
        connectionPromise = Promise.resolve({
            uri: manualEnv.mongoUri,
        });
    }

    return connectionPromise;
};
