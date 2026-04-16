import * as admin from "firebase-admin";
import {
    FirebaseInstanceConfig,
    getCurrentAdminConfig,
    getCurrentInstance,
    getFirebaseConfigBBT,
    setCurrentInstance,
} from "./instance-config";

export type { FirebaseInstanceConfig };

export { getCurrentInstance, setCurrentInstance };

export const parseServiceAccount = (envVar: string | undefined): FirebaseInstanceConfig => {
    if (!envVar) {
        throw new Error("Service account environment variable is not set");
    }
    try {
        return JSON.parse(envVar) as FirebaseInstanceConfig;
    } catch (error) {
        throw new Error(`Failed to parse service account from environment variable: ${error}`);
    }
};

// Get the current active config
const adminConfig = getCurrentAdminConfig();
// Get BBT config (special case)
export const serviceAccountConfigBBT = getFirebaseConfigBBT();

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(adminConfig),
    });
}

export { admin };
