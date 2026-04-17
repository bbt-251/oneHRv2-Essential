import { ManualRealtimeBroker } from "@/lib/backend/manual/realtime/subscription-broker";
import { RealtimeEventOperation } from "@/lib/backend/manual/realtime/types";

export interface ManualChangeStreamEvent<TPayload = unknown> {
  operation: RealtimeEventOperation;
  tenantId: string;
  resource: string;
  resourceId: string;
  payload: TPayload;
  resourceOwnerUid?: string;
  actorUid?: string;
}

export interface ManualChangeStreamSource {
  start: (onEvent: (event: ManualChangeStreamEvent) => void) => Promise<() => Promise<void> | void>;
}

export class ManualChangeStreamListenerService {
  private stopFn: (() => Promise<void> | void) | null = null;

  constructor(
    private readonly source: ManualChangeStreamSource,
    private readonly broker: ManualRealtimeBroker,
  ) {}

  async start(): Promise<void> {
    if (this.stopFn) {
      return;
    }

    this.stopFn = await this.source.start((event) => {
      this.broker.publish(event);
    });
  }

  async stop(): Promise<void> {
    if (!this.stopFn) {
      return;
    }

    await this.stopFn();
    this.stopFn = null;
  }
}

export class MemoryChangeStreamSource implements ManualChangeStreamSource {
  private handler: ((event: ManualChangeStreamEvent) => void) | null = null;

  async start(onEvent: (event: ManualChangeStreamEvent) => void) {
    this.handler = onEvent;
    return async () => {
      this.handler = null;
    };
  }

  emit(event: ManualChangeStreamEvent): void {
    this.handler?.(event);
  }
}
