// hooks/auth/usePasswordReset.ts
import { useState } from "react";
import { requestPasswordResetWithBackend } from "@/lib/backend/client/auth-client";

interface PasswordResetProps {
    email: string;
}

interface PasswordResetResponse {
    success: boolean;
    error?: string;
    errorCode?: string;
}

interface PasswordResetHook {
    sendResetEmail: (props: PasswordResetProps) => Promise<PasswordResetResponse>;
    isLoading: boolean;
    error: string | null;
}

export const usePasswordReset = (): PasswordResetHook => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const sendResetEmail = async ({
        email,
    }: PasswordResetProps): Promise<PasswordResetResponse> => {
        setIsLoading(true);
        setError(null);

        try {
            const data = await requestPasswordResetWithBackend({ email });

            if (!data.success) {
                return {
                    success: false,
                    error: data.error?.message || "Failed to send reset email. Please try again.",
                    errorCode: data.error?.code || "unknown",
                };
            }

            return {
                success: true,
            };
        } catch (err) {
            let errorMessage = "Failed to send reset email. Please try again.";
            let errorCode = "unknown";

            if (err instanceof Error) {
                switch (err.message) {
                    case "auth/invalid-email":
                        errorMessage = "The email address is not valid.";
                        errorCode = "auth/invalid-email";
                        break;
                    case "auth/user-not-found":
                        errorMessage =
                            "If an account with this email exists, a reset link has been sent.";
                        errorCode = "auth/user-not-found";
                        break;
                    case "auth/too-many-requests":
                        errorMessage = "Too many attempts. Try again later.";
                        errorCode = "auth/too-many-requests";
                        break;
                    case "auth/network-request-failed":
                        errorMessage = "Network error. Please check your connection.";
                        errorCode = "auth/network-request-failed";
                        break;
                    default:
                        errorMessage = "Failed to send reset email. Please try again.";
                        errorCode = "auth/unknown";
                }
            }

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

    return { sendResetEmail, isLoading, error };
};
