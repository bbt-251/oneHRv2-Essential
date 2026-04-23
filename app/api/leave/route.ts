import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { readSessionClaims } from "@/lib/server/shared/auth/session";
import { validatePayload } from "@/lib/server/shared/validation";
import { toErrorResponse } from "@/lib/server/shared/errors";
import { LeaveService } from "@/lib/server/leave/leave.service";

const payloadSchema = z.record(z.string(), z.unknown());

const createLeaveRequestSchema = z.object({
    payload: payloadSchema,
});

const updateLeaveRequestSchema = z.object({
    id: z.string().min(1),
    payload: payloadSchema,
});

export async function GET(request: NextRequest) {
    try {
        const id = request.nextUrl.searchParams.get("id");
        if (!id) {
            return NextResponse.json(
                {
                    error: {
                        code: "LEAVE_ID_REQUIRED",
                        message: "id is required.",
                    },
                },
                { status: 400 },
            );
        }

        const session = await readSessionClaims();
        const result = await LeaveService.getLeaveRequestById(id, session);
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
        const body = validatePayload(createLeaveRequestSchema, await request.json());
        const session = await readSessionClaims();
        const result = await LeaveService.createLeaveRequest(body.payload as never, session);

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
        const body = validatePayload(updateLeaveRequestSchema, await request.json());
        const session = await readSessionClaims();
        console.log("[api/leave][PATCH] request", {
            id: body.id,
            payloadKeys: Object.keys(body.payload ?? {}),
            leaveStage:
                body.payload && typeof body.payload === "object"
                    ? body.payload.leaveStage
                    : undefined,
            leaveState:
                body.payload && typeof body.payload === "object"
                    ? body.payload.leaveState
                    : undefined,
            employeeID:
                body.payload && typeof body.payload === "object"
                    ? body.payload.employeeID
                    : undefined,
            requestedFor:
                body.payload && typeof body.payload === "object"
                    ? body.payload.requestedFor
                    : undefined,
            sessionUid: session?.uid ?? null,
            sessionRoles: session?.roles ?? [],
        });
        const result = await LeaveService.updateLeaveRequest(
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
        console.error("[api/leave][PATCH] failed", error);
        return toErrorResponse(error);
    }
}
