import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { toErrorResponse } from "@/lib/backend/manual/errors";
import { authorizeDomainRequest } from "@/lib/backend/manual/phase-6-route-helpers";
import { createCompensation, listCompensation } from "@/lib/backend/manual/phase-6-domain-service";
import { validatePayload } from "@/lib/backend/manual/validation";

const createSchema = z.object({
    id: z.string().min(1),
    employeeUid: z.string().min(1),
    baseSalary: z.number().nonnegative(),
    allowances: z.number().nonnegative(),
    deductions: z.number().nonnegative(),
    effectiveDate: z.string().min(1),
});

export async function GET(request: NextRequest) {
    try {
        const employeeUid = request.nextUrl.searchParams.get("employeeUid") ?? undefined;
        const { tenantId } = await authorizeDomainRequest(request, "payroll", "read", employeeUid);
        return NextResponse.json({ compensation: listCompensation(tenantId, employeeUid) });
    } catch (error) {
        return toErrorResponse(error);
    }
}

export async function POST(request: NextRequest) {
    try {
        const { tenantId } = await authorizeDomainRequest(request, "payroll", "create");
        const payload = validatePayload(createSchema, await request.json());
        return NextResponse.json({ compensation: createCompensation(tenantId, payload) }, { status: 201 });
    } catch (error) {
        return toErrorResponse(error);
    }
}
