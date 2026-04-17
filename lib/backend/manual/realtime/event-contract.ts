import { createHash } from "node:crypto";
import {
  RealtimeEventContract,
  RealtimeEventOperation,
  RealtimeBacklogReplay,
} from "@/lib/backend/manual/realtime/types";

const MAX_REPLAY_EVENTS = 500;

const buildEventId = (seed: string): string =>
  createHash("sha1").update(seed).digest("hex").slice(0, 24);

export const buildResumeToken = (sequence: number): string =>
  Buffer.from(`seq:${sequence}`).toString("base64url");

export const parseResumeToken = (token?: string | null): number | null => {
  if (!token) {
    return null;
  }

  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    if (!decoded.startsWith("seq:")) {
      return null;
    }

    const parsed = Number(decoded.slice(4));
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
  } catch {
    return null;
  }
};

interface CreateEventInput<TPayload> {
  sequence: number;
  operation: RealtimeEventOperation;
  tenantId: string;
  resource: string;
  resourceId: string;
  payload: TPayload;
  resourceOwnerUid?: string;
  actorUid?: string;
  occurredAt?: Date;
}

export const createRealtimeEvent = <TPayload>(
  input: CreateEventInput<TPayload>,
): RealtimeEventContract<TPayload> => {
  const occurredAt = (input.occurredAt ?? new Date()).toISOString();
  const resumeToken = buildResumeToken(input.sequence);

  return {
    eventId: buildEventId(
      [
        input.tenantId,
        input.resource,
        input.resourceId,
        input.operation,
        input.sequence,
        occurredAt,
      ].join(":"),
    ),
    operation: input.operation,
    tenantId: input.tenantId,
    resource: input.resource,
    resourceId: input.resourceId,
    payload: input.payload,
    resourceOwnerUid: input.resourceOwnerUid,
    actorUid: input.actorUid,
    sequence: input.sequence,
    occurredAt,
    resumeToken,
  };
};

export const replayEventsFromToken = <TPayload>(
  events: RealtimeEventContract<TPayload>[],
  resumeToken?: string,
): RealtimeBacklogReplay<TPayload> => {
  const sequence = parseResumeToken(resumeToken);

  if (sequence === null) {
    return {
      events: events.slice(-MAX_REPLAY_EVENTS),
      resumedFromToken: null,
    };
  }

  return {
    events: events.filter((event) => event.sequence > sequence).slice(-MAX_REPLAY_EVENTS),
    resumedFromToken: resumeToken ?? null,
  };
};
