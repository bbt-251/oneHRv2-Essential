import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createLog } from "@/lib/server/logs/log.repository";
import { toErrorResponse } from "@/lib/server/shared/errors";

const createLogSchema = z.object({
    logInfo: z.object({
        title: z.string().min(1),
        description: z.string().min(1),
        module: z.string().min(1),
    }),
    actionBy: z.string().min(1),
    status: z.enum(["Success", "Failure"]),
});

export async function POST(request: NextRequest) {
    try {
        const body = createLogSchema.parse(await request.json());
        const success = await createLog(body.logInfo, body.actionBy, body.status);
        return NextResponse.json({ success }, { status: success ? 200 : 500 });
    } catch (error) {
        return toErrorResponse(error);
    }
}
