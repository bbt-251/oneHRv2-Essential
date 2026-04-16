import { manualEnv } from "@/lib/backend/manual/env";

interface ManualRedisClient {
    url: string;
}

let redisClient: ManualRedisClient | null = null;

export const getManualRedisClient = (): ManualRedisClient | null => {
    if (!manualEnv.redisUrl) {
        return null;
    }

    if (!redisClient) {
        redisClient = { url: manualEnv.redisUrl };
    }

    return redisClient;
};
