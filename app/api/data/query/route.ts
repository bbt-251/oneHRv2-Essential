import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { readSessionClaims } from "@/lib/backend/auth/session";
import { authorizeRequest } from "@/lib/backend/core/authorization";
import { toErrorResponse } from "@/lib/backend/core/errors";
import {
    CompactDataResource,
    queryCompactResource,
    resolveResourceOwnerUid,
} from "@/lib/backend/services/data-dispatcher.service";
import { COMPACT_DATA_RESOURCES } from "@/lib/backend/services/resource-types";
import { validatePayload } from "@/lib/backend/core/validation";
import { getCurrentConfig, getCurrentInstanceKey } from "@/lib/backend/config";

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
        const resourceOwnerUid = await resolveResourceOwnerUid({
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

        const data = await queryCompactResource({
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
