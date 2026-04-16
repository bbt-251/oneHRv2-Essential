import { NextResponse } from "next/server";
import { handlePasswordReset } from "@/lib/backend/api/auth/password-reset-service";

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Email is required",
                    errorCode: "validation-error",
                },
                { status: 400 },
            );
        }

        const result = await handlePasswordReset({ email });

        if (result.success) {
            return NextResponse.json(
                {
                    success: true,
                    message: "Password reset email sent successfully",
                },
                { status: 200 },
            );
        }

        return NextResponse.json(
            {
                success: false,
                error: result.error,
                errorCode: result.errorCode,
            },
            { status: 400 },
        );
    } catch (error) {
        console.error("Password reset API error:", error);
        return NextResponse.json(
            {
                success: false,
                error: "Internal server error",
                errorCode: "internal-error",
            },
            { status: 500 },
        );
    }
}
