import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  createManualSessionToken,
  createRefreshToken,
  setManualRefreshCookie,
  setManualSessionCookie,
} from "@/lib/backend/manual/auth-session";
import {
  loginManualUser,
  registerRefreshToken,
} from "@/lib/backend/manual/auth-service";
import { toErrorResponse } from "@/lib/backend/manual/errors";
import { validatePayload } from "@/lib/backend/manual/validation";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  tenantId: z.string().min(1).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const payload = validatePayload(loginSchema, await request.json());
    const identifier = request.headers.get("x-forwarded-for") ?? "local";

    const session = await loginManualUser({
      email: payload.email,
      password: payload.password,
      tenantId: payload.tenantId,
      identifier,
    });

    const sessionToken = await createManualSessionToken(session);
    const refreshToken = createRefreshToken();

    registerRefreshToken(refreshToken, session);
    await setManualSessionCookie(sessionToken);
    await setManualRefreshCookie(refreshToken);

    return NextResponse.json({
      authenticated: true,
      user: session,
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
