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
    id: z.string().min(1),
    payload: payloadSchema,
});

const deleteSchema = z.object({
    id: z.string().min(1),
    employeeUid: z.string().optional(),
});

export async function POST(request: NextRequest) {
    try {
        const body = validatePayload(createSchema, await request.json());
        const session = await readSessionClaims();
        const result = await AttendanceService.createOvertimeRequest(
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
        const result = await AttendanceService.updateOvertimeRequest(
            {
                id: body.id,
                ...(body.payload as Record<string, unknown>),
            } as never,
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

export async function DELETE(request: NextRequest) {
    try {
        const body = validatePayload(deleteSchema, await request.json());
        const session = await readSessionClaims();
        const result = await AttendanceService.deleteOvertimeRequest(
            body.id,
            body.employeeUid,
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
