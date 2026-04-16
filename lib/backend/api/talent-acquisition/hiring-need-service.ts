import { HiringNeedModel } from "@/lib/models/hiring-need";
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
import { hiringNeedCollection } from "../../firebase/collections";
import { db } from "../../firebase/init";
import { createLog } from "../logCollection";
import { HIRING_NEED_LOG_MESSAGES } from "@/lib/log-descriptions/manager-activities";

export const hiringNeedService = {
    /**
     * Create a new hiring need request
     * @param data Hiring need data without id
     * @param actionBy User performing the action
     * @returns Document ID of created hiring need
     */
    async create(data: Omit<HiringNeedModel, "id">, actionBy: string): Promise<string> {
        try {
            const docRef = doc(hiringNeedCollection);
            await setDoc(docRef, { ...data, id: docRef.id });

            // Log the creation
            await createLog(
                HIRING_NEED_LOG_MESSAGES.CREATED({
                    jobTitle: data.jobTitle,
                    department: data.department,
                    hiringNeedType: data.hiringNeedType,
                    createdBy: actionBy,
                }),
                actionBy,
                "Success",
            );

            return docRef.id;
        } catch (error) {
            console.error("Error creating hiring need:", error);

            // Log the failure
            await createLog(
                HIRING_NEED_LOG_MESSAGES.CREATED({
                    jobTitle: data.jobTitle,
                    department: data.department,
                    hiringNeedType: data.hiringNeedType,
                    createdBy: actionBy,
                }),
                actionBy,
                "Failure",
            );

            throw new Error("Failed to create hiring need");
        }
    },

    /**
     * Get a specific hiring need by ID
     * @param id Document ID
     * @returns Hiring need data or null if not found
     */
    async get(id: string): Promise<HiringNeedModel | null> {
        try {
            const docRef = doc(hiringNeedCollection, id);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() } as HiringNeedModel;
            }
            return null;
        } catch (error) {
            console.error("Error getting hiring need:", error);
            throw new Error("Failed to get hiring need");
        }
    },

    /**
     * Get all hiring needs
     * @returns Array of hiring needs ordered by timestamp descending
     */
    async getAll(): Promise<HiringNeedModel[]> {
        try {
            const q = query(hiringNeedCollection, orderBy("timestamp", "desc"));
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            })) as HiringNeedModel[];
        } catch (error) {
            console.error("Error getting all hiring needs:", error);
            throw new Error("Failed to get hiring needs");
        }
    },

    /**
     * Get hiring needs by stage
     * @param stage Hiring need stage to filter by
     * @returns Array of hiring needs for the specified stage
     */
    async getByStage(stage: string): Promise<HiringNeedModel[]> {
        try {
            const q = query(
                hiringNeedCollection,
                where("hiringNeedStage", "==", stage),
                orderBy("timestamp", "desc"),
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            })) as HiringNeedModel[];
        } catch (error) {
            console.error("Error getting hiring needs by stage:", error);
            throw new Error("Failed to get hiring needs by stage");
        }
    },

    /**
     * Get hiring needs by creator
     * @param createdBy Employee UID who created the hiring need
     * @returns Array of hiring needs created by the specified user
     */
    async getByCreator(createdBy: string): Promise<HiringNeedModel[]> {
        try {
            const q = query(
                hiringNeedCollection,
                where("createdBy", "==", createdBy),
                orderBy("timestamp", "desc"),
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            })) as HiringNeedModel[];
        } catch (error) {
            console.error("Error getting hiring needs by creator:", error);
            throw new Error("Failed to get hiring needs by creator");
        }
    },

    /**
     * Get hiring needs by department
     * @param department Department to filter by
     * @returns Array of hiring needs for the specified department
     */
    async getByDepartment(department: string): Promise<HiringNeedModel[]> {
        try {
            const q = query(
                hiringNeedCollection,
                where("department", "==", department),
                orderBy("timestamp", "desc"),
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            })) as HiringNeedModel[];
        } catch (error) {
            console.error("Error getting hiring needs by department:", error);
            throw new Error("Failed to get hiring needs by department");
        }
    },

    /**
     * Update a hiring need
     * @param id Document ID
     * @param data Partial hiring need data
     * @param actionBy User performing the action
     * @returns Success boolean
     */
    async update(id: string, data: Partial<HiringNeedModel>, actionBy: string): Promise<boolean> {
        try {
            const docRef = doc(hiringNeedCollection, id);
            await updateDoc(docRef, data);

            // Log the update
            await createLog(
                HIRING_NEED_LOG_MESSAGES.UPDATED({
                    id,
                    jobTitle: data.jobTitle,
                    status: data.hiringNeedStage,
                }),
                actionBy,
                "Success",
            );

            return true;
        } catch (error) {
            console.error("Error updating hiring need:", error);

            // Log the failure
            await createLog(
                HIRING_NEED_LOG_MESSAGES.UPDATED({
                    id,
                    jobTitle: data.jobTitle,
                    status: data.hiringNeedStage,
                }),
                actionBy,
                "Failure",
            );

            throw new Error("Failed to update hiring need");
        }
    },

    /**
     * Delete a hiring need
     * @param id Document ID
     * @param actionBy User performing the action
     * @returns Promise<void>
     */
    async delete(id: string, actionBy: string): Promise<void> {
        try {
            const docRef = doc(hiringNeedCollection, id);
            await deleteDoc(docRef);

            // Log the deletion
            await createLog(HIRING_NEED_LOG_MESSAGES.DELETED(id), actionBy, "Success");
        } catch (error) {
            console.error("Error deleting hiring need:", error);

            // Log the failure
            await createLog(HIRING_NEED_LOG_MESSAGES.DELETED(id), actionBy, "Failure");

            throw new Error("Failed to delete hiring need");
        }
    },

    /**
     * Approve a hiring need request
     * @param id Document ID
     * @param approvedBy User who approved the request
     * @returns Success boolean
     */
    async approve(id: string, approvedBy?: string): Promise<boolean> {
        try {
            const docRef = doc(hiringNeedCollection, id);
            await updateDoc(docRef, {
                hiringNeedStage: "Approved",
            });

            // Log the approval
            if (approvedBy) {
                await createLog(
                    HIRING_NEED_LOG_MESSAGES.APPROVED({
                        id,
                        approvedBy,
                    }),
                    approvedBy,
                    "Success",
                );
            }

            return true;
        } catch (error) {
            console.error("Error approving hiring need:", error);

            // Log the failure
            if (approvedBy) {
                await createLog(
                    HIRING_NEED_LOG_MESSAGES.APPROVED({
                        id,
                        approvedBy,
                    }),
                    approvedBy,
                    "Failure",
                );
            }

            throw new Error("Failed to approve hiring need");
        }
    },

    /**
     * Reject a hiring need request
     * @param id Document ID
     * @param rejectionReason Reason for rejection
     * @param rejectedBy User who rejected the request
     * @returns Success boolean
     */
    async reject(id: string, rejectionReason: string, rejectedBy?: string): Promise<boolean> {
        try {
            const docRef = doc(hiringNeedCollection, id);
            await updateDoc(docRef, {
                hiringNeedStage: "Rejected",
                rejectionReason: rejectionReason,
            });

            // Log the rejection
            if (rejectedBy) {
                await createLog(
                    HIRING_NEED_LOG_MESSAGES.REJECTED({
                        id,
                        rejectedBy,
                        reason: rejectionReason,
                    }),
                    rejectedBy,
                    "Success",
                );
            }

            return true;
        } catch (error) {
            console.error("Error rejecting hiring need:", error);

            // Log the failure
            if (rejectedBy) {
                await createLog(
                    HIRING_NEED_LOG_MESSAGES.REJECTED({
                        id,
                        rejectedBy,
                        reason: rejectionReason,
                    }),
                    rejectedBy,
                    "Failure",
                );
            }

            throw new Error("Failed to reject hiring need");
        }
    },

    /**
     * Batch add multiple hiring needs
     * @param hiringNeeds Array of hiring need data without ids
     * @param actionBy User performing the action
     * @returns Array of created document IDs
     */
    async batchAdd(
        hiringNeeds: Omit<HiringNeedModel, "id">[],
        actionBy: string,
    ): Promise<string[]> {
        try {
            const batch = writeBatch(db);
            const docRefs: any[] = [];

            hiringNeeds.forEach(hiringNeed => {
                const docRef = doc(firestoreCollection(db, "hiringNeed"));
                batch.set(docRef, hiringNeed);
                docRefs.push(docRef);
            });

            await batch.commit();

            // Log the bulk creation
            await createLog(
                {
                    title: "Hiring Needs Batch Created",
                    description: `Batch created ${hiringNeeds.length} hiring needs`,
                    module: "Talent Acquisition",
                },
                actionBy,
                "Success",
            );

            return docRefs.map(ref => ref.id);
        } catch (error) {
            console.error("Error batch adding hiring needs:", error);

            // Log the failure
            await createLog(
                {
                    title: "Hiring Needs Batch Creation Failed",
                    description: `Failed to batch create ${hiringNeeds.length} hiring needs`,
                    module: "Talent Acquisition",
                },
                actionBy,
                "Failure",
            );

            throw new Error("Failed to batch add hiring needs");
        }
    },

    /**
     * Batch update multiple hiring needs
     * @param updates Array of objects containing id and update data
     * @param actionBy User performing the action
     * @returns Success boolean
     */
    async batchUpdate(
        updates: { id: string; data: Partial<HiringNeedModel> }[],
        actionBy: string,
    ): Promise<boolean> {
        try {
            const batch = writeBatch(db);

            updates.forEach(({ id, data }) => {
                const docRef = doc(hiringNeedCollection, id);
                batch.update(docRef, data);
            });

            await batch.commit();

            // Log the bulk update
            await createLog(
                {
                    title: "Hiring Needs Batch Updated",
                    description: `Batch updated ${updates.length} hiring needs`,
                    module: "Talent Acquisition",
                },
                actionBy,
                "Success",
            );

            return true;
        } catch (error) {
            console.error("Error batch updating hiring needs:", error);

            // Log the failure
            await createLog(
                {
                    title: "Hiring Needs Batch Update Failed",
                    description: `Failed to batch update ${updates.length} hiring needs`,
                    module: "Talent Acquisition",
                },
                actionBy,
                "Failure",
            );

            throw new Error("Failed to batch update hiring needs");
        }
    },

    /**
     * Batch delete multiple hiring needs
     * @param ids Array of document IDs to delete
     * @param actionBy User performing the action
     * @returns Promise<void>
     */
    async batchDelete(ids: string[], actionBy: string): Promise<void> {
        try {
            const batch = writeBatch(db);

            ids.forEach(id => {
                const docRef = doc(hiringNeedCollection, id);
                batch.delete(docRef);
            });

            await batch.commit();

            // Log the bulk deletion
            await createLog(
                {
                    title: "Hiring Needs Batch Deleted",
                    description: `Batch deleted ${ids.length} hiring needs`,
                    module: "Talent Acquisition",
                },
                actionBy,
                "Success",
            );
        } catch (error) {
            console.error("Error batch deleting hiring needs:", error);

            // Log the failure
            await createLog(
                {
                    title: "Hiring Needs Batch Deletion Failed",
                    description: `Failed to batch delete ${ids.length} hiring needs`,
                    module: "Talent Acquisition",
                },
                actionBy,
                "Failure",
            );

            throw new Error("Failed to batch delete hiring needs");
        }
    },

    /**
     * Get hiring needs with multiple filters
     * @param filters Object containing filter criteria
     * @returns Array of filtered hiring needs
     */
    async getWithFilters(filters: {
        stage?: string;
        department?: string;
        createdBy?: string;
        hiringNeedType?: string;
    }): Promise<HiringNeedModel[]> {
        try {
            let q = query(hiringNeedCollection, orderBy("timestamp", "desc"));

            if (filters.stage) {
                q = query(q, where("hiringNeedStage", "==", filters.stage));
            }
            if (filters.department) {
                q = query(q, where("department", "==", filters.department));
            }
            if (filters.createdBy) {
                q = query(q, where("createdBy", "==", filters.createdBy));
            }
            if (filters.hiringNeedType) {
                q = query(q, where("hiringNeedType", "==", filters.hiringNeedType));
            }

            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            })) as HiringNeedModel[];
        } catch (error) {
            console.error("Error getting hiring needs with filters:", error);
            throw new Error("Failed to get hiring needs with filters");
        }
    },

    /**
     * Get pending hiring needs (for approval workflow)
     * @returns Array of pending hiring needs
     */
    async getPending(): Promise<HiringNeedModel[]> {
        return this.getByStage("Pending");
    },

    /**
     * Get approved hiring needs
     * @returns Array of approved hiring needs
     */
    async getApproved(): Promise<HiringNeedModel[]> {
        return this.getByStage("Approved");
    },

    /**
     * Get rejected hiring needs
     * @returns Array of rejected hiring needs
     */
    async getRejected(): Promise<HiringNeedModel[]> {
        return this.getByStage("Rejected");
    },

    /**
     * Generate unique hiring need ID
     * @returns Unique hiring need ID string
     */
    generateHiringNeedID(): string {
        const timestamp = Date.now();
        return `HN-${timestamp}`;
    },
};
