import { NextRequest } from "next/server";
import { readSessionClaims } from "@/lib/backend/auth/session";
import { authorizeRequest } from "@/lib/backend/core/authorization";
import { toErrorResponse } from "@/lib/backend/core/errors";
import { getCurrentConfig, getCurrentInstanceKey } from "@/lib/backend/config";
import { AppDataResource } from "@/context/app-data-routes";
import {
    RealtimeEventMessage,
    RealtimeSnapshotMessage,
    RealtimeSubscriptionTarget,
} from "@/lib/realtime/protocol";
import {
    ensureMongoRealtimeWatchers,
    getRealtimeBroker,
    loadInitialRealtimeSnapshot,
} from "@/lib/backend/services/stream.service";

const encoder = new TextEncoder();

const parseTargets = (value: string | null): RealtimeSubscriptionTarget[] => {
    if (!value) {
        return [];
    }

    try {
        const parsed = JSON.parse(value) as RealtimeSubscriptionTarget[];
        return Array.isArray(parsed)
            ? parsed.filter(
                target =>
                    typeof target?.resource === "string" &&
                      (!target.filters ||
                          typeof target.filters === "object" ||
                          target.filters === undefined),
            )
            : [];
    } catch {
        return [];
    }
};

const writeEvent = (
    controller: ReadableStreamDefaultController<Uint8Array>,
    type: string,
    payload: unknown,
) => {
    controller.enqueue(encoder.encode(`event: ${type}\ndata: ${JSON.stringify(payload)}\n\n`));
};

export async function GET(request: NextRequest) {
    try {
        getCurrentConfig();
        const session = await readSessionClaims();
        const targets = parseTargets(request.nextUrl.searchParams.get("targets"));
        const instanceKey = getCurrentInstanceKey();

        if (targets.length === 0) {
            return Response.json(
                {
                    error: {
                        code: "TARGETS_REQUIRED",
                        message: "targets query parameter is required.",
                    },
                },
                { status: 400 },
            );
        }

        const authorizedSession = session;
        const authorizedTargets = targets.map(target => ({
            resource: target.resource as AppDataResource,
            filters: target.filters?.uid ? { uid: target.filters.uid } : undefined,
            session: authorizeRequest({
                session: authorizedSession,
                instanceKey,
                resource: target.resource,
                action: "read",
                resourceOwnerUid: target.filters?.uid,
            }),
        }));

        await ensureMongoRealtimeWatchers();
        const broker = getRealtimeBroker();

        const stream = new ReadableStream({
            async start(controller) {
                const subscriptions = [];

                for (const target of authorizedTargets) {
                    const initialSnapshot = await loadInitialRealtimeSnapshot({
                        resource: target.resource,
                        session: target.session,
                        instanceKey,
                        filters: target.filters,
                    });

                    const snapshotMessage: RealtimeSnapshotMessage = {
                        type: "snapshot",
                        resource: target.resource,
                        filters: target.filters,
                        data: (initialSnapshot[target.resource] as unknown[]) ?? [],
                        receivedAt: new Date().toISOString(),
                    };

                    writeEvent(controller, "snapshot", snapshotMessage);

                    const subscription = broker.subscribe(
                        {
                            session: target.session,
                            instanceKey,
                            resource: target.resource,
                            action: "read",
                            resourceOwnerUid: target.filters?.uid,
                            channelKey: `tenant:${instanceKey}:${target.resource}:${target.filters?.uid ?? "all"}`,
                        },
                        ({ event }) => {
                            const payloadRecord =
                                event.payload && typeof event.payload === "object"
                                    ? (event.payload as Record<string, unknown>)
                                    : null;
                            const resourcePayload = payloadRecord?.[target.resource];

                            if (Array.isArray(resourcePayload)) {
                                const snapshotMessage: RealtimeSnapshotMessage = {
                                    type: "snapshot",
                                    resource: target.resource,
                                    filters: target.filters,
                                    data: resourcePayload,
                                    receivedAt: new Date().toISOString(),
                                };
                                writeEvent(controller, "snapshot", snapshotMessage);
                                return;
                            }

                            const eventMessage: RealtimeEventMessage = {
                                type: "event",
                                resource: target.resource,
                                operation: event.operation,
                                documentId: event.resourceId,
                                filters: target.filters,
                                data:
                                    resourcePayload ??
                                    (payloadRecord ? event.payload : event.payload),
                                receivedAt: new Date().toISOString(),
                                sequence: event.sequence,
                                resumeToken: event.resumeToken,
                            };

                            writeEvent(controller, "event", eventMessage);
                        },
                    );

                    subscriptions.push(subscription);
                }

                const keepAliveId = setInterval(() => {
                    writeEvent(controller, "pong", {
                        type: "pong",
                        receivedAt: new Date().toISOString(),
                    });
                }, 15_000);

                request.signal.addEventListener("abort", () => {
                    clearInterval(keepAliveId);
                    subscriptions.forEach(subscription => subscription.unsubscribe());
                    controller.close();
                });
            },
        });

        return new Response(stream, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache, no-transform",
                Connection: "keep-alive",
            },
        });
    } catch (error) {
        return toErrorResponse(error);
    }
}
