const requiredServerVars = ["MANUAL_AUTH_JWT_SECRET", "MANUAL_BACKEND_URL"] as const;

requiredServerVars.forEach(variableName => {
    if (!process.env[variableName]) {
        console.warn(`[manual-backend] Missing environment variable: ${variableName}`);
    }
});

export const manualEnv = {
    backendUrl: process.env.MANUAL_BACKEND_URL ?? "http://localhost:3011",
    jwtSecret: process.env.MANUAL_AUTH_JWT_SECRET ?? "",
    mongoUri: process.env.MANUAL_MONGODB_URI ?? "",
    redisUrl: process.env.MANUAL_REDIS_URL ?? "",
};
