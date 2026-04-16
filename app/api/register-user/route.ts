// app/api/employees/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { EmployeeModel } from "@/lib/models/employee";
import getFullName from "@/lib/util/getEmployeeFullName";
import { admin } from "@/lib/backend/firebase/admin";

export async function POST(req: NextRequest) {
    try {
        const data: Omit<EmployeeModel, "id"> = await req.json();

        // Create Firebase Auth user
        const userRecord = await admin.auth().createUser({
            email: data.companyEmail,
            password: data.password ?? "1q2w3e4r%T",
            displayName: getFullName(data as EmployeeModel),
        });

        // Set custom claims
        await admin.auth().setCustomUserClaims(userRecord.uid, {
            role: data.role,
        });

        return NextResponse.json({ success: true, uid: userRecord.uid }, { status: 201 });
    } catch (err: any) {
        console.error("Error creating employee:", err);

        let errorMessage = "An unknown error occurred.";

        if (err?.code) {
            switch (err.code) {
                case "auth/email-already-exists":
                    errorMessage = "Email is already in use.";
                    break;
                case "auth/invalid-email":
                    errorMessage = "Invalid email address.";
                    break;
                case "auth/invalid-password":
                    errorMessage = "Password must be at least 6 characters.";
                    break;
                case "auth/uid-already-exists":
                    errorMessage = "User ID already exists.";
                    break;
                default:
                    errorMessage = err.message || errorMessage;
            }
        } else if (err instanceof Error) {
            // Fallback for non-Firebase errors
            errorMessage = err.message;
        }

        return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const requestData = await req.json();
        const { uid, role, companyEmail, email } = requestData;

        // Accept both 'email' and 'companyEmail' for compatibility
        const finalEmail = companyEmail || email;

        if (!uid || !role) {
            return NextResponse.json(
                { success: false, message: "UID and role are required." },
                { status: 400 },
            );
        }

        // Update email if provided and email has changed
        if (finalEmail) {
            try {
                // Get current user to compare emails
                const currentUser = await admin.auth().getUser(uid);
                // Use case-insensitive comparison for safety
                if (currentUser.email?.toLowerCase() !== finalEmail.toLowerCase()) {
                    // Update Firebase Auth email
                    await admin.auth().updateUser(uid, {
                        email: finalEmail,
                    });
                }
            } catch (emailErr: any) {
                console.error("Error updating Firebase Auth email:", emailErr);

                let emailErrorMessage = "Failed to update login email.";
                if (emailErr?.code) {
                    switch (emailErr.code) {
                        case "auth/email-already-in-use":
                            emailErrorMessage = "This email is already in use by another account.";
                            break;
                        case "auth/invalid-email":
                            emailErrorMessage = "The email address is invalid.";
                            break;
                        case "auth/user-not-found":
                            emailErrorMessage = "User not found.";
                            break;
                    }
                }
                return NextResponse.json(
                    { success: false, message: emailErrorMessage },
                    { status: 400 },
                );
            }
        }

        // Update custom claims with the new role
        await admin.auth().setCustomUserClaims(uid, { role });

        return NextResponse.json(
            {
                success: true,
                message: finalEmail
                    ? `Role and login email updated successfully`
                    : `Role updated to ${role}`,
            },
            { status: 200 },
        );
    } catch (err: any) {
        console.error("Error updating role:", err);

        let errorMessage = "An unknown error occurred.";
        if (err?.code) {
            switch (err.code) {
                case "auth/user-not-found":
                    errorMessage = "User not found.";
                    break;
                default:
                    errorMessage = err.message || errorMessage;
            }
        } else if (err instanceof Error) {
            errorMessage = err.message;
        }

        return NextResponse.json({ success: false, message: errorMessage }, { status: 500 });
    }
}

// GET all users with their custom claims
export async function GET(req: NextRequest) {
    try {
        const maxResults = 1000; // Firebase allows up to 1000 per call
        const listUsersResult = await admin.auth().listUsers(maxResults);

        const users = listUsersResult.users.map(user => ({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            role: user.customClaims?.role || "No role",
            disabled: user.disabled,
            createdAt: new Date(user.metadata.creationTime).toISOString(),
            lastLogin: user.metadata.lastSignInTime
                ? new Date(user.metadata.lastSignInTime).toISOString()
                : null,
        }));

        return NextResponse.json({ success: true, users }, { status: 200 });
    } catch (err: any) {
        console.error("Error listing users:", err);
        return NextResponse.json(
            { success: false, message: err.message || "Error fetching users" },
            { status: 500 },
        );
    }
}
