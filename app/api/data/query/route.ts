import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { readSessionClaims } from "@/lib/server/shared/auth/session";
import { authorizeRequest } from "@/lib/server/shared/auth/authorization";
import { toErrorResponse } from "@/lib/server/shared/errors";
import { CompactDataResource, COMPACT_DATA_RESOURCES } from "@/lib/server/shared/resource-types";
import { validatePayload } from "@/lib/server/shared/validation";
import { getCurrentConfig, getCurrentInstanceKey } from "@/lib/shared/config";
import { DataResourceDispatcher } from "@/lib/server/shared/data-resource-dispatcher";

const querySchema = z.object({
    resource: z.enum(COMPACT_DATA_RESOURCES),
    filters: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: NextRequest) {
    try {
        getCurrentConfig();
        const payload = validatePayload(querySchema, await request.json());
        const session = await readSessionClaims();
        const instanceKey = getCurrentInstanceKey();
        const resource = payload.resource as CompactDataResource;
        const resourceOwnerUid = await DataResourceDispatcher.resolveOwnerUid({
            resource,
            payload: payload.filters,
        });

        authorizeRequest({
            session,
            instanceKey,
            resource,
            action: "read",
            resourceOwnerUid,
        });

        const data = await DataResourceDispatcher.query({
            resource,
            instanceKey,
            session: session!,
            filters: payload.filters,
        });

        return NextResponse.json(data);
    } catch (error) {
        return toErrorResponse(error);
    }
}
