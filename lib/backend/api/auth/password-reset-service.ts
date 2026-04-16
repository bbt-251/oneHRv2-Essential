import { admin } from "@/lib/backend/firebase/admin";
import { employeeAdminCollection } from "@/lib/backend/firebase/admin-collections";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/backend/firebase/init";

interface PasswordResetRequest {
    email: string;
}

interface PasswordResetResponse {
    success: boolean;
    error?: string;
    errorCode?: string;
}

export async function handlePasswordReset(
    request: PasswordResetRequest,
): Promise<PasswordResetResponse> {
    const { email } = request;

    try {
        // Check if company email exists in employee collection using Admin SDK
        const companyEmailQuery = employeeAdminCollection.where("companyEmail", "==", email);
        const companyEmailSnapshot = await companyEmailQuery.get();

        const emailExists = !companyEmailSnapshot.empty;

        if (!emailExists) {
            return {
                success: false,
                error: "This email is not registered. Please contact your administrator.",
                errorCode: "email-not-found",
            };
        }

        // Send password reset email via Firebase Auth
        await sendPasswordResetEmail(auth, email);

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

        return {
            success: false,
            error: errorMessage,
            errorCode,
        };
    }
}
