import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { toErrorResponse } from "@/lib/server/shared/errors";
import { readSessionClaims } from "@/lib/server/shared/auth/session";
import { validatePayload } from "@/lib/server/shared/validation";
import { ModuleSettingsService } from "@/lib/server/hr-settings/module-settings/module-settings.service";
import { isModuleSettingsResource } from "@/lib/server/hr-settings/module-settings/module-settings.types";

const payloadSchema = z.record(z.string(), z.unknown());
const createSchema = z.object({ payload: payloadSchema });
const updateSchema = z.object({ id: z.string().min(1), payload: payloadSchema });
const deleteSchema = z.object({ id: z.string().min(1) });

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
        if (!isModuleSettingsResource(resource)) {
            return NextResponse.json(
                {
                    error: {
                        code: "INVALID_MODULE_SETTINGS_RESOURCE",
                        message: "Unsupported module settings resource.",
                    },
                },
                { status: 400 },
            );
        }
        const id = request.nextUrl.searchParams.get("id");
        const session = await readSessionClaims();
        const result = id
            ? await ModuleSettingsService.getResourceById(resource, id, session)
            : await ModuleSettingsService.listResource(resource, session);
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
        const resource = await resolveResource(params);
        if (!isModuleSettingsResource(resource)) {
            return NextResponse.json(
                {
                    error: {
                        code: "INVALID_MODULE_SETTINGS_RESOURCE",
                        message: "Unsupported module settings resource.",
                    },
                },
                { status: 400 },
            );
        }
        const body = validatePayload(createSchema, await request.json());
        const session = await readSessionClaims();
        const result = await ModuleSettingsService.createResource(
            resource,
            body.payload as never,
            session,
        );
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
        const resource = await resolveResource(params);
        if (!isModuleSettingsResource(resource)) {
            return NextResponse.json(
                {
                    error: {
                        code: "INVALID_MODULE_SETTINGS_RESOURCE",
                        message: "Unsupported module settings resource.",
                    },
                },
                { status: 400 },
            );
        }
        const body = validatePayload(updateSchema, await request.json());
        const session = await readSessionClaims();
        const result = await ModuleSettingsService.updateResource(
            resource,
            body.id,
            body.payload as never,
            session,
        );
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
        const resource = await resolveResource(params);
        if (!isModuleSettingsResource(resource)) {
            return NextResponse.json(
                {
                    error: {
                        code: "INVALID_MODULE_SETTINGS_RESOURCE",
                        message: "Unsupported module settings resource.",
                    },
                },
                { status: 400 },
            );
        }
        const body = validatePayload(deleteSchema, await request.json());
        const session = await readSessionClaims();
        const result = await ModuleSettingsService.deleteResource(resource, body.id, session);
        return NextResponse.json({ message: result.message, ...result.data });
    } catch (error) {
        return toErrorResponse(error);
    }
}
