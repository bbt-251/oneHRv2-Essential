import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { toErrorResponse } from "@/lib/server/shared/errors";
import { AttendanceService } from "@/lib/server/attendance/attendance.service";
import { readSessionClaims } from "@/lib/server/shared/auth/session";
import { validatePayload } from "@/lib/server/shared/validation";

const payloadSchema = z.record(z.string(), z.unknown());

const createSchema = z.object({
    payload: payloadSchema,
});

export async function GET(request: NextRequest) {
    try {
        const session = await readSessionClaims();
        const searchParams = request.nextUrl.searchParams;
        const result = await AttendanceService.listLateComers(
            {
                month: searchParams.get("month") || undefined,
                year: searchParams.get("year") ? Number(searchParams.get("year")) : undefined,
                uid: searchParams.get("uid") || undefined,
            },
            session,
        );

        return NextResponse.json({
            message: result.message,
            ...result.data,
        });
    } catch (error) {
        return toErrorResponse(error);
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = validatePayload(createSchema, await request.json());
        const session = await readSessionClaims();
        const result = await AttendanceService.createLateComer(body.payload as never, session);

        return NextResponse.json(
            {
                message: result.message,
                ...result.data,
            },
            { status: 201 },
        );
    } catch (error) {
        return toErrorResponse(error);
    }
}
