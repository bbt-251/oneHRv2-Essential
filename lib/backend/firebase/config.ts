// Firebase configuration interface
import {
    FirebaseInstanceConfig,
    getCurrentFirebaseConfig,
    getEnvironment,
    setCurrentInstance,
    getCurrentInstance,
    getFirebaseConfigBBT,
} from "./instance-config";

export type { FirebaseInstanceConfig };

// Export the instance management functions
export { setCurrentInstance, getCurrentInstance };

// Get the current active config
export const firebaseConfig = getCurrentFirebaseConfig();

// Get BBT config (special case)
export const firebaseConfigBBT = getFirebaseConfigBBT();

export const environment = getEnvironment(firebaseConfig.projectId);

// Export the default Firebase config

const errorBotProduction =
    "https://discord.com/api/webhooks/1463092821660795017/gtQ1MtdWxbqYdjuUkkBsT14Q7OWaVo_-yaTz4t1HX3FrnJmNYcGSiCV5mHAypZwo4PIX";

export const errorBotURL = firebaseConfig.projectId === "onehr-dev" ? "" : errorBotProduction;
