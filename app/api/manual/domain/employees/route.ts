import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { toErrorResponse } from "@/lib/backend/manual/errors";
import { validatePayload } from "@/lib/backend/manual/validation";
import { authorizeDomainRequest } from "@/lib/backend/manual/phase-6-route-helpers";
import { createEmployee, listEmployees } from "@/lib/backend/manual/phase-6-domain-service";

const employeeCreateSchema = z.object({
    uid: z.string().min(1),
    email: z.string().email(),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    roles: z.array(z.string().min(1)).min(1),
    managerUid: z.string().min(1).optional(),
    active: z.boolean().default(true),
});

export async function GET(request: NextRequest) {
    try {
        const { tenantId } = await authorizeDomainRequest(request, "employee", "read");
        return NextResponse.json({ employees: listEmployees(tenantId) });
    } catch (error) {
        return toErrorResponse(error);
    }
}

export async function POST(request: NextRequest) {
    try {
        const { tenantId } = await authorizeDomainRequest(request, "employee", "create");
        const payload = validatePayload(employeeCreateSchema, await request.json());

        const employee = createEmployee(tenantId, payload);
        return NextResponse.json({ employee }, { status: 201 });
    } catch (error) {
        return toErrorResponse(error);
    }
}
