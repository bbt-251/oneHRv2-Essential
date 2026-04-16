import { JobPostModel } from "@/lib/models/job-post";
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
import { jobPostCollection } from "../../firebase/collections";
import { db } from "../../firebase/init";
import { createLog } from "../logCollection";
import { LogInfo } from "@/lib/log-descriptions/talent-acquisition";

export const jobPostService = {
    /**
     * Create a new job post
     * @param data Job post data without id
     * @param actionBy User who performed the action
     * @param logInfo Optional log information
     * @returns Document ID of created job post
     */
    async create(
        data: Omit<JobPostModel, "id">,
        actionBy?: string,
        logInfo?: LogInfo,
    ): Promise<string> {
        try {
            const docRef = doc(jobPostCollection);
            const jobPostData = {
                ...data,
                id: docRef.id,
            };
            await setDoc(docRef, jobPostData);
            const createdJobPost = await this.get(docRef.id);
            const yearsOfExperience = jobPostData.yearsOfExperience.valueOf();
            if (logInfo && actionBy) {
                await createLog(logInfo, actionBy, "Success");
            }

            try {
                await fetch(`/api/sync-job-post-to-weaviate`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ jobPost: jobPostData }),
                });
                console.log(`Job post ${docRef.id} added to Weaviate`);
            } catch (weaviateError) {
                console.error("Failed to add job post to Weaviate:", weaviateError);
            }

            return docRef.id;
        } catch (error) {
            console.error("Error creating job post:", error);
            // Log the failure if logInfo is provided
            if (logInfo && actionBy) {
                await createLog(
                    {
                        ...logInfo,
                        title: `${logInfo.title} Failed`,
                        description: `Failed to ${logInfo.description.toLowerCase()}`,
                    },
                    actionBy,
                    "Failure",
                );
            }
            throw new Error("Failed to create job post");
        }
    },

    /**
     * Get a specific job post by ID
     * @param id Document ID
     * @returns Job post data or null if not found
     */
    async get(id: string): Promise<JobPostModel | null> {
        try {
            const docRef = doc(jobPostCollection, id);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return { id: docSnap.id, ...docSnap.data() } as JobPostModel;
            }
            return null;
        } catch (error) {
            console.error("Error getting job post:", error);
            throw new Error("Failed to get job post");
        }
    },

    /**
     * Get all job posts
     * @returns Array of job posts ordered by createdAt descending
     */
    async getAll(): Promise<JobPostModel[]> {
        try {
            const q = query(jobPostCollection, orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            })) as JobPostModel[];
        } catch (error) {
            console.error("Error getting all job posts:", error);
            throw new Error("Failed to get job posts");
        }
    },

    /**
     * Get job posts by status
     * @param status Status to filter by
     * @returns Array of job posts for the specified status
     */
    async getByStatus(
        status: "Draft" | "Announced" | "Withdrawn" | "Terminated",
    ): Promise<JobPostModel[]> {
        try {
            const q = query(
                jobPostCollection,
                where("status", "==", status),
                orderBy("createdAt", "desc"),
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            })) as JobPostModel[];
        } catch (error) {
            console.error("Error getting job posts by status:", error);
            throw new Error("Failed to get job posts by status");
        }
    },

    /**
     * Get job posts by department
     * @param department Department to filter by
     * @returns Array of job posts for the specified department
     */
    async getByDepartment(department: string): Promise<JobPostModel[]> {
        try {
            const q = query(
                jobPostCollection,
                where("department", "==", department),
                orderBy("createdAt", "desc"),
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            })) as JobPostModel[];
        } catch (error) {
            console.error("Error getting job posts by department:", error);
            throw new Error("Failed to get job posts by department");
        }
    },

    /**
     * Get active job posts (Announced status)
     * @returns Array of active job posts
     */
    async getActive(): Promise<JobPostModel[]> {
        return this.getByStatus("Announced");
    },

    /**
     * Get draft job posts
     * @returns Array of draft job posts
     */
    async getDrafts(): Promise<JobPostModel[]> {
        return this.getByStatus("Draft");
    },

    /**
     * Update a job post
     * @param id Document ID
     * @param data Partial job post data
     * @param actionBy User who performed the action
     * @param logInfo Optional log information
     * @returns Success boolean
     */
    async update(
        id: string,
        data: Partial<JobPostModel>,
        actionBy?: string,
        logInfo?: LogInfo,
    ): Promise<boolean> {
        try {
            const docRef = doc(jobPostCollection, id);
            await updateDoc(docRef, data);

            // Log the update if logInfo is provided
            if (logInfo && actionBy) {
                await createLog(logInfo, actionBy, "Success");
            }

            return true;
        } catch (error) {
            console.error("Error updating job post:", error);
            // Log the failure if logInfo is provided
            if (logInfo && actionBy) {
                await createLog(
                    {
                        ...logInfo,
                        title: `${logInfo.title} Failed`,
                        description: `Failed to ${logInfo.description.toLowerCase()}`,
                    },
                    actionBy,
                    "Failure",
                );
            }
            throw new Error("Failed to update job post");
        }
    },

    /**
     * Update job post status
     * @param id Document ID
     * @param status New status
     * @param actionBy User who performed the action
     * @param logInfo Optional log information
     * @returns Success boolean
     */
    async updateStatus(
        id: string,
        status: "Draft" | "Announced" | "Withdrawn" | "Terminated",
        actionBy?: string,
        logInfo?: LogInfo,
    ): Promise<boolean> {
        try {
            const docRef = doc(jobPostCollection, id);
            await updateDoc(docRef, { status });

            // Log the status update if logInfo is provided
            if (logInfo && actionBy) {
                await createLog(logInfo, actionBy, "Success");
            }

            return true;
        } catch (error) {
            console.error("Error updating job post status:", error);
            // Log the failure if logInfo is provided
            if (logInfo && actionBy) {
                await createLog(
                    {
                        ...logInfo,
                        title: `${logInfo.title} Failed`,
                        description: `Failed to ${logInfo.description.toLowerCase()}`,
                    },
                    actionBy,
                    "Failure",
                );
            }
            throw new Error("Failed to update job post status");
        }
    },

    /**
     * Delete a job post
     * @param id Document ID
     * @param actionBy User who performed the action
     * @param logInfo Optional log information
     * @returns Promise<void>
     */
    async delete(id: string, actionBy?: string, logInfo?: LogInfo): Promise<void> {
        try {
            const docRef = doc(jobPostCollection, id);
            await deleteDoc(docRef);

            // Log the deletion if logInfo is provided
            if (logInfo && actionBy) {
                await createLog(logInfo, actionBy, "Success");
            }
        } catch (error) {
            console.error("Error deleting job post:", error);
            // Log the failure if logInfo is provided
            if (logInfo && actionBy) {
                await createLog(
                    {
                        ...logInfo,
                        title: `${logInfo.title} Failed`,
                        description: `Failed to ${logInfo.description.toLowerCase()}`,
                    },
                    actionBy,
                    "Failure",
                );
            }
            throw new Error("Failed to delete job post");
        }
    },

    /**
     * Batch add multiple job posts
     * @param jobPosts Array of job post data without ids
     * @returns Array of created document IDs
     */
    async batchAdd(jobPosts: Omit<JobPostModel, "id">[]): Promise<string[]> {
        try {
            const batch = writeBatch(db);
            const docRefs: any[] = [];

            jobPosts.forEach(jobPost => {
                const docRef = doc(firestoreCollection(db, "jobPost"));
                const jobPostData = {
                    ...jobPost,
                    id: docRef.id,
                    timestamp: new Date().toISOString(),
                    createdAt: new Date().toISOString(),
                    applicants: 0,
                    applications: [],
                };
                batch.set(docRef, jobPostData);
                docRefs.push(docRef);
            });

            await batch.commit();
            return docRefs.map(ref => ref.id);
        } catch (error) {
            console.error("Error batch adding job posts:", error);
            throw new Error("Failed to batch add job posts");
        }
    },

    /**
     * Batch update multiple job posts
     * @param updates Array of objects containing id and update data
     * @returns Success boolean
     */
    async batchUpdate(updates: { id: string; data: Partial<JobPostModel> }[]): Promise<boolean> {
        try {
            const batch = writeBatch(db);

            updates.forEach(({ id, data }) => {
                const docRef = doc(jobPostCollection, id);
                batch.update(docRef, data);
            });

            await batch.commit();
            return true;
        } catch (error) {
            console.error("Error batch updating job posts:", error);
            throw new Error("Failed to batch update job posts");
        }
    },

    /**
     * Batch delete multiple job posts
     * @param ids Array of document IDs to delete
     * @returns Promise<void>
     */
    async batchDelete(ids: string[]): Promise<void> {
        try {
            const batch = writeBatch(db);

            ids.forEach(id => {
                const docRef = doc(jobPostCollection, id);
                batch.delete(docRef);
            });

            await batch.commit();
        } catch (error) {
            console.error("Error batch deleting job posts:", error);
            throw new Error("Failed to batch delete job posts");
        }
    },

    /**
     * Get job posts with multiple filters
     * @param filters Object containing filter criteria
     * @returns Array of filtered job posts
     */
    async getWithFilters(filters: {
        status?: "Draft" | "Announced" | "Withdrawn" | "Terminated";
        department?: string;
        location?: string;
        employmentType?: string;
        visibility?: "Public" | "Private";
        jobTitle?: string;
    }): Promise<JobPostModel[]> {
        try {
            let q = query(jobPostCollection, orderBy("createdAt", "desc"));

            if (filters.status) {
                q = query(q, where("status", "==", filters.status));
            }

            if (filters.department) {
                q = query(q, where("department", "==", filters.department));
            }

            if (filters.location) {
                q = query(q, where("location", "==", filters.location));
            }

            if (filters.employmentType) {
                q = query(q, where("employmentType", "==", filters.employmentType));
            }

            if (filters.visibility) {
                q = query(q, where("visibility", "==", filters.visibility));
            }

            const querySnapshot = await getDocs(q);
            let results = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            })) as JobPostModel[];

            // Filter by job title if provided (client-side filtering for partial matches)
            if (filters.jobTitle) {
                results = results.filter(jobPost =>
                    jobPost.jobTitle.toLowerCase().includes(filters.jobTitle!.toLowerCase()),
                );
            }

            return results;
        } catch (error) {
            console.error("Error getting job posts with filters:", error);
            throw new Error("Failed to get job posts with filters");
        }
    },

    /**
     * Get public job posts
     * @returns Array of public job posts
     */
    async getPublic(): Promise<JobPostModel[]> {
        try {
            const q = query(
                jobPostCollection,
                where("visibility", "==", "Public"),
                where("status", "==", "Announced"),
                orderBy("createdAt", "desc"),
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            })) as JobPostModel[];
        } catch (error) {
            console.error("Error getting public job posts:", error);
            throw new Error("Failed to get public job posts");
        }
    },

    /**
     * Generate unique job post ID
     * @returns Unique job post ID string
     */
    generateJobPostID(): string {
        const timestamp = Date.now();
        return `JP-${timestamp}`;
    },
};

// Legacy function exports for backward compatibility
export const createJobPost = (data: Omit<JobPostModel, "id">) => jobPostService.create(data);

export const updateJobPost = (id: string, data: Partial<JobPostModel>) =>
    jobPostService.update(id, data);

export const deleteJobPost = (id: string) => jobPostService.delete(id);

export const getJobPostById = (id: string) => jobPostService.get(id);

export const getAllJobPosts = () => jobPostService.getAll();

export const getJobPostsByStatus = (status: "Draft" | "Announced" | "Withdrawn" | "Terminated") =>
    jobPostService.getByStatus(status);

export const getJobPostsByDepartment = (department: string) =>
    jobPostService.getByDepartment(department);
