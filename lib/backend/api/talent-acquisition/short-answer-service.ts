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
import { shortAnswerCollection } from "../../firebase/collections";
import ShortAnswerModel from "@/lib/models/short-answer";
import { db } from "../../firebase/init";

const collectionRef = shortAnswerCollection;
const collectionName = collectionRef.id;

export async function createShortAnswer(data: Omit<ShortAnswerModel, "id">) {
    const docRef = doc(collectionRef);

    return await setDoc(docRef, { ...data, id: docRef.id })
        .then(() => {
            return true;
        })
        .catch(err => {
            console.log("err", err);
            return false;
        });
}

export async function getShortAnswers() {
    const q = query(collectionRef);

    const response: ShortAnswerModel[] = await getDocs(q)
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

export async function getShortAnswer(id: string) {
    const q = query(collectionRef, where("id", "==", id));

    const response: ShortAnswerModel | null = await getDocs(q)
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

export async function updateShortAnswer(data: Partial<ShortAnswerModel>) {
    let result: boolean = false;

    const docRef = doc(db, collectionName, data.id ?? "");

    result = await updateDoc(docRef, data as any)
        .then(() => true)
        .catch(err => {
            console.log(err);
            return false;
        });

    return result;
}

export async function deleteShortAnswer(id: string) {
    let result: boolean = await deleteDoc(doc(db, collectionName, id))
        .then(() => {
            return true;
        })
        .catch(() => {
            return false;
        });

    return result;
}
