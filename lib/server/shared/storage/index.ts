import { ManualApiError } from "@/lib/server/shared/errors";
import { createStorageToken } from "@/lib/server/shared/storage/signing";
import {
    createSignedDownload,
    createSignedUpload,
    getStorageMetadata,
    listStorageMetadata,
} from "@/lib/server/shared/storage/service";
import { StorageObjectMetadata, UploadRequestInput } from "@/lib/server/shared/storage/types";

export const requestStorageUpload = (input: UploadRequestInput) => createSignedUpload(input);

export const requestStorageDownload = (objectKey: string) => createSignedDownload({ objectKey });

export const readStorageMetadata = (objectKey: string) => getStorageMetadata(objectKey);

export const listStoredObjects = () => listStorageMetadata();

export const validateStoredObjects = async ({
    objectKeys,
    instanceKey,
    ownerUid,
    module,
    entityId,
}: {
    objectKeys: string[];
    instanceKey: string;
    ownerUid?: string;
    module: string;
    entityId?: string;
}): Promise<StorageObjectMetadata[]> =>
    Promise.all(
        objectKeys.map(async objectKey => {
            const metadata = await getStorageMetadata(objectKey);

            if (!metadata) {
                throw new ManualApiError(
                    404,
                    "ATTACHMENT_NOT_FOUND",
                    `Attachment metadata was not found for ${objectKey}.`,
                );
            }

            if (metadata.instanceKey !== instanceKey) {
                throw new ManualApiError(
                    403,
                    "ATTACHMENT_TENANT_MISMATCH",
                    "Attachment does not belong to the active tenant.",
                );
            }

            if (metadata.linkage.module !== module) {
                throw new ManualApiError(
                    400,
                    "ATTACHMENT_LINKAGE_INVALID",
                    "Attachment linkage does not match the target module.",
                );
            }

            if (entityId && metadata.linkage.entityId && metadata.linkage.entityId !== entityId) {
                throw new ManualApiError(
                    400,
                    "ATTACHMENT_ENTITY_MISMATCH",
                    "Attachment is linked to a different entity.",
                );
            }

            if (ownerUid && metadata.ownerUid !== ownerUid) {
                throw new ManualApiError(
                    403,
                    "ATTACHMENT_OWNER_MISMATCH",
                    "Attachment access is limited to the owning employee.",
                );
            }

            return metadata;
        }),
    );

export const createLegacySignedUploadUrls = ({
    path,
    baseUrl,
}: {
    path: string;
    baseUrl: string;
}) => {
    const uploadToken = createStorageToken(path, "upload");
    const downloadToken = createStorageToken(path, "download");

    return {
        uploadUrl: `${baseUrl}/api/storage/object?token=${encodeURIComponent(uploadToken)}`,
        downloadUrl: `${baseUrl}/api/storage/object?token=${encodeURIComponent(downloadToken)}`,
    };
};

export const createLegacySignedDownloadUrl = ({
    path,
    baseUrl,
}: {
    path: string;
    baseUrl: string;
}) => {
    const downloadToken = createStorageToken(path, "download");

    return {
        downloadUrl: `${baseUrl}/api/storage/object?token=${encodeURIComponent(downloadToken)}`,
    };
};
