import { buildBackendUrl } from "@/lib/shared/config";

interface StorageUploadLinkage {
    module: string;
    entityId?: string;
    field?: string;
}

interface StorageUploadResponse {
    uploadUrl: string;
    downloadUrl: string;
    objectKey: string;
    requiredHeaders?: Record<string, string>;
}

interface StorageDownloadResponse {
    downloadUrl: string;
}

const digestFileSha256 = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const hash = await crypto.subtle.digest("SHA-256", buffer);
    return Array.from(new Uint8Array(hash))
        .map(value => value.toString(16).padStart(2, "0"))
        .join("");
};

export const uploadFileToBackendStorage = async ({
    file,
    linkage,
}: {
    file: File;
    linkage: StorageUploadLinkage;
}): Promise<{ objectKey: string; downloadUrl: string }> => {
    const sha256 = await digestFileSha256(file);
    const response = await fetch(buildBackendUrl("/api/storage/upload-url"), {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            originalFilename: file.name,
            mimeType: file.type || "application/octet-stream",
            sizeBytes: file.size,
            sha256,
            linkage,
        }),
    });

    if (!response.ok) {
        throw new Error("Unable to create a signed upload URL.");
    }

    const payload = (await response.json()) as StorageUploadResponse;
    const requiredHeaders = Object.fromEntries(
        Object.entries(payload.requiredHeaders ?? {}).filter(
            ([headerName]) => headerName.toLowerCase() !== "content-type",
        ),
    );

    const uploadResponse = await fetch(payload.uploadUrl, {
        method: "PUT",
        headers: {
            "Content-Type": file.type || "application/octet-stream",
            ...requiredHeaders,
        },
        body: file,
    });

    if (!uploadResponse.ok) {
        throw new Error(`Upload failed with status ${uploadResponse.status}.`);
    }

    return {
        objectKey: payload.objectKey,
        downloadUrl: payload.downloadUrl,
    };
};

export const getBackendStorageDownloadUrl = async (objectKey: string): Promise<string> => {
    const response = await fetch(buildBackendUrl("/api/storage/download-url"), {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ objectKey }),
    });

    if (!response.ok) {
        throw new Error("Unable to create a signed download URL.");
    }

    const payload = (await response.json()) as StorageDownloadResponse;
    return payload.downloadUrl;
};
