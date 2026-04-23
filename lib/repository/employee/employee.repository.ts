import { buildBackendUrl } from "@/lib/shared/config";
import { EmployeeModel } from "@/lib/models/employee";
import {
    RepositoryResult,
    repositoryFailure,
    repositorySuccess,
} from "@/lib/repository/shared/result";

export type EmployeeSubscriptionUnsubscribe = () => void;

type BackendErrorShape = {
    error?:
        | string
        | {
              code?: string;
              message?: string;
              details?: unknown;
          };
};

type EmployeeResponse = {
    message?: string;
    employee?: EmployeeModel | null;
    employees?: EmployeeModel[];
    deleted?: boolean;
    success?: boolean;
    errors?: string[];
};

type EmployeeStreamEventEnvelope = {
    event?: {
        operation?: "added" | "modified" | "removed";
        payload?: { employees?: EmployeeModel[] } | EmployeeModel;
    };
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

const isEmployeeModel = (value: unknown): value is EmployeeModel =>
    Boolean(value) &&
    typeof value === "object" &&
    (typeof (value as EmployeeModel).id === "string" ||
        typeof (value as EmployeeModel).uid === "string");

const parseEmployeeStreamPayload = (data: string): EmployeeModel[] | null => {
    const payload = JSON.parse(data) as
        | { employees?: EmployeeModel[] }
        | EmployeeStreamEventEnvelope;

    if ("employees" in payload && Array.isArray(payload.employees)) {
        return payload.employees;
    }

    const eventPayload = payload.event?.payload;
    if (eventPayload && "employees" in eventPayload && Array.isArray(eventPayload.employees)) {
        return eventPayload.employees;
    }

    if (payload.event?.operation === "removed") {
        return [];
    }

    return isEmployeeModel(eventPayload) ? [eventPayload] : null;
};

export class EmployeeRepository {
    private static async request<T extends EmployeeModel | EmployeeModel[] | { deleted: true }>(
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

            const payload = (await response.json().catch(() => ({}))) as EmployeeResponse &
                BackendErrorShape;

            if (!response.ok) {
                const error = parseError(payload, "Employee request failed.");
                return repositoryFailure(error.message, {
                    code: error.code,
                    details: error.details,
                });
            }

            const data = (payload.employee ??
                payload.employees ??
                (payload.deleted ? ({ deleted: true } as const) : null)) as T | null;

            if (!data) {
                return repositoryFailure("Employee response did not include expected data.");
            }

            return repositorySuccess(
                payload.message || "Employee request completed successfully.",
                data,
            );
        } catch (error) {
            return repositoryFailure(
                error instanceof Error ? error.message : "Employee request failed unexpectedly.",
            );
        }
    }

    static listEmployees(filters?: Record<string, unknown>) {
        const query = new URLSearchParams();
        Object.entries(filters ?? {}).forEach(([key, value]) => {
            if (Array.isArray(value)) {
                value.forEach(item => query.append(key, String(item)));
            } else if (value !== undefined && value !== null && value !== "") {
                query.set(key, String(value));
            }
        });

        return this.request<EmployeeModel[]>(
            query.size ? `/api/employee?${query.toString()}` : "/api/employee",
            { method: "GET" },
        );
    }

    static async getEmployeeByUid(uid: string) {
        const result = await this.listEmployees({ uid });
        if (!result.success) {
            return result as RepositoryResult<EmployeeModel>;
        }

        const employee = result.data[0];
        if (!employee) {
            return repositoryFailure("Employee was not found.", { code: "EMPLOYEE_NOT_FOUND" });
        }

        return repositorySuccess("Employee loaded successfully.", employee);
    }

    static createEmployee(payload: Omit<EmployeeModel, "id">) {
        return this.request<EmployeeModel>("/api/employee", {
            method: "POST",
            body: JSON.stringify({ payload }),
        });
    }

    static updateEmployee(payload: Partial<EmployeeModel> & { id: string }) {
        return this.request<EmployeeModel>("/api/employee", {
            method: "PATCH",
            body: JSON.stringify({ id: payload.id, payload }),
        });
    }

    static deleteEmployee(id: string) {
        return this.request<{ deleted: true }>("/api/employee", {
            method: "DELETE",
            body: JSON.stringify({ id }),
        });
    }

    static async batchUpdateEmployees(
        employees: (Partial<EmployeeModel> & { id: string })[],
    ): Promise<RepositoryResult<{ success: boolean }>> {
        try {
            const response = await fetch("/api/employee", {
                method: "PATCH",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    payload: {
                        employees,
                    },
                }),
            });

            const payload = (await response.json().catch(() => ({}))) as EmployeeResponse &
                BackendErrorShape;

            if (!response.ok) {
                const error = parseError(payload, "Employee batch update failed.");
                return repositoryFailure(error.message, {
                    code: error.code,
                    details: error.details,
                });
            }

            return repositorySuccess(payload.message || "Employees updated successfully.", {
                success: Boolean(payload.success),
            });
        } catch (error) {
            return repositoryFailure(
                error instanceof Error
                    ? error.message
                    : "Employee batch update failed unexpectedly.",
            );
        }
    }

    static async appendClaimedOvertime(
        employeeDocIds: string[],
        overtimeRequestId: string,
    ): Promise<RepositoryResult<{ success: boolean }>> {
        try {
            const response = await fetch("/api/employee", {
                method: "PATCH",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    payload: {
                        appendClaimedOvertime: true,
                        employeeDocIds,
                        overtimeRequestId,
                    },
                }),
            });

            const payload = (await response.json().catch(() => ({}))) as EmployeeResponse &
                BackendErrorShape;

            if (!response.ok) {
                const error = parseError(payload, "Appending claimed overtime failed.");
                return repositoryFailure(error.message, {
                    code: error.code,
                    details: error.details,
                });
            }

            return repositorySuccess(payload.message || "Claimed overtime updated successfully.", {
                success: Boolean(payload.success),
            });
        } catch (error) {
            return repositoryFailure(
                error instanceof Error
                    ? error.message
                    : "Appending claimed overtime failed unexpectedly.",
            );
        }
    }

    static async cascadeDeleteEmployee(
        employeeUid: string,
    ): Promise<RepositoryResult<{ success: boolean; errors: string[] }>> {
        try {
            const response = await fetch("/api/employee", {
                method: "DELETE",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    id: employeeUid,
                    cascade: true,
                }),
            });

            const payload = (await response.json().catch(() => ({}))) as EmployeeResponse &
                BackendErrorShape;

            if (!response.ok) {
                const error = parseError(payload, "Employee cascade delete failed.");
                return repositoryFailure(error.message, {
                    code: error.code,
                    details: error.details,
                });
            }

            return repositorySuccess(payload.message || "Employee deleted successfully.", {
                success: Boolean(payload.success),
                errors: payload.errors ?? [],
            });
        } catch (error) {
            return repositoryFailure(
                error instanceof Error
                    ? error.message
                    : "Employee cascade delete failed unexpectedly.",
            );
        }
    }

    static subscribeEmployeeByUid(
        uid: string,
        callback: (employees: EmployeeModel[], hasPendingWrites: boolean) => void,
        onError?: (error: Error) => void,
    ): EmployeeSubscriptionUnsubscribe {
        const url = buildBackendUrl(
            `/api/data/stream?resource=employees&uid=${encodeURIComponent(uid)}`,
        );
        const eventSource = new EventSource(url, { withCredentials: true });

        const handleEvent = (event: MessageEvent<string>) => {
            try {
                const employees = parseEmployeeStreamPayload(event.data);
                if (employees) {
                    callback(employees, false);
                }
            } catch (error) {
                onError?.(error as Error);
            }
        };

        eventSource.onmessage = handleEvent;
        eventSource.addEventListener("snapshot", handleEvent);
        eventSource.addEventListener("replay", handleEvent);
        eventSource.addEventListener("added", handleEvent);
        eventSource.addEventListener("modified", handleEvent);
        eventSource.addEventListener("removed", handleEvent);

        eventSource.onerror = () => {
            onError?.(new Error("Employee realtime subscription disconnected"));
            eventSource.close();
        };

        return () => {
            eventSource.close();
        };
    }
}
