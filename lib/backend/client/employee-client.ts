import { buildBackendUrl } from "@/lib/backend/config";
import { queryCompactData, mutateCompactData } from "@/lib/backend/client/data-client";
import { DependentModel } from "@/lib/models/dependent";
import { EmployeeModel } from "@/lib/models/employee";

export type EmployeeSubscriptionUnsubscribe = () => void;

interface EmployeeEventPayload {
    employees: EmployeeModel[];
}

type EmployeeStreamEventEnvelope = {
    event?: {
        operation?: "added" | "modified" | "removed";
        payload?: EmployeeEventPayload | EmployeeModel;
    };
};

const isEmployeeModel = (value: unknown): value is EmployeeModel =>
    Boolean(value) &&
    typeof value === "object" &&
    (typeof (value as EmployeeModel).id === "string" ||
        typeof (value as EmployeeModel).uid === "string");

const parseEmployeeStreamPayload = (data: string): EmployeeModel[] | null => {
    const payload = JSON.parse(data) as
        | EmployeeEventPayload
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

export const createEmployeeWithBackend = (payload: Omit<EmployeeModel, "id">) =>
    mutateCompactData<{ employee: EmployeeModel }>({
        resource: "employees",
        action: "create",
        payload: payload as Record<string, unknown>,
    });

export const updateEmployeeWithBackend = (payload: Partial<EmployeeModel> & { id: string }) =>
    mutateCompactData<{ employee: EmployeeModel | null }>({
        resource: "employees",
        action: "update",
        targetId: payload.id,
        payload: payload as Record<string, unknown>,
    });

export const deleteEmployeeWithBackend = (employeeId: string) =>
    mutateCompactData<{ deleted: true }>({
        resource: "employees",
        action: "delete",
        targetId: employeeId,
    });

export const listEmployeesWithBackend = (filters?: Record<string, unknown>) =>
    queryCompactData<{ employees: EmployeeModel[] }>({
        resource: "employees",
        filters,
    });

export const subscribeEmployeeByUidWithBackend = (
    uid: string,
    callback: (employees: EmployeeModel[], hasPendingWrites: boolean) => void,
    onError?: (error: Error) => void,
): EmployeeSubscriptionUnsubscribe => {
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
            console.error("[employee-client] failed to parse employee stream payload", {
                uid,
                eventType: event.type,
                error: error instanceof Error ? error.message : error,
            });
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
        console.error("[employee-client] employee stream disconnected", {
            uid,
            readyState: eventSource.readyState,
        });
        onError?.(new Error("Employee realtime subscription disconnected"));
        eventSource.close();
    };

    return () => {
        eventSource.close();
    };
};

export const createDependentWithBackend = (payload: Omit<DependentModel, "id">) =>
    mutateCompactData<{ dependent: DependentModel }>({
        resource: "dependents",
        action: "create",
        payload: payload as Record<string, unknown>,
    });

export const updateDependentWithBackend = (payload: Partial<DependentModel> & { id: string }) =>
    mutateCompactData<{ dependent: DependentModel | null }>({
        resource: "dependents",
        action: "update",
        targetId: payload.id,
        payload: payload as Record<string, unknown>,
    });

export const deleteDependentWithBackend = (dependentId: string) =>
    mutateCompactData<{ deleted: true }>({
        resource: "dependents",
        action: "delete",
        targetId: dependentId,
    });

export const listDependentsForEmployeeWithBackend = (employeeId: string) =>
    queryCompactData<{ dependents: DependentModel[] }>({
        resource: "dependents",
        filters: { employeeId },
    });

export const batchUpdateEmployeesWithBackend = (
    employees: (Partial<EmployeeModel> & { id: string })[],
) =>
    mutateCompactData<{ success: boolean }>({
        resource: "employees",
        action: "update",
        payload: { employees },
    });

export const appendClaimedOvertimeToEmployeesWithBackend = (
    employeeDocIds: string[],
    overtimeRequestId: string,
) =>
    mutateCompactData<{ success: boolean }>({
        resource: "employees",
        action: "update",
        payload: {
            appendClaimedOvertime: true,
            employeeDocIds,
            overtimeRequestId,
        },
    });

export const cascadeDeleteEmployeeWithBackend = (employeeUid: string) =>
    mutateCompactData<{ success: boolean; errors: string[] }>({
        resource: "employees",
        action: "delete",
        targetId: employeeUid,
        payload: {
            cascade: true,
        },
    });
