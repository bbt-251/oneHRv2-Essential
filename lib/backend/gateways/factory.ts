import { createFirebaseAuthGateway } from "@/lib/backend/gateways/firebase/auth-gateway";
import { createFirebaseDataGateway } from "@/lib/backend/gateways/firebase/data-gateway";
import {
    createFirebaseStorageGateway,
    uploadFileToFirebaseSignedUrl,
} from "@/lib/backend/gateways/firebase/storage-gateway";
import { getGatewaySourceConfig } from "@/lib/backend/gateways/data-source-flags";
import { logGatewayMismatch } from "@/lib/backend/gateways/observability";
import { createManualAuthGateway } from "@/lib/backend/gateways/manual/auth-gateway";
import { createManualDataGateway } from "@/lib/backend/gateways/manual/data-gateway";
import { createManualStorageGateway } from "@/lib/backend/gateways/manual/storage-gateway";
import {
    AuthGateway,
    DataGateway,
    StorageGateway,
} from "@/lib/backend/gateways/types";

export const createAuthGateway = (): AuthGateway => {
    const source = getGatewaySourceConfig().auth;

    if (source === "firebase") {
        return createFirebaseAuthGateway();
    }

    return createManualAuthGateway();
};

export const createEmployeeDataGateway = (): DataGateway => {
    const source = getGatewaySourceConfig().employeeData;

    if (source === "firebase") {
        return createFirebaseDataGateway();
    }

    return createManualDataGateway();
};

export const createStorageGateway = (): StorageGateway => {
    const source = getGatewaySourceConfig().storage;

    if (source === "manual") {
        return createManualStorageGateway();
    }

    return createFirebaseStorageGateway();
};

export const uploadUsingGateway = async (
    path: string,
    file: File,
): Promise<string> => {
    const source = getGatewaySourceConfig().storage;
    const gateway = createStorageGateway();

    try {
        const signedUploadUrl = await gateway.getSignedUploadUrl(
            path,
            file.type || "application/octet-stream",
        );

        if (source === "firebase") {
            await uploadFileToFirebaseSignedUrl(signedUploadUrl, file);
        } else {
            const uploadResponse = await fetch(signedUploadUrl, {
                method: "PUT",
                headers: {
                    "Content-Type": file.type || "application/octet-stream",
                },
                body: file,
            });

            if (!uploadResponse.ok) {
                throw new Error(`Upload failed with status ${uploadResponse.status}`);
            }
        }

        return gateway.getSignedDownloadUrl(path);
    } catch (error) {
        logGatewayMismatch({
            module: "storage",
            expectedSource: source,
            reason: "Upload flow failed",
            metadata: {
                path,
                error: error instanceof Error ? error.message : "unknown",
            },
        });

        throw error;
    }
};
