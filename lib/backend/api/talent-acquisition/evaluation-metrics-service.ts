import { EvaluationMetricModel } from "@/lib/models/evaluation-metric";
import {
    deleteDoc,
    doc,
    collection as firestoreCollection,
    getDoc,
    getDocs,
    orderBy,
    query,
    setDoc,
    updateDoc,
    where,
    writeBatch,
} from "firebase/firestore";
import { evaluationMetricsCollection } from "../../firebase/collections";
import { db } from "../../firebase/init";

export const evaluationMetricsService = {
    /**
     * Create a new evaluation metric
     * @param data Evaluation metric data without id
     * @returns Document ID of created evaluation metric
     */
    async create(data: Omit<EvaluationMetricModel, "id">): Promise<string> {
        try {
            const docRef = doc(evaluationMetricsCollection);
            await setDoc(docRef, { ...data, id: docRef.id });
            return docRef.id;
        } catch (error) {
            console.error("Error creating evaluation metric:", error);
            throw new Error("Failed to create evaluation metric");
        }
    },

    /**
     * Get a specific evaluation metric by ID
     * @param id Document ID
     * @returns Evaluation metric data or null if not found
     */
    async get(id: string): Promise<EvaluationMetricModel | null> {
        try {
            const docRef = doc(evaluationMetricsCollection, id);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() } as EvaluationMetricModel;
            }
            return null;
        } catch (error) {
            console.error("Error getting evaluation metric:", error);
            throw new Error("Failed to get evaluation metric");
        }
    },

    /**
     * Get all evaluation metrics
     * @returns Array of evaluation metrics ordered by createdAt descending
     */
    async getAll(): Promise<EvaluationMetricModel[]> {
        try {
            const q = query(evaluationMetricsCollection, orderBy("timestamp", "desc"));
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            })) as EvaluationMetricModel[];
        } catch (error) {
            console.error("Error getting all evaluation metrics:", error);
            throw new Error("Failed to get evaluation metrics");
        }
    },

    /**
     * Get evaluation metrics by status
     * @param isActive Status to filter by
     * @returns Array of evaluation metrics for the specified status
     */
    async getByStatus(isActive: boolean): Promise<EvaluationMetricModel[]> {
        try {
            const q = query(
                evaluationMetricsCollection,
                where("isActive", "==", isActive),
                orderBy("timestamp", "desc"),
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            })) as EvaluationMetricModel[];
        } catch (error) {
            console.error("Error getting evaluation metrics by status:", error);
            throw new Error("Failed to get evaluation metrics by status");
        }
    },

    /**
     * Update an evaluation metric
     * @param id Document ID
     * @param data Partial evaluation metric data
     * @returns Success boolean
     */
    async update(id: string, data: Partial<EvaluationMetricModel>): Promise<boolean> {
        try {
            const docRef = doc(evaluationMetricsCollection, id);
            await updateDoc(docRef, data);
            return true;
        } catch (error) {
            console.error("Error updating evaluation metric:", error);
            throw new Error("Failed to update evaluation metric");
        }
    },

    /**
     * Delete an evaluation metric
     * @param id Document ID
     * @returns Promise<void>
     */
    async delete(id: string): Promise<void> {
        try {
            const docRef = doc(evaluationMetricsCollection, id);
            await deleteDoc(docRef);
        } catch (error) {
            console.error("Error deleting evaluation metric:", error);
            throw new Error("Failed to delete evaluation metric");
        }
    },

    /**
     * Batch add multiple evaluation metrics
     * @param evaluationMetrics Array of evaluation metric data without ids
     * @returns Array of created document IDs
     */
    async batchAdd(evaluationMetrics: Omit<EvaluationMetricModel, "id">[]): Promise<string[]> {
        try {
            const batch = writeBatch(db);
            const docRefs: any[] = [];

            evaluationMetrics.forEach(evaluationMetric => {
                const docRef = doc(firestoreCollection(db, "evaluationMetrics"));
                batch.set(docRef, evaluationMetric);
                docRefs.push(docRef);
            });

            await batch.commit();
            return docRefs.map(ref => ref.id);
        } catch (error) {
            console.error("Error batch adding evaluation metrics:", error);
            throw new Error("Failed to batch add evaluation metrics");
        }
    },

    /**
     * Batch update multiple evaluation metrics
     * @param updates Array of objects containing id and update data
     * @returns Success boolean
     */
    async batchUpdate(
        updates: { id: string; data: Partial<EvaluationMetricModel> }[],
    ): Promise<boolean> {
        try {
            const batch = writeBatch(db);

            updates.forEach(({ id, data }) => {
                const docRef = doc(evaluationMetricsCollection, id);
                batch.update(docRef, data);
            });

            await batch.commit();
            return true;
        } catch (error) {
            console.error("Error batch updating evaluation metrics:", error);
            throw new Error("Failed to batch update evaluation metrics");
        }
    },

    /**
     * Batch delete multiple evaluation metrics
     * @param ids Array of document IDs to delete
     * @returns Promise<void>
     */
    async batchDelete(ids: string[]): Promise<void> {
        try {
            const batch = writeBatch(db);

            ids.forEach(id => {
                const docRef = doc(evaluationMetricsCollection, id);
                batch.delete(docRef);
            });

            await batch.commit();
        } catch (error) {
            console.error("Error batch deleting evaluation metrics:", error);
            throw new Error("Failed to batch delete evaluation metrics");
        }
    },

    /**
     * Get evaluation metrics with multiple filters
     * @param filters Object containing filter criteria
     * @returns Array of filtered evaluation metrics
     */
    async getWithFilters(filters: {
        isActive?: boolean;
        name?: string;
    }): Promise<EvaluationMetricModel[]> {
        try {
            let q = query(evaluationMetricsCollection, orderBy("timestamp", "desc"));

            if (filters.isActive !== undefined) {
                q = query(q, where("isActive", "==", filters.isActive));
            }

            const querySnapshot = await getDocs(q);
            let results = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            })) as EvaluationMetricModel[];

            // Filter by name if provided (client-side filtering for partial matches)
            if (filters.name) {
                results = results.filter(metric =>
                    metric.name.toLowerCase().includes(filters.name!.toLowerCase()),
                );
            }

            return results;
        } catch (error) {
            console.error("Error getting evaluation metrics with filters:", error);
            throw new Error("Failed to get evaluation metrics with filters");
        }
    },

    /**
     * Get active evaluation metrics
     * @returns Array of active evaluation metrics
     */
    async getActive(): Promise<EvaluationMetricModel[]> {
        return this.getByStatus(true);
    },

    /**
     * Get inactive evaluation metrics
     * @returns Array of inactive evaluation metrics
     */
    async getInactive(): Promise<EvaluationMetricModel[]> {
        return this.getByStatus(false);
    },

    /**
     * Generate unique evaluation metric ID
     * @returns Unique evaluation metric ID string
     */
    generateEvaluationMetricID(): string {
        const timestamp = Date.now();
        return `EM-${timestamp}`;
    },
};

// Legacy function exports for backward compatibility
export const createEvaluationMetric = (data: Omit<EvaluationMetricModel, "id">) =>
    evaluationMetricsService.create(data);

export const updateEvaluationMetric = (data: {
    id: string;
    name: string;
    passingScore: number;
    status: boolean;
    metrics: any[];
}) =>
    evaluationMetricsService.update(data.id, {
        name: data.name,
        passingScore: data.passingScore,
        isActive: data.status,
        metrics: data.metrics,
    });

export const deleteEvaluationMetric = (id: string) => evaluationMetricsService.delete(id);
