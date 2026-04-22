import { ManualApiError } from "@/lib/backend/core/errors";
import { assertCanAccess } from "@/lib/backend/database-rules";
import { Action, SessionClaims } from "@/lib/backend/core/types";

interface AuthorizationInput {
    session: SessionClaims | null;
    instanceKey: string;
    resource: string;
    action: Action;
    resourceOwnerUid?: string;
}

export const authorizeRequest = ({
    session,
    instanceKey,
    resource,
    action,
    resourceOwnerUid,
}: AuthorizationInput): SessionClaims => {
    if (!session) {
        throw new ManualApiError(401, "UNAUTHENTICATED", "Authentication is required.");
    }

    assertCanAccess({
        session,
        instanceKey,
        resource,
        action,
        resourceOwnerUid,
    });

    return session;
};
