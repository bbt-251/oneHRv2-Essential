import { ManualApiError } from "@/lib/server/shared/errors";
import { canAccessResource } from "@/lib/server/shared/auth/database-rules";
import {
    RealtimeEventContract,
    RealtimePolicyContext,
    RealtimeSubscriptionRequest,
} from "@/lib/server/shared/realtime/types";

export const assertRealtimeSubscriptionPolicy = (request: RealtimeSubscriptionRequest): void => {
    const allowed = canAccessResource({
        session: request.session,
        instanceKey: request.instanceKey,
        resource: request.resource,
        action: request.action ?? "read",
        resourceOwnerUid: request.resourceOwnerUid,
    });

    if (!allowed) {
        throw new ManualApiError(
            403,
            "REALTIME_SUBSCRIPTION_DENIED",
            "Realtime subscription denied by policy matrix.",
        );
    }
};

export const canReceiveRealtimeEvent = (
    context: RealtimePolicyContext,
    event: RealtimeEventContract,
): boolean => {
    if (context.instanceKey !== event.instanceKey) {
        return false;
    }

    if (context.resource !== event.resource) {
        return false;
    }

    return canAccessResource({
        session: context.session,
        instanceKey: context.instanceKey,
        resource: context.resource,
        action: context.action,
        resourceOwnerUid: event.resourceOwnerUid,
    });
};
