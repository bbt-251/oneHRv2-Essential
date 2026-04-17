import { NextRequest } from "next/server";
import { writeAuditRecord } from "@/lib/backend/manual/audit";
import { readManualSession } from "@/lib/backend/manual/auth-session";
import { authorizeRequest } from "@/lib/backend/manual/authorization";
import { toErrorResponse } from "@/lib/backend/manual/errors";
import { getManualRealtimeBroker } from "@/lib/backend/manual/realtime/subscription-broker";

const encoder = new TextEncoder();

export async function GET(request: NextRequest) {
  try {
    const session = await readManualSession();
    const uid = request.nextUrl.searchParams.get("uid");
    const tenantId = request.nextUrl.searchParams.get("tenantId") ?? "default";
    const resumeToken = request.nextUrl.searchParams.get("resumeToken") ?? undefined;

    if (!uid) {
      return new Response("Missing uid", { status: 400 });
    }

    const authorizedSession = authorizeRequest({
      session,
      tenantId,
      resource: "employee",
      action: "read",
      resourceOwnerUid: uid,
    });

    writeAuditRecord(
      authorizedSession,
      "/api/manual/realtime/employee",
      "subscribe",
      {
        streamTargetUid: uid,
        resumeToken: resumeToken ?? null,
      },
    );

    const broker = getManualRealtimeBroker();

    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode(`event: snapshot\ndata: ${JSON.stringify({ employees: [] })}\n\n`),
        );

        const subscription = broker.subscribe(
          {
            session: authorizedSession,
            tenantId,
            resource: "employee",
            action: "read",
            resourceOwnerUid: uid,
            resumeToken,
            channelKey: `tenant:${tenantId}:employee:${uid}`,
          },
          ({ event }) => {
            controller.enqueue(
              encoder.encode(
                `id: ${event.resumeToken}\nevent: ${event.operation}\ndata: ${JSON.stringify({ event })}\n\n`,
              ),
            );
          },
          (replayEvents) => {
            replayEvents.forEach((event) => {
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
    return toErrorResponse(error);
  }
}
