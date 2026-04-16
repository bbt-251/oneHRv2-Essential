import {
    doc,
    DocumentData,
    getDoc,
    getDocs,
    limit,
    query,
    QuerySnapshot,
    setDoc,
    updateDoc,
    where,
    writeBatch,
} from "firebase/firestore";
import { deleteObject, ref } from "firebase/storage";
import ApplicantModel, { JobPreference } from "@/lib/models/applicant";
import { applicantCollection, jobApplicationCollection } from "../../firebase/collections";
import { db, storage } from "../../firebase/init";
import { JobApplicationModel } from "@/lib/models/job-application";
import { createLog } from "../logCollection";
import { LogInfo } from "@/lib/log-descriptions/talent-acquisition";

const collectionRef = applicantCollection;
const collectionName = collectionRef.id;

export const generateUUID = () => {
    return crypto.randomUUID();
};

export async function createApplicant(
    data: Omit<ApplicantModel, "id">,
    actionBy?: string,
    logInfo?: LogInfo,
): Promise<ApplicantModel | null> {
    try {
        const docRef = doc(collectionRef);

        await setDoc(docRef, {
            ...data,
            id: docRef.id,
            isEmailVerified: false,
            emailVerificationSentAt: null,
            profile_share_token: generateUUID(),
        });

        // Log the creation if logInfo is provided
        if (logInfo) {
            await createLog(logInfo, actionBy ?? "", "Success");
        }

        const createdApplicant = await getApplicant(docRef.id);
        console.log(`✅ Applicant ${createdApplicant} created successfully`);
        if (!createdApplicant) {
            throw new Error("Applicant creation failed");
        }

        try {
            // await weaviateService.createApplicant(createdApplicant);
            await fetch(`/api/sync-applicant-to-weaviate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ applicant: createdApplicant }),
            });
            console.log(`Applicant ${docRef.id} added to Weaviate`);
        } catch (weaviateError) {
            console.error("Failed to add applicant to Weaviate:", weaviateError);
        }
        return createdApplicant;
    } catch (err) {
        console.error("Error creating applicant:", err);
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
        return null;
    }
}

export async function getApplicants() {
    const q = query(collectionRef);

    const response: ApplicantModel[] = await getDocs(q)
        .then((snapshot: QuerySnapshot<DocumentData>) => {
            const data: any[] = [];
            snapshot.docs.map(doc => {
                data.push({
                    id: doc.id,
                    ...doc.data(),
                });
            });
            return data;
        })
        .catch((e: any) => {
            console.log("err: ", e);
            return [];
        });

    return response;
}

export async function getApplicant(id: string) {
    const q = query(collectionRef, where("id", "==", id));

    const response: ApplicantModel | null = await getDocs(q)
        .then((snapshot: QuerySnapshot<DocumentData>) => {
            const data: any[] = [];
            snapshot.docs.map(doc => {
                data.push({
                    id: doc.id,
                    ...doc.data(),
                });
            });
            return data.find(c => c.id === id);
        })
        .catch((e: any) => {
            console.log("err: ", e);
            return null;
        });

    return response;
}
// getApplicantByShareToken
// Fetches a single applicant document from Firestore using their unique id
export async function getApplicantByShareToken(uid: string): Promise<ApplicantModel | null> {
    console.log("Fetching applicant with share token:", uid);
    // 1. Create a query against the collection.
    const q = query(collectionRef, where("uid", "==", uid), limit(1));

    try {
        // 2. Execute the query.
        const querySnapshot = await getDocs(q);

        // 3. Check if any document was found.
        if (querySnapshot.empty) {
            console.log("No applicant found with that share token.");
            return null;
        }

        // 4. Return the data from the first document found.
        const applicantDoc = querySnapshot.docs[0];

        return applicantDoc.data() as ApplicantModel;
    } catch (error) {
        console.error("Error fetching applicant by share token:", error);
        return null;
    }
}

export async function updateApplicant(
    data: Partial<ApplicantModel>,
    actionBy?: string,
    logInfo?: LogInfo,
) {
    console.log("updateApplicant", data);
    let result: boolean = false;

    const docRef = doc(db, collectionName, data.id ?? "");

    try {
        await updateDoc(docRef, data as any);
        result = true;

        // Log the update if logInfo is provided
        if (logInfo) {
            await createLog(logInfo, actionBy ?? "", "Success");
        }
    } catch (err) {
        console.log(err);
        result = false;

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
    }

    return result;
}

// A specific helper for updating job preferences
export async function updateApplicantJobPreferences(
    applicantId: string,
    preferences: JobPreference[],
    actionBy?: string,
    logInfo?: LogInfo,
): Promise<boolean> {
    // This function simply calls the generic updateApplicant function
    // with the specific payload for job preferences.
    return updateApplicant(
        {
            id: applicantId,
            jobPreferences: preferences,
        },
        actionBy,
        logInfo,
    );
}
export async function deleteApplicant(
    id: string,
    actionBy?: string,
    logInfo?: LogInfo,
): Promise<boolean> {
    const batch = writeBatch(db);

    try {
        // 1. Get the applicant document first to access storage files
        const applicantDocRef = doc(db, collectionName, id);
        const applicantDoc = await getDoc(applicantDocRef);

        if (!applicantDoc.exists()) {
            console.error("Applicant document not found");
            return false;
        }

        const applicantData = applicantDoc.data() as ApplicantModel;

        // 2. Delete storage files (photo and CV)
        const storageDeletions: Promise<void>[] = [];

        // Delete photo if exists
        if (applicantData.photo) {
            try {
                const photoRef = ref(storage, applicantData.photo);
                storageDeletions.push(deleteObject(photoRef));
            } catch (error) {
                console.warn("Error deleting photo:", error);
            }
        }

        // Delete CV document if exists
        if (applicantData.cvDocument?.url) {
            try {
                const cvRef = ref(storage, applicantData.cvDocument.url);
                storageDeletions.push(deleteObject(cvRef));
            } catch (error) {
                console.warn("Error deleting CV:", error);
            }
        }

        // 3. Delete the applicant document
        batch.delete(applicantDocRef);

        // 4. Delete all job applications for this applicant
        const jobApplicationsQuery = query(jobApplicationCollection, where("uid", "==", id));
        const jobApplicationsSnapshot = await getDocs(jobApplicationsQuery);

        jobApplicationsSnapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });

        // 5. Delete all matches for this applicant
        // const matchesQuery = query(matchesCollection, where("applicantId", "==", id));
        // const matchesSnapshot = await getDocs(matchesQuery);

        // matchesSnapshot.docs.forEach((doc) => {
        //     batch.delete(doc.ref);
        // });

        // 6. Update job posts to remove this applicant from their applications array
        // First, get all job applications to find which job posts need updating
        const allJobApplicationsQuery = query(jobApplicationCollection, where("uid", "==", id));
        const allJobApplicationsSnapshot = await getDocs(allJobApplicationsQuery);

        const jobPostIdsToUpdate = new Set<string>();
        allJobApplicationsSnapshot.docs.forEach(doc => {
            const jobApp = doc.data() as JobApplicationModel;
            if (jobApp.jobPostId) {
                jobPostIdsToUpdate.add(jobApp.jobPostId);
            }
        });

        // Update each job post to remove this applicant and decrement applicant count
        for (const jobPostId of jobPostIdsToUpdate) {
            const jobPostRef = doc(db, "jobPost", jobPostId);
            const jobPostDoc = await getDoc(jobPostRef);

            if (jobPostDoc.exists()) {
                const jobPostData = jobPostDoc.data();
                const updatedApplications = (jobPostData.applications || []).filter(
                    (app: any) => app.applicantId !== id,
                );

                batch.update(jobPostRef, {
                    applications: updatedApplications,
                    applicants: Math.max(0, (jobPostData.applicants || 0) - 1),
                });
            }
        }

        // 7. Execute all deletions and updates in a single batch
        await batch.commit();

        // 8. Wait for storage deletions to complete
        await Promise.allSettled(storageDeletions);

        // Log the deletion if logInfo is provided
        if (logInfo) {
            await createLog(logInfo, actionBy ?? "", "Success");
        }

        return true;
    } catch (error) {
        console.error("Error deleting applicant and related data:", error);
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

export async function saveJob(
    savedJobs: string[],
    id: string,
    actionBy?: string,
    logInfo?: LogInfo,
): Promise<boolean> {
    return await updateApplicant(
        {
            id,
            savedJobs,
        },
        actionBy,
        logInfo,
    );
}

export async function unsaveJob(
    savedJobs: string[],
    id: string,
    actionBy?: string,
    logInfo?: LogInfo,
): Promise<boolean> {
    return await updateApplicant(
        {
            id,
            savedJobs,
        },
        actionBy,
        logInfo,
    );
}
