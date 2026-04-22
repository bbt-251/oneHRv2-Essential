import { NextRequest } from "next/server";
import { readSessionClaims } from "@/lib/backend/auth/session";
import { authorizeRequest } from "@/lib/backend/core/authorization";
import { Action, SessionClaims } from "@/lib/backend/core/types";
import { getCurrentInstanceKey } from "@/lib/backend/config";

export const authorizeDomainRoute = async (
    request: NextRequest,
    resource: string,
    action: Action,
    resourceOwnerUid?: string,
): Promise<{ session: SessionClaims; instanceKey: string }> => {
    const session = await readSessionClaims();
    const instanceKey = getCurrentInstanceKey();

    const authorizedSession = authorizeRequest({
        session,
        instanceKey,
        resource,
        action,
        resourceOwnerUid,
    });

    return {
        session: authorizedSession,
        instanceKey,
    };
};
