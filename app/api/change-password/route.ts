import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/lib/backend/firebase/admin";

export async function POST(req: NextRequest) {
    try {
        const { uid, newPassword, forceChange } = await req.json();

        // Validate required fields
        if (!uid || !newPassword) {
            return NextResponse.json(
                { success: false, message: "UID and newPassword are required." },
                { status: 400 },
            );
        }

        // Firebase Auth password requirements:
        // - 6+ characters minimum
        // - Must include uppercase, lowercase, and numbers as per user specification
        if (newPassword.length < 6) {
            return NextResponse.json(
                { success: false, message: "Password must be at least 6 characters long." },
                { status: 400 },
            );
        }

        const hasUpperCase = /[A-Z]/.test(newPassword);
        const hasLowerCase = /[a-z]/.test(newPassword);
        const hasNumbers = /\d/.test(newPassword);

        const missingRequirements = [];
        if (!hasUpperCase) missingRequirements.push("uppercase letter");
        if (!hasLowerCase) missingRequirements.push("lowercase letter");
        if (!hasNumbers) missingRequirements.push("number");

        if (missingRequirements.length > 0) {
            const message = `Password must contain at least one ${missingRequirements.join(", ")}.`;
            return NextResponse.json(
                {
                    success: false,
                    message,
                },
                { status: 400 },
            );
        }

        // Get current user claims to preserve existing claims
        let currentUser;
        try {
            currentUser = await admin.auth().getUser(uid);
        } catch (userErr: any) {
            if (userErr?.code === "auth/user-not-found") {
                return NextResponse.json(
                    { success: false, message: "User not found." },
                    { status: 404 },
                );
            }
            throw userErr;
        }

        // Update user password in Firebase Auth
        const updatedUser = await admin.auth().updateUser(uid, {
            password: newPassword,
        });

        // Handle force change flag
        if (forceChange) {
            await admin.auth().setCustomUserClaims(uid, {
                ...currentUser.customClaims,
                forcePasswordChange: true,
            });
        } else {
            // If not forcing change, clear the flag if it exists
            const currentClaims = currentUser.customClaims || {};
            if (currentClaims.forcePasswordChange) {
                delete currentClaims.forcePasswordChange;
                await admin.auth().setCustomUserClaims(uid, currentClaims);
            }
        }

        return NextResponse.json(
            { success: true, message: "Password changed successfully.", uid: updatedUser.uid },
            { status: 200 },
        );
    } catch (error: any) {
        console.error("Error changing password:", error);

        let errorMessage = "An unknown error occurred.";

        if (error?.code) {
            switch (error.code) {
                case "auth/invalid-password":
                    errorMessage = "Invalid password format.";
                    break;
                case "auth/user-not-found":
                    errorMessage = "User not found.";
                    break;
                case "auth/insufficient-permission":
                    errorMessage = "Insufficient permissions to update password.";
                    break;
                case "auth/invalid-uid":
                    errorMessage = "Invalid user ID.";
                    break;
                default:
                    errorMessage = error.message || errorMessage;
            }
        } else if (error instanceof Error) {
            errorMessage = error.message;
        }

        return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
    }
}
