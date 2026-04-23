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

const updateSchema = z.object({
    action: z.enum(["approve", "refuse"]),
    id: z.string().min(1),
    payload: payloadSchema,
});

export async function POST(request: NextRequest) {
    try {
        const body = validatePayload(createSchema, await request.json());
        const session = await readSessionClaims();
        const result = await AttendanceService.requestAttendanceModification(
            body.payload as never,
            session,
        );

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

export async function PATCH(request: NextRequest) {
    try {
        const body = validatePayload(updateSchema, await request.json());
        const session = await readSessionClaims();
        const payload = {
            id: body.id,
            ...(body.payload as Record<string, unknown>),
        } as never;
        const result =
            body.action === "approve"
                ? await AttendanceService.approveAttendanceModification(payload, session)
                : await AttendanceService.refuseAttendanceModification(payload, session);

        return NextResponse.json({
            message: result.message,
            ...result.data,
        });
    } catch (error) {
        return toErrorResponse(error);
    }
}
