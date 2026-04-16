import { deleteDoc, doc, setDoc, updateDoc, writeBatch } from "firebase/firestore";
import { competenceValueCollection } from "../../firebase/collections";
import { db } from "../../firebase/init";
import { CompetenceValueModel } from "@/lib/models/competenceAssessment";

const collectionRef = competenceValueCollection;
const collectionName = collectionRef.id;

export async function createCompetenceValue(
    data: Omit<CompetenceValueModel, "id">,
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

export async function updateCompetenceValue(
    data: Partial<CompetenceValueModel> & { id: string },
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

export async function deleteCompetenceValue(id: string): Promise<boolean> {
    const docRef = doc(db, collectionName, id);
    try {
        await deleteDoc(docRef);
        return true;
    } catch (err) {
        console.error(err);
        return false;
    }
}

export async function batchCreateCompetenceValues(
    dataArray: Array<Omit<CompetenceValueModel, "id">>,
): Promise<boolean> {
    const batch = writeBatch(db);

    try {
        dataArray.forEach(data => {
            const docRef = doc(collectionRef);
            batch.set(docRef, { ...data, id: docRef.id });
        });

        await batch.commit();
        return true;
    } catch (error) {
        console.error("Batch create error:", error);
        return false;
    }
}

export async function batchUpdateCompetenceValues(
    dataArray: Array<Partial<CompetenceValueModel> & { id: string }>,
): Promise<boolean> {
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
