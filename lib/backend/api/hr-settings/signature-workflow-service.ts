import { SignatureWorkflowModel } from "@/lib/models/signature-workflow";
import { deleteDoc, doc, getDoc, getDocs, setDoc, updateDoc, collection } from "firebase/firestore";
import { db } from "../../firebase/init";
import { createLog } from "../logCollection";

// Get collection reference - stored under hrSettings/main/signatureWorkflows
function getCollection() {
    return collection(db, "hrSettings", "main", "signatureWorkflows");
}

// Helper to log activity for signature workflows
async function logActivity(
    action: "CREATED" | "UPDATED" | "DELETED",
    workflow: SignatureWorkflowModel,
    userId?: string,
    details?: string,
): Promise<void> {
    if (!userId) return;

    try {
        const logInfo = {
            title: `Signature Workflow ${action}`,
            description: `${action} signature workflow "${workflow.name}"${details ? `: ${details}` : ""}`,
            module: "Company Setup - Document Management",
        };
        await createLog(logInfo, userId, "Success");
    } catch (error) {
        console.error("[SIGNATURE WORKFLOW ACTIVITY LOG ERROR]", error);
    }
}

export async function createSignatureWorkflow(
    data: Omit<SignatureWorkflowModel, "id">,
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
            const newWorkflow = { ...data, id: docRef.id } as SignatureWorkflowModel;
            await logActivity("CREATED", newWorkflow, createdById);
        }

        return true;
    } catch (error) {
        console.log("Error", error);
        return false;
    }
}

export async function updateSignatureWorkflow(
    data: Partial<SignatureWorkflowModel> & { id: string },
    updatedById?: string,
): Promise<boolean> {
    try {
        const collectionRef = getCollection();
        const docRef = doc(collectionRef, data.id);

        // Get existing document for logging
        const docSnap = await getDoc(docRef);
        const existingDoc = docSnap.exists() ? (docSnap.data() as SignatureWorkflowModel) : null;

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

export async function deleteSignatureWorkflow(id: string, deletedById?: string): Promise<boolean> {
    try {
        const collectionRef = getCollection();
        const docRef = doc(collectionRef, id);

        // Get existing document for logging
        const docSnap = await getDoc(docRef);
        const existingDoc = docSnap.exists() ? (docSnap.data() as SignatureWorkflowModel) : null;

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

export async function getSignatureWorkflows(): Promise<SignatureWorkflowModel[]> {
    try {
        const collectionRef = getCollection();
        const querySnapshot = await getDocs(collectionRef);

        const workflows: SignatureWorkflowModel[] = [];
        querySnapshot.forEach(doc => {
            workflows.push(doc.data() as SignatureWorkflowModel);
        });

        return workflows;
    } catch (error) {
        console.error("Error getting signature workflows:", error);
        return [];
    }
}
