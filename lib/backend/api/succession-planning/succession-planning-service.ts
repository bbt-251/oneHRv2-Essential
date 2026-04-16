import { addDoc, collection, deleteDoc, doc, getDocs, updateDoc } from "firebase/firestore";
import { db } from "@/lib/backend/firebase/init";
import { successionPlanningCollection } from "@/lib/backend/firebase/collections";
import { SuccessionPlanningModel, SuccessionPlanningStage } from "@/lib/models/succession-planning";

const collectionRef = successionPlanningCollection;
const collectionName = collectionRef.id;

export type SuccessionPlanningCreateInput = Omit<SuccessionPlanningModel, "id">;

export type SuccessionPlanningUpdateInput = Partial<SuccessionPlanningModel> & {
    id: string;
};

export async function getAllSuccessionPlans(): Promise<SuccessionPlanningModel[]> {
    const snapshot = await getDocs(collectionRef);
    return snapshot.docs.map(d => ({ id: d.id, ...(d.data() as any) }) as SuccessionPlanningModel);
}

export async function createSuccessionPlan(
    data: SuccessionPlanningCreateInput,
): Promise<string | null> {
    try {
        // Firestore does not allow undefined values – strip them out
        const cleanedData = Object.fromEntries(
            Object.entries(data).filter(([, value]) => value !== undefined),
        ) as SuccessionPlanningCreateInput;

        const col = collection(db, collectionName);
        const docRef = await addDoc(col, cleanedData as any);
        return docRef.id;
    } catch (e) {
        console.error("Failed to create succession plan", e);
        return null;
    }
}

export async function updateSuccessionPlan(data: SuccessionPlanningUpdateInput): Promise<boolean> {
    const { id, ...rest } = data;
    const docRef = doc(db, collectionName, id);

    try {
        await updateDoc(docRef, rest as any);
        return true;
    } catch (e) {
        console.error("Failed to update succession plan", e);
        return false;
    }
}

export async function deleteSuccessionPlan(id: string): Promise<boolean> {
    try {
        const docRef = doc(db, collectionName, id);
        await deleteDoc(docRef);
        return true;
    } catch (e) {
        console.error("Failed to delete succession plan", e);
        return false;
    }
}

export function getSuccessionStageLabel(stage: SuccessionPlanningStage) {
    if (stage === "Successor Identified") return "Successor Identified";
    return "Open";
}
