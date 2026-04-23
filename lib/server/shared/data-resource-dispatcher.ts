import { ManualApiError } from "@/lib/server/shared/errors";
import { SessionClaims } from "@/lib/server/shared/types";
import { CompactDataResource } from "@/lib/server/shared/resource-types";
import {
    filterDocumentsForSession,
    readString,
    requirePayload,
} from "@/lib/server/shared/service-helpers";
import {
    isSettingsResource,
    listSettingsResourceForSession,
    mutateSettingsResource,
} from "@/lib/server/shared/hr-settings-resource";
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
} from "@/lib/server/employee/employee.repository";
import {
    listLeaveRequestsForSession,
    mutateLeaveRequest,
    resolveLeaveOwnerUid,
} from "@/lib/server/leave/leave.repository";
import { AttendanceServerRepository } from "@/lib/server/attendance/attendance.repository";
import { NotificationServerRepository } from "@/lib/server/notifications/notification.repository";
import { PayrollServerRepository } from "@/lib/server/payroll/payroll.repository";
import { ProjectServerRepository } from "@/lib/server/projects/project.repository";
import { DependentModel } from "@/lib/models/dependent";
import { EmployeeModel } from "@/lib/models/employee";

interface QueryInput {
    resource: CompactDataResource;
    instanceKey: string;
    session: SessionClaims;
    filters?: Record<string, unknown>;
}

interface MutationInput {
    resource: CompactDataResource;
    action: "create" | "update" | "delete";
    instanceKey: string;
    payload?: Record<string, unknown>;
    targetId?: string;
}

const listEmployeesForSession = async ({
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
        uids: Array.isArray(filters?.uids) ? (filters.uids as string[]).filter(Boolean) : undefined,
    });

    return {
        employees: filterDocumentsForSession(employees, "employees", instanceKey, session),
    };
};

