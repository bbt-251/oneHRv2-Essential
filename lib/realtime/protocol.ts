import { AppDataResource } from "@/context/app-data-routes";

export type RealtimeEventOperation = "added" | "modified" | "removed";

export interface RealtimeSubscriptionFilters {
    uid?: string;
}

export interface RealtimeSubscriptionTarget {
    resource: AppDataResource;
    filters?: RealtimeSubscriptionFilters;
}

export interface RealtimeSubscribeMessage {
    type: "subscribe";
    resources: RealtimeSubscriptionTarget[];
}

export interface RealtimeUnsubscribeMessage {
    type: "unsubscribe";
    resources: RealtimeSubscriptionTarget[];
}

export interface RealtimePingMessage {
    type: "ping";
    sentAt: string;
}

export type ClientRealtimeMessage =
    | RealtimeSubscribeMessage
    | RealtimeUnsubscribeMessage
    | RealtimePingMessage;

export interface RealtimeSnapshotMessage<TPayload = unknown> {
    type: "snapshot";
    resource: AppDataResource;
    filters?: RealtimeSubscriptionFilters;
    data: TPayload[];
    receivedAt: string;
}

export interface RealtimeEventMessage<TPayload = unknown> {
    type: "event";
    resource: AppDataResource;
    operation: RealtimeEventOperation;
    documentId: string;
    filters?: RealtimeSubscriptionFilters;
    data?: TPayload;
    receivedAt: string;
    sequence?: number;
    resumeToken?: string;
}

export interface RealtimeAckMessage {
    type: "ack";
    action: "subscribe" | "unsubscribe" | "reconnect";
    resources?: RealtimeSubscriptionTarget[];
    receivedAt: string;
}

export interface RealtimeErrorMessage {
    type: "error";
    code: string;
    message: string;
    resource?: AppDataResource;
    receivedAt: string;
}

export interface RealtimePongMessage {
    type: "pong";
    receivedAt: string;
}

export type ServerRealtimeMessage<TPayload = unknown> =
    | RealtimeSnapshotMessage<TPayload>
    | RealtimeEventMessage<TPayload>
    | RealtimeAckMessage
    | RealtimeErrorMessage
    | RealtimePongMessage;

export const buildRealtimeSubscriptionKey = (target: RealtimeSubscriptionTarget): string => {
    const uid = target.filters?.uid ?? "";
    return `${target.resource}:${uid}`;
};

export const uniqueRealtimeTargets = (
    targets: readonly RealtimeSubscriptionTarget[],
): RealtimeSubscriptionTarget[] => {
    const seen = new Set<string>();

    return targets.filter(target => {
        const key = buildRealtimeSubscriptionKey(target);
        if (seen.has(key)) {
            return false;
        }

        seen.add(key);
        return true;
    });
};
