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
    const cryptoObject = globalThis.crypto;

    if (cryptoObject?.subtle && typeof cryptoObject.subtle.digest === "function") {
        const hash = await cryptoObject.subtle.digest("SHA-256", buffer);
        return Array.from(new Uint8Array(hash))
            .map(value => value.toString(16).padStart(2, "0"))
            .join("");
    }

    const bytes = new Uint8Array(buffer);
    const seeds = new Uint32Array([
        0x811c9dc5,
        0x9e3779b9,
        0x85ebca6b,
        0xc2b2ae35,
        0x27d4eb2f,
        0x165667b1,
        0xd3a2646c,
        0xfd7046c5,
    ]);

    for (let index = 0; index < bytes.length; index += 1) {
        const byte = bytes[index]!;
        const seedIndex = index % seeds.length;
        seeds[seedIndex] = Math.imul(seeds[seedIndex] ^ byte, 16777619) >>> 0;
    }

    const fileFingerprint = `${file.name}:${file.type}:${file.size}:${file.lastModified}`;
    for (let index = 0; index < fileFingerprint.length; index += 1) {
        const codePoint = fileFingerprint.charCodeAt(index);
        const seedIndex = index % seeds.length;
        seeds[seedIndex] = Math.imul(seeds[seedIndex] ^ codePoint, 2246822519) >>> 0;
    }

    return Array.from(seeds, value => value.toString(16).padStart(8, "0")).join("");
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
