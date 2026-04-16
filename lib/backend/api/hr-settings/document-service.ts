import { DocumentDefinitionModel } from "@/lib/models/document";
import { ApprovalComment, SignatureWorkflowModel } from "@/lib/models/signature-workflow";
import { deleteDoc, doc, getDoc, getDocs, setDoc, updateDoc } from "firebase/firestore";
import { documentManagementCollection } from "../../firebase/collections";
import { db } from "../../firebase/init";
import { getSignatureWorkflows } from "./signature-workflow-service";

const collectionRef = documentManagementCollection;
const collectionName = collectionRef.id;

export async function createDocument(data: Omit<DocumentDefinitionModel, "id">): Promise<boolean> {
    try {
        // Save employee in Firestore
        const docRef = doc(collectionRef);
        await setDoc(docRef, {
            ...data,
            id: docRef.id,
        });

        return true;
    } catch (error) {
        console.log("Error", error);
        return false;
    }
}

export async function updateDocument(
    data: Partial<DocumentDefinitionModel> & { id: string },
): Promise<boolean> {
    const docRef = doc(db, collectionName, data.id);
    try {
        await updateDoc(docRef, data as any);
        return true;
    } catch (err) {
        console.error(err);
        return false;
    }
}

export async function deleteDocument(id: string): Promise<boolean> {
    const docRef = doc(db, collectionName, id);
    try {
        await deleteDoc(docRef);
        return true;
    } catch (err) {
        console.error(err);
        return false;
    }
}

export async function getDocuments(): Promise<DocumentDefinitionModel[]> {
    try {
        const querySnapshot = await getDocs(collectionRef);
        const documents: DocumentDefinitionModel[] = [];
        querySnapshot.forEach(doc => {
            documents.push(doc.data() as DocumentDefinitionModel);
        });
        return documents;
    } catch (error) {
        console.error("Error getting documents:", error);
        return [];
    }
}

// Approval and signing functions

/**
 * Approve a document template
 */
export async function approveDocument(
    templateId: string,
    approverUID: string,
    comment?: string,
): Promise<boolean> {
    try {
        const docRef = doc(db, collectionName, templateId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) return false;

        const template = docSnap.data() as DocumentDefinitionModel;

        // Initialize approvalState if it doesn't exist
        let updatedApprovalState = template.approvalState
            ? { ...template.approvalState }
            : {
                status: "pending" as const,
                currentApproverIndex: 1,
                approvedBy: [],
                approvedTimestamps: [],
                rejectedBy: null,
                rejectionReason: null,
                approverComments: [],
            };

        // Add comment if provided
        if (comment) {
            const newComment: ApprovalComment = {
                id: Date.now().toString(),
                approverUID: approverUID,
                approverName: "", // Will be filled by caller
                comment: comment,
                timestamp: new Date().toISOString(),
            };
            updatedApprovalState.approverComments = [
                ...(updatedApprovalState.approverComments || []),
                newComment,
            ];
        }

        // Update approval state based on workflow type
        if (template.approvalWorkflowID === "manager") {
            // Manager approval - single approval completes it
            updatedApprovalState.status = "approved";
            updatedApprovalState.approvedBy = [approverUID];
            updatedApprovalState.approvedTimestamps = [new Date().toISOString()];
        } else if (template.approvalWorkflowID) {
            // Signature workflow - sequential approval
            const workflow = await getSignatureWorkflow(template.approvalWorkflowID);
            if (!workflow) return false;

            // Get the current approver based on currentApproverIndex
            const currentApproverIndex = updatedApprovalState.currentApproverIndex ?? 1;
            const currentApprover = workflow.approvers.find(
                approver => approver.order === currentApproverIndex,
            );

            if (!currentApprover || currentApprover.employeeUID !== approverUID) return false;

            updatedApprovalState.approvedBy = [
                ...(updatedApprovalState.approvedBy || []),
                approverUID,
            ];
            updatedApprovalState.approvedTimestamps = [
                ...(updatedApprovalState.approvedTimestamps || []),
                new Date().toISOString(),
            ];

            // Check if this is the final approval
            if (currentApproverIndex >= workflow.approvers.length) {
                updatedApprovalState.status = "approved";
            } else {
                updatedApprovalState.currentApproverIndex = currentApproverIndex + 1;
            }
        }

        await updateDoc(docRef, { approvalState: updatedApprovalState });
        return true;
    } catch (error) {
        console.error("Error approving document:", error);
        return false;
    }
}

