import { ObjectiveModel } from "@/lib/models/objective-model";
import {
    deleteDoc,
    doc,
    setDoc,
    updateDoc,
    writeBatch,
    runTransaction,
    Transaction,
} from "firebase/firestore";
import { objectiveCollection, logCollection } from "../../firebase/collections";
import { db } from "../../firebase/init";
import { getTimestamp } from "@/lib/util/dayjs_format";
import { LogModel } from "@/lib/models/log";

const collectionRef = objectiveCollection;
const collectionName = collectionRef.id;

// ============================================================================
// AUDIT LOGGING FUNCTIONS
// ============================================================================

/**
 * Creates an audit log entry for performance evaluation actions
 */
async function createEvaluationAuditLog(
    action: string,
    description: string,
    actionBy: string,
    employeeUid?: string,
    campaignId?: string,
    additionalData?: Record<string, any>,
): Promise<boolean> {
    try {
        const logDocRef = doc(logCollection);
        const logData: Omit<LogModel, "id"> = {
            timestamp: getTimestamp(),
            module: "Performance Evaluation",
            title: action,
            description: description,
            status: "Success",
            actionBy,
        };

        // Add additional metadata as JSON string in description if provided
        if (additionalData) {
            logData.description += ` | Metadata: ${JSON.stringify(additionalData)}`;
        }

        await setDoc(logDocRef, logData);
        console.log(`[AUDIT] ${action}: ${description}`);
        return true;
    } catch (error) {
        console.error("[AUDIT ERROR] Failed to create audit log:", error);
        return false;
    }
}

/**
 * Creates a detailed audit log for objective updates with before/after state
 */
async function createObjectiveChangeLog(
    objectiveId: string,
    actionType: "CREATE" | "UPDATE" | "DELETE" | "FINALIZE" | "SELF_ASSESSMENT",
    actionBy: string,
    changes: {
        field: string;
        oldValue?: any;
        newValue?: any;
    }[],
    employeeUid?: string,
    campaignId?: string,
): Promise<boolean> {
    try {
        const logDocRef = doc(logCollection);
        const changeSummary = changes
            .map(c => `${c.field}: ${c.oldValue ?? "null"} → ${c.newValue ?? "null"}`)
            .join(", ");

        const logData: Omit<LogModel, "id"> = {
            timestamp: getTimestamp(),
            module: "Performance Evaluation - Objectives",
            title: `Objective ${actionType}`,
            description: `Objective ${objectiveId} - ${actionType} by ${actionBy} | Changes: ${changeSummary}`,
            status: "Success",
            actionBy,
        };

        await setDoc(logDocRef, logData);
        return true;
    } catch (error) {
        console.error("[AUDIT ERROR] Failed to create change log:", error);
        return false;
    }
}

// ============================================================================
// TRANSACTION-BASED OPERATIONS
// ============================================================================

/**
 * Updates objectives within a Firestore transaction
 * Ensures atomicity - all updates succeed or all are rolled back
 */
async function updateObjectivesTransaction(
    transaction: Transaction,
    dataArray: Array<Partial<ObjectiveModel> & { id: string }>,
): Promise<void> {
    for (const data of dataArray) {
        const docRef = doc(db, collectionName, data.id);

        // Get current state for audit purposes
        // Note: In a real implementation, you'd want to capture pre-state here

        transaction.update(docRef, data as any);
    }
}

/**
 * Validates that all required fields are present for finalization
 */
function validateFinalizationRequirements(
    dataArray: Array<Partial<ObjectiveModel> & { id: string }>,
): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const data of dataArray) {
        if (!data.id) {
            errors.push("Missing objective ID");
            continue;
        }

        // Check if it's a finalization attempt (isAbleToEdit = false)
        if (data.managerEvaluation?.isAbleToEdit === false) {
            // Validate that all required fields are present for finalization
            if (
                data.managerEvaluation?.value === null ||
                data.managerEvaluation?.value === undefined
            ) {
                errors.push(`Objective ${data.id}: Manager rating is required for finalization`);
            }
            if (!data.managerEvaluation?.justification) {
                errors.push(
                    `Objective ${data.id}: Manager justification is required for finalization`,
                );
            }
        }
    }

    return { valid: errors.length === 0, errors };
}

