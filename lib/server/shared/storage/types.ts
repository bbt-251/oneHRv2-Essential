export interface StorageLinkage {
    module: string;
    entityId?: string;
    field?: string;
}

export interface StorageObjectMetadata {
    instanceKey: string;
    bucket: string;
    objectKey: string;
    originalFilename: string;
    mimeType: string;
    sizeBytes: number;
    sha256: string;
    ownerUid: string;
    linkage: StorageLinkage;
    createdAt: string;
    legacyPath?: string;
    migration?: Record<string, unknown>;
}

export interface SignedUploadDescriptor {
    uploadUrl: string;
    method: "PUT";
    expiresAt: string;
    requiredHeaders: Record<string, string>;
    objectKey: string;
}

export interface SignedDownloadDescriptor {
    downloadUrl: string;
    method: "GET";
    expiresAt: string;
    objectKey: string;
}

export interface UploadRequestInput {
    instanceKey: string;
    ownerUid: string;
    originalFilename: string;
    mimeType: string;
    sizeBytes: number;
    sha256: string;
    linkage: StorageLinkage;
}
