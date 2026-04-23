import { NextRequest } from "next/server";
import { authorizeRequest } from "@/lib/server/shared/auth/authorization";
import { Action, SessionClaims } from "@/lib/server/shared/types";
import { getCurrentInstanceKey } from "@/lib/shared/config";
import { readSessionClaims } from "@/lib/server/shared/auth/session";

export const authorizeDomainRoute = async (
    _request: NextRequest,
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
