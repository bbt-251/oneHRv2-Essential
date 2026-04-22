import { Action, SessionClaims } from "@/lib/backend/core/types";

export type RealtimeEventOperation = "added" | "modified" | "removed";

export interface RealtimeEventContract<TPayload = unknown> {
    eventId: string;
    operation: RealtimeEventOperation;
    instanceKey: string;
    resource: string;
    resourceId: string;
    resourceOwnerUid?: string;
    actorUid?: string;
    sequence: number;
    occurredAt: string;
    payload: TPayload;
    resumeToken: string;
}

export interface RealtimeSubscriptionRequest {
    session: SessionClaims;
    instanceKey: string;
    resource: string;
    action?: Action;
    resourceOwnerUid?: string;
    channelKey?: string;
    resumeToken?: string;
}

export interface RealtimeDeliveryEnvelope<TPayload = unknown> {
    event: RealtimeEventContract<TPayload>;
    deliveredAt: string;
}

export interface RealtimeBacklogReplay<TPayload = unknown> {
    events: RealtimeEventContract<TPayload>[];
    resumedFromToken: string | null;
}

export interface RealtimePolicyContext {
    session: SessionClaims;
    instanceKey: string;
    resource: string;
    action: Action;
    resourceOwnerUid?: string;
}

export type RealtimeSubscriber<TPayload = unknown> = (
    envelope: RealtimeDeliveryEnvelope<TPayload>,
) => void;

export interface RealtimeSubscriptionHandle {
    subscriptionId: string;
    keepAliveMs: number;
    unsubscribe: () => void;
}
