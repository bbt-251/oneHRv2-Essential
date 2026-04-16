// hooks/auth/useLogin.ts
import { auth } from "@/lib/backend/firebase/init";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useState } from "react";

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
        setIsLoading(true);
        setError(null);

        try {
            // Authenticate user with Firebase
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            return {
                success: true,
                user: {
                    uid: user.uid,
                    email: user.email || "",
                    displayName: user.displayName || undefined,
                },
            };
        } catch (err) {
            let errorMessage = "Login failed. Please try again.";
            let errorCode = "unknown";

            // Handle specific Firebase authentication errors
            if (err instanceof Error) {
                switch (err.message) {
                    case "Firebase: Error (auth/invalid-email).":
                        errorMessage = "Invalid email address.";
                        errorCode = "auth/invalid-email";
                        break;
                    case "Firebase: Error (auth/user-disabled).":
                        errorMessage = "This account has been disabled.";
                        errorCode = "auth/user-disabled";
                        break;
                    case "Firebase: Error (auth/user-not-found).":
                        errorMessage = "No account found with this email.";
                        errorCode = "auth/user-not-found";
                        break;
                    case "Firebase: Error (auth/wrong-password).":
                        errorMessage = "Incorrect password.";
                        errorCode = "auth/wrong-password";
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
                        errorMessage = "Login failed. Please check your credentials.";
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

    return { login, isLoading, error };
};
