import { ref, uploadBytes } from "firebase/storage";
import { getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/backend/firebase/init";
import { StorageGateway } from "@/lib/backend/gateways/types";

const FIREBASE_SCHEME = "firebase://";

export const createFirebaseStorageGateway = (): StorageGateway => ({
    getSignedUploadUrl: async (path) => `${FIREBASE_SCHEME}${path}`,
    getSignedDownloadUrl: async (path) => {
        const storageRef = ref(storage, path);
        return getDownloadURL(storageRef);
    },
});

export const uploadFileToFirebaseSignedUrl = async (
    signedUploadUrl: string,
    file: File,
): Promise<void> => {
    if (!signedUploadUrl.startsWith(FIREBASE_SCHEME)) {
        throw new Error("Unsupported Firebase signed upload URL format.");
    }

    const path = signedUploadUrl.slice(FIREBASE_SCHEME.length);
    const storageRef = ref(storage, path);
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    await uploadBytes(storageRef, bytes, {
        contentType: file.type,
    });
};
