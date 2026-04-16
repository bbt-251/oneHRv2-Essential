import { NextResponse } from "next/server";
import { clearManualSession } from "@/lib/backend/manual/auth-session";

export async function POST() {
    await clearManualSession();
    return NextResponse.json({ success: true });
}
