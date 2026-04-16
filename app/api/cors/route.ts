import { NextRequest, NextResponse } from "next/server";

const allowedDomains = [
    "finstrat.solutions",
    "onehr.solutions",
    "black-bridge.tech",
    "vercel.app",
    "localhost",
];

export async function GET(request: NextRequest) {
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

    const response = NextResponse.json({ message: "CORS enabled" });

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

export async function OPTIONS(request: NextRequest) {
    const origin = request.headers.get("origin");

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
