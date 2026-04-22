import { buildBackendUrl } from "@/lib/backend/config";
import { CompactDataResource } from "@/lib/backend/services/resource-types";

interface QueryOptions {
    resource: CompactDataResource;
    filters?: Record<string, unknown>;
}

interface MutateOptions {
    resource: CompactDataResource;
    action: "create" | "update" | "delete";
    payload?: Record<string, unknown>;
    targetId?: string;
}

const requestCompactData = async <T>(
    path: "/api/data/query" | "/api/data/mutate",
    body: object,
) => {
    const response = await fetch(buildBackendUrl(path), {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    });

    const payload = (await response.json().catch(() => ({}))) as T & { error?: string };
    if (!response.ok) {
        throw new Error(payload.error ?? `Request failed for ${path}.`);
    }

    return payload;
};

export const queryCompactData = async <T>({ resource, filters }: QueryOptions): Promise<T> =>
    requestCompactData<T>("/api/data/query", {
        resource,
        filters,
    });

export const mutateCompactData = async <T>({
    resource,
    action,
    payload,
    targetId,
}: MutateOptions): Promise<T> =>
    requestCompactData<T>("/api/data/mutate", {
        resource,
        action,
        payload,
        targetId,
    });
