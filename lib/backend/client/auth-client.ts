import { createAuthClient } from "better-auth/react";
import { customSessionClient } from "better-auth/client/plugins";
import { buildBackendUrl } from "@/lib/backend/config";
import type { auth } from "@/lib/backend/auth/better-auth";
import type { Role } from "@/lib/backend/core/types";

export interface AuthUserPayload {
    uid: string;
    email: string | null;
    roles: Role[];
    active?: boolean;
}

export type AuthIdentity = AuthUserPayload;
export type AuthStateUnsubscribe = () => void;
const AUTH_CHANGED_EVENT = "auth-changed";

export interface AuthSessionResponse {
    authenticated: boolean;
    user?: AuthUserPayload;
    error?: {
        code?: string;
        message?: string;
    };
}

export interface PasswordResetApiResponse {
    success?: boolean;
    message?: string;
    error?: {
        code?: string;
        message?: string;
    };
}

export const authClient = createAuthClient({
    baseURL: buildBackendUrl("/api/auth"),
    plugins: [customSessionClient<typeof auth>()],
});

const mapSessionToResponse = (
    sessionData:
        | {
              uid?: string;
              email?: string | null;
              roles?: Role[];
              active?: boolean;
          }
        | null
        | undefined,
): AuthSessionResponse => {
    if (!sessionData?.uid) {
        return { authenticated: false };
    }

    return {
        authenticated: true,
        user: {
            uid: sessionData.uid,
            email: sessionData.email ?? null,
            roles: sessionData.roles ?? [],
            active: sessionData.active,
        },
    };
};

export const loginWithBackend = async ({
    email,
    password,
}: {
    email: string;
    password: string;
}): Promise<AuthSessionResponse> => {
    console.log("[auth-client] signIn.email request", { email });
    const result = await authClient.signIn.email({
        email,
        password,
        rememberMe: true,
    });

    console.log("[auth-client] signIn.email result", {
        email,
        hasError: Boolean(result.error),
        errorCode: result.error?.code ?? null,
    });

    if (result.error) {
        return {
            authenticated: false,
            error: {
                code: result.error.code,
                message: result.error.message,
            },
        };
    }

    if (typeof window !== "undefined") {
        window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
    }

    return fetchBackendSession();
};

export const requestPasswordResetWithBackend = async ({
    email,
}: {
    email: string;
}): Promise<PasswordResetApiResponse> => {
    const result = await authClient.requestPasswordReset({
        email,
        redirectTo: `${buildBackendUrl("/reset-password")}`,
    });

    if (result.error) {
        return {
            success: false,
            error: {
                code: result.error.code,
                message: result.error.message,
            },
        };
    }

    return {
        success: true,
        message: "If an account with this email exists, a reset link has been sent.",
    };
};

export const fetchBackendSession = async (): Promise<AuthSessionResponse> => {
    console.log("[auth-client] getSession request");
    const result = await authClient.getSession({
        fetchOptions: {
            credentials: "include",
            cache: "no-store",
        },
    });

    console.log("[auth-client] getSession result", {
        hasError: Boolean(result.error),
        hasData: Boolean(result.data),
        uid: result.data?.uid ?? null,
        email: result.data?.email ?? null,
    });

    if (result.error || !result.data) {
        return { authenticated: false };
    }

    return mapSessionToResponse(result.data);
};

export const logoutFromBackend = async (): Promise<void> => {
    await authClient.signOut();

    if (typeof window !== "undefined") {
        window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
    }
};

export const subscribeToBackendAuthState = (
    callback: (identity: AuthIdentity | null) => void,
): AuthStateUnsubscribe => {
    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const syncSession = async () => {
        if (cancelled) {
            return;
        }

        try {
            const session = await fetchBackendSession();
            callback(session.authenticated ? (session.user ?? null) : null);
        } catch (error) {
            console.error("Failed to sync backend auth session", error);
            callback(null);
        }
    };

    void syncSession();
    intervalId = setInterval(() => {
        void syncSession();
    }, 30000);

    const handleAuthChanged = () => {
        void syncSession();
    };

    if (typeof window !== "undefined") {
        window.addEventListener(AUTH_CHANGED_EVENT, handleAuthChanged);
    }

    return () => {
        cancelled = true;
        if (intervalId) {
            clearInterval(intervalId);
        }
        if (typeof window !== "undefined") {
            window.removeEventListener(AUTH_CHANGED_EVENT, handleAuthChanged);
        }
    };
};
