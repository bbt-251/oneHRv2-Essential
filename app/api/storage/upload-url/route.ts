import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { readSessionClaims } from "@/lib/backend/auth/session";
import { authorizeRequest } from "@/lib/backend/core/authorization";
import { toErrorResponse } from "@/lib/backend/core/errors";
import { getCurrentConfig, getCurrentInstanceKey } from "@/lib/backend/config";
import {
    requestStorageDownload,
    requestStorageUpload,
    createLegacySignedUploadUrls,
} from "@/lib/backend/services/storage.service";

const legacyPayloadSchema = z.object({
    path: z.string().min(1),
    contentType: z.string().min(1),
});

const compactPayloadSchema = z.object({
    originalFilename: z.string().min(1),
    mimeType: z.string().min(1),
    sizeBytes: z.number().positive(),
    sha256: z.string().min(1),
    linkage: z.object({
        module: z.string().min(1),
        entityId: z.string().min(1).optional(),
        field: z.string().min(1).optional(),
    }),
});

const payloadSchema = z.union([legacyPayloadSchema, compactPayloadSchema]);

export async function POST(request: NextRequest) {
    try {
        getCurrentConfig();
        const body = payloadSchema.parse(await request.json());
        const session = await readSessionClaims();
        const instanceKey = getCurrentInstanceKey();

        const authorizedSession = authorizeRequest({
            session,
            instanceKey,
            resource: "storage",
            action: "create",
            resourceOwnerUid: session?.uid,
        });

        if ("originalFilename" in body) {
            const uploadRequest = requestStorageUpload({
                instanceKey,
                ownerUid: authorizedSession.uid,
                originalFilename: body.originalFilename,
                mimeType: body.mimeType,
                sizeBytes: body.sizeBytes,
                sha256: body.sha256,
                linkage: body.linkage,
            });

            const signedDownload = requestStorageDownload(uploadRequest.metadata.objectKey);

            return NextResponse.json({
                uploadUrl: uploadRequest.signedUpload.uploadUrl,
                downloadUrl: signedDownload.downloadUrl,
                objectKey: uploadRequest.metadata.objectKey,
                expiresAt: uploadRequest.signedUpload.expiresAt,
                requiredHeaders: uploadRequest.signedUpload.requiredHeaders,
            });
        }

        const signedUrls = createLegacySignedUploadUrls({
            path: body.path,
            baseUrl: request.nextUrl.origin,
        });

        return NextResponse.json({
            uploadUrl: signedUrls.uploadUrl,
            downloadUrl: signedUrls.downloadUrl,
        });
    } catch (error) {
        return toErrorResponse(error);
    }
}
