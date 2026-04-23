import { createAuthClient } from "better-auth/react";
import { customSessionClient } from "better-auth/client/plugins";
import { buildBackendUrl } from "@/lib/shared/config";
import type { auth } from "@/lib/server/auth/better-auth";
import type { Role } from "@/lib/server/shared/types";

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

export class AuthRepository {
    static authClient = authClient;

    static async login({
        email,
        password,
    }: {
        email: string;
        password: string;
    }): Promise<AuthSessionResponse> {
        const result = await authClient.signIn.email({
            email,
            password,
            rememberMe: true,
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

        return this.fetchSession();
    }

    static async requestPasswordReset({
        email,
    }: {
        email: string;
    }): Promise<PasswordResetApiResponse> {
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
    }

    static async fetchSession(): Promise<AuthSessionResponse> {
        const result = await authClient.getSession({
            fetchOptions: {
                credentials: "include",
                cache: "no-store",
            },
        });

        if (result.error || !result.data) {
            return { authenticated: false };
        }

        return mapSessionToResponse(result.data);
    }

    static async logout(): Promise<void> {
        await authClient.signOut();

        if (typeof window !== "undefined") {
            window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
        }
    }

    static subscribe(callback: (identity: AuthIdentity | null) => void): AuthStateUnsubscribe {
        let cancelled = false;
        let intervalId: ReturnType<typeof setInterval> | null = null;

        const syncSession = async () => {
            if (cancelled) {
                return;
            }

            try {
                const session = await this.fetchSession();
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
    }

    static async confirmPassword(password: string): Promise<boolean> {
        const session = await this.fetchSession();
        const email = session.user?.email;
        if (!session.authenticated || !email) {
            return false;
        }

        const result = await this.login({ email, password });
        return result.authenticated && Boolean(result.user?.uid);
    }
}
