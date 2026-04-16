import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/lib/backend/firebase/admin";

export async function GET(req: NextRequest) {
    try {
        // List users with a limit of 1 to check if any users exist
        const listUsersResult = await admin.auth().listUsers(1);

        const usersExist = listUsersResult.users.length > 0;

        return NextResponse.json(
            {
                success: true,
                usersExist,
                userCount: listUsersResult.users.length,
            },
            { status: 200 },
        );
    } catch (err: any) {
        return NextResponse.json(
            { success: false, message: err.message || "Error checking users" },
            { status: 500 },
        );
    }
}
