import { ObjectiveWeightModel } from "@/lib/models/objective-weight";
import { deleteDoc, doc, setDoc, updateDoc, writeBatch } from "firebase/firestore";
import { weightDefinitionCollection } from "../../firebase/collections";
import { db } from "../../firebase/init";

const collectionRef = weightDefinitionCollection;
const collectionName = collectionRef.id;

export async function createObjectiveWeight(
    data: Omit<ObjectiveWeightModel, "id">,
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

export async function updateObjectiveWeight(
    data: Partial<ObjectiveWeightModel> & { id: string },
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

export async function deleteObjectiveWeight(id: string): Promise<boolean> {
    const docRef = doc(db, collectionName, id);
    try {
        await deleteDoc(docRef);
        return true;
    } catch (err) {
        console.error(err);
        return false;
    }
}

export async function batchCreateObjectiveWeight(
    dataArray: Array<Omit<ObjectiveWeightModel, "id">>,
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

export async function batchUpdateObjectiveWeight(
    dataArray: Array<Partial<ObjectiveWeightModel> & { id: string }>,
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
