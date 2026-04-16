import { NextResponse } from "next/server";
import {
  clearManualSession,
  readRefreshToken,
} from "@/lib/backend/manual/auth-session";
import { revokeRefreshToken } from "@/lib/backend/manual/auth-service";

export async function POST() {
  const refreshToken = await readRefreshToken();

  if (refreshToken) {
    revokeRefreshToken(refreshToken);
  }

  await clearManualSession();
  return NextResponse.json({ success: true });
}
