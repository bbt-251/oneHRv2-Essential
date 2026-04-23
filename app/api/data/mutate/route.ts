import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { readSessionClaims } from "@/lib/server/shared/auth/session";
import { authorizeRequest } from "@/lib/server/shared/auth/authorization";
import { toErrorResponse } from "@/lib/server/shared/errors";
import { CompactDataResource, COMPACT_DATA_RESOURCES } from "@/lib/server/shared/resource-types";
import { validatePayload } from "@/lib/server/shared/validation";
import { getCurrentConfig, getCurrentInstanceKey } from "@/lib/shared/config";
import { DataResourceDispatcher } from "@/lib/server/shared/data-resource-dispatcher";

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
        const resourceOwnerUid = await DataResourceDispatcher.resolveOwnerUid({
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

        const data = await DataResourceDispatcher.mutate({
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
