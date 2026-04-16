import {
    doc,
    DocumentData,
    getDoc,
    getDocs,
    query,
    QuerySnapshot,
    setDoc,
    updateDoc,
    deleteDoc,
} from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { talentPoolCollection } from "../../firebase/collections";
import { db, storage } from "../../firebase/init";
import { TalentPoolModel } from "@/lib/models/talentPool";

const collectionRef = talentPoolCollection;
const collectionName = collectionRef.id;

export async function createTalentPoolEntry(
    data: Omit<TalentPoolModel, "id">,
): Promise<TalentPoolModel | null> {
    try {
        const docRef = doc(collectionRef);
        await setDoc(docRef, {
            ...data,
            id: docRef.id,
        });

        return await getTalentPoolEntry(docRef.id);
    } catch (err) {
        console.error("Error creating talent pool entry:", err);
        return null;
    }
}

export async function getTalentPoolEntries(): Promise<TalentPoolModel[]> {
    try {
        const q = query(collectionRef);
        const querySnapshot: QuerySnapshot<DocumentData> = await getDocs(q);

        const entries: TalentPoolModel[] = querySnapshot.docs.map(
            doc =>
                ({
                    id: doc.id,
                    ...doc.data(),
                }) as TalentPoolModel,
        );

        return entries;
    } catch (err) {
        console.error("Error fetching talent pool entries:", err);
        return [];
    }
}

export async function getTalentPoolEntry(id: string): Promise<TalentPoolModel | null> {
    try {
        const docRef = doc(db, collectionName, id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as TalentPoolModel;
        } else {
            console.log(`No talent pool entry found with ID: ${id}`);
            return null;
        }
    } catch (err) {
        console.error("Error fetching talent pool entry:", err);
        return null;
    }
}

export async function updateTalentPoolEntry(
    data: Partial<TalentPoolModel> & { id: string },
): Promise<boolean> {
    if (!data.id) {
        console.error("Update failed: Document ID is missing.");
        return false;
    }

    const docRef = doc(db, collectionName, data.id);

    try {
        await updateDoc(docRef, data);
        return true;
    } catch (err) {
        console.error(`Error updating talent pool entry with ID ${data.id}:`, err);
        return false;
    }
}

export async function deleteTalentPoolEntry(id: string): Promise<boolean> {
    const docRef = doc(db, collectionName, id);

    try {
        const entryToDelete = await getTalentPoolEntry(id);

        if (entryToDelete?.cvDocument?.url) {
            const cvRef = ref(storage, entryToDelete.cvDocument.url);
            try {
                await deleteObject(cvRef);
                console.log(`Successfully deleted CV from storage for entry: ${id}`);
            } catch (storageError) {
                console.warn(
                    `Could not delete CV from storage for entry ${id}. It might not exist or there was a permissions issue.`,
                    storageError,
                );
            }
        }

        await deleteDoc(docRef);
        return true;
    } catch (err) {
        console.error(`Error deleting talent pool entry with ID ${id}:`, err);
        return false;
    }
}

/**
 * Uploads a CV file to Firebase Storage for the talent pool.
 * @param file The CV file to upload.
 * @returns A promise that resolves with the public download URL and the file name.
 * @throws Throws an error if the upload fails.
 */
export const uploadTalentPoolCV = async (file: File): Promise<{ url: string; name: string }> => {
    if (!file) {
        throw new Error("No file provided for upload.");
    }

    // Create a unique file path to avoid overwriting files with the same name
    const filePath = `talent-pool-cvs/${Date.now()}-${file.name}`;
    const storageRef = ref(storage, filePath);

    try {
        // 'uploadBytes' completes the upload and returns a snapshot
        const snapshot = await uploadBytes(storageRef, file);

        // Get the public URL for the uploaded file
        const downloadURL = await getDownloadURL(snapshot.ref);

        return {
            url: downloadURL,
            name: file.name, // Return the original file name
        };
    } catch (error) {
        console.error("Error uploading CV to Firebase Storage:", error);
        // Re-throw the error to be caught by the calling function
        throw error;
    }
};
