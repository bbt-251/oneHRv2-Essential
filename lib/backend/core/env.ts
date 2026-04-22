import { getApiBaseUrl, getCurrentInstance, getServerConfig } from "@/lib/backend/config";

const serverConfig = getServerConfig();

if (!serverConfig.authJwtSecret) {
    console.warn(`[manual-backend] Missing auth JWT secret for instance: ${getCurrentInstance()}`);
}

export const manualEnv = {
    backendUrl: getApiBaseUrl(),
    jwtSecret: serverConfig.authJwtSecret,
    mongoUri: serverConfig.mongoUri,
    mongoDbName: serverConfig.mongoDbName,
    redisUrl: serverConfig.redisUrl,
    storageRoot: serverConfig.storageRoot,
    objectStorageBucket: serverConfig.objectStorageBucket,
};
