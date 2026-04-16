import { deleteDoc, doc, setDoc, updateDoc } from "firebase/firestore";
import { flexibilityParameterCollection } from "../../firebase/collections";
import { db } from "../../firebase/init";
import { FlexibilityParameterModel } from "@/lib/models/flexibilityParameter";

const collectionRef = flexibilityParameterCollection;
const collectionName = collectionRef.id;

export async function createParameter(
    data: Omit<FlexibilityParameterModel, "id">,
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

export async function updateParameter(
    data: Partial<FlexibilityParameterModel> & { id: string },
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

export async function deleteDocument(id: string): Promise<boolean> {
    const docRef = doc(db, collectionName, id);
    try {
        await deleteDoc(docRef);
        return true;
    } catch (err) {
        console.error(err);
        return false;
    }
}