/**
 * Checks if all objectives for an employee have been evaluated
 */
async function validateAllObjectivesEvaluated(
    employeeUid: string,
    period: string,
    round: string,
    objectiveIds: string[],
): Promise<{ valid: boolean; missingCount: number; missingIds: string[] }> {
    // This would typically query the database to check all objectives
    // For now, we validate that all provided objectives are being finalized
    // A more complete implementation would query all objectives for the employee

    const missingCount = 0; // Placeholder - would be calculated from DB
    return {
        valid: true, // Placeholder
        missingCount,
        missingIds: [],
    };
}

// ============================================================================
// PUBLIC API
// ============================================================================

export async function createObjective(
    data: Omit<ObjectiveModel, "id">,
    actionBy: string,
): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
        const docRef = doc(collectionRef);
        const objectiveData = {
            ...data,
            id: docRef.id,
        };

        await setDoc(docRef, objectiveData);

        // Create audit log
        await createEvaluationAuditLog(
            "Objective Created",
            `Created objective "${data.title}" for employee ${data.employee}`,
            actionBy,
            data.employee,
            data.period,
        );

        // Create change log
        await createObjectiveChangeLog(docRef.id, "CREATE", actionBy, [
            { field: "title", newValue: data.title },
            { field: "employee", newValue: data.employee },
            { field: "period", newValue: data.period },
            { field: "round", newValue: data.round },
        ]);

        return { success: true, id: docRef.id };
    } catch (error: any) {
        console.error("Error creating objective:", error);

        // Log failure
        await createEvaluationAuditLog(
            "Objective Creation Failed",
            `Failed to create objective: ${error.message}`,
            actionBy,
        );

        return { success: false, error: error.message };
    }
}

export async function updateObjective(
    data: Partial<ObjectiveModel> & { id: string },
    actionBy: string,
    captureChange: boolean = true,
): Promise<{ success: boolean; error?: string }> {
    try {
        const docRef = doc(db, collectionName, data.id);

        // Capture changes for audit if requested
        if (captureChange) {
            await createObjectiveChangeLog(
                data.id,
                "UPDATE",
                actionBy,
                Object.entries(data).map(([field, value]) => ({
                    field,
                    newValue: value,
                })),
            );
        }

        await updateDoc(docRef, data as any);

        return { success: true };
    } catch (error: any) {
        console.error("Error updating objective:", error);
        return { success: false, error: error.message };
    }
}

export async function deleteObjective(
    id: string,
    actionBy: string,
): Promise<{ success: boolean; error?: string }> {
    try {
        const docRef = doc(db, collectionName, id);

        await deleteDoc(docRef);

        // Create audit log
        await createObjectiveChangeLog(id, "DELETE", actionBy, [
            { field: "status", oldValue: "deleted", newValue: "deleted" },
        ]);

        await createEvaluationAuditLog("Objective Deleted", `Deleted objective ${id}`, actionBy);

        return { success: true };
    } catch (error: any) {
        console.error("Error deleting objective:", error);
        return { success: false, error: error.message };
    }
}

/**
 * Finalizes performance evaluations with full transactional support and audit logging
 *
 * @param dataArray - Array of objective updates containing manager evaluations
 * @param actionBy - UID of the user performing the finalization
 * @param isFinalize - If true, this is a finalization (locks the evaluation); if false, it's a save
 * @returns Result indicating success/failure with details
 */
