import { randomUUID } from "node:crypto";
import {
    createRealtimeEvent,
    replayEventsFromToken,
} from "@/lib/server/shared/realtime/event-contract";
import {
    assertRealtimeSubscriptionPolicy,
    canReceiveRealtimeEvent,
} from "@/lib/server/shared/realtime/policy";
import {
    RealtimeDeliveryEnvelope,
    RealtimeEventContract,
    RealtimeEventOperation,
    RealtimeSubscriber,
    RealtimeSubscriptionHandle,
    RealtimeSubscriptionRequest,
} from "@/lib/server/shared/realtime/types";

interface BrokerSubscriber {
    id: string;
    request: RealtimeSubscriptionRequest;
    onEvent: RealtimeSubscriber;
    onReplay?: (events: RealtimeEventContract[]) => void;
    pending: RealtimeEventContract[];
    flushTimer: NodeJS.Timeout | null;
}

interface PublishInput<TPayload> {
    operation: RealtimeEventOperation;
    instanceKey: string;
    resource: string;
    resourceId: string;
    payload: TPayload;
    resourceOwnerUid?: string;
    actorUid?: string;
}

interface BrokerOptions {
    keepAliveMs?: number;
    throttleMs?: number;
    maxBacklogSize?: number;
}

export class ManualRealtimeBroker {
    private readonly subscribers = new Map<string, BrokerSubscriber>();

    private readonly eventBacklog: RealtimeEventContract[] = [];

    private sequence = 0;

    private readonly keepAliveMs: number;

    private readonly throttleMs: number;

    private readonly maxBacklogSize: number;

    constructor(options?: BrokerOptions) {
        this.keepAliveMs = options?.keepAliveMs ?? 15_000;
        this.throttleMs = options?.throttleMs ?? 120;
        this.maxBacklogSize = options?.maxBacklogSize ?? 1_000;
    }

    subscribe(
        request: RealtimeSubscriptionRequest,
        onEvent: RealtimeSubscriber,
        onReplay?: (events: RealtimeEventContract[]) => void,
    ): RealtimeSubscriptionHandle {
        assertRealtimeSubscriptionPolicy(request);

        const subscriptionId = randomUUID();
        const subscriber: BrokerSubscriber = {
            id: subscriptionId,
            request,
            onEvent,
            onReplay,
            pending: [],
            flushTimer: null,
        };

        const replay = replayEventsFromToken(this.eventBacklog, request.resumeToken);
        const filteredReplay = replay.events.filter(event =>
            canReceiveRealtimeEvent(
                {
                    session: request.session,
                    instanceKey: request.instanceKey,
                    resource: request.resource,
                    action: request.action ?? "read",
                    resourceOwnerUid: request.resourceOwnerUid,
                },
                event,
            ),
        );

        if (filteredReplay.length > 0 && subscriber.onReplay) {
            subscriber.onReplay(filteredReplay);
        }

        this.subscribers.set(subscriptionId, subscriber);

        return {
            subscriptionId,
            keepAliveMs: this.keepAliveMs,
            unsubscribe: () => this.unsubscribe(subscriptionId),
        };
    }

    publish<TPayload>(input: PublishInput<TPayload>): RealtimeEventContract<TPayload> {
        this.sequence += 1;

        const event = createRealtimeEvent({
            sequence: this.sequence,
            operation: input.operation,
            instanceKey: input.instanceKey,
            resource: input.resource,
            resourceId: input.resourceId,
            payload: input.payload,
            resourceOwnerUid: input.resourceOwnerUid,
            actorUid: input.actorUid,
        });

        this.eventBacklog.push(event);
        if (this.eventBacklog.length > this.maxBacklogSize) {
            this.eventBacklog.splice(0, this.eventBacklog.length - this.maxBacklogSize);
        }

        this.subscribers.forEach(subscriber => {
            const allowed = canReceiveRealtimeEvent(
                {
                    session: subscriber.request.session,
                    instanceKey: subscriber.request.instanceKey,
                    resource: subscriber.request.resource,
                    action: subscriber.request.action ?? "read",
                    resourceOwnerUid: subscriber.request.resourceOwnerUid,
                },
                event,
            );

            if (!allowed) {
                return;
            }

            subscriber.pending.push(event);
            this.scheduleFlush(subscriber);
        });

        return event;
    }

    stop(): void {
        this.subscribers.forEach(subscriber => {
            if (subscriber.flushTimer) {
                clearTimeout(subscriber.flushTimer);
            }
        });
        this.subscribers.clear();
    }

    private unsubscribe(subscriptionId: string): void {
        const subscriber = this.subscribers.get(subscriptionId);
        if (!subscriber) {
            return;
        }

        if (subscriber.flushTimer) {
            clearTimeout(subscriber.flushTimer);
        }

        this.subscribers.delete(subscriptionId);
    }

    private scheduleFlush(subscriber: BrokerSubscriber): void {
        if (subscriber.flushTimer) {
            return;
        }

        subscriber.flushTimer = setTimeout(() => {
            subscriber.flushTimer = null;
            const batch = subscriber.pending.splice(0, subscriber.pending.length);

            batch.forEach(event => {
                const envelope: RealtimeDeliveryEnvelope = {
                    event,
                    deliveredAt: new Date().toISOString(),
                };
                subscriber.onEvent(envelope);
            });
        }, this.throttleMs);
    }
}

let singletonBroker: ManualRealtimeBroker | null = null;

export const getManualRealtimeBroker = (): ManualRealtimeBroker => {
    if (!singletonBroker) {
        singletonBroker = new ManualRealtimeBroker();
    }

    return singletonBroker;
};
