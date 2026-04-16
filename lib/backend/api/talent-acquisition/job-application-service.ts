import {
    deleteDoc,
    doc,
    DocumentData,
    getDoc,
    getDocs,
    onSnapshot,
    query,
    QuerySnapshot,
    setDoc,
    updateDoc,
    where,
    addDoc,
    collection,
    orderBy,
    Timestamp,
} from "firebase/firestore";
import { jobApplicationCollection } from "../../firebase/collections";
import { JobApplicationModel, NoteModel } from "@/lib/models/job-application";
import { updateJobPost } from "./job-post-service";
import { db } from "../../firebase/init";
import { getApplicant } from "./applicant-service";
import { JobPostModel } from "@/lib/models/job-post";
// import { weaviateService } from "@/lib/backend/weaviate/weaviate-service";
// import { indexApplicantResumeFromParsedText } from '@/lib/backend/rag/chunk';

const collectionRef = jobApplicationCollection;
const collectionName = collectionRef.id;

export async function createJobApplication(
    data: Omit<JobApplicationModel, "id">,
    jobPost: JobPostModel | null,
) {
    const docRef = doc(collectionRef);
    try {
        const jobApplicationData = { ...data, id: docRef.id };
        await setDoc(docRef, jobApplicationData);
        // await setDoc(docRef, { ...data, id: docRef.id })
        try {
            await fetch(`/api/sync-job-application-to-weaviate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ jobApplication: jobApplicationData }),
            });
            console.log(`Job application ${docRef.id} added to Weaviate`);
        } catch (weaviateError) {
            console.error("Failed to add job application to Weaviate:", weaviateError);
        }
    } catch (err) {
        console.log("err", err);
        return false; // Early return on failure
    }

    if (jobPost !== null) {
        await updateJobPost(data.jobPostId, {
            applicants: (jobPost?.applicants ?? 0) + 1,
        });

        try {
            await fetch(`/api/sync-job-post-to-weaviate`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    jobPostId: data.jobPostId,
                    applicants: (jobPost?.applicants ?? 0) + 1,
                }),
            });
            console.log(`Job post ${docRef.id} added to Weaviate`);
        } catch (weaviateError) {
            console.error("Failed to add job post to Weaviate:", weaviateError);
        }
    }

    return await getJobApplication(docRef.id);
}

export async function getJobApplications() {
    const q = query(collectionRef);

    const response: JobApplicationModel[] = await getDocs(q)
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

export async function getJobApplicationsForUser(uid: string) {
    const q = query(collectionRef);

    const response: JobApplicationModel[] = await getDocs(q)
        .then((snapshot: QuerySnapshot<DocumentData>) => {
            const data: any[] = [];
            snapshot.docs.map(doc => {
                data.push({
                    id: doc.id,
                    ...doc.data(),
                });
            });
            return data.filter(doc => doc.uid === uid);
        })
        .catch((e: any) => {
            console.log("err: ", e);
            return [];
        });

    return response;
}

// Notes management functions - stored in the job application document
export const addNoteToApplication = async (
    applicationId: string,
    note: Omit<NoteModel, "id">,
): Promise<void> => {
    try {
        // Get current application
        const application = await getJobApplication(applicationId);
        if (!application) {
            throw new Error("Application not found");
        }

        // Generate new note ID
        const noteId = doc(collection(db, "temp")).id;
        const newNote: NoteModel = {
            ...note,
            id: noteId,
        };

        // Update application with new notes array
        const updatedNotes = [...(application.notes || []), newNote];
        await updateDoc(doc(db, collectionName, applicationId), {
            notes: updatedNotes,
        });
    } catch (error) {
        console.error("Error adding note:", error);
        throw error;
    }
};

export const updateNoteInApplication = async (
    applicationId: string,
    note: NoteModel,
): Promise<void> => {
    try {
        // Get current application
        const application = await getJobApplication(applicationId);
        if (!application) {
            throw new Error("Application not found");
        }

        // Update the specific note in the notes array
        const updatedNotes = (application.notes || []).map(n => (n.id === note.id ? note : n));

        await updateDoc(doc(db, collectionName, applicationId), {
            notes: updatedNotes,
        });
    } catch (error) {
        console.error("Error updating note:", error);
        throw error;
    }
};

export const deleteNoteFromApplication = async (
    applicationId: string,
    noteId: string,
): Promise<void> => {
    try {
        // Get current application
        const application = await getJobApplication(applicationId);
        if (!application) {
            throw new Error("Application not found");
        }

        // Remove the note from the notes array
        const updatedNotes = (application.notes || []).filter(n => n.id !== noteId);

        await updateDoc(doc(db, collectionName, applicationId), {
            notes: updatedNotes,
        });
    } catch (error) {
        console.error("Error deleting note:", error);
        throw error;
    }
};

export const getApplicationNotes = async (applicationId: string): Promise<NoteModel[]> => {
    try {
        const application = await getJobApplication(applicationId);
        return application?.notes || [];
    } catch (error) {
        console.error("Error getting notes:", error);
        return [];
    }
};

export async function getJobApplication(id: string) {
    const q = query(collectionRef, where("id", "==", id));

    const response: JobApplicationModel | null = await getDocs(q)
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

export async function updateJobApplication(data: Partial<JobApplicationModel>) {
    let result: boolean = false;

    // fetch the applicant
    const applicant = await getApplicant(data.applicantId ?? "");

    if (!applicant) {
        return false;
    }
    const docRef = doc(db, collectionName, data.id ?? "");

    result = await updateDoc(docRef, { ...data, applicant: applicant })
        .then(() => true)
        .catch(err => {
            console.log(err);
            return false;
        });

    return result;
}

export async function deleteJobApplication(id: string) {
    const result: boolean = await deleteDoc(doc(db, collectionName, id))
        .then(() => {
            return true;
        })
        .catch(() => {
            return false;
        });

    return result;
}

export async function getJobApplicationsByCompany(companyId: string) {
    // Fetch all job applications, then filter by company.id
    const q = query(collectionRef);

    const response: JobApplicationModel[] = await getDocs(q)
        .then((snapshot: QuerySnapshot<DocumentData>) => {
            const data: any[] = [];
            snapshot.docs.map(doc => {
                data.push({
                    id: doc.id,
                    ...doc.data(),
                });
            });
            // Filter applications where company.id matches the provided companyId
            return data.filter(app => app.company && app.company.id === companyId);
        })
        .catch((e: any) => {
            console.log("err: ", e);
            return [];
        });

    return response;
}

export function extractSkillsFromRequirements(reqs: string[] = []): string[] {
    return reqs
        .flatMap(r => r.split(","))
        .map(s => s.trim().toLowerCase())
        .filter(Boolean);
}

export function extractPreferredSkills(jobPost: any): string[] {
    return jobPost.preferredSkills?.length ? jobPost.preferredSkills : [];
}
