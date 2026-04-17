import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { toErrorResponse } from "@/lib/backend/manual/errors";
import { authorizeDomainRequest } from "@/lib/backend/manual/phase-6-route-helpers";
import { applyLoanPayment } from "@/lib/backend/manual/phase-6-domain-service";
import { validatePayload } from "@/lib/backend/manual/validation";

const paymentSchema = z.object({
    amount: z.number().positive(),
});

interface Context {
  params: Promise<{
    loanId: string;
  }>;
}

export async function PATCH(request: NextRequest, context: Context) {
    try {
        const { loanId } = await context.params;
        const { tenantId } = await authorizeDomainRequest(request, "payroll", "update");
        const payload = validatePayload(paymentSchema, await request.json());

        return NextResponse.json({ loan: applyLoanPayment(tenantId, loanId, payload.amount) });
    } catch (error) {
        return toErrorResponse(error);
    }
}
