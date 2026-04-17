import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { toErrorResponse } from "@/lib/backend/manual/errors";
import { authorizeDomainRequest } from "@/lib/backend/manual/phase-6-route-helpers";
import { decideOvertimeRequest } from "@/lib/backend/manual/phase-6-domain-service";
import { validatePayload } from "@/lib/backend/manual/validation";

const decisionSchema = z.object({
    decision: z.enum(["approved", "rejected"]),
});

interface Context {
  params: Promise<{
    requestId: string;
  }>;
}

export async function PATCH(request: NextRequest, context: Context) {
    try {
        const { requestId } = await context.params;
        const { session, tenantId } = await authorizeDomainRequest(request, "attendance", "update");
        const payload = validatePayload(decisionSchema, await request.json());

        const overtimeRequest = decideOvertimeRequest(
            tenantId,
            requestId,
            payload.decision,
            session.uid,
        );

        return NextResponse.json({ overtimeRequest });
    } catch (error) {
        return toErrorResponse(error);
    }
}
