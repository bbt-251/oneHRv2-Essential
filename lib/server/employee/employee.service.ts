import { ManualApiError } from "@/lib/server/shared/errors";
import { authorizeRequest } from "@/lib/server/shared/auth/authorization";
import { SessionClaims } from "@/lib/server/shared/types";
import { EmployeeModel } from "@/lib/models/employee";
import { getCurrentInstanceKey } from "@/lib/server/shared/config";
import { serviceSuccess } from "@/lib/server/shared/result";
import { EmployeeServerRepository } from "@/lib/server/employee/employee.repository";
import {
    CreateDependentInput,
    CreateEmployeeInput,
    DependentListPayload,
    DependentRecordPayload,
    EmployeeListFilters,
    EmployeeListPayload,
    EmployeeRecordPayload,
    UpdateDependentInput,
    UpdateEmployeeInput,
} from "@/lib/server/employee/employee.types";

const getEmployeeOwnerUid = (employee: EmployeeModel): string | undefined =>
    employee.uid || undefined;
export class EmployeeService {
    static async listEmployees(filters: EmployeeListFilters, session: SessionClaims | null) {
        const instanceKey = getCurrentInstanceKey();
        const authorizedSession = authorizeRequest({
            session,
            instanceKey,
            resource: "employees",
            action: "read",
        });

        const employees = await EmployeeServerRepository.list(
            filters,
            instanceKey,
            authorizedSession,
        );

        return serviceSuccess<EmployeeListPayload>("Employees loaded successfully.", { employees });
    }

    static async getEmployeeByUid(uid: string, session: SessionClaims | null) {
        const result = await this.listEmployees({ uid }, session);
        const employee = result.data.employees[0] ?? null;
        if (!employee) {
            throw new ManualApiError(404, "EMPLOYEE_NOT_FOUND", "Employee was not found.");
        }

        return serviceSuccess<EmployeeRecordPayload>("Employee loaded successfully.", { employee });
    }

    static async createEmployee(payload: CreateEmployeeInput, session: SessionClaims | null) {
        const instanceKey = getCurrentInstanceKey();
        authorizeRequest({
            session,
            instanceKey,
            resource: "employees",
            action: "create",
            resourceOwnerUid: payload.uid,
        });

        const employee = await EmployeeServerRepository.create(payload, instanceKey);
        return serviceSuccess<EmployeeRecordPayload>("Employee created successfully.", {
            employee,
        });
    }

    static async updateEmployee(payload: UpdateEmployeeInput, session: SessionClaims | null) {
        const instanceKey = getCurrentInstanceKey();
        authorizeRequest({
            session,
            instanceKey,
            resource: "employees",
            action: "update",
            resourceOwnerUid: payload.uid,
        });

        const employee = await EmployeeServerRepository.update(payload, instanceKey);
        if (!employee) {
            throw new ManualApiError(404, "EMPLOYEE_NOT_FOUND", "Employee could not be updated.");
        }

        return serviceSuccess<EmployeeRecordPayload>("Employee updated successfully.", {
            employee,
        });
    }

    static async batchUpdateEmployees(
        employees: (Partial<EmployeeModel> & { id: string })[],
        session: SessionClaims | null,
    ) {
        const instanceKey = getCurrentInstanceKey();
        authorizeRequest({
            session,
            instanceKey,
            resource: "employees",
            action: "update",
        });

        await EmployeeServerRepository.batchUpdate(employees, instanceKey);
        return serviceSuccess("Employees updated successfully.", { success: true });
    }

    static async appendClaimedOvertime(
        employeeDocIds: string[],
        overtimeRequestId: string,
        session: SessionClaims | null,
    ) {
        const instanceKey = getCurrentInstanceKey();
        authorizeRequest({
            session,
            instanceKey,
            resource: "employees",
            action: "update",
        });

        await EmployeeServerRepository.appendClaimedOvertime(
            employeeDocIds,
            overtimeRequestId,
            instanceKey,
        );
        return serviceSuccess("Claimed overtime appended successfully.", { success: true });
    }

    static async deleteEmployee(
        id: string,
        session: SessionClaims | null,
        options?: { cascade?: boolean },
    ) {
        const instanceKey = getCurrentInstanceKey();
        const readResult = await this.listEmployees({ id }, session);
        const employee = readResult.data.employees[0] ?? null;

        authorizeRequest({
            session,
            instanceKey,
            resource: "employees",
            action: "delete",
            resourceOwnerUid: employee ? getEmployeeOwnerUid(employee) : undefined,
        });

        if (options?.cascade) {
            const errors = await EmployeeServerRepository.cascadeDelete(id, instanceKey);
            return serviceSuccess("Employee cascade delete completed.", {
                success: errors.length === 0,
                errors,
            });
        }

        await EmployeeServerRepository.delete(id, instanceKey);
        return serviceSuccess("Employee deleted successfully.", { deleted: true });
    }

    static async listDependents(employeeId: string, session: SessionClaims | null) {
        const instanceKey = getCurrentInstanceKey();
        const authorizedSession = authorizeRequest({
            session,
            instanceKey,
            resource: "dependents",
            action: "read",
            resourceOwnerUid: employeeId,
        });

        const dependents = await EmployeeServerRepository.listDependents(
            employeeId,
            instanceKey,
            authorizedSession,
        );

        return serviceSuccess<DependentListPayload>("Dependents loaded successfully.", {
            dependents,
        });
    }

    static async createDependent(payload: CreateDependentInput, session: SessionClaims | null) {
        const instanceKey = getCurrentInstanceKey();
        authorizeRequest({
            session,
            instanceKey,
            resource: "dependents",
            action: "create",
            resourceOwnerUid: payload.relatedTo,
        });

        const dependent = await EmployeeServerRepository.createDependent(payload, instanceKey);
        return serviceSuccess<DependentRecordPayload>("Dependent created successfully.", {
            dependent,
        });
    }

    static async updateDependent(payload: UpdateDependentInput, session: SessionClaims | null) {
        const instanceKey = getCurrentInstanceKey();
        authorizeRequest({
            session,
            instanceKey,
            resource: "dependents",
            action: "update",
            resourceOwnerUid: payload.relatedTo,
        });

        const dependent = await EmployeeServerRepository.updateDependent(payload, instanceKey);
        if (!dependent) {
            throw new ManualApiError(404, "DEPENDENT_NOT_FOUND", "Dependent could not be updated.");
        }

        return serviceSuccess<DependentRecordPayload>("Dependent updated successfully.", {
            dependent,
        });
    }

    static async deleteDependent(
        id: string,
        relatedTo: string | undefined,
        session: SessionClaims | null,
    ) {
        const instanceKey = getCurrentInstanceKey();
        authorizeRequest({
            session,
            instanceKey,
            resource: "dependents",
            action: "delete",
            resourceOwnerUid: relatedTo,
        });

        await EmployeeServerRepository.deleteDependent(id, instanceKey);
        return serviceSuccess("Dependent deleted successfully.", { deleted: true });
    }
}
