// This file runs only on the server side
// It's automatically executed by Next.js when the server starts
import { EventEmitter } from "events";

// Raise listener limit for Firebase real-time listeners
// This only runs on the server, so it's safe to use Node.js built-ins
EventEmitter.defaultMaxListeners = 100;

export async function register() {
    // This function is required by Next.js instrumentation hook
    // The EventEmitter configuration above runs when this module loads
}
