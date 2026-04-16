import { ExternalDocumentModel } from "@/lib/models/external-document";
import { deleteDoc, doc, getDoc, getDocs, setDoc, updateDoc, collection } from "firebase/firestore";
import { db } from "../../firebase/init";
import { createLog } from "../logCollection";

// Get collection reference - stored under hrSettings/main/externalDocuments
function getCollection() {
    return collection(db, "hrSettings", "main", "externalDocuments");
}

// Helper to log activity for external documents
async function logActivity(
    action: "CREATED" | "UPDATED" | "DELETED",
    document: ExternalDocumentModel,
    userId?: string,
    details?: string,
): Promise<void> {
    if (!userId) return;

    try {
        const logInfo = {
            title: `External Document ${action}`,
            description: `${action} external document "${document.name}"${details ? `: ${details}` : ""}`,
            module: "Company Setup - Document Management",
        };
        await createLog(logInfo, userId, "Success");
    } catch (error) {
        console.error("[EXTERNAL DOCUMENT ACTIVITY LOG ERROR]", error);
    }
}

export async function createExternalDocument(
    data: Omit<ExternalDocumentModel, "id">,
    createdById?: string,
): Promise<boolean> {
    try {
        const collectionRef = getCollection();
        const docRef = doc(collectionRef);
        await setDoc(docRef, {
            ...data,
            id: docRef.id,
        });

        // Log activity if userId provided
        if (createdById) {
            const newDoc = { ...data, id: docRef.id } as ExternalDocumentModel;
            await logActivity("CREATED", newDoc, createdById);
        }

        return true;
    } catch (error) {
        console.log("Error", error);
        return false;
    }
}

export async function updateExternalDocument(
    data: Partial<ExternalDocumentModel> & { id: string },
    updatedById?: string,
): Promise<boolean> {
    try {
        const collectionRef = getCollection();
        const docRef = doc(collectionRef, data.id);

        // Get existing document for logging
        const docSnap = await getDoc(docRef);
        const existingDoc = docSnap.exists() ? (docSnap.data() as ExternalDocumentModel) : null;

        await updateDoc(docRef, data as any);

        // Log activity if userId provided
        if (updatedById && existingDoc) {
            await logActivity("UPDATED", existingDoc, updatedById);
        }

        return true;
    } catch (err) {
        console.error(err);
        return false;
    }
}

export async function deleteExternalDocument(id: string, deletedById?: string): Promise<boolean> {
    try {
        const collectionRef = getCollection();
        const docRef = doc(collectionRef, id);

        // Get existing document for logging
        const docSnap = await getDoc(docRef);
        const existingDoc = docSnap.exists() ? (docSnap.data() as ExternalDocumentModel) : null;

        await deleteDoc(docRef);

        // Log activity if userId provided
        if (deletedById && existingDoc) {
            await logActivity("DELETED", existingDoc, deletedById);
        }

        return true;
    } catch (err) {
        console.error(err);
        return false;
    }
}

export async function getExternalDocuments(): Promise<ExternalDocumentModel[]> {
    try {
        const collectionRef = getCollection();
        const querySnapshot = await getDocs(collectionRef);

        const documents: ExternalDocumentModel[] = [];
        querySnapshot.forEach(doc => {
            documents.push(doc.data() as ExternalDocumentModel);
        });

        return documents;
    } catch (error) {
        console.error("Error getting external documents:", error);
        return [];
    }
}
