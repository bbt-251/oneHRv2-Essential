type Primitive = string | number | boolean | null;

export type InMemoryValue =
    | Primitive
    | InMemoryRecord
    | InMemoryValue[]
    | { __op: string; [key: string]: InMemoryValue | undefined };

export interface InMemoryRecord {
    [key: string]: InMemoryValue | undefined;
}

export interface InMemoryDocument {
    id: string;
    data: InMemoryRecord;
}

export interface InMemoryWhereConstraint {
    kind: "where";
    field: string;
    op: "==" | "!=" | "<" | "<=" | ">" | ">=" | "in" | "array-contains" | "array-contains-any";
    value: InMemoryValue;
}

export interface InMemoryOrderByConstraint {
    kind: "orderBy";
    field: string;
    direction: "asc" | "desc";
}

export interface InMemoryLimitConstraint {
    kind: "limit";
    count: number;
}

export interface InMemoryCompositeConstraint {
    kind: "composite";
    mode: "and" | "or";
    constraints: InMemoryQueryConstraint[];
}

export type InMemoryQueryConstraint =
    | InMemoryWhereConstraint
    | InMemoryOrderByConstraint
    | InMemoryLimitConstraint
    | InMemoryCompositeConstraint;

type Listener = () => void;

const STORE_KEY = "__onehr_in_memory_store__";
const LISTENER_KEY = "__onehr_in_memory_store_listeners__";

