import { NextRequest } from "next/server";
import { readSessionClaims } from "@/lib/backend/auth/session";
import { authorizeRequest } from "@/lib/backend/core/authorization";
import { toErrorResponse } from "@/lib/backend/core/errors";
import { getCurrentConfig, getCurrentInstanceKey } from "@/lib/backend/config";
import {
    getRealtimeBroker,
    loadInitialRealtimeSnapshot,
} from "@/lib/backend/services/stream.service";

const encoder = new TextEncoder();

export async function GET(request: NextRequest) {
    try {
        getCurrentConfig();
        const session = await readSessionClaims();
        const resource = request.nextUrl.searchParams.get("resource");
        const uid = request.nextUrl.searchParams.get("uid");
        const instanceKey = getCurrentInstanceKey();
        const resumeToken = request.nextUrl.searchParams.get("resumeToken") ?? undefined;

        if (!resource) {
            return Response.json(
                {
                    error: {
                        code: "RESOURCE_REQUIRED",
                        message: "resource query parameter is required.",
                    },
                },
                { status: 400 },
            );
        }

        const authorizedSession = authorizeRequest({
            session,
            instanceKey,
            resource,
            action: "read",
            resourceOwnerUid: uid || undefined,
        });

        const broker = getRealtimeBroker();

        const stream = new ReadableStream({
            async start(controller) {
                const initialSnapshot = await loadInitialRealtimeSnapshot({
                    resource,
                    session: authorizedSession,
                    instanceKey,
                    filters: {
                        uid: uid || undefined,
                    },
                });

                controller.enqueue(
                    encoder.encode(`event: snapshot\ndata: ${JSON.stringify(initialSnapshot)}\n\n`),
                );

                const subscription = broker.subscribe(
                    {
                        session: authorizedSession,
                        instanceKey,
                        resource,
                        action: "read",
                        resourceOwnerUid: uid || undefined,
                        resumeToken,
                        channelKey: `tenant:${instanceKey}:${resource}:${uid ?? "all"}`,
                    },
                    ({ event }) => {
                        controller.enqueue(
                            encoder.encode(
                                `id: ${event.resumeToken}\nevent: ${event.operation}\ndata: ${JSON.stringify({ event })}\n\n`,
                            ),
                        );
                    },
                    replayEvents => {
                        replayEvents.forEach(event => {
                            controller.enqueue(
                                encoder.encode(
                                    `id: ${event.resumeToken}\nevent: replay\ndata: ${JSON.stringify({ event })}\n\n`,
                                ),
                            );
                        });
                    },
                );

                const keepAliveId = setInterval(() => {
                    controller.enqueue(encoder.encode("event: ping\ndata: {}\n\n"));
                }, subscription.keepAliveMs);

                request.signal.addEventListener("abort", () => {
                    clearInterval(keepAliveId);
                    subscription.unsubscribe();
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
        console.error("[stream-route] stream request failed", {
            error: error instanceof Error ? error.message : error,
        });
        return toErrorResponse(error);
    }
}
