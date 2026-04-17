import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { toErrorResponse } from "@/lib/backend/manual/errors";
import { authorizeDomainRequest } from "@/lib/backend/manual/phase-6-route-helpers";
import { adjustAttendance } from "@/lib/backend/manual/phase-6-domain-service";
import { validatePayload } from "@/lib/backend/manual/validation";

const patchSchema = z.object({
    status: z.enum(["present", "absent", "late", "leave"]),
    workedMinutes: z.number().int().min(0),
    notes: z.string().optional(),
});

interface Context {
  params: Promise<{
    attendanceId: string;
  }>;
}

export async function PATCH(request: NextRequest, context: Context) {
    try {
        const { attendanceId } = await context.params;
        const { tenantId } = await authorizeDomainRequest(request, "attendance", "update");
        const payload = validatePayload(patchSchema, await request.json());
        const attendance = adjustAttendance(tenantId, attendanceId, payload);
        return NextResponse.json({ attendance });
    } catch (error) {
        return toErrorResponse(error);
    }
}
