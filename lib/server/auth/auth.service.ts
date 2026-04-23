import { NextRequest, NextResponse } from "next/server";
import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/server/auth/better-auth";
import { getAuthUserByEmail } from "@/lib/server/auth/auth.repository";
import {
    assertLoginNotLocked,
    registerLoginFailure,
    resetLoginFailures,
} from "@/lib/server/shared/auth/rate-limit";

const authHandler = toNextJsHandler(auth);

const isEmailSignInRequest = (request: NextRequest, pathname: string): boolean =>
    request.method === "POST" && pathname.endsWith("/sign-in/email");

const getRateLimitKey = (request: NextRequest, email?: string | null) =>
    `${request.headers.get("x-forwarded-for") ?? "unknown"}:${email?.trim().toLowerCase() ?? "anonymous"}`;

export class AuthService {
    static async guardInactiveEmailSignIn(request: NextRequest): Promise<NextResponse | null> {
        const body = (await request
            .clone()
            .json()
            .catch(() => null)) as { email?: string } | null;

        if (!body?.email) {
            return null;
        }

        const key = getRateLimitKey(request, body.email);
        assertLoginNotLocked(key);

        const authUser = await getAuthUserByEmail(body.email);
        if (authUser && authUser.active === false) {
            registerLoginFailure(key);
            return NextResponse.json(
                {
                    code: "ACCOUNT_DISABLED",
                    message: "This account is inactive and cannot sign in.",
                },
                { status: 403 },
            );
        }

        return null;
    }

    static async handleGet(request: NextRequest) {
        return authHandler.GET(request);
    }

    static async handlePost(request: NextRequest) {
        const isEmailSignIn = isEmailSignInRequest(request, request.nextUrl.pathname);
        const handlerRequest = isEmailSignIn ? request.clone() : request;

        let rateLimitKey: string | null = null;

        if (isEmailSignIn) {
            const body = (await request
                .clone()
                .json()
                .catch(() => null)) as { email?: string } | null;
            rateLimitKey = getRateLimitKey(request, body?.email ?? null);

            const inactiveResponse = await this.guardInactiveEmailSignIn(request);
            if (inactiveResponse) {
                return inactiveResponse;
            }
        }

        const response = await authHandler.POST(handlerRequest);

        if (isEmailSignIn && rateLimitKey) {
            if (response.ok) {
                resetLoginFailures(rateLimitKey);
            } else if (
                response.status === 401 ||
                response.status === 403 ||
                response.status === 429
            ) {
                registerLoginFailure(rateLimitKey);
            }
        }

        return response;
    }
}
