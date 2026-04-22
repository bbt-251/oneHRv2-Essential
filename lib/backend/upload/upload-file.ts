import { uploadFileToBackendStorage } from "@/lib/backend/client/storage-client";

export default async function uploadFile(file: File, directory: string): Promise<string | false> {
    try {
        const uploadResult = await uploadFileToBackendStorage({
            file,
            linkage: {
                module: directory,
            },
        });
        return uploadResult.downloadUrl;
    } catch (error) {
        console.error("Failed to upload file:", error);
        return false;
    }
}
