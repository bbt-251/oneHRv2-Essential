import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { toErrorResponse } from "@/lib/backend/manual/errors";
import { authorizeDomainRequest } from "@/lib/backend/manual/phase-6-route-helpers";
import { updateLeaveRequest } from "@/lib/backend/manual/phase-6-domain-service";
import { validatePayload } from "@/lib/backend/manual/validation";

const patchSchema = z.object({
    status: z.enum(["approved", "rejected"]).optional(),
    reason: z.string().optional(),
});

interface Context {
  params: Promise<{
    leaveId: string;
  }>;
}

export async function PATCH(request: NextRequest, context: Context) {
    try {
        const { leaveId } = await context.params;
        const { session, tenantId } = await authorizeDomainRequest(request, "leave", "update");
        const payload = validatePayload(patchSchema, await request.json());

        const leaveRequest = updateLeaveRequest(tenantId, leaveId, {
            ...payload,
            decidedBy: payload.status ? session.uid : undefined,
        });

        return NextResponse.json({ leaveRequest });
    } catch (error) {
        return toErrorResponse(error);
    }
}
