import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { storage } from "../init";

const uploadFile = async (
    file: File, // changed to File
    directoryName: string,
    storageInstance = storage,
    setProgress?: React.Dispatch<React.SetStateAction<number>>,
) => {
    return new Promise<false | string>((resolve, reject) => {
        const epoch = Date.now().toString();
        const storageRef = ref(storage, `${directoryName}/${epoch}${Math.random().toFixed(3)}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on(
            "state_changed",
            snapshot => {
                if (setProgress) {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    setProgress(progress);
                }
            },
            error => {
                console.error(error);
                reject(false);
            },
            () => {
                getDownloadURL(uploadTask.snapshot.ref)
                    .then((downloadUrl: string) => {
                        resolve(downloadUrl);
                    })
                    .catch(error => {
                        console.error("Error getting download URL:", error);
                        reject(false);
                    });
            },
        );
    });
};

export default uploadFile;
