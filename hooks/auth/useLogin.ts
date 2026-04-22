import { useState } from "react";
import { loginWithBackend } from "@/lib/backend/client/auth-client";

interface LoginProps {
    email: string;
    password: string;
}

interface LoginResponse {
    success: boolean;
    user?: {
        uid: string;
        email: string;
        displayName?: string;
    };
    error?: string;
    errorCode?: string;
}

interface LoginHook {
    login: (props: LoginProps) => Promise<LoginResponse>;
    isLoading: boolean;
    error: string | null;
}

export const useLogin = (): LoginHook => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const login = async ({ email, password }: LoginProps): Promise<LoginResponse> => {
        console.log("[auth][login] starting login request", { email });
        setIsLoading(true);
        setError(null);

        try {
            const data = await loginWithBackend({ email, password });
            console.log("[auth][login] backend login response", {
                email,
                authenticated: data.authenticated,
                hasUser: Boolean(data.user),
                errorCode: data.error?.code ?? null,
            });

            if (!data.authenticated || !data.user) {
                const manualErrorCode = data.error?.code || "auth/unknown";
                throw new Error(manualErrorCode);
            }

            if (typeof window !== "undefined") {
                window.dispatchEvent(new Event("auth-changed"));
            }

            console.log("[auth][login] login succeeded", {
                uid: data.user.uid,
                email: data.user.email || "",
            });
            return {
                success: true,
                user: {
                    uid: data.user.uid,
                    email: data.user.email || "",
                },
            };
        } catch (err) {
            let errorMessage = "Login failed. Please try again.";
            let errorCode = "unknown";

            if (err instanceof Error) {
                switch (err.message) {
                    case "INVALID_CREDENTIALS":
                    case "auth/invalid-credential":
                    case "auth/wrong-password":
                    case "auth/user-not-found":
                        errorMessage = "Login failed. Please check your credentials.";
                        errorCode = "auth/invalid-credential";
                        break;
                    case "TENANT_MISMATCH":
                        errorMessage = "Your account is not available for this environment.";
                        errorCode = "auth/tenant-mismatch";
                        break;
                    case "auth/invalid-email":
                        errorMessage = "Invalid email address.";
                        errorCode = "auth/invalid-email";
                        break;
                    case "auth/user-disabled":
                        errorMessage = "This account has been disabled.";
                        errorCode = "auth/user-disabled";
                        break;
                    case "TOO_MANY_ATTEMPTS":
                    case "auth/too-many-requests":
                        errorMessage = "Too many attempts. Try again later.";
                        errorCode = "auth/too-many-requests";
                        break;
                    case "auth/network-request-failed":
                        errorMessage = "Network error. Please check your connection.";
                        errorCode = "auth/network-request-failed";
                        break;
                    default:
                        errorMessage = "Login failed. Please check your credentials.";
                        errorCode = "auth/unknown";
                }
            }

            console.error("[auth][login] login failed", {
                email,
                errorCode,
                rawError: err instanceof Error ? err.message : err,
            });

            setError(errorMessage);

            return {
                success: false,
                error: errorMessage,
                errorCode,
            };
        } finally {
            setIsLoading(false);
        }
    };

    return { login, isLoading, error };
};