export async function finalizeObjectives(
    dataArray: Array<Partial<ObjectiveModel> & { id: string }>,
    actionBy: string,
    isFinalize: boolean = true,
): Promise<{
    success: boolean;
    message: string;
    finalizedCount: number;
    errors: string[];
}> {
    const errors: string[] = [];
    let finalizedCount = 0;

    try {
        // Step 1: Validate inputs
        if (!dataArray.length) {
            return {
                success: false,
                message: "No objectives to finalize",
                finalizedCount: 0,
                errors: ["Empty data array provided"],
            };
        }

        // Step 2: Validate finalization requirements
        const validation = validateFinalizationRequirements(dataArray);
        if (!validation.valid) {
            return {
                success: false,
                message: "Validation failed",
                finalizedCount: 0,
                errors: validation.errors,
            };
        }

        // Step 3: Execute within transaction for atomicity
        await runTransaction(db, async transaction => {
            // Update all objectives within the transaction
            for (const data of dataArray) {
                const docRef = doc(db, collectionName, data.id);

                // Apply the update
                transaction.update(docRef, data as any);

                finalizedCount++;
            }
        });

        // Step 3.5: Create audit logs AFTER transaction completes successfully
        for (const data of dataArray) {
            await createObjectiveChangeLog(data.id, isFinalize ? "FINALIZE" : "UPDATE", actionBy, [
                { field: "managerEvaluation", newValue: data.managerEvaluation },
                { field: "isAbleToEdit", newValue: !isFinalize },
            ]);
        }

        // Step 4: Create comprehensive audit log after successful transaction
        const actionType = isFinalize ? "Finalized" : "Saved";
        await createEvaluationAuditLog(
            `Objectives ${actionType}`,
            `${actionType} ${dataArray.length} objectives for evaluation by ${actionBy}`,
            actionBy,
            undefined,
            undefined,
            {
                finalizedCount,
                isFinalize,
                objectiveIds: dataArray.map(d => d.id),
            },
        );

        console.log(`[SUCCESS] ${isFinalize ? "Finalized" : "Saved"} ${finalizedCount} objectives`);

        return {
            success: true,
            message: isFinalize
                ? `Successfully finalized ${finalizedCount} evaluations`
                : `Successfully saved ${finalizedCount} evaluations`,
            finalizedCount,
            errors: [],
        };
    } catch (error: any) {
        console.error(`[ERROR] Failed to ${isFinalize ? "finalize" : "save"} objectives:`, error);

        // Log the failure
        await createEvaluationAuditLog(
            `Objectives ${isFinalize ? "Finalization" : "Save"} Failed`,
            `Failed to ${isFinalize ? "finalize" : "save"} objectives: ${error.message}`,
            actionBy,
            undefined,
            undefined,
            {
                attemptedCount: dataArray.length,
                error: error.message,
            },
        );

        return {
            success: false,
            message: `Failed to ${isFinalize ? "finalize" : "save"} evaluations`,
            finalizedCount: 0,
            errors: [error.message],
        };
    }
}

/**
 * Saves self-assessment for objectives with detailed logging
 *
 * @param dataArray - Array of objective updates containing self-evaluations
 * @param actionBy - UID of the employee submitting the self-assessment
 * @returns Result indicating success/failure
 */
