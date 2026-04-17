import crypto from "node:crypto";
import path from "node:path";
import { manualEnv } from "@/lib/backend/manual/env";
import { ManualApiError } from "@/lib/backend/manual/errors";
import {
    SignedDownloadDescriptor,
    SignedUploadDescriptor,
    StorageObjectMetadata,
    UploadRequestInput,
} from "@/lib/backend/manual/storage/types";
import {
    validateFileIntegrityHints,
    validateMimeType,
} from "@/lib/backend/manual/storage/validation";

const DEFAULT_BUCKET = process.env.MANUAL_OBJECT_STORAGE_BUCKET ?? "onehr-manual";
const DEFAULT_UPLOAD_TTL_SECONDS = 15 * 60;
const DEFAULT_DOWNLOAD_TTL_SECONDS = 10 * 60;

const storageMetadata = new Map<string, StorageObjectMetadata>();

const sanitizeSegment = (value: string): string =>
    value
        .toLowerCase()
        .replace(/[^a-z0-9_-]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "") || "na";

const safeFileName = (fileName: string): string => {
    const extension = path.extname(fileName).toLowerCase();
    const base = path.basename(fileName, extension);
    const sanitizedBase = sanitizeSegment(base).slice(0, 80);
    const sanitizedExtension = extension.replace(/[^.a-z0-9]/g, "").slice(0, 10);
    return `${sanitizedBase}${sanitizedExtension}`;
};

const createStorageSignature = (payload: string): string => {
    const secret = manualEnv.jwtSecret || "manual-storage-dev-secret";
    return crypto.createHmac("sha256", secret).update(payload).digest("base64url");
};

const signObjectUrl = ({
    objectKey,
    operation,
    expiresAt,
}: {
  objectKey: string;
  operation: "upload" | "download";
  expiresAt: number;
}): string => {
    const payload = `${operation}:${objectKey}:${expiresAt}`;
    const signature = createStorageSignature(payload);
    const base = `${manualEnv.backendUrl}/manual-object-storage/${DEFAULT_BUCKET}/${objectKey}`;
    return `${base}?op=${operation}&exp=${expiresAt}&sig=${encodeURIComponent(signature)}`;
};

export const buildObjectKey = ({
    tenantId,
    module,
    ownerUid,
    originalFilename,
}: {
  tenantId: string;
  module: string;
  ownerUid: string;
  originalFilename: string;
}): string => {
    const randomId = crypto.randomBytes(6).toString("hex");
    const now = new Date();
    const yyyy = String(now.getUTCFullYear());
    const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(now.getUTCDate()).padStart(2, "0");

    return [
        sanitizeSegment(tenantId),
        sanitizeSegment(module),
        sanitizeSegment(ownerUid),
        yyyy,
        mm,
        dd,
        `${Date.now()}-${randomId}-${safeFileName(originalFilename)}`,
    ].join("/");
};

export const persistStorageMetadata = (
    metadata: StorageObjectMetadata,
): StorageObjectMetadata => {
    storageMetadata.set(metadata.objectKey, metadata);
    return metadata;
};

export const getStorageMetadata = (
    objectKey: string,
): StorageObjectMetadata | null => {
    return storageMetadata.get(objectKey) ?? null;
};

export const createSignedUpload = (
    input: UploadRequestInput,
): {
  signedUpload: SignedUploadDescriptor;
  metadata: StorageObjectMetadata;
} => {
    validateMimeType(input.mimeType);
    validateFileIntegrityHints({ sha256: input.sha256, sizeBytes: input.sizeBytes });

    const objectKey = buildObjectKey({
        tenantId: input.tenantId,
        module: input.linkage.module,
        ownerUid: input.ownerUid,
        originalFilename: input.originalFilename,
    });

    const expiresAtEpoch = Math.floor(Date.now() / 1000) + DEFAULT_UPLOAD_TTL_SECONDS;
    const signedUpload: SignedUploadDescriptor = {
        uploadUrl: signObjectUrl({
            objectKey,
            operation: "upload",
            expiresAt: expiresAtEpoch,
        }),
        method: "PUT",
        expiresAt: new Date(expiresAtEpoch * 1000).toISOString(),
        requiredHeaders: {
            "content-type": input.mimeType,
            "x-content-sha256": input.sha256,
            "x-content-length": String(input.sizeBytes),
        },
        objectKey,
    };

    const metadata: StorageObjectMetadata = {
        tenantId: input.tenantId,
        bucket: DEFAULT_BUCKET,
        objectKey,
        originalFilename: input.originalFilename,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
        sha256: input.sha256,
        ownerUid: input.ownerUid,
        linkage: input.linkage,
        createdAt: new Date().toISOString(),
    };

    persistStorageMetadata(metadata);

    return {
        signedUpload,
        metadata,
    };
};

export const createSignedDownload = ({
    objectKey,
}: {
  objectKey: string;
}): SignedDownloadDescriptor => {
    const metadata = getStorageMetadata(objectKey);

    if (!metadata) {
        throw new ManualApiError(404, "OBJECT_NOT_FOUND", "Object metadata was not found.");
    }

    const expiresAtEpoch = Math.floor(Date.now() / 1000) + DEFAULT_DOWNLOAD_TTL_SECONDS;

    return {
        downloadUrl: signObjectUrl({
            objectKey,
            operation: "download",
            expiresAt: expiresAtEpoch,
        }),
        method: "GET",
        expiresAt: new Date(expiresAtEpoch * 1000).toISOString(),
        objectKey,
    };
};

export const listStorageMetadata = (): StorageObjectMetadata[] => {
    return Array.from(storageMetadata.values());
};
