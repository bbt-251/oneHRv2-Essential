import { Action, SessionClaims } from "@/lib/backend/core/types";
import { ManualApiError } from "@/lib/backend/core/errors";
import {
    listEmployeesForSession,
    listDependentsForSession,
    mutateDependent,
    mutateEmployee,
    resolveDependentOwnerUid,
    resolveEmployeeOwnerUid,
} from "@/lib/backend/services/employee.service";
import {
    listAttendancesForSession,
    listAttendanceLogicForSession,
    listFlexibilityParametersForSession,
    listLateComersForSession,
    listOvertimeRequestsForSession,
    listRequestModificationsForSession,
    mutateAttendance,
    mutateAttendanceLogic,
    mutateFlexibilityParameter,
    mutateLateComer,
    mutateOvertimeRequest,
    mutateRequestModification,
    resolveAttendanceOwnerUid,
} from "@/lib/backend/services/attendance.service";
import {
    listLeaveRequestsForSession,
    mutateLeaveRequest,
    resolveLeaveOwnerUid,
} from "@/lib/backend/services/leave.service";
import {
    listCompensationsForSession,
    listLoansForSession,
    listPayrollSettings,
    mutateCompensation,
    mutateLoan,
    mutatePayrollSettings,
    resolvePayrollOwnerUid,
} from "@/lib/backend/services/payroll.service";
import {
    resolveProjectOwnerUid,
    updateProjectAllocations,
} from "@/lib/backend/services/project.service";
import { mutateNotification } from "@/lib/backend/services/notification.service";
import {
    isHrSettingsResource,
    listHrSettingsResourceForSession,
    mutateHrSettingsResource,
} from "@/lib/backend/services/hr-settings-resource.service";
import { CompactDataResource } from "@/lib/backend/services/resource-types";

interface QueryInput {
    resource: CompactDataResource;
    instanceKey: string;
    session: SessionClaims;
    filters?: Record<string, unknown>;
}

interface MutationInput {
    resource: CompactDataResource;
    action: Exclude<Action, "read">;
    instanceKey: string;
    payload?: Record<string, unknown>;
    targetId?: string;
}

export type { CompactDataResource } from "@/lib/backend/services/resource-types";

export const queryCompactResource = async ({
    resource,
    instanceKey,
    session,
    filters,
}: QueryInput): Promise<Record<string, unknown>> => {
    if (isHrSettingsResource(resource)) {
        return listHrSettingsResourceForSession({
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
            return listAttendancesForSession({ instanceKey, session, filters });
        case "requestModifications":
            return listRequestModificationsForSession({ instanceKey, session, filters });
        case "lateComers":
            return listLateComersForSession({ instanceKey, session, filters });
        case "leaveManagements":
            return listLeaveRequestsForSession({ instanceKey, session, filters });
        case "projects":
            throw new ManualApiError(
                400,
                "UNSUPPORTED_QUERY",
                "Projects should be read through the app data stream.",
            );
        case "overtimeRequests":
            return listOvertimeRequestsForSession({ instanceKey, session, filters });
        case "attendanceLogic":
            return listAttendanceLogicForSession({ instanceKey, session });
        case "flexibilityParameter":
            return listFlexibilityParametersForSession({ instanceKey, session });
        case "compensations":
            return listCompensationsForSession({ instanceKey, session, filters });
        case "employeeLoans":
            return listLoansForSession({ instanceKey, session, filters });
        case "payrollSettings":
            return listPayrollSettings(instanceKey);
        default:
            throw new ManualApiError(400, "UNKNOWN_RESOURCE", "Unsupported data resource.");
    }
};

export const mutateCompactResource = async ({
    resource,
    action,
    instanceKey,
    payload,
    targetId,
}: MutationInput): Promise<Record<string, unknown>> => {
    if (isHrSettingsResource(resource)) {
        return mutateHrSettingsResource({
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
            return mutateAttendance({ action, instanceKey, payload, targetId });
        case "notifications":
            return mutateNotification({ action, instanceKey, payload, targetId });
        case "requestModifications":
            return mutateRequestModification({ action, payload, targetId });
        case "lateComers":
            return mutateLateComer({ action, payload, targetId });
        case "leaveManagements":
            return mutateLeaveRequest({ action, instanceKey, payload, targetId });
        case "projects":
            if (action === "update") {
                return updateProjectAllocations({
                    instanceKey,
                    payload,
                    targetId,
                });
            }
            break;
        case "overtimeRequests":
            return mutateOvertimeRequest({ action, instanceKey, payload, targetId });
        case "attendanceLogic":
            return mutateAttendanceLogic({ action, payload, targetId });
        case "flexibilityParameter":
            return mutateFlexibilityParameter({ action, payload, targetId });
        case "compensations":
            return mutateCompensation({ action, payload, targetId });
        case "employeeLoans":
            return mutateLoan({ action, instanceKey, payload, targetId });
        case "payrollSettings":
            if (action === "create" || action === "update") {
                return mutatePayrollSettings({ instanceKey, payload });
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
};

export const resolveResourceOwnerUid = async ({
    resource,
    payload,
    targetId,
}: {
    resource: CompactDataResource;
    payload?: Record<string, unknown>;
    targetId?: string;
}): Promise<string | undefined> => {
    const input = payload ?? {};

    switch (resource) {
        case "employees":
            return resolveEmployeeOwnerUid({ payload: input, targetId });
        case "dependents":
            return resolveDependentOwnerUid({ payload: input, targetId });
        case "notifications":
            return typeof input.uid === "string" ? input.uid : undefined;
        case "attendances":
        case "overtimeRequests":
        case "requestModifications":
        case "lateComers":
            return resolveAttendanceOwnerUid(input);
        case "leaveManagements":
            return resolveLeaveOwnerUid(input);
        case "employeeLoans":
        case "compensations":
            return resolvePayrollOwnerUid(input);
        case "projects":
            return resolveProjectOwnerUid(input);
        case "attendanceLogic":
        case "flexibilityParameter":
        case "payrollSettings":
            return undefined;
        default:
            return undefined;
    }
};
