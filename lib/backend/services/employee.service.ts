import {
    appendClaimedOvertime,
    batchUpdateEmployees,
    createDependentRecord,
    createEmployeeRecord,
    deleteDependentRecord,
    deleteEmployeeCascadeRecords,
    deleteEmployeeRecord,
    getDependentById,
    getEmployeeById,
    listDependentsByEmployee,
    listEmployees,
    updateDependentRecord,
    updateEmployeeRecord,
} from "@/lib/backend/persistence/employee.repository";
import { SessionClaims } from "@/lib/backend/core/types";
import { ManualApiError } from "@/lib/backend/core/errors";
import { DependentModel } from "@/lib/models/dependent";
import { EmployeeModel } from "@/lib/models/employee";
import {
    filterDocumentsForSession,
    readString,
    requirePayload,
} from "@/lib/backend/services/service-helpers";

export const listEmployeesForSession = async ({
    instanceKey,
    session,
    filters,
}: {
    instanceKey: string;
    session: SessionClaims;
    filters?: Record<string, unknown>;
}): Promise<Record<string, unknown>> => {
    const employees = await listEmployees({
        id: readString(filters?.id),
        department: readString(filters?.department),
        uid: readString(filters?.uid),
        companyEmail: readString(filters?.companyEmail),
        personalEmail: readString(filters?.personalEmail),
        uids: Array.isArray(filters?.uids)
            ? (filters?.uids as string[]).filter(Boolean)
            : undefined,
    });

    return {
        employees: filterDocumentsForSession(employees, "employees", instanceKey, session),
    };
};

export const listDependentsForSession = async ({
    instanceKey,
    session,
    filters,
}: {
    instanceKey: string;
    session: SessionClaims;
    filters?: Record<string, unknown>;
}): Promise<Record<string, unknown>> => {
    const employeeId = readString(filters?.employeeId);
    if (!employeeId) {
        throw new ManualApiError(
            400,
            "EMPLOYEE_ID_REQUIRED",
            "employeeId is required for dependents query.",
        );
    }

    const dependents = await listDependentsByEmployee(employeeId);
    return {
        dependents: filterDocumentsForSession(dependents, "dependents", instanceKey, session),
    };
};

export const mutateEmployee = async ({
    action,
    payload,
    targetId,
}: {
    action: "create" | "update" | "delete";
    payload?: Record<string, unknown>;
    targetId?: string;
}): Promise<Record<string, unknown>> => {
    if (action === "create") {
        return {
            employee: await createEmployeeRecord(
                requirePayload(payload) as Omit<EmployeeModel, "id">,
            ),
        };
    }

    if (
        action === "update" &&
        Array.isArray(payload?.employees) &&
        payload.employees.every(
            employee =>
                employee &&
                typeof employee === "object" &&
                "id" in employee &&
                typeof employee.id === "string",
        )
    ) {
        await batchUpdateEmployees(
            payload.employees as (Partial<EmployeeModel> & { id: string })[],
        );
        return { success: true };
    }

    if (
        action === "update" &&
        payload?.appendClaimedOvertime === true &&
        Array.isArray(payload.employeeDocIds) &&
        typeof payload.overtimeRequestId === "string"
    ) {
        await appendClaimedOvertime(payload.employeeDocIds as string[], payload.overtimeRequestId);
        return { success: true };
    }

    if (!targetId) {
        throw new ManualApiError(400, "TARGET_ID_REQUIRED", "targetId is required.");
    }

    if (action === "update") {
        return {
            employee: await updateEmployeeRecord(
                targetId,
                requirePayload(payload) as Partial<EmployeeModel>,
            ),
        };
    }

    if (payload?.cascade === true) {
        const errors = await deleteEmployeeCascadeRecords(targetId);
        return {
            success: errors.length === 0,
            errors,
        };
    }

    await deleteEmployeeRecord(targetId);
    return { deleted: true };
};

export const mutateDependent = async ({
    action,
    payload,
    targetId,
}: {
    action: "create" | "update" | "delete";
    payload?: Record<string, unknown>;
    targetId?: string;
}): Promise<Record<string, unknown>> => {
    if (action === "create") {
        return {
            dependent: await createDependentRecord(
                requirePayload(payload) as Omit<DependentModel, "id">,
            ),
        };
    }

    if (!targetId) {
        throw new ManualApiError(400, "TARGET_ID_REQUIRED", "targetId is required.");
    }

    if (action === "update") {
        return {
            dependent: await updateDependentRecord(
                targetId,
                requirePayload(payload) as Partial<DependentModel>,
            ),
        };
    }

    await deleteDependentRecord(targetId);
    return { deleted: true };
};

export const resolveEmployeeOwnerUid = async ({
    payload,
    targetId,
}: {
    payload?: Record<string, unknown>;
    targetId?: string;
}): Promise<string | undefined> => {
    if (typeof payload?.uid === "string") {
        return payload.uid;
    }

    if (targetId) {
        return (await getEmployeeById(targetId))?.uid;
    }

    return undefined;
};

export const resolveDependentOwnerUid = async ({
    payload,
    targetId,
}: {
    payload?: Record<string, unknown>;
    targetId?: string;
}): Promise<string | undefined> => {
    if (typeof payload?.relatedTo === "string") {
        return payload.relatedTo;
    }

    if (targetId) {
        return (await getDependentById(targetId))?.relatedTo;
    }

    return undefined;
};

export const batchMutateEmployees = async ({
    employees,
}: {
    employees: (Partial<EmployeeModel> & { id: string })[];
}): Promise<Record<string, unknown>> => {
    await batchUpdateEmployees(employees);
    return { success: true };
};

export const appendEmployeeClaimedOvertime = async ({
    employeeDocIds,
    overtimeRequestId,
}: {
    employeeDocIds: string[];
    overtimeRequestId: string;
}): Promise<Record<string, unknown>> => {
    await appendClaimedOvertime(employeeDocIds, overtimeRequestId);
    return { success: true };
};

export const cascadeDeleteEmployee = async ({
    employeeUid,
}: {
    employeeUid: string;
}): Promise<Record<string, unknown>> => {
    const errors = await deleteEmployeeCascadeRecords(employeeUid);
    return {
        success: errors.length === 0,
        errors,
    };
};