export async function saveSelfAssessment(
    dataArray: Array<Partial<ObjectiveModel> & { id: string }>,
    actionBy: string,
): Promise<{
    success: boolean;
    message: string;
    savedCount: number;
    errors: string[];
}> {
    const errors: string[] = [];
    let savedCount = 0;

    try {
        // Step 1: Validate inputs
        if (!dataArray.length) {
            return {
                success: false,
                message: "No self-assessments to save",
                savedCount: 0,
                errors: ["Empty data array provided"],
            };
        }

        // Step 2: Validate self-assessment values
        for (const data of dataArray) {
            if (data.selfEvaluation?.value !== undefined) {
                if (
                    !Number.isInteger(data.selfEvaluation.value) ||
                    data.selfEvaluation.value < 1 ||
                    data.selfEvaluation.value > 5
                ) {
                    errors.push(
                        `Invalid self-evaluation value for objective ${data.id}: must be integer 1-5`,
                    );
                }
            }
        }

        if (errors.length > 0) {
            return {
                success: false,
                message: "Validation failed",
                savedCount: 0,
                errors,
            };
        }

        // Step 3: Execute within transaction
        await runTransaction(db, async transaction => {
            for (const data of dataArray) {
                const docRef = doc(db, collectionName, data.id);
                transaction.update(docRef, data as any);
                savedCount++;
            }
        });

        // Step 3.5: Create audit logs AFTER transaction completes successfully
        for (const data of dataArray) {
            await createObjectiveChangeLog(data.id, "SELF_ASSESSMENT", actionBy, [
                { field: "selfEvaluation.value", newValue: data.selfEvaluation?.value },
                {
                    field: "selfEvaluation.justification",
                    newValue: data.selfEvaluation?.justification,
                },
                {
                    field: "selfEvaluation.actualResult",
                    newValue: data.selfEvaluation?.actualResult,
                },
            ]);
        }

        // Step 4: Create audit log
        await createEvaluationAuditLog(
            "Self-Assessment Saved",
            `Saved self-assessment for ${savedCount} objectives by ${actionBy}`,
            actionBy,
            undefined,
            undefined,
            {
                savedCount,
                objectiveIds: dataArray.map(d => d.id),
            },
        );

        console.log(`[SUCCESS] Saved ${savedCount} self-assessments`);

        return {
            success: true,
            message: `Successfully saved ${savedCount} self-assessments`,
            savedCount,
            errors: [],
        };
    } catch (error: any) {
        console.error("[ERROR] Failed to save self-assessments:", error);

        await createEvaluationAuditLog(
            "Self-Assessment Save Failed",
            `Failed to save self-assessments: ${error.message}`,
            actionBy,
            undefined,
            undefined,
            {
                attemptedCount: dataArray.length,
                error: error.message,
            },
        );

        return {
            success: false,
            message: "Failed to save self-assessments",
            savedCount: 0,
            errors: [error.message],
        };
    }
}

/**
 * Legacy batch update function - kept for backward compatibility
 * Consider migrating to the new transaction-based functions above
 */
export async function batchUpdateObjective(
    dataArray: Array<Partial<ObjectiveModel> & { id: string }>,
): Promise<boolean> {
    // Validate 1-5 ratings
    for (const data of dataArray) {
        if (data.selfEvaluation?.value != null) {
            if (
                !Number.isInteger(data.selfEvaluation.value) ||
                data.selfEvaluation.value < 1 ||
                data.selfEvaluation.value > 5
            ) {
                console.error(
                    `Invalid selfEvaluation value for objective ${data.id}: must be integer 1-5`,
                );
                return false;
            }
        }
        if (data.managerEvaluation?.value != null) {
            if (
                !Number.isInteger(data.managerEvaluation.value) ||
                data.managerEvaluation.value < 1 ||
                data.managerEvaluation.value > 5
            ) {
                console.error(
                    `Invalid managerEvaluation value for objective ${data.id}: must be integer 1-5`,
                );
                return false;
            }
        }
    }

    const batch = writeBatch(db);

    try {
        dataArray.forEach(data => {
            const docRef = doc(db, collectionName, data.id);
            batch.update(docRef, data as any);
        });

        await batch.commit();
        return true;
    } catch (error) {
        console.error("Batch update error:", error);
        return false;
    }
}

// ============================================================================
// HELPER TYPES FOR EXTERNAL USE
// ============================================================================

export interface FinalizationResult {
    success: boolean;
    message: string;
    finalizedCount: number;
    errors: string[];
}

export interface SelfAssessmentResult {
    success: boolean;
    message: string;
    savedCount: number;
    errors: string[];
}

export interface AuditLogEntry {
    timestamp: string;
    module: string;
    title: string;
    description: string;
    status: "Success" | "Failure";
    actionBy: string;
}
