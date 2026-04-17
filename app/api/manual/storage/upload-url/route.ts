import { NextRequest, NextResponse } from "next/server";
import { readManualSession } from "@/lib/backend/manual/auth-session";
import { authorizeRequest } from "@/lib/backend/manual/authorization";
import { toErrorResponse } from "@/lib/backend/manual/errors";
import { createSignedUpload } from "@/lib/backend/manual/storage/service";
import { uploadPayloadSchema } from "@/lib/backend/manual/storage/validation";
import { validatePayload } from "@/lib/backend/manual/validation";

export async function POST(request: NextRequest) {
    try {
        const payload = validatePayload(uploadPayloadSchema, await request.json());
        const session = await readManualSession();
        const ownerUid = payload.ownerUid ?? session?.uid ?? "";

        authorizeRequest({
            session,
            tenantId: payload.tenantId,
            resource: "storage",
            action: "create",
            resourceOwnerUid: ownerUid,
        });

        const { signedUpload, metadata } = createSignedUpload({
            tenantId: payload.tenantId,
            ownerUid,
            originalFilename: payload.originalFilename,
            mimeType: payload.mimeType,
            sizeBytes: payload.sizeBytes,
            sha256: payload.sha256,
            linkage: payload.linkage,
        });

        return NextResponse.json({
            upload: signedUpload,
            metadata,
        });
    } catch (error) {
        return toErrorResponse(error);
    }
}
