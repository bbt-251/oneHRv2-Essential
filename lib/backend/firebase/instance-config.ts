// Shared configuration for Firebase instances

export interface FirebaseInstanceConfig {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    measurementId?: string;
}

// Define enum for instance names to provide type safety and better intellisense
export enum InstanceName {
    Development = "development",
    Dev = "dev",
    Int = "int",
    Val = "val",
    CargolinkDev = "cargolinkDev",
    CargolinkInt = "cargolinkInt",
    CargolinkVal = "cargolinkVal",
    CargolinkProd = "cargolinkProd",
    Komari = "komari",
    KomariVal = "komariVal",
    KomariV2Val = "komariV2Val",
    Demo = "demo",
    Bbt = "bbt",
    Kegna = "kegna",
    Gebeya = "gebeya",
    GebeyaVal = "gebeyaVal",
    Asgb = "asgb",
    Insa = "insa",
    Lonadd = "lonadd",
    Mmcy = "mmcy",
    MigrationTest = "migrationTest",
    GlobalBank = "global-bank",
}

// Helper function to safely parse JSON from environment variables
const parseFirebaseConfig = (envVar: string | undefined): FirebaseInstanceConfig => {
    if (!envVar) {
        throw new Error("Firebase configuration environment variable is not set");
    }
    try {
        return JSON.parse(envVar) as FirebaseInstanceConfig;
    } catch (error) {
        throw new Error(`Failed to parse Firebase config from environment variable: ${error}`);
    }
};

// Environment instances mapping with both client and admin configs
export const FIREBASE_INSTANCES = {
    [InstanceName.Development]: {
        client: process.env.NEXT_PUBLIC_FIREBASE_DEVELOPMENT,
        admin: process.env.NEXT_PUBLIC_FIREBASE_ADMIN_DEVELOPMENT,
    },
    [InstanceName.Dev]: {
        client: process.env.NEXT_PUBLIC_FIREBASE_DEV,
        admin: process.env.NEXT_PUBLIC_FIREBASE_ADMIN_DEV,
    },
    [InstanceName.Int]: {
        client: process.env.NEXT_PUBLIC_FIREBASE_INT,
        admin: process.env.NEXT_PUBLIC_FIREBASE_ADMIN_INT,
    },
    [InstanceName.Val]: {
        client: process.env.NEXT_PUBLIC_FIREBASE_VALIDATION,
        admin: process.env.NEXT_PUBLIC_FIREBASE_ADMIN_VALIDATION,
    },
    [InstanceName.CargolinkDev]: {
        client: process.env.NEXT_PUBLIC_FIREBASE_CARGOLINK_DEV,
        admin: process.env.NEXT_PUBLIC_FIREBASE_ADMIN_CARGOLINK_DEV,
    },
    [InstanceName.CargolinkInt]: {
        client: process.env.NEXT_PUBLIC_FIREBASE_CARGOLINK_INT,
        admin: process.env.NEXT_PUBLIC_FIREBASE_ADMIN_CARGOLINK_INT,
    },
    [InstanceName.CargolinkVal]: {
        client: process.env.NEXT_PUBLIC_FIREBASE_CARGOLINK_VAL,
        admin: process.env.NEXT_PUBLIC_FIREBASE_ADMIN_CARGOLINK_VAL,
    },
    [InstanceName.CargolinkProd]: {
        client: process.env.NEXT_PUBLIC_FIREBASE_CARGOLINK_PROD,
        admin: process.env.NEXT_PUBLIC_FIREBASE_ADMIN_CARGOLINK_PROD,
    },
    [InstanceName.Komari]: {
        client: process.env.NEXT_PUBLIC_FIREBASE_KOMARI,
        admin: process.env.NEXT_PUBLIC_FIREBASE_ADMIN_KOMARI,
    },
    [InstanceName.KomariVal]: {
        client: process.env.NEXT_PUBLIC_FIREBASE_KOMARI_VAL,
        admin: process.env.NEXT_PUBLIC_FIREBASE_ADMIN_KOMARI_VAL,
    },
    [InstanceName.KomariV2Val]: {
        client: process.env.NEXT_PUBLIC_FIREBASE_KOMARI_VAL_V2,
        admin: process.env.NEXT_PUBLIC_FIREBASE_ADMIN_KOMARI_VAL_V2,
    },
    [InstanceName.Demo]: {
        client: process.env.NEXT_PUBLIC_FIREBASE_DEMO,
        admin: process.env.NEXT_PUBLIC_FIREBASE_ADMIN_DEMO,
    },
    [InstanceName.Bbt]: {
        client: process.env.NEXT_PUBLIC_FIREBASE_BBT,
        admin: process.env.NEXT_PUBLIC_FIREBASE_ADMIN_BBT,
    },
    [InstanceName.Kegna]: {
        client: process.env.NEXT_PUBLIC_FIREBASE_KEGNA,
        admin: process.env.NEXT_PUBLIC_FIREBASE_ADMIN_KEGNA,
    },
    [InstanceName.Gebeya]: {
        client: process.env.NEXT_PUBLIC_FIREBASE_GEBEYA,
        admin: process.env.NEXT_PUBLIC_FIREBASE_ADMIN_GEBEYA,
    },
    [InstanceName.GebeyaVal]: {
        client: process.env.NEXT_PUBLIC_FIREBASE_GEBEYA_VAL,
        admin: process.env.NEXT_PUBLIC_FIREBASE_ADMIN_GEBEYA_VAL,
    },
    [InstanceName.Asgb]: {
        client: process.env.NEXT_PUBLIC_FIREBASE_ASGB,
        admin: process.env.NEXT_PUBLIC_FIREBASE_ADMIN_ASGB,
    },
    [InstanceName.Insa]: {
        client: process.env.NEXT_PUBLIC_FIREBASE_INSA,
        admin: process.env.NEXT_PUBLIC_FIREBASE_ADMIN_INSA,
    },
    [InstanceName.Lonadd]: {
        client: process.env.NEXT_PUBLIC_FIREBASE_LONADD,
        admin: process.env.NEXT_PUBLIC_FIREBASE_ADMIN_LONADD,
    },
    [InstanceName.Mmcy]: {
        client: process.env.NEXT_PUBLIC_FIREBASE_MMCY,
        admin: process.env.NEXT_PUBLIC_FIREBASE_ADMIN_MMCY,
    },
    [InstanceName.MigrationTest]: {
        client: process.env.NEXT_PUBLIC_FIREBASE_MIGRATION_TEST,
        admin: process.env.NEXT_PUBLIC_FIREBASE_ADMIN_MIGRATION_TEST,
    },
    [InstanceName.GlobalBank]: {
        client: process.env.NEXT_PUBLIC_FIREBASE_GLOBAL_BANK,
        admin: process.env.NEXT_PUBLIC_FIREBASE_ADMIN_GLOBAL_BANK,
    },
} as const;

