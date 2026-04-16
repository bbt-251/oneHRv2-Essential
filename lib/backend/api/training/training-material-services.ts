import { deleteDoc, doc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase/init";
import { trainingMaterialCollection } from "../../firebase/collections";
import { TrainingMaterialModel } from "@/lib/models/training-material";
import { createLog } from "../logCollection";
import { TRAINING_MATERIAL_LOG_MESSAGES } from "@/lib/log-descriptions/manager-activities";
import { LEARNING_LOG_MESSAGES, LogInfo } from "@/lib/log-descriptions/learning";

const collectionRef = trainingMaterialCollection;
const collectionName = collectionRef.id;

export async function createTrainingMaterial(
    data: Omit<TrainingMaterialModel, "id">,
    actionBy: string,
): Promise<boolean> {
    try {
        const docRef = doc(collectionRef);
        await setDoc(docRef, {
            ...data,
            id: docRef.id,
        });
        // Log the creation
        await createLog(
            TRAINING_MATERIAL_LOG_MESSAGES.CREATED({
                name: data.name,
                category: data.category,
                format: data.format,
                createdBy: actionBy,
            }),
            actionBy,
            "Success",
        );
        return true;
    } catch (error) {
        console.log("Error", error);
        // Log the failure
        await createLog(
            TRAINING_MATERIAL_LOG_MESSAGES.CREATED({
                name: data.name,
                category: data.category,
                format: data.format,
                createdBy: actionBy,
            }),
            actionBy,
            "Failure",
        );
        return false;
    }
}

export async function updateTrainingMaterial(
    data: Partial<TrainingMaterialModel> & { id: string },
    actionBy?: string,
    logInfo?: LogInfo,
): Promise<boolean> {
    try {
        const docRef = doc(db, collectionName, data.id);
        await updateDoc(docRef, data as any);
        // Log the update if logInfo is provided
        if (logInfo) {
            await createLog(logInfo, actionBy ?? "", "Success");
        }
        return true;
    } catch (err) {
        console.error(err);
        // Log the failure if logInfo is provided
        if (logInfo) {
            await createLog(
                {
                    ...logInfo,
                    title: `${logInfo.title} Failed`,
                    description: `Failed to ${logInfo.description.toLowerCase()}`,
                },
                actionBy ?? "",
                "Failure",
            );
        }
        return false;
    }
}

export async function deleteTrainingMaterial(id: string, actionBy: string): Promise<boolean> {
    const docRef = doc(db, collectionName, id);
    try {
        await deleteDoc(docRef);
        // Log the deletion
        await createLog(TRAINING_MATERIAL_LOG_MESSAGES.DELETED(id), actionBy, "Success");
        return true;
    } catch (err) {
        console.error(err);
        // Log the failure
        await createLog(TRAINING_MATERIAL_LOG_MESSAGES.DELETED(id), actionBy, "Failure");
        return false;
    }
}

export async function managerApproveTrainingMaterial(
    id: string,
    comments?: string,
    actionBy?: string,
    materialName?: string,
): Promise<boolean> {
    try {
        const docRef = doc(db, collectionName, id);
        await updateDoc(docRef, {
            approvalStatus: "Awaiting HR Approval",
            comments: comments || "",
        });
        // Log the approval
        if (actionBy) {
            await createLog(
                TRAINING_MATERIAL_LOG_MESSAGES.APPROVED({
                    id,
                    name: materialName || "Training Material",
                    approvedBy: actionBy,
                }),
                actionBy,
                "Success",
            );
        }
        return true;
    } catch (error) {
        console.error("Error approving training material:", error);
        // Log the failure
        if (actionBy) {
            await createLog(
                TRAINING_MATERIAL_LOG_MESSAGES.APPROVED({
                    id,
                    name: materialName || "Training Material",
                    approvedBy: actionBy,
                }),
                actionBy,
                "Failure",
            );
        }
        return false;
    }
}

export async function managerRejectTrainingMaterial(
    id: string,
    comments: string,
    actionBy?: string,
    materialName?: string,
): Promise<boolean> {
    try {
        const docRef = doc(db, collectionName, id);
        await updateDoc(docRef, {
            approvalStatus: "Rejected",
            comments: comments || "",
        });
        // Log the rejection
        if (actionBy) {
            await createLog(
                TRAINING_MATERIAL_LOG_MESSAGES.REJECTED({
                    id,
                    name: materialName || "Training Material",
                    rejectedBy: actionBy,
                    reason: comments,
                }),
                actionBy,
                "Success",
            );
        }
        return true;
    } catch (error) {
        console.error("Error rejecting training material:", error);
        // Log the failure
        if (actionBy) {
            await createLog(
                TRAINING_MATERIAL_LOG_MESSAGES.REJECTED({
                    id,
                    name: materialName || "Training Material",
                    rejectedBy: actionBy,
                    reason: comments,
                }),
                actionBy,
                "Failure",
            );
        }
        return false;
    }
}

export async function HRApproveTrainingMaterial(
    id: string,
    comments?: string,
    actionBy?: string,
): Promise<boolean> {
    try {
        const docRef = doc(db, collectionName, id);
        await updateDoc(docRef, {
            approvalStatus: "Approved",
            comments: comments || "",
        });
        // Log the approval
        await createLog(
            LEARNING_LOG_MESSAGES.TRAINING_MATERIAL_HR_APPROVED("Training Material"),
            actionBy || "",
            "Success",
        );
        return true;
    } catch (error) {
        console.error("Error approving training material:", error);
        // Log the failure
        await createLog(
            LEARNING_LOG_MESSAGES.TRAINING_MATERIAL_HR_APPROVED("Training Material"),
            actionBy || "",
            "Failure",
        );
        return false;
    }
}

export async function HRRefuseTrainingMaterial(
    id: string,
    comments: string,
    actionBy?: string,
): Promise<boolean> {
    try {
        const docRef = doc(db, collectionName, id);
        await updateDoc(docRef, {
            approvalStatus: "Refuse",
            comments: comments,
        });
        // Log the refusal
        await createLog(
            LEARNING_LOG_MESSAGES.TRAINING_MATERIAL_HR_REFUSED("Training Material"),
            actionBy || "",
            "Success",
        );
        return true;
    } catch (error) {
        console.error("Error refuseing training material:", error);
        // Log the failure
        await createLog(
            LEARNING_LOG_MESSAGES.TRAINING_MATERIAL_HR_REFUSED("Training Material"),
            actionBy || "",
            "Failure",
        );
        return false;
    }
}
