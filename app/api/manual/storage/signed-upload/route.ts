import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { readManualSession } from "@/lib/backend/manual/auth-session";
import { authorizeRequest } from "@/lib/backend/manual/authorization";
import { createStorageToken } from "@/lib/backend/manual/storage-signing";
import { toErrorResponse } from "@/lib/backend/manual/errors";

const payloadSchema = z.object({
    path: z.string().min(1),
    contentType: z.string().min(1),
});

export async function POST(request: NextRequest) {
    try {
        const body = payloadSchema.parse(await request.json());
        const session = await readManualSession();

        const authorizedSession = authorizeRequest({
            session,
            tenantId: session?.tenantId ?? "default",
            resource: "employee",
            action: "read",
        });

        const uploadToken = createStorageToken(body.path, "upload");
        const downloadToken = createStorageToken(body.path, "download");
        const baseUrl = request.nextUrl.origin;

        return NextResponse.json({
            uploadUrl: `${baseUrl}/api/manual/storage/object?token=${encodeURIComponent(uploadToken)}`,
            downloadUrl: `${baseUrl}/api/manual/storage/object?token=${encodeURIComponent(downloadToken)}`,
            tenantId: authorizedSession.tenantId,
        });
    } catch (error) {
        return toErrorResponse(error);
    }
}
