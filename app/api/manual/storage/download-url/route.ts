import { NextRequest, NextResponse } from "next/server";
import { readManualSession } from "@/lib/backend/manual/auth-session";
import { authorizeRequest } from "@/lib/backend/manual/authorization";
import { toErrorResponse } from "@/lib/backend/manual/errors";
import {
    createSignedDownload,
    getStorageMetadata,
} from "@/lib/backend/manual/storage/service";
import { downloadPayloadSchema } from "@/lib/backend/manual/storage/validation";
import { validatePayload } from "@/lib/backend/manual/validation";

export async function POST(request: NextRequest) {
    try {
        const payload = validatePayload(downloadPayloadSchema, await request.json());
        const session = await readManualSession();
        const metadata = getStorageMetadata(payload.objectKey);

        if (!metadata) {
            return NextResponse.json(
                {
                    error: {
                        code: "OBJECT_NOT_FOUND",
                        message: "Object metadata was not found.",
                    },
                },
                { status: 404 },
            );
        }

        authorizeRequest({
            session,
            tenantId: payload.tenantId,
            resource: "storage",
            action: "read",
            resourceOwnerUid: metadata.ownerUid,
        });

        const download = createSignedDownload({ objectKey: payload.objectKey });

        return NextResponse.json({
            download,
            metadata,
        });
    } catch (error) {
        return toErrorResponse(error);
    }
}
