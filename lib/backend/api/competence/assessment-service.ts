import { deleteDoc, doc, setDoc, updateDoc, writeBatch } from "firebase/firestore";
import { competenceAssessmentCollection } from "../../firebase/collections";
import { db } from "../../firebase/init";
import { CompetenceAssessmentModel } from "@/lib/models/competenceAssessment";

const collectionRef = competenceAssessmentCollection;
const collectionName = collectionRef.id;

export async function createCompetenceAssessment(
    data: Omit<CompetenceAssessmentModel, "id">,
): Promise<boolean> {
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

export async function updateCompetenceAssessment(
    data: Partial<CompetenceAssessmentModel> & { id: string },
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

export async function deleteCompetenceAssessment(id: string): Promise<boolean> {
    const docRef = doc(db, collectionName, id);
    try {
        await deleteDoc(docRef);
        return true;
    } catch (err) {
        console.error(err);
        return false;
    }
}
