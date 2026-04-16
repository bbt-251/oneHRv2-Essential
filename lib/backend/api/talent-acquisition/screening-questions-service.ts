import ScreeningQuestionModel from "@/lib/models/screening-questions";
import {
    deleteDoc,
    doc,
    DocumentData,
    getDocs,
    query,
    QuerySnapshot,
    setDoc,
    updateDoc,
    where,
} from "firebase/firestore";
import { screeningQuestionCollection } from "../../firebase/collections";
import { db } from "../../firebase/init";

const collectionRef = screeningQuestionCollection;
const collectionName = collectionRef.id;

export async function createScreeningQuestion(data: Omit<ScreeningQuestionModel, "id">) {
    const docRef = doc(collectionRef);

    return await setDoc(docRef, { ...data, id: docRef.id })
        .then(() => {
            return true;
        })
        .catch(() => {
            return false;
        });
}

export async function getScreeningQuestions() {
    const q = query(collectionRef);

    const response: ScreeningQuestionModel[] = await getDocs(q)
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
        .catch(() => {
            return [];
        });

    return response;
}

export async function getScreeningQuestion(id: string) {
    const q = query(collectionRef, where("id", "==", id));

    const response: ScreeningQuestionModel | null = await getDocs(q)
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
        .catch(() => {
            return null;
        });

    return response;
}

export async function updateScreeningQuestion(data: Partial<ScreeningQuestionModel>) {
    let result: boolean = false;

    const docRef = doc(db, collectionName, data.id ?? "");

    result = await updateDoc(docRef, data as any)
        .then(() => true)
        .catch(() => {
            return false;
        });

    return result;
}

export async function deleteScreeningQuestion(id: string) {
    let result: boolean = await deleteDoc(doc(db, collectionName, id))
        .then(() => {
            return true;
        })
        .catch(() => {
            return false;
        });

    return result;
}