const listDependentsForSession = async ({
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

const mutateEmployee = async ({
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

const mutateDependent = async ({
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

const resolveEmployeeOwnerUid = async ({
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

const resolveDependentOwnerUid = async ({
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

export class DataResourceDispatcher {
    static async query({
        resource,
        instanceKey,
        session,
        filters,
    }: QueryInput): Promise<Record<string, unknown>> {
        if (isSettingsResource(resource)) {
            return listSettingsResourceForSession({
                resource,
                instanceKey,
                session,
                filters,
            });
        }

        switch (resource) {
            case "employees":
                return listEmployeesForSession({ instanceKey, session, filters });
            case "dependents":
                return listDependentsForSession({ instanceKey, session, filters });
            case "attendances":
                return {
                    attendances: await AttendanceServerRepository.list(
                        filters,
                        instanceKey,
                        session,
                    ),
                };
            case "requestModifications":
                return {
                    requestModifications: await AttendanceServerRepository.listRequestModifications(
                        filters ?? {},
                        instanceKey,
                        session,
                    ),
                };
            case "lateComers":
                return {
                    lateComers: await AttendanceServerRepository.listLateComers(
                        filters ?? {},
                        instanceKey,
                        session,
                    ),
                };
            case "leaveManagements":
                return listLeaveRequestsForSession({ instanceKey, session, filters });
            case "projects":
                return ProjectServerRepository.list(filters, instanceKey, session);
            case "notifications":
                return NotificationServerRepository.list(filters, instanceKey, session);
            case "overtimeRequests":
                return {
                    overtimeRequests: await AttendanceServerRepository.listOvertimeRequests(
                        filters ?? {},
                        instanceKey,
                        session,
                    ),
                };
            case "compensations":
                return PayrollServerRepository.listCompensations(filters, instanceKey, session);
            case "employeeLoans":
                return PayrollServerRepository.listLoans(filters, instanceKey, session);
            case "payrollSettings":
                return PayrollServerRepository.listSettings(instanceKey);
            default:
                throw new ManualApiError(400, "UNKNOWN_RESOURCE", "Unsupported data resource.");
        }
    }

    static async mutate({
        resource,
        action,
        instanceKey,
        payload,
        targetId,
    }: MutationInput): Promise<Record<string, unknown>> {
        if (isSettingsResource(resource)) {
            return mutateSettingsResource({
                resource,
                action,
                instanceKey,
                payload,
                targetId,
            });
        }

        switch (resource) {
            case "employees":
                return mutateEmployee({ action, payload, targetId });
            case "dependents":
                return mutateDependent({ action, payload, targetId });
            case "attendances":
                if (action === "create") {
                    return {
                        attendance: await AttendanceServerRepository.create(
                            payload as never,
                            instanceKey,
                        ),
                    };
                }
                if (action === "update" && targetId) {
                    return {
                        attendance: await AttendanceServerRepository.update(
                            { id: targetId, ...(payload ?? {}) } as never,
                            instanceKey,
                        ),
                    };
                }
                if (action === "delete" && targetId) {
                    await AttendanceServerRepository.delete(targetId, instanceKey);
                    return { deleted: true };
                }
                break;
            case "notifications":
                if (action === "create") {
                    return NotificationServerRepository.create(payload ?? {}, instanceKey);
                }
                break;
            case "requestModifications":
                if (action === "create") {
                    return {
                        requestModification:
                            await AttendanceServerRepository.createRequestModification(
                                payload as never,
                                instanceKey,
                            ),
                    };
                }
                if (action === "update" && targetId) {
                    return {
                        requestModification:
                            await AttendanceServerRepository.updateRequestModification(
                                { id: targetId, ...(payload ?? {}) } as never,
                                instanceKey,
                            ),
                    };
                }
                break;
            case "lateComers":
                if (action === "create") {
                    return {
                        lateComer: await AttendanceServerRepository.createLateComer(
                            payload as never,
                            instanceKey,
                        ),
                    };
                }
                break;
            case "leaveManagements":
                return mutateLeaveRequest({ action, instanceKey, payload, targetId });
            case "projects":
                if (action === "update") {
                    return ProjectServerRepository.updateAllocations(
                        ProjectServerRepository.parseUpdateInput(
                            ProjectServerRepository.requireTargetId(targetId),
                            payload ?? {},
                        ),
                        instanceKey,
                    );
                }
                break;
            case "overtimeRequests":
                if (action === "create") {
                    return {
                        overtimeRequest: await AttendanceServerRepository.createOvertimeRequest(
                            payload as never,
                            instanceKey,
                        ),
                    };
                }
                if (action === "update" && targetId) {
                    return {
                        overtimeRequest: await AttendanceServerRepository.updateOvertimeRequest(
                            { id: targetId, ...(payload ?? {}) } as never,
                            instanceKey,
                        ),
                    };
                }
                if (action === "delete" && targetId) {
                    await AttendanceServerRepository.deleteOvertimeRequest(targetId, instanceKey);
                    return { deleted: true };
                }
                break;
            case "compensations":
                if (action === "create") {
                    return PayrollServerRepository.createCompensation(payload ?? {});
                }
                if (action === "update") {
                    return PayrollServerRepository.updateCompensation(
                        PayrollServerRepository.requireTargetId(targetId),
                        payload ?? {},
                    );
                }
                return PayrollServerRepository.deleteCompensation(
                    PayrollServerRepository.requireTargetId(targetId),
                );
            case "employeeLoans":
                if (action === "create") {
                    return PayrollServerRepository.createLoan(instanceKey, payload ?? {});
                }
                if (action === "update") {
                    return PayrollServerRepository.updateLoan(
                        instanceKey,
                        PayrollServerRepository.requireTargetId(targetId),
                        payload ?? {},
                    );
                }
                return PayrollServerRepository.deleteLoan(
                    instanceKey,
                    PayrollServerRepository.requireTargetId(targetId),
                );
            case "payrollSettings":
                if (action === "create" || action === "update") {
                    return PayrollServerRepository.updateSettings(instanceKey, payload ?? {});
                }
                break;
            default:
                break;
        }

        throw new ManualApiError(
            400,
            "UNSUPPORTED_MUTATION",
            `Unsupported ${action} operation for resource ${resource}.`,
        );
    }

    static async resolveOwnerUid({
        resource,
        payload,
        targetId,
    }: {
        resource: CompactDataResource;
        payload?: Record<string, unknown>;
        targetId?: string;
    }): Promise<string | undefined> {
        const input = payload ?? {};

        switch (resource) {
            case "employees":
                return resolveEmployeeOwnerUid({ payload: input, targetId });
            case "dependents":
                return resolveDependentOwnerUid({ payload: input, targetId });
            case "notifications":
                return NotificationServerRepository.resolveOwnerUid(input);
            case "attendances":
            case "overtimeRequests":
            case "requestModifications":
            case "lateComers":
                return AttendanceServerRepository.resolveOwnerUid(input);
            case "leaveManagements":
                return resolveLeaveOwnerUid(input);
            case "employeeLoans":
            case "compensations":
                return PayrollServerRepository.resolveOwnerUid(input);
            case "projects":
                return ProjectServerRepository.resolveOwnerUid(input);
            case "attendanceLogic":
            case "flexibilityParameter":
            case "payrollSettings":
                return undefined;
            default:
                return undefined;
        }
    }
}
