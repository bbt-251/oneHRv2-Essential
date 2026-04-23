import { buildBackendUrl } from "@/lib/shared/config";
import { CompactDataResource } from "@/lib/server/shared/resource-types";

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

interface BackendErrorPayload {
    error?:
        | string
        | {
              code?: string;
              message?: string;
              details?: unknown;
          };
}

const getErrorMessage = (payload: BackendErrorPayload, fallback: string): string => {
    if (typeof payload.error === "string" && payload.error.trim()) {
        return payload.error;
    }

    if (
        payload.error &&
        typeof payload.error === "object" &&
        typeof payload.error.message === "string" &&
        payload.error.message.trim()
    ) {
        return payload.error.code
            ? `${payload.error.message} (${payload.error.code})`
            : payload.error.message;
    }

    return fallback;
};

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

    const payload = (await response.json().catch(() => ({}))) as T & BackendErrorPayload;
    if (!response.ok) {
        throw new Error(getErrorMessage(payload, `Request failed for ${path}.`));
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
