import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { toErrorResponse } from "@/lib/backend/manual/errors";
import { authorizeDomainRequest } from "@/lib/backend/manual/phase-6-route-helpers";
import { getPayrollSettings, upsertPayrollSettings } from "@/lib/backend/manual/phase-6-domain-service";
import { validatePayload } from "@/lib/backend/manual/validation";

const patchSchema = z.object({
    currency: z.string().min(3),
    paySchedule: z.enum(["monthly", "biweekly"]),
    overtimeMultiplier: z.number().positive(),
});

export async function GET(request: NextRequest) {
    try {
        const { tenantId } = await authorizeDomainRequest(request, "payroll", "read");
        return NextResponse.json({ settings: getPayrollSettings(tenantId) });
    } catch (error) {
        return toErrorResponse(error);
    }
}

export async function PUT(request: NextRequest) {
    try {
        const { tenantId } = await authorizeDomainRequest(request, "payroll", "update");
        const payload = validatePayload(patchSchema, await request.json());
        return NextResponse.json({ settings: upsertPayrollSettings(tenantId, payload) });
    } catch (error) {
        return toErrorResponse(error);
    }
}
