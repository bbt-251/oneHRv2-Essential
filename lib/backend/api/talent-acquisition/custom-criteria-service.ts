import {
    deleteDoc,
    doc,
    DocumentData,
    getDocs,
    query,
    setDoc,
    updateDoc,
    where,
} from "firebase/firestore";
import { customCriteriaCollection } from "../../firebase/collections";
import CustomCriteriaModel from "@/lib/models/custom-criteria";
import { db } from "../../firebase/init";

const collectionRef = customCriteriaCollection;
const collectionName = collectionRef.id;

export async function createCustomCriteria(data: Omit<CustomCriteriaModel, "id">) {
    try {
        const docRef = doc(collectionRef);
        await setDoc(docRef, { ...data, id: docRef.id });
        return await getCustomCriteriaById(docRef.id);
    } catch (error) {
        console.error("Error creating custom criteria:", error);
        return null;
    }
}

export async function getCustomCriteria() {
    try {
        const q = query(collectionRef);
        const snapshot = await getDocs(q);
        const data: CustomCriteriaModel[] = [];

        snapshot.docs.forEach(doc => {
            data.push({
                id: doc.id,
                ...doc.data(),
            } as CustomCriteriaModel);
        });

        return data;
    } catch (error) {
        console.error("Error getting custom criteria:", error);
        return [];
    }
}

export async function getCustomCriteriaCreatedByUser(uid: string) {
    try {
        const q = query(collectionRef);
        const snapshot = await getDocs(q);
        const data: CustomCriteriaModel[] = [];

        snapshot.docs.forEach(doc => {
            data.push({
                id: doc.id,
                ...doc.data(),
            } as CustomCriteriaModel);
        });

        return data.filter(doc => doc.uid === uid);
    } catch (error) {
        console.error(`Error getting custom criteria for user ${uid}:`, error);
        return [];
    }
}

export async function getCustomCriteriaById(id: string) {
    try {
        const q = query(collectionRef, where("id", "==", id));
        const snapshot = await getDocs(q);
        const data: CustomCriteriaModel[] = [];

        snapshot.docs.forEach(doc => {
            data.push({
                id: doc.id,
                ...doc.data(),
            } as CustomCriteriaModel);
        });

        return data.find(c => c.id === id) || null;
    } catch (error) {
        console.error(`Error getting custom criteria with id ${id}:`, error);
        return null;
    }
}

export async function updateCustomCriteria(data: Partial<CustomCriteriaModel>) {
    try {
        if (!data.id) {
            throw new Error("ID is required for updating custom criteria");
        }

        const docRef = doc(db, collectionName, data.id);
        await updateDoc(docRef, data as any);
        return true;
    } catch (error) {
        console.error(`Error updating custom criteria ${data.id}:`, error);
        return false;
    }
}

export async function deleteCustomCriteria(id: string) {
    try {
        await deleteDoc(doc(db, collectionName, id));
        return true;
    } catch (error) {
        console.error(`Error deleting custom criteria ${id}:`, error);
        return false;
    }
}
