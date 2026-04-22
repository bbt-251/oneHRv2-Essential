import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { readSessionClaims } from "@/lib/backend/auth/session";
import { authorizeRequest } from "@/lib/backend/core/authorization";
import { toErrorResponse } from "@/lib/backend/core/errors";
import { getCurrentConfig, getCurrentInstanceKey } from "@/lib/backend/config";
import {
    createLegacySignedDownloadUrl,
    readStorageMetadata,
    requestStorageDownload,
} from "@/lib/backend/services/storage.service";

const payloadSchema = z.union([
    z.object({
        path: z.string().min(1),
    }),
    z.object({
        objectKey: z.string().min(1),
    }),
]);

export async function POST(request: NextRequest) {
    try {
        getCurrentConfig();
        const body = payloadSchema.parse(await request.json());
        const session = await readSessionClaims();
        const instanceKey = getCurrentInstanceKey();
        const resourceOwnerUid =
            "objectKey" in body ? readStorageMetadata(body.objectKey)?.ownerUid : session?.uid;

        authorizeRequest({
            session,
            instanceKey,
            resource: "storage",
            action: "read",
            resourceOwnerUid,
        });

        if ("objectKey" in body) {
            const download = requestStorageDownload(body.objectKey);

            return NextResponse.json({
                downloadUrl: download.downloadUrl,
                objectKey: download.objectKey,
            });
        }

        const download = createLegacySignedDownloadUrl({
            path: body.path,
            baseUrl: request.nextUrl.origin,
        });

        return NextResponse.json({
            downloadUrl: download.downloadUrl,
        });
    } catch (error) {
        return toErrorResponse(error);
    }
}
