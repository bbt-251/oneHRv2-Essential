import { FileDocumentModel } from "@/lib/models/file-document";
import { deleteDoc, doc, getDoc, getDocs, setDoc, updateDoc, collection } from "firebase/firestore";
import { db } from "../../firebase/init";
import { getDownloadURL, ref, uploadBytes, deleteObject } from "firebase/storage";
import { storage } from "../../firebase/init";
import { createLog } from "../logCollection";

// Collection type for file documents
export type FileDocumentType = "header" | "footer" | "signature" | "stamp" | "initial";

// Map type to display name
const typeDisplayNames: Record<FileDocumentType, string> = {
    header: "Header",
    footer: "Footer",
    signature: "Signature",
    stamp: "Stamp",
    initial: "Initial",
};

// Helper to log activity for file documents
async function logActivity(
    action: "CREATED" | "UPDATED" | "DELETED",
    document: FileDocumentModel,
    type: FileDocumentType,
    userId?: string,
    details?: string,
): Promise<void> {
    if (!userId) return;

    try {
        const logInfo = {
            title: `${typeDisplayNames[type]} Document ${action}`,
            description: `${action.toLowerCase()} ${typeDisplayNames[type].toLowerCase()} document "${document.name}"${details ? `: ${details}` : ""}`,
            module: "Company Setup - Document Management",
        };
        await createLog(logInfo, userId, "Success");
    } catch (error) {
        console.error("[FILE DOCUMENT ACTIVITY LOG ERROR]", error);
    }
}

// Get collection based on type - stored under hrSettings/main/{type}Documents
function getCollection(type: FileDocumentType) {
    switch (type) {
        case "header":
            return collection(db, "hrSettings", "main", "headerDocuments");
        case "footer":
            return collection(db, "hrSettings", "main", "footerDocuments");
        case "signature":
            return collection(db, "hrSettings", "main", "signatureDocuments");
        case "stamp":
            return collection(db, "hrSettings", "main", "stampDocuments");
        case "initial":
            return collection(db, "hrSettings", "main", "initialDocuments");
    }
}

// Get storage path based on type
function getStoragePath(type: FileDocumentType): string {
    switch (type) {
        case "header":
            return "header-documents";
        case "footer":
            return "footer-documents";
        case "signature":
            return "signature-documents";
        case "stamp":
            return "stamp-documents";
        case "initial":
            return "initial-documents";
    }
}

// Validate file (image only, max 5MB)
export function validateFile(file: File): { valid: boolean; error?: string } {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
        return { valid: false, error: "Only image files (JPEG, PNG, GIF, WebP, SVG) are allowed" };
    }

    if (file.size > maxSize) {
        return { valid: false, error: "File size must be less than 5MB" };
    }

    return { valid: true };
}

// Upload file to Firebase Storage
async function uploadFile(
    file: File,
    type: FileDocumentType,
): Promise<{ url: string; filePath: string } | null> {
    try {
        const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
        const storageRef = ref(storage, `${getStoragePath(type)}/${fileName}`);
        const uploadResult = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(uploadResult.ref);
        return { url: downloadURL, filePath: uploadResult.ref.fullPath };
    } catch (error) {
        console.error("Error uploading file:", error);
        return null;
    }
}

// Delete file from Firebase Storage
async function deleteFile(filePath: string): Promise<boolean> {
    try {
        const fileRef = ref(storage, filePath);
        await deleteObject(fileRef);
        return true;
    } catch (error) {
        console.error("Error deleting file:", error);
        return false;
    }
}

// Create file document
export async function createFileDocument(
    type: FileDocumentType,
    data: Omit<FileDocumentModel, "id" | "fileUrl" | "filePath" | "fileType" | "mimeType" | "type">,
    file: File,
    createdById?: string,
): Promise<boolean> {
    try {
        // Validate file
        const validation = validateFile(file);
        if (!validation.valid) {
            console.error("File validation failed:", validation.error);
            return false;
        }

        // Upload file
        const uploadResult = await uploadFile(file, type);
        if (!uploadResult) {
            return false;
        }

        // Create document
        const collectionRef = getCollection(type);
        const docRef = doc(collectionRef);

        await setDoc(docRef, {
            ...data,
            id: docRef.id,
            fileUrl: uploadResult.url,
            filePath: uploadResult.filePath,
            fileType: file.type.split("/")[1],
            mimeType: file.type,
        });

        // Log activity if userId provided
        if (createdById) {
            const newDoc = {
                ...data,
                id: docRef.id,
                fileUrl: uploadResult.url,
                filePath: uploadResult.filePath,
            } as FileDocumentModel;
            await logActivity("CREATED", newDoc, type, createdById);
        }

        return true;
    } catch (error) {
        console.error("Error creating file document:", error);
        return false;
    }
}

// Update file document
export async function updateFileDocument(
    type: FileDocumentType,
    data: Partial<FileDocumentModel> & { id: string },
    newFile?: File,
    updatedById?: string,
): Promise<boolean> {
    try {
        const collectionRef = getCollection(type);
        const docRef = doc(collectionRef, data.id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            return false;
        }

        const existingData = docSnap.data() as FileDocumentModel;
        let updateData = { ...data };

        // If new file provided, handle upload and delete old file
        if (newFile) {
            const validation = validateFile(newFile);
            if (!validation.valid) {
                console.error("File validation failed:", validation.error);
                return false;
            }

            // Delete old file if exists
            if (existingData.filePath) {
                await deleteFile(existingData.filePath);
            }

            // Upload new file
            const uploadResult = await uploadFile(newFile, type);
            if (!uploadResult) {
                return false;
            }

            updateData.fileUrl = uploadResult.url;
            updateData.filePath = uploadResult.filePath;
            updateData.fileType = newFile.type.split("/")[1];
            updateData.mimeType = newFile.type;
        }

        await updateDoc(docRef, updateData as any);

        // Log activity if userId provided
        if (updatedById) {
            await logActivity("UPDATED", existingData, type, updatedById);
        }

        return true;
    } catch (error) {
        console.error("Error updating file document:", error);
        return false;
    }
}

// Delete file document
export async function deleteFileDocument(
    type: FileDocumentType,
    id: string,
    deletedById?: string,
): Promise<boolean> {
    try {
        const collectionRef = getCollection(type);
        const docRef = doc(collectionRef, id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            return false;
        }

        const existingData = docSnap.data() as FileDocumentModel;

        // Delete file from storage if exists
        if (existingData.filePath) {
            await deleteFile(existingData.filePath);
        }

        await deleteDoc(docRef);

        // Log activity if userId provided
        if (deletedById) {
            await logActivity("DELETED", existingData, type, deletedById);
        }

        return true;
    } catch (error) {
        console.error("Error deleting file document:", error);
        return false;
    }
}

// Get all documents of a type
export async function getFileDocuments(type: FileDocumentType): Promise<FileDocumentModel[]> {
    try {
        const collectionRef = getCollection(type);
        const querySnapshot = await getDocs(collectionRef);

        const documents: FileDocumentModel[] = [];
        querySnapshot.forEach(doc => {
            documents.push(doc.data() as FileDocumentModel);
        });

        return documents;
    } catch (error) {
        console.error("Error getting file documents:", error);
        return [];
    }
}
