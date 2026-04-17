import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { toErrorResponse } from "@/lib/backend/manual/errors";
import { authorizeDomainRequest } from "@/lib/backend/manual/phase-6-route-helpers";
import { createLeaveRequest, getLeaveBalance, listLeaveRequests } from "@/lib/backend/manual/phase-6-domain-service";
import { validatePayload } from "@/lib/backend/manual/validation";

const createSchema = z.object({
    id: z.string().min(1),
    employeeUid: z.string().min(1),
    leaveType: z.string().min(1),
    startDate: z.string().min(1),
    endDate: z.string().min(1),
    reason: z.string().optional(),
});

export async function GET(request: NextRequest) {
    try {
        const employeeUid = request.nextUrl.searchParams.get("employeeUid") ?? undefined;
        const { tenantId } = await authorizeDomainRequest(request, "leave", "read", employeeUid);

        return NextResponse.json({
            leaveRequests: listLeaveRequests(tenantId, employeeUid),
            leaveBalance: employeeUid ? getLeaveBalance(tenantId, employeeUid) : null,
        });
    } catch (error) {
        return toErrorResponse(error);
    }
}

export async function POST(request: NextRequest) {
    try {
        const payload = validatePayload(createSchema, await request.json());
        const { tenantId } = await authorizeDomainRequest(request, "leave", "create", payload.employeeUid);
        const leaveRequest = createLeaveRequest(tenantId, payload);

        return NextResponse.json({ leaveRequest }, { status: 201 });
    } catch (error) {
        return toErrorResponse(error);
    }
}
