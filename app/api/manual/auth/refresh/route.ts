import { NextResponse } from "next/server";
import {
  createManualSessionToken,
  createRefreshToken,
  readRefreshToken,
  setManualRefreshCookie,
  setManualSessionCookie,
} from "@/lib/backend/manual/auth-session";
import {
  consumeRefreshToken,
  registerRefreshToken,
} from "@/lib/backend/manual/auth-service";
import { toErrorResponse, ManualApiError } from "@/lib/backend/manual/errors";

export async function POST() {
  try {
    const refreshToken = await readRefreshToken();

    if (!refreshToken) {
      throw new ManualApiError(
        401,
        "REFRESH_TOKEN_MISSING",
        "Refresh token is required.",
      );
    }

    const session = consumeRefreshToken(refreshToken);

    if (!session) {
      throw new ManualApiError(
        401,
        "REFRESH_TOKEN_INVALID",
        "Refresh token is invalid or expired.",
      );
    }

    const nextSessionToken = await createManualSessionToken(session);
    const nextRefreshToken = createRefreshToken();

    registerRefreshToken(nextRefreshToken, session);
    await setManualSessionCookie(nextSessionToken);
    await setManualRefreshCookie(nextRefreshToken);

    return NextResponse.json({ authenticated: true, user: session });
  } catch (error) {
    return toErrorResponse(error);
  }
}
