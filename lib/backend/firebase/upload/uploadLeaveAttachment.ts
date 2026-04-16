import { ref, uploadBytes, uploadBytesResumable } from "firebase/storage";
import { storage } from "../init";
import { getDownloadURL } from "firebase/storage";

export const uploadLeaveAttachment = async (file: File, leaveId: string) => {
    // Upload new file
    const documentId = Date.now().toString();
    const fileName = `${documentId}-${file.name}`;
    const filePath = `leaves/${leaveId}/${fileName}`;
    const storageRef = ref(storage, filePath);
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    await uploadBytes(storageRef, bytes, { contentType: file.type });
    const downloadUrl = await getDownloadURL(storageRef);

    return downloadUrl;
};
