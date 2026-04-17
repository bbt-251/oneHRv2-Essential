import { ManualAction, ManualSessionClaims } from "@/lib/backend/manual/types";

export type RealtimeEventOperation = "added" | "modified" | "removed";

export interface RealtimeEventContract<TPayload = unknown> {
  eventId: string;
  operation: RealtimeEventOperation;
  tenantId: string;
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
  session: ManualSessionClaims;
  tenantId: string;
  resource: string;
  action?: ManualAction;
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
  session: ManualSessionClaims;
  tenantId: string;
  resource: string;
  action: ManualAction;
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
