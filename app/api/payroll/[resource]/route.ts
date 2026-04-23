import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { toErrorResponse } from "@/lib/server/shared/errors";
import { PayrollService } from "@/lib/server/payroll/payroll.service";
import { readSessionClaims } from "@/lib/server/shared/auth/session";
import { validatePayload } from "@/lib/server/shared/validation";

const payloadSchema = z.record(z.string(), z.unknown());

const updateSchema = z.object({
    id: z.string().min(1).optional(),
    payload: payloadSchema.optional(),
});

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ resource: string }> },
) {
    try {
        const session = await readSessionClaims();
        const { resource } = await params;
        const normalized = PayrollService.getResource(resource);
        const searchParams = request.nextUrl.searchParams;
        const filters = {
            employeeUid: searchParams.get("employeeUid") || undefined,
        };

        const result =
            normalized === "compensations"
                ? await PayrollService.listCompensations(filters, session)
                : normalized === "loans"
                    ? await PayrollService.listLoans(filters, session)
                    : await PayrollService.getSettings(session);

        return NextResponse.json({ message: result.message, ...result.data });
    } catch (error) {
        return toErrorResponse(error);
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ resource: string }> },
) {
    try {
        const session = await readSessionClaims();
        const { resource } = await params;
        const normalized = PayrollService.getResource(resource);
        const body = validatePayload(updateSchema, await request.json());
        const payload = body.payload ?? {};

        const result =
            normalized === "compensations"
                ? await PayrollService.createCompensation(payload, session)
                : normalized === "loans"
                    ? await PayrollService.createLoan(payload, session)
                    : await PayrollService.updateSettings(payload, session);

        return NextResponse.json({ message: result.message, ...result.data }, { status: 201 });
    } catch (error) {
        return toErrorResponse(error);
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ resource: string }> },
) {
    try {
        const session = await readSessionClaims();
        const { resource } = await params;
        const normalized = PayrollService.getResource(resource);
        const body = validatePayload(updateSchema, await request.json());
        const payload = body.payload ?? {};

        const result =
            normalized === "compensations"
                ? await PayrollService.updateCompensation(body.id ?? "", payload, session)
                : normalized === "loans"
                    ? await PayrollService.updateLoan(body.id ?? "", payload, session)
                    : await PayrollService.updateSettings(payload, session);

        return NextResponse.json({ message: result.message, ...result.data });
    } catch (error) {
        return toErrorResponse(error);
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ resource: string }> },
) {
    try {
        const session = await readSessionClaims();
        const { resource } = await params;
        const normalized = PayrollService.getResource(resource);
        const body = validatePayload(updateSchema, await request.json());

        const result =
            normalized === "compensations"
                ? await PayrollService.deleteCompensation(body.id ?? "", session)
                : await PayrollService.deleteLoan(body.id ?? "", session);

        return NextResponse.json({ message: result.message, ...result.data });
    } catch (error) {
        return toErrorResponse(error);
    }
}
