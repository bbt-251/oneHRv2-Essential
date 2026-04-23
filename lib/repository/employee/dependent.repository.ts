import { DependentModel } from "@/lib/models/dependent";
import {
    RepositoryResult,
    repositoryFailure,
    repositorySuccess,
} from "@/lib/repository/shared/result";

type BackendErrorShape = {
    error?:
        | string
        | {
              code?: string;
              message?: string;
              details?: unknown;
          };
};

type DependentResponse = {
    message?: string;
    dependent?: DependentModel | null;
    dependents?: DependentModel[];
    deleted?: boolean;
};

const parseError = (payload: BackendErrorShape, fallback: string) => {
    if (typeof payload.error === "string" && payload.error.trim()) {
        return { message: payload.error, code: undefined, details: undefined };
    }

    if (payload.error && typeof payload.error === "object") {
        return {
            message: payload.error.message || fallback,
            code: payload.error.code,
            details: payload.error.details,
        };
    }

    return { message: fallback, code: undefined, details: undefined };
};

export class DependentRepository {
    private static async request<T extends DependentModel | DependentModel[] | { deleted: true }>(
        input: RequestInfo | URL,
        init?: RequestInit,
    ): Promise<RepositoryResult<T>> {
        try {
            const response = await fetch(input, {
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    ...(init?.headers ?? {}),
                },
                ...init,
            });

            const payload = (await response.json().catch(() => ({}))) as DependentResponse &
                BackendErrorShape;

            if (!response.ok) {
                const error = parseError(payload, "Dependent request failed.");
                return repositoryFailure(error.message, {
                    code: error.code,
                    details: error.details,
                });
            }

            const data = (payload.dependent ??
                payload.dependents ??
                (payload.deleted ? ({ deleted: true } as const) : null)) as T | null;

            if (!data) {
                return repositoryFailure("Dependent response did not include expected data.");
            }

            return repositorySuccess(
                payload.message || "Dependent request completed successfully.",
                data,
            );
        } catch (error) {
            return repositoryFailure(
                error instanceof Error ? error.message : "Dependent request failed unexpectedly.",
            );
        }
    }

    static listDependents(employeeId: string) {
        const query = new URLSearchParams({ employeeId });
        return this.request<DependentModel[]>(`/api/employee/dependent?${query.toString()}`, {
            method: "GET",
        });
    }

    static createDependent(payload: Omit<DependentModel, "id">) {
        return this.request<DependentModel>("/api/employee/dependent", {
            method: "POST",
            body: JSON.stringify({ payload }),
        });
    }

    static updateDependent(payload: Partial<DependentModel> & { id: string }) {
        return this.request<DependentModel>("/api/employee/dependent", {
            method: "PATCH",
            body: JSON.stringify({ id: payload.id, payload }),
        });
    }

    static deleteDependent(id: string, relatedTo?: string) {
        return this.request<{ deleted: true }>("/api/employee/dependent", {
            method: "DELETE",
            body: JSON.stringify({ id, relatedTo }),
        });
    }
}