/**
 * Reject a document template
 */
export async function rejectDocument(
    templateId: string,
    approverUID: string,
    reason: string,
    comment?: string,
): Promise<boolean> {
    try {
        const docRef = doc(db, collectionName, templateId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) return false;

        const template = docSnap.data() as DocumentDefinitionModel;

        if (!template.approvalState) return false;

        const updatedApprovalState = { ...template.approvalState };

        // Add comment if provided
        if (comment) {
            const newComment: ApprovalComment = {
                id: Date.now().toString(),
                approverUID: approverUID,
                approverName: "", // Will be filled by caller
                comment: comment,
                timestamp: new Date().toISOString(),
            };
            updatedApprovalState.approverComments = [
                ...(updatedApprovalState.approverComments || []),
                newComment,
            ];
        }

        // Set rejection state
        updatedApprovalState.status = "rejected";
        updatedApprovalState.rejectedBy = approverUID;
        updatedApprovalState.rejectionReason = reason;

        await updateDoc(docRef, { approvalState: updatedApprovalState });
        return true;
    } catch (error) {
        console.error("Error rejecting document:", error);
        return false;
    }
}

/**
 * Get a single signature workflow by ID
 */
export async function getSignatureWorkflow(
    workflowId: string,
): Promise<SignatureWorkflowModel | null> {
    try {
        const workflows = await getSignatureWorkflows();
        const workflow = workflows.find(w => w.id === workflowId && w.active);
        return workflow || null;
    } catch (error) {
        console.error("Error getting signature workflow:", error);
        return null;
    }
}

/**
 * Sign a document for an employee
 */
export async function signDocument(templateId: string, employeeUID: string): Promise<boolean> {
    try {
        const docRef = doc(db, collectionName, templateId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) return false;

        const template = docSnap.data() as DocumentDefinitionModel;

        // Check if document requires employee signature
        if (template.employeeSignatureNeeded !== "Yes") {
            return false;
        }

        // Get employee data to add to signedDocuments
        const employeeRef = doc(db, "employees", employeeUID);
        const employeeSnap = await getDoc(employeeRef);

        if (!employeeSnap.exists()) return false;

        const employeeData = employeeSnap.data();
        const signedDocuments = employeeData.signedDocuments || [];

        // Check if already signed
        if (signedDocuments.includes(templateId)) {
            return true; // Already signed
        }

        // Add template ID to signedDocuments array
        signedDocuments.push(templateId);

        // Update employee document
        await updateDoc(employeeRef, { signedDocuments });

        return true;
    } catch (error) {
        console.error("Error signing document:", error);
        return false;
    }
}

/**
 * Get pending approvals for a specific user
 */
export async function getPendingApprovalsForUser(
    userUID: string,
): Promise<DocumentDefinitionModel[]> {
    try {
        const querySnapshot = await getDocs(collectionRef);
        const pendingApprovals: DocumentDefinitionModel[] = [];

        querySnapshot.forEach(docSnap => {
            const template = docSnap.data() as DocumentDefinitionModel;

            // Check if document has approval workflow and is pending
            if (!template.approvalWorkflowID || template.approvalState?.status !== "pending") {
                return;
            }

            // Check if user is the current approver
            if (template.approvalWorkflowID === "manager") {
                // For manager approval, check if user is the line manager
                // This would need to be checked against employee data
                // For now, we'll include it if it's pending
                pendingApprovals.push(template);
            } else {
                // For signature workflow, check if user is current approver
                const currentApproverIndex = template.approvalState?.currentApproverIndex ?? 0;
                // We need to check the workflow to see if this user is the current approver
                // This is handled in the component logic
                pendingApprovals.push(template);
            }
        });

        return pendingApprovals;
    } catch (error) {
        console.error("Error getting pending approvals:", error);
        return [];
    }
}
