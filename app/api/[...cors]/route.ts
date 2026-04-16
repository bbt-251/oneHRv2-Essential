import { NextRequest, NextResponse } from "next/server";

const allowedDomains = [
    "finstrat.solutions",
    "onehr.solutions",
    "black-bridge.tech",
    "vercel.app",
    "localhost",
];

function isAllowedOrigin(origin: string | null): boolean {
    if (!origin) return false;

    return allowedDomains.some(domain => {
        return (
            origin === `http://${domain}` ||
            origin === `https://${domain}` ||
            origin.endsWith(`.${domain}`) ||
            (domain === "localhost" && origin.includes("localhost"))
        );
    });
}

export async function GET(request: NextRequest) {
    return handleCORS(request);
}

export async function POST(request: NextRequest) {
    return handleCORS(request);
}

export async function PUT(request: NextRequest) {
    return handleCORS(request);
}

export async function DELETE(request: NextRequest) {
    return handleCORS(request);
}

export async function OPTIONS(request: NextRequest) {
    return handleCORS(request);
}

function handleCORS(request: NextRequest) {
    const origin = request.headers.get("origin");
    const isAllowed = isAllowedOrigin(origin);

    const response = new NextResponse(
        JSON.stringify({
            message: "CORS handled by API route",
            origin: origin,
            allowed: isAllowed,
        }),
        {
            status: request.method === "OPTIONS" ? 200 : 200,
            headers: {
                "Content-Type": "application/json",
            },
        },
    );

    // Only set CORS headers for allowed origins
    if (isAllowed) {
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
