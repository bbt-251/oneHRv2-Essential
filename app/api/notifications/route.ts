import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { toErrorResponse } from "@/lib/server/shared/errors";
import { readSessionClaims } from "@/lib/server/shared/auth/session";
import { validatePayload } from "@/lib/server/shared/validation";
import { NotificationService } from "@/lib/server/notifications/notification.service";

const payloadSchema = z.record(z.string(), z.unknown());

export async function GET(request: NextRequest) {
    try {
        const session = await readSessionClaims();
        const filters = {
            uid: request.nextUrl.searchParams.get("uid") || undefined,
        };
        const result = await NotificationService.list(filters, session);
        return NextResponse.json({ message: result.message, ...result.data });
    } catch (error) {
        return toErrorResponse(error);
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await readSessionClaims();
        const body = validatePayload(z.object({ payload: payloadSchema }), await request.json());
        const result = await NotificationService.create(body.payload, session);
        return NextResponse.json({ message: result.message, ...result.data }, { status: 201 });
    } catch (error) {
        return toErrorResponse(error);
    }
}
