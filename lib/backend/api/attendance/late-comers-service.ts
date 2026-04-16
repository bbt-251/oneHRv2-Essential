import { LateComersModel } from "@/lib/models/late-comers";
import { doc, setDoc, getDocs, query, where } from "firebase/firestore";
import { lateComersCollection } from "../../firebase/collections";
import dayjs from "dayjs";

const collectionRef = lateComersCollection;

export async function addLateComers(data: Omit<LateComersModel, "id">): Promise<boolean> {
    try {
        const docRef = doc(collectionRef);
        await setDoc(docRef, {
            ...data,
            id: docRef.id,
        });
        return true;
    } catch (error) {
        console.error("Error adding late comer:", error);
        return false;
    }
}

export async function getLateComersByMonth(
    month: string,
    year: number,
): Promise<LateComersModel[]> {
    try {
        const startOfMonth = dayjs(`${year}-${month}-01`).startOf("month").toISOString();
        const endOfMonth = dayjs(`${year}-${month}-01`).endOf("month").toISOString();

        const q = query(
            collectionRef,
            where("timestamp", ">=", startOfMonth),
            where("timestamp", "<=", endOfMonth),
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as LateComersModel);
    } catch (error) {
        console.error("Error getting late comers:", error);
        return [];
    }
}
