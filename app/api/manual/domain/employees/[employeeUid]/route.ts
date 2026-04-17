import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { toErrorResponse } from "@/lib/backend/manual/errors";
import { validatePayload } from "@/lib/backend/manual/validation";
import { authorizeDomainRequest } from "@/lib/backend/manual/phase-6-route-helpers";
import {
    deleteEmployee,
    getEmployeeProfile,
    updateEmployee,
} from "@/lib/backend/manual/phase-6-domain-service";

const updateSchema = z.object({
    email: z.string().email().optional(),
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    roles: z.array(z.string().min(1)).min(1).optional(),
    managerUid: z.string().min(1).optional(),
    active: z.boolean().optional(),
});

interface Context {
  params: Promise<{
    employeeUid: string;
  }>;
}

export async function GET(request: NextRequest, context: Context) {
    try {
        const { employeeUid } = await context.params;
        const { tenantId } = await authorizeDomainRequest(request, "employee", "read", employeeUid);
        return NextResponse.json({ employee: getEmployeeProfile(tenantId, employeeUid) });
    } catch (error) {
        return toErrorResponse(error);
    }
}

export async function PATCH(request: NextRequest, context: Context) {
    try {
        const { employeeUid } = await context.params;
        const { tenantId } = await authorizeDomainRequest(request, "employee", "update", employeeUid);
        const payload = validatePayload(updateSchema, await request.json());

        return NextResponse.json({ employee: updateEmployee(tenantId, employeeUid, payload) });
    } catch (error) {
        return toErrorResponse(error);
    }
}

export async function DELETE(request: NextRequest, context: Context) {
    try {
        const { employeeUid } = await context.params;
        const { tenantId } = await authorizeDomainRequest(request, "employee", "delete", employeeUid);
        deleteEmployee(tenantId, employeeUid);
        return NextResponse.json({ deleted: true });
    } catch (error) {
        return toErrorResponse(error);
    }
}
