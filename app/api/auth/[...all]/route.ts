import { NextRequest, NextResponse } from "next/server";
import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/backend/auth/better-auth";
import { getAuthUserByEmail } from "@/lib/backend/persistence/auth.repository";

const authHandler = toNextJsHandler(auth);

const isEmailSignInRequest = (request: NextRequest, pathname: string): boolean =>
    request.method === "POST" && pathname.endsWith("/sign-in/email");

async function guardInactiveEmailSignIn(request: NextRequest): Promise<NextResponse | null> {
    const body = (await request
        .clone()
        .json()
        .catch(() => null)) as { email?: string } | null;

    console.log("[auth-route] guardInactiveEmailSignIn payload", {
        hasBody: Boolean(body),
        email: body?.email ?? null,
    });

    if (!body?.email) {
        return null;
    }

    const authUser = await getAuthUserByEmail(body.email);
    console.log("[auth-route] guardInactiveEmailSignIn auth user", {
        email: body.email,
        found: Boolean(authUser),
        active: authUser?.active ?? null,
        uid: authUser?.uid ?? null,
    });
    if (authUser && authUser.active === false) {
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

export async function GET(request: NextRequest) {
    try {
        console.log("[auth-route] GET", {
            pathname: request.nextUrl.pathname,
        });
        return await authHandler.GET(request);
    } catch (error) {
        console.error("[auth-route] GET failed", {
            pathname: request.nextUrl.pathname,
            error: error instanceof Error ? error.message : error,
            stack: error instanceof Error ? error.stack : undefined,
        });
        throw error;
    }
}

export async function POST(request: NextRequest) {
    try {
        console.log("[auth-route] POST", {
            pathname: request.nextUrl.pathname,
            method: request.method,
        });

        const isEmailSignIn = isEmailSignInRequest(request, request.nextUrl.pathname);
        const handlerRequest = isEmailSignIn ? request.clone() : request;

        if (isEmailSignIn) {
            const inactiveResponse = await guardInactiveEmailSignIn(request);
            if (inactiveResponse) {
                console.warn("[auth-route] blocked inactive sign-in", {
                    pathname: request.nextUrl.pathname,
                });
                return inactiveResponse;
            }
        }

        return await authHandler.POST(handlerRequest);
    } catch (error) {
        console.error("[auth-route] POST failed", {
            pathname: request.nextUrl.pathname,
            method: request.method,
            error: error instanceof Error ? error.message : error,
            stack: error instanceof Error ? error.stack : undefined,
        });
        throw error;
    }
}
