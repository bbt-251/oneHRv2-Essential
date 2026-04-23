import { ManualApiError } from "@/lib/server/shared/errors";
import { assertCanAccess } from "@/lib/server/shared/auth/database-rules";
import { Action, SessionClaims } from "@/lib/server/shared/types";

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
