import { NextRequest } from "next/server";
import { readManualSession } from "@/lib/backend/manual/auth-session";
import { authorizeRequest } from "@/lib/backend/manual/authorization";
import { toErrorResponse } from "@/lib/backend/manual/errors";
import { writeAuditRecord } from "@/lib/backend/manual/audit";

const encoder = new TextEncoder();

export async function GET(request: NextRequest) {
  try {
    const session = await readManualSession();
    const uid = request.nextUrl.searchParams.get("uid");
    const tenantId = request.nextUrl.searchParams.get("tenantId") ?? "default";

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
      },
    );

    const stream = new ReadableStream({
      start(controller) {
        const initialPayload = JSON.stringify({ employees: [] });
        controller.enqueue(encoder.encode(`data: ${initialPayload}\n\n`));

        const keepAliveId = setInterval(() => {
          controller.enqueue(encoder.encode(`event: ping\ndata: {}\n\n`));
        }, 15000);

        request.signal.addEventListener("abort", () => {
          clearInterval(keepAliveId);
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
