import { ManualApiError } from "@/lib/backend/core/errors";

interface LoginAttemptState {
    attempts: number;
    firstAttemptAt: number;
    lockedUntil: number;
}

const loginAttemptStateByKey = new Map<string, LoginAttemptState>();

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

const now = (): number => Date.now();

const getState = (key: string): LoginAttemptState => {
    const currentState = loginAttemptStateByKey.get(key);
    if (!currentState) {
        const initialState: LoginAttemptState = {
            attempts: 0,
            firstAttemptAt: now(),
            lockedUntil: 0,
        };
        loginAttemptStateByKey.set(key, initialState);
        return initialState;
    }

    if (now() - currentState.firstAttemptAt > WINDOW_MS) {
        const resetState: LoginAttemptState = {
            attempts: 0,
            firstAttemptAt: now(),
            lockedUntil: 0,
        };
        loginAttemptStateByKey.set(key, resetState);
        return resetState;
    }

    return currentState;
};

export const assertLoginNotLocked = (key: string): void => {
    const state = getState(key);

    if (state.lockedUntil > now()) {
        throw new ManualApiError(
            429,
            "AUTH_LOCKED",
            "Too many failed login attempts. Try again later.",
            {
                lockedUntil: new Date(state.lockedUntil).toISOString(),
            },
        );
    }
};

export const registerLoginFailure = (key: string): void => {
    const state = getState(key);
    state.attempts += 1;

    if (state.attempts >= MAX_ATTEMPTS) {
        state.lockedUntil = now() + LOCKOUT_MS;
    }

    loginAttemptStateByKey.set(key, state);
};

export const resetLoginFailures = (key: string): void => {
    loginAttemptStateByKey.delete(key);
};
