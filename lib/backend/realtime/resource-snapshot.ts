import { inMemoryStore } from "@/lib/backend/persistence/in-memory-store";

const resourceToCollectionPath: Record<string, string> = {
    employees: "employee",
    attendances: "attendance",
    overtimeRequests: "overtimeRequest",
    employeeLoans: "employeeLoan",
    compensations: "employeeCompensation",
};

const getCollectionPath = (resource: string): string => {
    return resourceToCollectionPath[resource] ?? resource;
};

export const loadRealtimeSnapshot = async (
    resource: string,
    filters?: {
        uid?: string;
    },
): Promise<Record<string, unknown[]>> => {
    const collectionPath = getCollectionPath(resource);
    const constraints =
        resource === "employees" && filters?.uid
            ? [
                {
                    kind: "where" as const,
                    field: "uid",
                    op: "==" as const,
                    value: filters.uid,
                },
            ]
            : [];
    const snapshot = inMemoryStore
        .queryCollection(collectionPath, constraints)
        .map(document => document.data);

    return {
        [resource]: snapshot,
    };
};
