import { InMemoryQueryConstraint, inMemoryStore } from "@/lib/backend/persistence/in-memory-store";

export const stripUndefined = <T extends Record<string, unknown>>(value: T): T =>
    Object.fromEntries(
        Object.entries(value).filter(([, entryValue]) => entryValue !== undefined),
    ) as T;

export const getInMemoryDocumentByPath = <T>(path: string): T | null => {
    const document = inMemoryStore.getDocument(path);
    if (!document) {
        return null;
    }

    return {
        id: document.id,
        ...document.data,
    } as T;
};

export const listInMemoryCollection = <T>(
    collectionPath: string,
    constraints: InMemoryQueryConstraint[] = [],
): T[] =>
        inMemoryStore.queryCollection(collectionPath, constraints).map(
            document =>
            ({
                id: document.id,
                ...document.data,
            }) as T,
        );
