import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { toErrorResponse } from "@/lib/server/shared/errors";
import { readSessionClaims } from "@/lib/server/shared/auth/session";
import { validatePayload } from "@/lib/server/shared/validation";
import { CoreSettingsService } from "@/lib/server/hr-settings/core-settings/core-settings.service";
import { isCoreSettingsResource } from "@/lib/server/hr-settings/core-settings/core-settings.types";

const payloadSchema = z.record(z.string(), z.unknown());

const createSchema = z.object({
    payload: payloadSchema,
});

const updateSchema = z.object({
    id: z.string().min(1),
    payload: payloadSchema,
});

const deleteSchema = z.object({
    id: z.string().min(1),
});

const resolveResource = async (params: Promise<{ resource: string }>): Promise<string> => {
    const { resource } = await params;
    return resource;
};

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ resource: string }> },
) {
    try {
        const resource = await resolveResource(params);
        if (!isCoreSettingsResource(resource)) {
            return NextResponse.json(
                {
                    error: {
                        code: "INVALID_CORE_SETTINGS_RESOURCE",
                        message: "Unsupported core settings resource.",
                    },
                },
                { status: 400 },
            );
        }

        const id = request.nextUrl.searchParams.get("id");
        const session = await readSessionClaims();
        const result = id
            ? await CoreSettingsService.getResourceById(resource, id, session)
            : await CoreSettingsService.listResource(resource, session);

        return NextResponse.json({
            message: result.message,
            ...result.data,
        });
    } catch (error) {
        return toErrorResponse(error);
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ resource: string }> },
) {
    try {
        const resource = await resolveResource(params);
        if (!isCoreSettingsResource(resource)) {
            return NextResponse.json(
                {
                    error: {
                        code: "INVALID_CORE_SETTINGS_RESOURCE",
                        message: "Unsupported core settings resource.",
                    },
                },
                { status: 400 },
            );
        }

        const body = validatePayload(createSchema, await request.json());
        const session = await readSessionClaims();
        const result = await CoreSettingsService.createResource(
            resource,
            body.payload as never,
            session,
        );

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

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ resource: string }> },
) {
    try {
        const resource = await resolveResource(params);
        if (!isCoreSettingsResource(resource)) {
            return NextResponse.json(
                {
                    error: {
                        code: "INVALID_CORE_SETTINGS_RESOURCE",
                        message: "Unsupported core settings resource.",
                    },
                },
                { status: 400 },
            );
        }

        const body = validatePayload(updateSchema, await request.json());
        const session = await readSessionClaims();
        const result = await CoreSettingsService.updateResource(
            resource,
            body.id,
            body.payload as never,
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

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ resource: string }> },
) {
    try {
        const resource = await resolveResource(params);
        if (!isCoreSettingsResource(resource)) {
            return NextResponse.json(
                {
                    error: {
                        code: "INVALID_CORE_SETTINGS_RESOURCE",
                        message: "Unsupported core settings resource.",
                    },
                },
                { status: 400 },
            );
        }

        const body = validatePayload(deleteSchema, await request.json());
        const session = await readSessionClaims();
        const result = await CoreSettingsService.deleteResource(resource, body.id, session);

        return NextResponse.json({
            message: result.message,
            ...result.data,
        });
    } catch (error) {
        return toErrorResponse(error);
    }
}
