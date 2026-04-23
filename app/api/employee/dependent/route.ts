import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { readSessionClaims } from "@/lib/server/shared/auth/session";
import { validatePayload } from "@/lib/server/shared/validation";
import { toErrorResponse } from "@/lib/server/shared/errors";
import { EmployeeService } from "@/lib/server/employee/employee.service";

const payloadSchema = z.record(z.string(), z.unknown());

const createDependentSchema = z.object({
    payload: payloadSchema,
});

const updateDependentSchema = z.object({
    id: z.string().min(1),
    payload: payloadSchema,
});

const deleteDependentSchema = z.object({
    id: z.string().min(1),
    relatedTo: z.string().optional(),
});

export async function GET(request: NextRequest) {
    try {
        const session = await readSessionClaims();
        const employeeId = request.nextUrl.searchParams.get("employeeId");
        if (!employeeId) {
            return NextResponse.json(
                {
                    error: {
                        code: "EMPLOYEE_ID_REQUIRED",
                        message: "employeeId is required.",
                    },
                },
                { status: 400 },
            );
        }

        const result = await EmployeeService.listDependents(employeeId, session);
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
        const body = validatePayload(createDependentSchema, await request.json());
        const session = await readSessionClaims();
        const result = await EmployeeService.createDependent(body.payload as never, session);
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
        const body = validatePayload(updateDependentSchema, await request.json());
        const session = await readSessionClaims();
        const result = await EmployeeService.updateDependent(
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
        const body = validatePayload(deleteDependentSchema, await request.json());
        const session = await readSessionClaims();
        const result = await EmployeeService.deleteDependent(body.id, body.relatedTo, session);
        return NextResponse.json({
            message: result.message,
            ...result.data,
        });
    } catch (error) {
        return toErrorResponse(error);
    }
}