// Default instance name
export const DEFAULT_INSTANCE = InstanceName.Dev;

let currentInstance: InstanceName = DEFAULT_INSTANCE;

export function setCurrentInstance(instance: InstanceName): void {
    currentInstance = instance;
}

export function getCurrentInstance(): InstanceName {
    return currentInstance;
}

// Get config for the current active instance
export function getCurrentFirebaseConfig(): FirebaseInstanceConfig {
    return getFirebaseConfig(currentInstance);
}

export function getFirebaseConfig(
    instanceName: InstanceName = currentInstance,
): FirebaseInstanceConfig {
    const instance = FIREBASE_INSTANCES[instanceName];
    if (!instance || !instance.client) {
        throw new Error(`No Firebase configuration found for instance: ${instanceName}`);
    }
    return parseFirebaseConfig(instance.client);
}

// Get admin config for the current active instance
export function getCurrentAdminConfig(): FirebaseInstanceConfig {
    return getAdminConfig(currentInstance);
}

export function getAdminConfig(
    instanceName: InstanceName = currentInstance,
): FirebaseInstanceConfig {
    const instance = FIREBASE_INSTANCES[instanceName];
    if (!instance || !instance.admin) {
        throw new Error(`No admin configuration found for instance: ${instanceName}`);
    }
    return parseFirebaseConfig(instance.admin);
}

// Get config for BBT instance (special case)
export function getFirebaseConfigBBT(): FirebaseInstanceConfig {
    return getFirebaseConfig(InstanceName.Bbt);
}

// Get admin config for BBT instance
export function getAdminConfigBBT(): FirebaseInstanceConfig {
    return getAdminConfig(InstanceName.Bbt);
}

export function getEnvironment(projectId: string): string {
    return projectId.includes("komari") ? "komari" : "default";
}
