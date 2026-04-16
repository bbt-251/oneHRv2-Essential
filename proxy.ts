import { NextRequest, NextResponse } from "next/server";

const allowedDomains = [
    "finstrat.solutions",
    "onehr.solutions",
    "black-bridge.tech",
    "vercel.app",
    "localhost",
];

export function proxy(request: NextRequest) {
    const origin = request.headers.get("origin");

    // Check if origin is allowed (including subdomains)
    const isAllowedOrigin =
        origin &&
        allowedDomains.some(domain => {
            // Check exact match or subdomain
            return (
                origin === `http://${domain}` ||
                origin === `https://${domain}` ||
                origin.endsWith(`.${domain}`) ||
                (domain === "localhost" && origin.includes("localhost"))
            );
        });

    // Handle preflight requests
    if (request.method === "OPTIONS") {
        const response = new NextResponse(null, { status: 200 });

        if (isAllowedOrigin) {
            response.headers.set("Access-Control-Allow-Origin", origin!);
            response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
            response.headers.set(
                "Access-Control-Allow-Headers",
                "X-Requested-With, Content-Type, Authorization",
            );
            response.headers.set("Access-Control-Allow-Credentials", "true");
        }

        return response;
    }

    // Handle regular requests - get the response first
    const response = NextResponse.next();

    // Add debug header to verify middleware is working
    response.headers.set("X-Middleware-Debug", "active");

    // Always delete any existing CORS headers first to prevent platform override
    response.headers.delete("Access-Control-Allow-Origin");
    response.headers.delete("Access-Control-Allow-Methods");
    response.headers.delete("Access-Control-Allow-Headers");
    response.headers.delete("Access-Control-Allow-Credentials");

    // Also delete any variations that might be set
    response.headers.delete("access-control-allow-origin");
    response.headers.delete("Access-control-allow-origin");

    if (isAllowedOrigin) {
        // Only set CORS headers for allowed origins
        response.headers.set("Access-Control-Allow-Origin", origin!);
        response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        response.headers.set(
            "Access-Control-Allow-Headers",
            "X-Requested-With, Content-Type, Authorization",
        );
        response.headers.set("Access-Control-Allow-Credentials", "true");
        response.headers.set("X-CORS-Status", "allowed");
    } else {
        // For disallowed origins, ensure no CORS headers are present
        response.headers.set("X-CORS-Status", "blocked");
    }

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        "/((?!_next/static|_next/image|favicon.ico).*)",
    ],
};
