import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { toErrorResponse } from "@/lib/server/shared/errors";
import { ProjectService } from "@/lib/server/projects/project.service";
import { readSessionClaims } from "@/lib/server/shared/auth/session";
import { validatePayload } from "@/lib/server/shared/validation";

const payloadSchema = z.record(z.string(), z.unknown());
const updateSchema = z.object({
    id: z.string().min(1),
    payload: payloadSchema,
});

export async function GET(request: NextRequest) {
    try {
        const session = await readSessionClaims();
        const filters = {
            uid: request.nextUrl.searchParams.get("uid") || undefined,
        };
        const result = await ProjectService.list(filters, session);
        return NextResponse.json({ message: result.message, ...result.data });
    } catch (error) {
        return toErrorResponse(error);
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const session = await readSessionClaims();
        const body = validatePayload(updateSchema, await request.json());
        const result = await ProjectService.updateAllocations(body.id, body.payload, session);
        return NextResponse.json({ message: result.message, ...result.data });
    } catch (error) {
        return toErrorResponse(error);
    }
}
