import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { readSessionClaims } from "@/lib/server/shared/auth/session";
import { validatePayload } from "@/lib/server/shared/validation";
import { toErrorResponse } from "@/lib/server/shared/errors";
import { EmployeeService } from "@/lib/server/employee/employee.service";

const payloadSchema = z.record(z.string(), z.unknown());

const createEmployeeSchema = z.object({
    payload: payloadSchema,
});

const updateEmployeeSchema = z.object({
    id: z.string().min(1),
    payload: payloadSchema,
});

const deleteEmployeeSchema = z.object({
    id: z.string().min(1),
    cascade: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
    try {
        const session = await readSessionClaims();
        const searchParams = request.nextUrl.searchParams;
        const uids = searchParams.getAll("uids").filter(Boolean);
        const result = await EmployeeService.listEmployees(
            {
                id: searchParams.get("id") || undefined,
                department: searchParams.get("department") || undefined,
                uid: searchParams.get("uid") || undefined,
                companyEmail: searchParams.get("companyEmail") || undefined,
                personalEmail: searchParams.get("personalEmail") || undefined,
                uids: uids.length ? uids : undefined,
            },
            session,
        );

        return NextResponse.json({
            message: result.message,
            ...result.data,
        });
    } catch (error) {
        return toErrorResponse(error);
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = validatePayload(createEmployeeSchema, await request.json());
        const session = await readSessionClaims();
        const result = await EmployeeService.createEmployee(body.payload as never, session);
        return NextResponse.json(
            {
                message: result.message,
                ...result.data,
            },
            { status: 201 },
        );
    } catch (error) {
        return toErrorResponse(error);
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const body = validatePayload(updateEmployeeSchema, await request.json());
        const session = await readSessionClaims();

        if (
            Array.isArray((body.payload as Record<string, unknown>).employees) &&
            (body.payload as Record<string, unknown>).employees?.every(
                employee =>
                    employee &&
                    typeof employee === "object" &&
                    "id" in employee &&
                    typeof (employee as { id?: unknown }).id === "string",
            )
        ) {
            const result = await EmployeeService.batchUpdateEmployees(
                (body.payload as { employees: (Record<string, unknown> & { id: string })[] })
                    .employees as never,
                session,
            );
            return NextResponse.json({
                message: result.message,
                ...result.data,
            });
        }

        if ((body.payload as Record<string, unknown>).appendClaimedOvertime === true) {
            const payload = body.payload as {
                employeeDocIds?: string[];
                overtimeRequestId?: string;
            };
            const result = await EmployeeService.appendClaimedOvertime(
                payload.employeeDocIds ?? [],
                payload.overtimeRequestId ?? "",
                session,
            );
            return NextResponse.json({
                message: result.message,
                ...result.data,
            });
        }

        const result = await EmployeeService.updateEmployee(
            {
                id: body.id,
                ...(body.payload as Record<string, unknown>),
            } as never,
            session,
        );
        return NextResponse.json({
            message: result.message,
            ...result.data,
        });
    } catch (error) {
        return toErrorResponse(error);
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const body = validatePayload(deleteEmployeeSchema, await request.json());
        const session = await readSessionClaims();
        const result = await EmployeeService.deleteEmployee(body.id, session, {
            cascade: body.cascade,
        });
        return NextResponse.json({
            message: result.message,
            ...result.data,
        });
    } catch (error) {
        return toErrorResponse(error);
    }
}
