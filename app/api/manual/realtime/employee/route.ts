import { NextRequest } from "next/server";
import { readManualSession } from "@/lib/backend/manual/auth-session";

const encoder = new TextEncoder();

export async function GET(request: NextRequest) {
    const session = await readManualSession();
    const uid = request.nextUrl.searchParams.get("uid");

    if (!session || !uid || session.uid !== uid) {
        return new Response("Unauthorized", { status: 401 });
    }

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
}
