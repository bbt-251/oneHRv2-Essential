import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { readSessionClaims } from "@/lib/server/shared/auth/session";
import { authorizeRequest } from "@/lib/server/shared/auth/authorization";
import { toErrorResponse } from "@/lib/server/shared/errors";
import { getCurrentConfig, getCurrentInstanceKey } from "@/lib/shared/config";
import {
    createLegacySignedDownloadUrl,
    readStorageMetadata,
    requestStorageDownload,
} from "@/lib/server/shared/storage";

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
            "objectKey" in body
                ? (await readStorageMetadata(body.objectKey))?.ownerUid
                : session?.uid;

        authorizeRequest({
            session,
            instanceKey,
            resource: "storage",
            action: "read",
            resourceOwnerUid,
        });

        if ("objectKey" in body) {
            const download = await requestStorageDownload(body.objectKey);

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
