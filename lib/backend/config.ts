export enum InstanceName {
    Dev = "dev",
    Int = "int",
    Val = "val",
}

interface PublicInstanceConfig {
    apiDomain: string;
    storageDomain: string;
}

interface ServerInstanceConfig {
    mongoUri: string;
    mongoDbName: string;
    authJwtSecret: string;
    redisUrl: string;
    storageRoot: string;
    objectStorageBucket: string;
}

export interface BackendInstanceConfig {
    public: PublicInstanceConfig;
    server: ServerInstanceConfig;
}

const trimTrailingSlash = (value: string): string => value.replace(/\/$/, "");

const withProtocol = (value: string): string =>
    /^https?:\/\//.test(value) ? value : `https://${value}`;

const readInstanceEnv = (baseName: string, instance: InstanceName): string => {
    const normalizedInstance = instance.toUpperCase();
    return process.env[`${baseName}_${normalizedInstance}`] ?? "";
};

const getDefaultApiDomain = (): string => {
    if (typeof window !== "undefined") {
        return window.location.origin;
    }

    return "http://localhost:3011";
};

const createPublicConfig = (instance: InstanceName): PublicInstanceConfig => {
    const apiDomain =
        readInstanceEnv("NEXT_PUBLIC_API_DOMAIN", instance) ||
        readInstanceEnv("NEXT_PUBLIC_MANUAL_BACKEND_URL", instance) ||
        getDefaultApiDomain();

    const storageDomain = readInstanceEnv("NEXT_PUBLIC_STORAGE_DOMAIN", instance) || apiDomain;

    return {
        apiDomain: trimTrailingSlash(withProtocol(apiDomain)),
        storageDomain: trimTrailingSlash(withProtocol(storageDomain)),
    };
};

const createServerConfig = (instance: InstanceName): ServerInstanceConfig => ({
    mongoUri:
        readInstanceEnv("MANUAL_MONGODB_URI", instance) || process.env.MANUAL_MONGODB_URI || "",
    mongoDbName:
        readInstanceEnv("MANUAL_MONGODB_DB", instance) || process.env.MANUAL_MONGODB_DB || instance,
    authJwtSecret:
        readInstanceEnv("MANUAL_AUTH_JWT_SECRET", instance) ||
        process.env.MANUAL_AUTH_JWT_SECRET ||
        "",
    redisUrl: readInstanceEnv("MANUAL_REDIS_URL", instance) || process.env.MANUAL_REDIS_URL || "",
    storageRoot:
        readInstanceEnv("MANUAL_STORAGE_ROOT", instance) ||
        process.env.MANUAL_STORAGE_ROOT ||
        ".manual-storage",
    objectStorageBucket:
        readInstanceEnv("MANUAL_OBJECT_STORAGE_BUCKET", instance) ||
        process.env.MANUAL_OBJECT_STORAGE_BUCKET ||
        "onehr-manual",
});

export const INSTANCES: Record<InstanceName, BackendInstanceConfig> = {
    [InstanceName.Dev]: {
        public: createPublicConfig(InstanceName.Dev),
        server: createServerConfig(InstanceName.Dev),
    },
    [InstanceName.Int]: {
        public: createPublicConfig(InstanceName.Int),
        server: createServerConfig(InstanceName.Int),
    },
    [InstanceName.Val]: {
        public: createPublicConfig(InstanceName.Val),
        server: createServerConfig(InstanceName.Val),
    },
};

export const DEFAULT_INSTANCE: InstanceName = InstanceName.Dev;

let currentInstance: InstanceName = DEFAULT_INSTANCE;

export const setCurrentInstance = (instance: InstanceName): void => {
    currentInstance = instance;
};

export const getCurrentInstance = (): InstanceName => currentInstance;

export const getInstanceConfig = (
    instance: InstanceName = getCurrentInstance(),
): BackendInstanceConfig => {
    const config = INSTANCES[instance];

    if (!config) {
        throw new Error(`No backend config found for instance: ${instance}`);
    }

    return config;
};

export const getCurrentConfig = (): BackendInstanceConfig => getInstanceConfig();

export const getPublicConfig = (
    instance: InstanceName = getCurrentInstance(),
): PublicInstanceConfig => getInstanceConfig(instance).public;

export const getServerConfig = (
    instance: InstanceName = getCurrentInstance(),
): ServerInstanceConfig => getInstanceConfig(instance).server;

export const getApiBaseUrl = (instance: InstanceName = getCurrentInstance()): string =>
    getPublicConfig(instance).apiDomain;

export const getStorageBaseUrl = (instance: InstanceName = getCurrentInstance()): string =>
    getPublicConfig(instance).storageDomain;

export const getCurrentInstanceKey = (instance: InstanceName = getCurrentInstance()): string =>
    instance;

export const buildBackendUrl = (
    path: string,
    instance: InstanceName = getCurrentInstance(),
): string => {
    if (/^https?:\/\//.test(path)) {
        return path;
    }

    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return `${getApiBaseUrl(instance)}${normalizedPath}`;
};
