import { PerformanceEvaluationModel } from "@/lib/models/performance-evaluation";
import {
    addDoc,
    deleteDoc,
    doc,
    collection as firestoreCollection,
    getDoc,
    getDocs,
    query,
    updateDoc,
    where,
    writeBatch,
} from "firebase/firestore";
import { performanceEvaluationCollection } from "../../firebase/collections";
import { db } from "../../firebase/init";
import { createLog } from "../logCollection";
import { PERFORMANCE_LOG_MESSAGES } from "@/lib/log-descriptions/manager-activities";

export const performanceEvaluationService = {
    /**
     * Create a new performance evaluation
     * @param data Performance evaluation data without id
     * @param actionBy User performing the action
     * @returns Document ID of created performance evaluation
     */
    async create(data: Omit<PerformanceEvaluationModel, "id">, actionBy: string): Promise<string> {
        try {
            const docRef = await addDoc(performanceEvaluationCollection, data);

            // Log the creation
            await createLog(
                PERFORMANCE_LOG_MESSAGES.PERFORMANCE_EVALUATION_CREATED({
                    employeeUID: data.employeeUid,
                    campaignID: data.campaignID,
                    createdBy: actionBy,
                }),
                actionBy,
                "Success",
            );

            return docRef.id;
        } catch (error) {
            console.error("Error creating performance evaluation:", error);

            // Log the failure
            await createLog(
                PERFORMANCE_LOG_MESSAGES.PERFORMANCE_EVALUATION_CREATED({
                    employeeUID: data.employeeUid,
                    campaignID: data.campaignID,
                    createdBy: actionBy,
                }),
                actionBy,
                "Failure",
            );

            throw new Error(
                `Failed to create performance evaluation in collection: ${performanceEvaluationCollection.id}`,
            );
        }
    },

    /**
     * Get a specific performance evaluation by ID
     * @param id Document ID
     * @returns Performance evaluation data or null if not found
     */
    async get(id: string): Promise<PerformanceEvaluationModel | null> {
        try {
            const docRef = doc(performanceEvaluationCollection, id);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() } as PerformanceEvaluationModel;
            }
            return null;
        } catch (error) {
            console.error("Error getting performance evaluation:", error);
            throw new Error(
                `Failed to get performance evaluation from collection: ${performanceEvaluationCollection.id}`,
            );
        }
    },

    /**
     * Get all performance evaluations
     * @returns Array of performance evaluations
     */
    async getAll(): Promise<PerformanceEvaluationModel[]> {
        try {
            const querySnapshot = await getDocs(performanceEvaluationCollection);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            })) as PerformanceEvaluationModel[];
        } catch (error) {
            console.error("Error getting all performance evaluations:", error);
            throw new Error(
                `Failed to get performance evaluations from collection: ${performanceEvaluationCollection.id}`,
            );
        }
    },

    /**
     * Get performance evaluations by campaign ID
     * @param campaignID Campaign ID to filter by
     * @returns Array of performance evaluations for the campaign
     */
    async getByCampaignID(campaignID: string): Promise<PerformanceEvaluationModel[]> {
        try {
            const q = query(performanceEvaluationCollection, where("campaignID", "==", campaignID));
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            })) as PerformanceEvaluationModel[];
        } catch (error) {
            console.error("Error getting performance evaluations by campaign ID:", error);
            throw new Error("Failed to get performance evaluations by campaign ID");
        }
    },

    /**
     * Get performance evaluations by employee UID
     * @param employeeUid Employee UID to filter by
     * @returns Array of performance evaluations for the employee
     */
    async getByEmployeeUid(employeeUid: string): Promise<PerformanceEvaluationModel[]> {
        try {
            const q = query(
                performanceEvaluationCollection,
                where("employeeUid", "==", employeeUid),
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            })) as PerformanceEvaluationModel[];
        } catch (error) {
            console.error("Error getting performance evaluations by employee UID:", error);
            throw new Error("Failed to get performance evaluations by employee UID");
        }
    },

    /**
     * Update a performance evaluation
     * @param id Document ID
     * @param data Partial performance evaluation data
     * @param actionBy User performing the action
     * @returns Success boolean
     */
    async update(
        id: string,
        data: Partial<PerformanceEvaluationModel>,
        actionBy?: string,
    ): Promise<boolean> {
        try {
            const docRef = doc(performanceEvaluationCollection, id);
            await updateDoc(docRef, data);

            // Log performance review completion
            if (actionBy && data.comment) {
                await createLog(
                    PERFORMANCE_LOG_MESSAGES.PERFORMANCE_REVIEW_COMPLETED({
                        employeeName: data.employeeUid || "Employee",
                        completedBy: actionBy,
                        rating: undefined, // Could be extracted from comment if needed
                    }),
                    actionBy,
                    "Success",
                );
            } else if (actionBy) {
                // Log general update
                await createLog(
                    PERFORMANCE_LOG_MESSAGES.PERFORMANCE_EVALUATION_UPDATED({
                        id,
                        employeeUID: data.employeeUid || "Unknown",
                        updatedBy: actionBy,
                    }),
                    actionBy,
                    "Success",
                );
            }

            return true;
        } catch (error) {
            console.error("Error updating performance evaluation:", error);

            // Log failure
            if (actionBy && data.comment) {
                await createLog(
                    PERFORMANCE_LOG_MESSAGES.PERFORMANCE_REVIEW_COMPLETED({
                        employeeName: data.employeeUid || "Employee",
                        completedBy: actionBy,
                        rating: undefined,
                    }),
                    actionBy,
                    "Failure",
                );
            } else if (actionBy) {
                // Log general update failure
                await createLog(
                    PERFORMANCE_LOG_MESSAGES.PERFORMANCE_EVALUATION_UPDATED({
                        id,
                        employeeUID: data.employeeUid || "Unknown",
                        updatedBy: actionBy,
                    }),
                    actionBy,
                    "Failure",
                );
            }

            throw new Error(
                `Failed to update performance evaluation in collection: ${performanceEvaluationCollection.id}`,
            );
        }
    },

    /**
     * Delete a performance evaluation
     * @param id Document ID
     * @param actionBy User performing the action
     * @returns Promise<void>
     */
    async delete(id: string, actionBy: string): Promise<void> {
        try {
            const docRef = doc(performanceEvaluationCollection, id);
            await deleteDoc(docRef);

            // Log the deletion
            await createLog(
                PERFORMANCE_LOG_MESSAGES.PERFORMANCE_EVALUATION_DELETED({
                    id,
                    employeeUID: "Unknown", // Would need to fetch from existing data
                    deletedBy: actionBy,
                }),
                actionBy,
                "Success",
            );
        } catch (error) {
            console.error("Error deleting performance evaluation:", error);

            // Log the failure
            await createLog(
                PERFORMANCE_LOG_MESSAGES.PERFORMANCE_EVALUATION_DELETED({
                    id,
                    employeeUID: "Unknown",
                    deletedBy: actionBy,
                }),
                actionBy,
                "Failure",
            );

            throw new Error("Failed to delete performance evaluation");
        }
    },

    /**
     * Batch add multiple performance evaluations
     * @param evaluations Array of performance evaluation data without ids
     * @param actionBy User performing the action
     * @returns Array of created document IDs
     */
    async batchAdd(
        evaluations: Omit<PerformanceEvaluationModel, "id">[],
        actionBy: string,
    ): Promise<string[]> {
        try {
            const batch = writeBatch(db);
            const docRefs: any[] = [];

            evaluations.forEach(evaluation => {
                const docRef = doc(firestoreCollection(db, "performanceEvaluation"));
                batch.set(docRef, evaluation);
                docRefs.push(docRef);
            });

            await batch.commit();

            // Log the bulk creation
            await createLog(
                {
                    title: "Performance Evaluations Batch Created",
                    description: `Batch created ${evaluations.length} performance evaluations`,
                    module: "Performance Management",
                },
                actionBy,
                "Success",
            );

            return docRefs.map(ref => ref.id);
        } catch (error) {
            console.error("Error batch adding performance evaluations:", error);

            // Log the failure
            await createLog(
                {
                    title: "Performance Evaluations Batch Creation Failed",
                    description: `Failed to batch create ${evaluations.length} performance evaluations`,
                    module: "Performance Management",
                },
                actionBy,
                "Failure",
            );

            throw new Error("Failed to batch add performance evaluations");
        }
    },

    /**
     * Batch update multiple performance evaluations
     * @param updates Array of objects containing id and update data
     * @param actionBy User performing the action
     * @returns Success boolean
     */
    async batchUpdate(
        updates: { id: string; data: Partial<PerformanceEvaluationModel> }[],
        actionBy: string,
    ): Promise<boolean> {
        try {
            const batch = writeBatch(db);

            updates.forEach(({ id, data }) => {
                const docRef = doc(performanceEvaluationCollection, id);
                batch.update(docRef, data);
            });

            await batch.commit();

            // Log the bulk update
            await createLog(
                {
                    title: "Performance Evaluations Batch Updated",
                    description: `Batch updated ${updates.length} performance evaluations`,
                    module: "Performance Management",
                },
                actionBy,
                "Success",
            );

            return true;
        } catch (error) {
            console.error("Error batch updating performance evaluations:", error);

            // Log the failure
            await createLog(
                {
                    title: "Performance Evaluations Batch Update Failed",
                    description: `Failed to batch update ${updates.length} performance evaluations`,
                    module: "Performance Management",
                },
                actionBy,
                "Failure",
            );

            throw new Error("Failed to batch update performance evaluations");
        }
    },

    /**
     * Batch delete multiple performance evaluations
     * @param ids Array of document IDs to delete
     * @param actionBy User performing the action
     * @returns Promise<void>
     */
    async batchDelete(ids: string[], actionBy: string): Promise<void> {
        try {
            const batch = writeBatch(db);

            ids.forEach(id => {
                const docRef = doc(performanceEvaluationCollection, id);
                batch.delete(docRef);
            });

            await batch.commit();

            // Log the bulk deletion
            await createLog(
                {
                    title: "Performance Evaluations Batch Deleted",
                    description: `Batch deleted ${ids.length} performance evaluations`,
                    module: "Performance Management",
                },
                actionBy,
                "Success",
            );
        } catch (error) {
            console.error("Error batch deleting performance evaluations:", error);

            // Log the failure
            await createLog(
                {
                    title: "Performance Evaluations Batch Deletion Failed",
                    description: `Failed to batch delete ${ids.length} performance evaluations`,
                    module: "Performance Management",
                },
                actionBy,
                "Failure",
            );

            throw new Error("Failed to batch delete performance evaluations");
        }
    },

    /**
     * Validate if period and round IDs exist in HR settings
     * @param periodID Period ID to validate
     * @param roundID Round ID to validate
     * @returns Promise<boolean> True if both IDs exist
     */
    async validatePeriodAndRound(periodID: string, roundID: string): Promise<boolean> {
        try {
            // This would need to be implemented based on how HR settings are stored
            // For now, we'll assume they exist if they're provided
            return periodID.length > 0 && roundID.length > 0;
        } catch (error) {
            console.error("Error validating period and round:", error);
            return false;
        }
    },

    /**
     * Determine stage based on campaign dates and current date
     * @param startDate Campaign start date
     * @param endDate Campaign end date
     * @returns Stage: "Incoming", "Open", or "Closed"
     */
    determineStageFromDates(startDate: string, endDate: string): "Incoming" | "Open" | "Closed" {
        const now = new Date();
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (now < start) {
            return "Incoming";
        } else if (now >= start && now <= end) {
            return "Open";
        } else {
            return "Closed";
        }
    },

    /**
     * Create performance evaluations for campaign employees
     * @param campaignID Campaign ID
     * @param employeeUids Array of employee UIDs
     * @param startDate Campaign start date
     * @param endDate Campaign end date
     * @param periodID Period ID for the evaluations
     * @param roundID Round ID for the evaluations
     * @param actionBy User performing the action
     * @returns Array of created document IDs
     */
    async createForCampaign(
        campaignID: string,
        employeeUids: string[],
        startDate: string,
        endDate: string,
        periodID: string,
        roundID: string,
        actionBy: string,
    ): Promise<string[]> {
        try {
            const stage = this.determineStageFromDates(startDate, endDate);

            const evaluations: Omit<PerformanceEvaluationModel, "id">[] = employeeUids.map(
                employeeUid => ({
                    employeeUid,
                    stage,
                    campaignID,
                    comment: null,
                    confirmationStatus: "Not Confirmed",
                    periodID,
                    roundID,
                }),
            );

            return await this.batchAdd(evaluations, actionBy);
        } catch (error) {
            console.error("Error creating performance evaluations for campaign:", error);
            throw new Error("Failed to create performance evaluations for campaign");
        }
    },

    /**
     * Delete performance evaluations by campaign ID and employee UIDs
     * @param campaignID Campaign ID
     * @param employeeUids Array of employee UIDs to remove
     * @param actionBy User performing the action
     * @returns Promise<void>
     */
    async deleteForCampaignEmployees(
        campaignID: string,
        employeeUids: string[],
        actionBy: string,
    ): Promise<void> {
        try {
            // Get all evaluations for the campaign
            const campaignEvaluations = await this.getByCampaignID(campaignID);

            // Filter evaluations that match the employee UIDs to delete
            const evaluationsToDelete = campaignEvaluations.filter(evaluation =>
                employeeUids.includes(evaluation.employeeUid),
            );

            if (evaluationsToDelete.length > 0) {
                const idsToDelete = evaluationsToDelete.map(evaluation => evaluation.id);
                await this.batchDelete(idsToDelete, actionBy);
            }
        } catch (error) {
            console.error("Error deleting performance evaluations for campaign employees:", error);
            throw new Error("Failed to delete performance evaluations for campaign employees");
        }
    },

    /**
     * Manage performance evaluations for campaign employee changes
     * @param campaignID Campaign ID
     * @param oldEmployeeUids Previous employee UIDs
     * @param newEmployeeUids New employee UIDs
     * @param startDate Campaign start date
     * @param endDate Campaign end date
     * @param periodID Period ID for new evaluations
     * @param roundID Round ID for new evaluations
     * @param actionBy User performing the action
     * @returns Object with created and deleted counts
     */
    async manageCampaignEmployeeChanges(
        campaignID: string,
        oldEmployeeUids: string[],
        newEmployeeUids: string[],
        startDate: string,
        endDate: string,
        periodID: string,
        roundID: string,
        actionBy: string,
    ): Promise<{ created: number; deleted: number }> {
        try {
            // Find employees to add (in new but not in old)
            const employeesToAdd = newEmployeeUids.filter(uid => !oldEmployeeUids.includes(uid));

            // Find employees to remove (in old but not in new)
            const employeesToRemove = oldEmployeeUids.filter(uid => !newEmployeeUids.includes(uid));

            let createdCount = 0;
            let deletedCount = 0;

            // Create evaluations for new employees
            if (employeesToAdd.length > 0) {
                await this.createForCampaign(
                    campaignID,
                    employeesToAdd,
                    startDate,
                    endDate,
                    periodID,
                    roundID,
                    actionBy,
                );
                createdCount = employeesToAdd.length;
            }

            // Delete evaluations for removed employees
            if (employeesToRemove.length > 0) {
                await this.deleteForCampaignEmployees(campaignID, employeesToRemove, actionBy);
                deletedCount = employeesToRemove.length;
            }

            return { created: createdCount, deleted: deletedCount };
        } catch (error) {
            console.error("Error managing campaign employee changes:", error);
            throw new Error("Failed to manage campaign employee changes");
        }
    },

    /**
     * Update stages for all evaluations in a campaign based on new dates
     * @param campaignID Campaign ID
     * @param startDate New campaign start date
     * @param endDate New campaign end date
     * @param actionBy User performing the action
     * @returns Number of evaluations updated
     */
    async updateCampaignEvaluationStages(
        campaignID: string,
        startDate: string,
        endDate: string,
        actionBy: string,
    ): Promise<number> {
        try {
            const evaluations = await this.getByCampaignID(campaignID);
            const newStage = this.determineStageFromDates(startDate, endDate);

            if (evaluations.length === 0) {
                return 0;
            }

            const updates = evaluations.map(evaluation => ({
                id: evaluation.id,
                data: { stage: newStage },
            }));

            await this.batchUpdate(updates, actionBy);
            return evaluations.length;
        } catch (error) {
            console.error("Error updating campaign evaluation stages:", error);
            throw new Error("Failed to update campaign evaluation stages");
        }
    },

    /**
     * Get performance evaluations by period and round IDs
     * @param periodID Period ID to filter by
     * @param roundID Round ID to filter by
     * @returns Array of performance evaluations for the period and round
     */
    async getByPeriodAndRound(
        periodID: string,
        roundID: string,
    ): Promise<PerformanceEvaluationModel[]> {
        try {
            const q = query(
                performanceEvaluationCollection,
                where("periodID", "==", periodID),
                where("roundID", "==", roundID),
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            })) as PerformanceEvaluationModel[];
        } catch (error) {
            console.error("Error getting performance evaluations by period and round:", error);
            throw new Error("Failed to get performance evaluations by period and round");
        }
    },

    /**
     * Get performance evaluations by period ID
     * @param periodID Period ID to filter by
     * @returns Array of performance evaluations for the period
     */
    async getByPeriodID(periodID: string): Promise<PerformanceEvaluationModel[]> {
        try {
            const q = query(performanceEvaluationCollection, where("periodID", "==", periodID));
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            })) as PerformanceEvaluationModel[];
        } catch (error) {
            console.error("Error getting performance evaluations by period ID:", error);
            throw new Error("Failed to get performance evaluations by period ID");
        }
    },
};
