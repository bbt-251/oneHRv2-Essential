import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { readSessionClaims } from "@/lib/backend/auth/session";
import { authorizeRequest } from "@/lib/backend/core/authorization";
import { toErrorResponse } from "@/lib/backend/core/errors";
import {
    CompactDataResource,
    mutateCompactResource,
    resolveResourceOwnerUid,
} from "@/lib/backend/services/data-dispatcher.service";
import { COMPACT_DATA_RESOURCES } from "@/lib/backend/services/resource-types";
import { validatePayload } from "@/lib/backend/core/validation";
import { getCurrentConfig, getCurrentInstanceKey } from "@/lib/backend/config";

const mutateSchema = z.object({
    resource: z.enum(COMPACT_DATA_RESOURCES),
    action: z.enum(["create", "update", "delete"]),
    targetId: z.string().min(1).optional(),
    payload: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: NextRequest) {
    try {
        getCurrentConfig();
        const payload = validatePayload(mutateSchema, await request.json());
        const session = await readSessionClaims();
        const instanceKey = getCurrentInstanceKey();
        const resource = payload.resource as CompactDataResource;
        const resourceOwnerUid = await resolveResourceOwnerUid({
            resource,
            payload: payload.payload,
            targetId: payload.targetId,
        });

        authorizeRequest({
            session,
            instanceKey,
            resource,
            action: payload.action,
            resourceOwnerUid,
        });

        const data = await mutateCompactResource({
            resource,
            action: payload.action,
            instanceKey,
            payload: payload.payload,
            targetId: payload.targetId,
        });

        return NextResponse.json(data, { status: payload.action === "create" ? 201 : 200 });
    } catch (error) {
        return toErrorResponse(error);
    }
}
