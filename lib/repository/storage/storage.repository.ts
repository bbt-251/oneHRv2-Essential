import {
    getBackendStorageDownloadUrl,
    uploadFileToBackendStorage,
} from "@/lib/repository/shared/storage-client";

export class StorageRepository {
    static async uploadFile(input: Parameters<typeof uploadFileToBackendStorage>[0]) {
        return uploadFileToBackendStorage(input);
    }

    static async getDownloadUrl(objectKey: string) {
        return getBackendStorageDownloadUrl(objectKey);
    }
}
