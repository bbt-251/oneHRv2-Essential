// hooks/auth/usePasswordReset.ts
import { auth } from "@/lib/backend/firebase/init";
import { useState } from "react";

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
            // Call the API endpoint to handle password reset with admin SDK
            const response = await fetch("/api/auth/password-reset", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                return {
                    success: false,
                    error: data.error || "Failed to send reset email. Please try again.",
                    errorCode: data.errorCode || "unknown",
                };
            }

            return {
                success: true,
            };
        } catch (err) {
            let errorMessage = "Failed to send reset email. Please try again.";
            let errorCode = "unknown";

            // Handle specific Firebase password reset errors
            if (err instanceof Error) {
                switch (err.message) {
                    case "Firebase: Error (auth/invalid-email).":
                        errorMessage = "The email address is not valid.";
                        errorCode = "auth/invalid-email";
                        break;
                    case "Firebase: Error (auth/user-not-found).":
                        errorMessage =
                            "If an account with this email exists, a reset link has been sent.";
                        errorCode = "auth/user-not-found";
                        break;
                    case "Firebase: Error (auth/too-many-requests).":
                        errorMessage = "Too many attempts. Try again later.";
                        errorCode = "auth/too-many-requests";
                        break;
                    case "Firebase: Error (auth/network-request-failed).":
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
