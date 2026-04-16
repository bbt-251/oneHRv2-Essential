import {
    CollectionReference,
    DocumentData,
    writeBatch,
    doc,
    getFirestore,
} from "firebase/firestore";

type WithId<T> = T & { id: string };

const MAX_BATCH_SIZE = 500;

export async function batchUpsert<T extends DocumentData>(
    data: WithId<T>[],
    collectionRef: CollectionReference<T>,
): Promise<void> {
    if (!Array.isArray(data)) {
        throw new Error("Data must be an array.");
    }

    if (!data.length) return;

    const db = getFirestore();

    // Split into 500-sized chunks
    for (let i = 0; i < data.length; i += MAX_BATCH_SIZE) {
        const chunk = data.slice(i, i + MAX_BATCH_SIZE);
        const batch = writeBatch(db);

        try {
            for (const item of chunk) {
                if (!item.id || typeof item.id !== "string") {
                    throw new Error(`Invalid document id: ${item.id}`);
                }

                const { id, ...docData } = item;

                const docRef = doc(collectionRef, id);

                batch.set(docRef, docData as unknown as T, { merge: true });
            }

            await batch.commit();
        } catch (error) {
            console.error("Batch commit failed:", error);
            throw new Error(
                `Batch write failed at chunk starting index ${i}: ${(error as Error).message}`,
            );
        }
    }
}
