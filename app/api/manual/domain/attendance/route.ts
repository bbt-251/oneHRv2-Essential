import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { toErrorResponse } from "@/lib/backend/manual/errors";
import { authorizeDomainRequest } from "@/lib/backend/manual/phase-6-route-helpers";
import { createAttendance, listAttendance } from "@/lib/backend/manual/phase-6-domain-service";
import { validatePayload } from "@/lib/backend/manual/validation";

const createSchema = z.object({
    id: z.string().min(1),
    employeeUid: z.string().min(1),
    date: z.string().min(1),
    status: z.enum(["present", "absent", "late", "leave"]),
    workedMinutes: z.number().int().min(0),
    notes: z.string().optional(),
});

export async function GET(request: NextRequest) {
    try {
        const { tenantId } = await authorizeDomainRequest(request, "attendance", "read");
        const employeeUid = request.nextUrl.searchParams.get("employeeUid") ?? undefined;
        return NextResponse.json({ attendance: listAttendance(tenantId, employeeUid) });
    } catch (error) {
        return toErrorResponse(error);
    }
}

export async function POST(request: NextRequest) {
    try {
        const { tenantId } = await authorizeDomainRequest(request, "attendance", "create");
        const payload = validatePayload(createSchema, await request.json());
        const attendance = createAttendance(tenantId, payload);
        return NextResponse.json({ attendance }, { status: 201 });
    } catch (error) {
        return toErrorResponse(error);
    }
}
