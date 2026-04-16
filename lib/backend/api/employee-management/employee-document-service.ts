import { EmployeeDocument } from "@/lib/models/type";
import {
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    query,
    setDoc,
    updateDoc,
    where,
    collection,
    addDoc,
} from "firebase/firestore";
import { db } from "../../firebase/init";
import { employeeDocumentCollection } from "../../firebase/collections";
import { getDownloadURL, ref, uploadBytes, deleteObject } from "firebase/storage";
import { storage } from "../../firebase/init";

const collectionRef = employeeDocumentCollection;
const collectionName = collectionRef.id;

export async function getEmployeeDocuments(uid: string): Promise<EmployeeDocument[]> {
    try {
        const q = query(collectionRef, where("uid", "==", uid));
        const querySnapshot = await getDocs(q);

        const documents: EmployeeDocument[] = [];
        querySnapshot.forEach(doc => {
            documents.push(doc.data() as EmployeeDocument);
        });

        return documents;
    } catch (error) {
        console.error("Error getting employee documents:", error);
        return [];
    }
}

export async function uploadEmployeeDocument(
    uid: string,
    documentData: Omit<EmployeeDocument, "id" | "uploadDate" | "size" | "uploadedBy">,
    file: File,
    uploadedBy: string,
): Promise<EmployeeDocument | null> {
    try {
        // Upload file to Firebase Storage
        const storageRef = ref(storage, `employee-documents/${uid}/${Date.now()}_${file.name}`);
        const uploadResult = await uploadBytes(storageRef, file);

        // Get download URL
        const downloadURL = await getDownloadURL(uploadResult.ref);

        // Create document record in Firestore with explicit ID
        const docRef = doc(collectionRef);
        const newDocument: EmployeeDocument = {
            id: docRef.id,
            uid,
            name: documentData.name || file.name,
            type: documentData.type,
            uploadDate: new Date().toISOString().split("T")[0],
            size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
            uploadedBy,
            fileUrl: downloadURL,
            filePath: uploadResult.ref.fullPath,
        };

        await setDoc(docRef, newDocument);

        return newDocument;
    } catch (error) {
        console.error("Error uploading employee document:", error);
        return null;
    }
}

export async function deleteEmployeeDocument(documentId: string): Promise<boolean> {
    try {
        // First get the document to get the file path
        const docRef = doc(collectionRef, documentId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const documentData = docSnap.data() as EmployeeDocument;

            // Delete file from storage if it exists
            if (documentData.filePath) {
                const fileRef = ref(storage, documentData.filePath);
                await deleteObject(fileRef);
            }

            // Delete document from Firestore
            await deleteDoc(docRef);
            return true;
        }

        return false;
    } catch (error) {
        console.error("Error deleting employee document:", error);
        return false;
    }
}

export async function getDocumentDownloadUrl(documentId: string): Promise<string | null> {
    try {
        const docRef = doc(collectionRef, documentId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const documentData = docSnap.data() as EmployeeDocument;

            // If we have a filePath, get a fresh download URL from Firebase Storage
            if (documentData.filePath) {
                try {
                    const fileRef = ref(storage, documentData.filePath);
                    const downloadURL = await getDownloadURL(fileRef);
                    return downloadURL;
                } catch (storageError) {
                    console.error("Error getting download URL from storage:", storageError);
                    // Fallback to stored URL if available
                    return documentData.fileUrl || null;
                }
            }

            return documentData.fileUrl || null;
        }

        return null;
    } catch (error) {
        console.error("Error getting document download URL:", error);
        return null;
    }
}
