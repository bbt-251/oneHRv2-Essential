import { NextRequest } from "next/server";
import { readSessionClaims } from "@/lib/server/shared/auth/session";
import { authorizeRequest } from "@/lib/server/shared/auth/authorization";
import { toErrorResponse } from "@/lib/server/shared/errors";
import { getCurrentConfig, getCurrentInstanceKey } from "@/lib/shared/config";
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
} from "@/lib/server/shared/realtime/stream.service";

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
                let streamClosed = false;
                let keepAliveId: ReturnType<typeof setInterval> | null = null;

                const safeWriteEvent = (type: string, payload: unknown) => {
                    if (streamClosed) {
                        return;
                    }

                    try {
                        writeEvent(controller, type, payload);
                    } catch (error) {
                        const isClosedControllerError =
                            error instanceof TypeError &&
                            error.message.includes("Controller is already closed");

                        if (!isClosedControllerError) {
                            throw error;
                        }

                        cleanup();
                    }
                };

                const cleanup = () => {
                    if (streamClosed) {
                        return;
                    }

                    streamClosed = true;
                    if (keepAliveId !== null) {
                        clearInterval(keepAliveId);
                        keepAliveId = null;
                    }
                    subscriptions.forEach(subscription => subscription.unsubscribe());

                    try {
                        controller.close();
                    } catch {
                        // Ignore double-close races during request teardown.
                    }
                };

                const initialSnapshots = await Promise.all(
                    authorizedTargets.map(async target => ({
                        target,
                        initialSnapshot: await loadInitialRealtimeSnapshot({
                            resource: target.resource,
                            session: target.session,
                            instanceKey,
                            filters: target.filters,
                        }),
                    })),
                );

                for (const { target, initialSnapshot } of initialSnapshots) {
                    const snapshotMessage: RealtimeSnapshotMessage = {
                        type: "snapshot",
                        resource: target.resource,
                        filters: target.filters,
                        data: (initialSnapshot[target.resource] as unknown[]) ?? [],
                        receivedAt: new Date().toISOString(),
                    };

                    safeWriteEvent("snapshot", snapshotMessage);

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
                                safeWriteEvent("snapshot", snapshotMessage);
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

                            safeWriteEvent("event", eventMessage);
                        },
                    );

                    subscriptions.push(subscription);
                }

                keepAliveId = setInterval(() => {
                    safeWriteEvent("pong", {
                        type: "pong",
                        receivedAt: new Date().toISOString(),
                    });
                }, 15_000);

                request.signal.addEventListener("abort", cleanup);
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
