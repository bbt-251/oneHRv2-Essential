import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { toErrorResponse } from "@/lib/backend/manual/errors";
import { authorizeDomainRequest } from "@/lib/backend/manual/phase-6-route-helpers";
import { createOvertimeRequest } from "@/lib/backend/manual/phase-6-domain-service";
import { validatePayload } from "@/lib/backend/manual/validation";

const createSchema = z.object({
    id: z.string().min(1),
    employeeUid: z.string().min(1),
    date: z.string().min(1),
    minutes: z.number().int().positive(),
    reason: z.string().min(1),
});

export async function POST(request: NextRequest) {
    try {
        const { tenantId } = await authorizeDomainRequest(request, "attendance", "update");
        const payload = validatePayload(createSchema, await request.json());
        const overtimeRequest = createOvertimeRequest(tenantId, payload);
        return NextResponse.json({ overtimeRequest }, { status: 201 });
    } catch (error) {
        return toErrorResponse(error);
    }
}