const randomId = (): string =>
    `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;

const cloneValue = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const normalizeCollectionPath = (segments: string[]): string => segments.join("/");

const getPathSegments = (path: string): string[] => path.split("/").filter(Boolean);

const getCollectionPrefix = (collectionPath: string): string => `${collectionPath}/`;

const isDocumentInCollection = (documentPath: string, collectionPath: string): boolean => {
    const docSegments = getPathSegments(documentPath);
    const collectionSegments = getPathSegments(collectionPath);
    return (
        docSegments.length === collectionSegments.length + 1 &&
        documentPath.startsWith(getCollectionPrefix(collectionPath))
    );
};

const getGlobalRecord = (): Record<string, InMemoryRecord> => {
    const target = globalThis as typeof globalThis & {
        [STORE_KEY]?: Record<string, InMemoryRecord>;
    };

    if (!target[STORE_KEY]) {
        target[STORE_KEY] = {};
    }

    return target[STORE_KEY]!;
};

const getGlobalListeners = (): Set<Listener> => {
    const target = globalThis as typeof globalThis & {
        [LISTENER_KEY]?: Set<Listener>;
    };

    if (!target[LISTENER_KEY]) {
        target[LISTENER_KEY] = new Set<Listener>();
    }

    return target[LISTENER_KEY]!;
};

const applyFieldOperation = (
    currentValue: InMemoryValue | undefined,
    nextValue: InMemoryValue,
): InMemoryValue => {
    if (
        nextValue &&
        typeof nextValue === "object" &&
        !Array.isArray(nextValue) &&
        "__op" in nextValue
    ) {
        const op = nextValue.__op;
        if (op === "increment") {
            const amount = Number(nextValue.amount ?? 0);
            return Number(currentValue ?? 0) + amount;
        }

        if (op === "arrayUnion") {
            const current = Array.isArray(currentValue) ? [...currentValue] : [];
            const values = Array.isArray(nextValue.values) ? nextValue.values : [];
            for (const value of values) {
                if (!current.some(entry => JSON.stringify(entry) === JSON.stringify(value))) {
                    current.push(value);
                }
            }
            return current;
        }

        if (op === "arrayRemove") {
            const current = Array.isArray(currentValue) ? [...currentValue] : [];
            const values = Array.isArray(nextValue.values) ? nextValue.values : [];
            return current.filter(
                entry => !values.some(value => JSON.stringify(entry) === JSON.stringify(value)),
            );
        }

        if (op === "serverTimestamp") {
            return new Date().toISOString();
        }
    }

    return cloneValue(nextValue);
};

const matchesWhere = (record: InMemoryRecord, constraint: InMemoryWhereConstraint): boolean => {
    const currentValue = record[constraint.field];
    const expected = constraint.value;

    switch (constraint.op) {
        case "==":
            return JSON.stringify(currentValue) === JSON.stringify(expected);
        case "!=":
            return JSON.stringify(currentValue) !== JSON.stringify(expected);
        case "<":
            return Number(currentValue ?? 0) < Number(expected ?? 0);
        case "<=":
            return Number(currentValue ?? 0) <= Number(expected ?? 0);
        case ">":
            return Number(currentValue ?? 0) > Number(expected ?? 0);
        case ">=":
            return Number(currentValue ?? 0) >= Number(expected ?? 0);
        case "in":
            return Array.isArray(expected)
                ? expected.some(value => JSON.stringify(value) === JSON.stringify(currentValue))
                : false;
        case "array-contains":
            return Array.isArray(currentValue)
                ? currentValue.some(value => JSON.stringify(value) === JSON.stringify(expected))
                : false;
        case "array-contains-any":
            return Array.isArray(currentValue) && Array.isArray(expected)
                ? expected.some(value =>
                    currentValue.some(entry => JSON.stringify(entry) === JSON.stringify(value)),
                )
                : false;
        default:
            return false;
    }
};

const matchesConstraint = (
    record: InMemoryRecord,
    constraint: InMemoryQueryConstraint,
): boolean => {
    if (constraint.kind === "where") {
        return matchesWhere(record, constraint);
    }

    if (constraint.kind === "composite") {
        if (constraint.mode === "and") {
            return constraint.constraints.every(entry => matchesConstraint(record, entry));
        }

        return constraint.constraints.some(entry => matchesConstraint(record, entry));
    }

    return true;
};

export const inMemoryStore = {
    getDocument(path: string): InMemoryDocument | null {
        const data = getGlobalRecord()[path];
        if (!data) {
            return null;
        }

        const segments = getPathSegments(path);
        return {
            id: segments[segments.length - 1] ?? path,
            data: cloneValue(data),
        };
    },

    setDocument(path: string, data: InMemoryRecord): InMemoryDocument {
        getGlobalRecord()[path] = cloneValue(data);
        this.notify();
        return this.getDocument(path)!;
    },

    updateDocument(path: string, patch: InMemoryRecord): InMemoryDocument {
        const current = this.getDocument(path)?.data ?? {};
        const next: InMemoryRecord = { ...current };

        for (const [key, value] of Object.entries(patch)) {
            if (value === undefined) {
                continue;
            }

            next[key] = applyFieldOperation(next[key], value);
        }

        getGlobalRecord()[path] = next;
        this.notify();
        return this.getDocument(path)!;
    },

    deleteDocument(path: string): void {
        delete getGlobalRecord()[path];
        this.notify();
    },

    createDocument(collectionPath: string, data: InMemoryRecord, id?: string): InMemoryDocument {
        const documentId = id ?? randomId();
        const path = normalizeCollectionPath([...getPathSegments(collectionPath), documentId]);
        return this.setDocument(path, data);
    },

    queryCollection(
        collectionPath: string,
        constraints: InMemoryQueryConstraint[] = [],
    ): InMemoryDocument[] {
        let results = Object.entries(getGlobalRecord())
            .filter(([path]) => isDocumentInCollection(path, collectionPath))
            .map(([path, data]) => {
                const segments = getPathSegments(path);
                return {
                    id: segments[segments.length - 1] ?? path,
                    data: cloneValue(data),
                };
            });

        for (const constraint of constraints) {
            if (constraint.kind === "where" || constraint.kind === "composite") {
                results = results.filter(document => matchesConstraint(document.data, constraint));
            }
        }

        const orderByConstraints = constraints.filter(
            (constraint): constraint is InMemoryOrderByConstraint => constraint.kind === "orderBy",
        );

        for (const constraint of orderByConstraints.reverse()) {
            results = [...results].sort((left, right) => {
                const leftValue = left.data[constraint.field];
                const rightValue = right.data[constraint.field];
                const leftComparable =
                    typeof leftValue === "string" ? leftValue : Number(leftValue ?? 0);
                const rightComparable =
                    typeof rightValue === "string" ? rightValue : Number(rightValue ?? 0);

                if (leftComparable < rightComparable) {
                    return constraint.direction === "asc" ? -1 : 1;
                }

                if (leftComparable > rightComparable) {
                    return constraint.direction === "asc" ? 1 : -1;
                }

                return 0;
            });
        }

        const limitConstraint = constraints.find(
            (constraint): constraint is InMemoryLimitConstraint => constraint.kind === "limit",
        );

        if (limitConstraint) {
            results = results.slice(0, Math.max(0, limitConstraint.count));
        }

        return results;
    },

    countCollection(collectionPath: string, constraints: InMemoryQueryConstraint[] = []): number {
        return this.queryCollection(collectionPath, constraints).length;
    },

    subscribe(listener: Listener): () => void {
        const listeners = getGlobalListeners();
        listeners.add(listener);
        return () => {
            listeners.delete(listener);
        };
    },

    notify(): void {
        const listeners = getGlobalListeners();
        for (const listener of listeners) {
            listener();
        }
    },
};
