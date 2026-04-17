import { StorageGateway } from "@/lib/backend/gateways/types";
import { buildManualApiUrl } from "@/lib/backend/gateways/runtime-config";

interface SignedUploadResponse {
  uploadUrl: string;
  downloadUrl: string;
}

interface SignedDownloadResponse {
  downloadUrl: string;
}

export const createManualStorageGateway = (): StorageGateway => ({
    getSignedUploadUrl: async (path, contentType) => {
        const response = await fetch(
            buildManualApiUrl("/api/manual/storage/signed-upload"),
            {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ path, contentType }),
            },
        );

        if (!response.ok) {
            throw new Error("Unable to fetch signed upload URL.");
        }

        const payload = (await response.json()) as SignedUploadResponse;
        return payload.uploadUrl;
    },
    getSignedDownloadUrl: async (path) => {
        const response = await fetch(
            buildManualApiUrl("/api/manual/storage/signed-download"),
            {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ path }),
            },
        );

        if (!response.ok) {
            throw new Error("Unable to fetch signed download URL.");
        }

        const payload = (await response.json()) as SignedDownloadResponse;
        return payload.downloadUrl;
    },
});
