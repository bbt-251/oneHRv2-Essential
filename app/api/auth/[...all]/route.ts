import { NextRequest } from "next/server";
import { AuthService } from "@/lib/server/auth/auth.service";

export async function GET(request: NextRequest) {
    try {
        console.log("[auth-route] GET", {
            pathname: request.nextUrl.pathname,
        });
        return await AuthService.handleGet(request);
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

        return await AuthService.handlePost(request);
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
