import crypto from "node:crypto";
import path from "node:path";
import { getMongoCollection } from "@/lib/server/shared/db/mongo";
import { manualEnv } from "@/lib/server/shared/env";
import { ManualApiError } from "@/lib/server/shared/errors";
import { createStorageToken } from "@/lib/server/shared/storage/signing";
import {
    SignedDownloadDescriptor,
    SignedUploadDescriptor,
    StorageObjectMetadata,
    UploadRequestInput,
} from "@/lib/server/shared/storage/types";
import {
    validateFileIntegrityHints,
    validateMimeType,
} from "@/lib/server/shared/storage/validation";

const DEFAULT_BUCKET = manualEnv.objectStorageBucket || "onehr-manual";
const DEFAULT_UPLOAD_TTL_SECONDS = 15 * 60;
const DEFAULT_DOWNLOAD_TTL_SECONDS = 10 * 60;
const storageMetadataCollectionName = "storageObjects";

type StorageMetadataDocument = StorageObjectMetadata & {
    _id: string;
};

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

const signObjectUrl = ({
    objectKey,
    operation,
}: {
    objectKey: string;
    operation: "upload" | "download";
}): string => {
    const token = createStorageToken(objectKey, operation);
    return `${manualEnv.backendUrl}/api/storage/object?token=${encodeURIComponent(token)}`;
};

export const buildObjectKey = ({
    instanceKey,
    module,
    ownerUid,
    originalFilename,
}: {
    instanceKey: string;
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
        sanitizeSegment(instanceKey),
        sanitizeSegment(module),
        sanitizeSegment(ownerUid),
        yyyy,
        mm,
        dd,
        `${Date.now()}-${randomId}-${safeFileName(originalFilename)}`,
    ].join("/");
};

const getStorageMetadataCollection = () =>
    getMongoCollection<StorageMetadataDocument>(storageMetadataCollectionName);

const toStorageMetadata = (document: StorageMetadataDocument): StorageObjectMetadata => ({
    instanceKey: document.instanceKey,
    bucket: document.bucket,
    objectKey: document.objectKey,
    originalFilename: document.originalFilename,
    mimeType: document.mimeType,
    sizeBytes: document.sizeBytes,
    sha256: document.sha256,
    ownerUid: document.ownerUid,
    linkage: document.linkage,
    createdAt: document.createdAt,
    legacyPath: document.legacyPath,
    migration: document.migration,
});

export const persistStorageMetadata = async (
    metadata: StorageObjectMetadata,
): Promise<StorageObjectMetadata> => {
    const collection = await getStorageMetadataCollection();
    await collection.updateOne(
        { _id: metadata.objectKey },
        {
            $set: {
                ...metadata,
                _id: metadata.objectKey,
            },
        },
        { upsert: true },
    );

    return metadata;
};

export const getStorageMetadata = async (
    objectKey: string,
): Promise<StorageObjectMetadata | null> => {
    const collection = await getStorageMetadataCollection();
    const metadata = await collection.findOne({ _id: objectKey });
    return metadata ? toStorageMetadata(metadata) : null;
};

export const createSignedUpload = async (
    input: UploadRequestInput,
): Promise<{
    signedUpload: SignedUploadDescriptor;
    metadata: StorageObjectMetadata;
}> => {
    validateMimeType(input.mimeType);
    validateFileIntegrityHints({ sha256: input.sha256, sizeBytes: input.sizeBytes });

    const objectKey = buildObjectKey({
        instanceKey: input.instanceKey,
        module: input.linkage.module,
        ownerUid: input.ownerUid,
        originalFilename: input.originalFilename,
    });

    const expiresAtEpoch = Math.floor(Date.now() / 1000) + DEFAULT_UPLOAD_TTL_SECONDS;
    const signedUpload: SignedUploadDescriptor = {
        uploadUrl: signObjectUrl({
            objectKey,
            operation: "upload",
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
        instanceKey: input.instanceKey,
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

    await persistStorageMetadata(metadata);

    return {
        signedUpload,
        metadata,
    };
};

export const createSignedDownload = async ({
    objectKey,
}: {
    objectKey: string;
}): Promise<SignedDownloadDescriptor> => {
    const metadata = await getStorageMetadata(objectKey);

    if (!metadata) {
        throw new ManualApiError(404, "OBJECT_NOT_FOUND", "Object metadata was not found.");
    }

    const expiresAtEpoch = Math.floor(Date.now() / 1000) + DEFAULT_DOWNLOAD_TTL_SECONDS;

    return {
        downloadUrl: signObjectUrl({
            objectKey,
            operation: "download",
        }),
        method: "GET",
        expiresAt: new Date(expiresAtEpoch * 1000).toISOString(),
        objectKey,
    };
};

export const listStorageMetadata = async (): Promise<StorageObjectMetadata[]> => {
    const collection = await getStorageMetadataCollection();
    const metadata = await collection.find({}).toArray();
    return metadata.map(toStorageMetadata);
};
