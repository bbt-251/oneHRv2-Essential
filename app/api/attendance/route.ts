import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { toErrorResponse } from "@/lib/server/shared/errors";
import { AttendanceService } from "@/lib/server/attendance/attendance.service";
import { readSessionClaims } from "@/lib/server/shared/auth/session";
import { validatePayload } from "@/lib/server/shared/validation";

const payloadSchema = z.record(z.string(), z.unknown());

const createSchema = z.object({
    payload: payloadSchema,
    mode: z.enum(["create", "generate"]).optional(),
});

const updateSchema = z.object({
    id: z.string().min(1),
    payload: payloadSchema,
});

const deleteSchema = z.object({
    id: z.string().min(1),
});

export async function GET(request: NextRequest) {
    try {
        const session = await readSessionClaims();
        const searchParams = request.nextUrl.searchParams;
        const result = await AttendanceService.listAttendances(
            {
                id: searchParams.get("id") || undefined,
                uid: searchParams.get("uid") || undefined,
                month: searchParams.get("month") || undefined,
                year: searchParams.get("year") ? Number(searchParams.get("year")) : undefined,
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
        const result =
            body.mode === "generate"
                ? await AttendanceService.generateAttendanceForEmployee(
                      body.payload as never,
                      session,
                )
                : await AttendanceService.createAttendance(body.payload as never, session);

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
        const result = await AttendanceService.updateAttendance(
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
        const result = await AttendanceService.deleteAttendance(body.id, session);

        return NextResponse.json({
            message: result.message,
            ...result.data,
        });
    } catch (error) {
        return toErrorResponse(error);
    }
}
