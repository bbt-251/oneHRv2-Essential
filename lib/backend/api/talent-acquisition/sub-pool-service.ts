import {
    doc,
    DocumentData,
    getDoc,
    getDocs,
    query,
    QuerySnapshot,
    setDoc,
    updateDoc,
    deleteDoc,
} from "firebase/firestore";
import { subPoolCollection } from "../../firebase/collections";
import { db } from "../../firebase/init";
import { SubPoolModel } from "@/lib/models/subPool";

const collectionRef = subPoolCollection;
const collectionName = collectionRef.id;

export async function createSubPool(data: Omit<SubPoolModel, "id">): Promise<SubPoolModel | null> {
    try {
        const docRef = doc(collectionRef);
        const now = new Date().toISOString();
        await setDoc(docRef, {
            ...data,
            id: docRef.id,
            createdAt: now,
            updatedAt: now,
        });

        return await getSubPool(docRef.id);
    } catch (err) {
        console.error("Error creating sub pool:", err);
        return null;
    }
}

export async function getSubPools(): Promise<SubPoolModel[]> {
    try {
        const q = query(collectionRef);
        const querySnapshot: QuerySnapshot<DocumentData> = await getDocs(q);

        const entries: SubPoolModel[] = querySnapshot.docs.map(
            doc =>
                ({
                    id: doc.id,
                    ...doc.data(),
                }) as SubPoolModel,
        );

        return entries;
    } catch (err) {
        console.error("Error fetching sub pools:", err);
        return [];
    }
}

export async function getSubPool(id: string): Promise<SubPoolModel | null> {
    try {
        const docRef = doc(db, collectionName, id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() } as SubPoolModel;
        } else {
            console.log(`No sub pool found with ID: ${id}`);
            return null;
        }
    } catch (err) {
        console.error("Error fetching sub pool:", err);
        return null;
    }
}

export async function updateSubPool(
    data: Partial<SubPoolModel> & { id: string },
): Promise<boolean> {
    if (!data.id) {
        console.error("Update failed: Document ID is missing.");
        return false;
    }

    const docRef = doc(db, collectionName, data.id);

    try {
        await updateDoc(docRef, {
            ...data,
            updatedAt: new Date().toISOString(),
        });
        return true;
    } catch (err) {
        console.error(`Error updating sub pool with ID ${data.id}:`, err);
        return false;
    }
}

export async function deleteSubPool(id: string): Promise<boolean> {
    const docRef = doc(db, collectionName, id);

    try {
        await deleteDoc(docRef);
        return true;
    } catch (err) {
        console.error(`Error deleting sub pool with ID ${id}:`, err);
        return false;
    }
}
