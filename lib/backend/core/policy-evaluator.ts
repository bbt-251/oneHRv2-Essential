import { assertCanAccess, canAccessResource } from "@/lib/backend/database-rules";
import { Action, SessionClaims } from "@/lib/backend/core/types";

interface PolicyCheckInput {
    session: SessionClaims;
    resource: string;
    action: Action;
    resourceOwnerUid?: string;
    instanceKey: string;
}

export const evaluatePolicy = ({
    session,
    resource,
    action,
    resourceOwnerUid,
    instanceKey,
}: PolicyCheckInput): boolean => {
    return canAccessResource({
        session,
        resource,
        action,
        resourceOwnerUid,
        instanceKey,
    });
};

export const requirePolicy = (input: PolicyCheckInput): void => {
    assertCanAccess(input);
};
