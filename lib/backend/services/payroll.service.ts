import {
    applyLoanPaymentRecord,
    createCompensationRecord,
    createLoanRecord,
    deleteCompensationRecord,
    deleteLoanRecord,
    getPayrollSettingsRecord,
    listCompensation,
    listLoans,
    upsertPayrollSettingsRecord,
    updateCompensationRecord,
    updateLoanRecord,
} from "@/lib/backend/persistence/payroll.repository";
import { SessionClaims } from "@/lib/backend/core/types";
import { ManualApiError } from "@/lib/backend/core/errors";
import { EmployeeCompensationModel } from "@/lib/models/employeeCompensation";
import { EmployeeLoanModel } from "@/lib/models/employeeLoan";
import {
    filterDocumentsForSession,
    readString,
    requirePayload,
} from "@/lib/backend/services/service-helpers";

export const listCompensationsForSession = async ({
    instanceKey,
    session,
    filters,
}: {
    instanceKey: string;
    session: SessionClaims;
    filters?: Record<string, unknown>;
}): Promise<Record<string, unknown>> => {
    const compensations = await listCompensation(readString(filters?.employeeUid));

    return {
        compensations: filterDocumentsForSession(
            compensations,
            "compensations",
            instanceKey,
            session,
        ),
    };
};

export const listLoansForSession = async ({
    instanceKey,
    session,
    filters,
}: {
    instanceKey: string;
    session: SessionClaims;
    filters?: Record<string, unknown>;
}): Promise<Record<string, unknown>> => {
    const loans = await listLoans(readString(filters?.employeeUid));

    return {
        employeeLoans: filterDocumentsForSession(loans, "employeeLoans", instanceKey, session),
    };
};

export const listPayrollSettings = (instanceKey: string): Record<string, unknown> => ({
    payrollSettings: [getPayrollSettingsRecord(instanceKey)],
});

export const mutateCompensation = async ({
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
            compensation: await createCompensationRecord(
                requirePayload(payload) as Omit<EmployeeCompensationModel, "id">,
            ),
        };
    }

    if (!targetId) {
        throw new ManualApiError(400, "TARGET_ID_REQUIRED", "targetId is required.");
    }

    if (action === "update") {
        return {
            compensation: await updateCompensationRecord(
                targetId,
                requirePayload(payload) as Partial<EmployeeCompensationModel>,
            ),
        };
    }

    await deleteCompensationRecord(targetId);
    return { deleted: true };
};

export const mutateLoan = async ({
    action,
    instanceKey: _instanceKey,
    payload,
    targetId,
}: {
    action: "create" | "update" | "delete";
    instanceKey: string;
    payload?: Record<string, unknown>;
    targetId?: string;
}): Promise<Record<string, unknown>> => {
    if (action === "create") {
        return {
            loan: await createLoanRecord(requirePayload(payload) as Omit<EmployeeLoanModel, "id">),
        };
    }

    if (!targetId) {
        throw new ManualApiError(400, "TARGET_ID_REQUIRED", "targetId is required.");
    }

    const input = requirePayload(payload);
    if (action === "update") {
        if (typeof input.amount === "number") {
            return {
                loan: applyLoanPaymentRecord(targetId, input.amount),
            };
        }

        return {
            loan: await updateLoanRecord(targetId, input as Partial<EmployeeLoanModel>),
        };
    }

    await deleteLoanRecord(targetId);
    return { deleted: true };
};

export const mutatePayrollSettings = ({
    instanceKey,
    payload,
}: {
    instanceKey: string;
    payload?: Record<string, unknown>;
}): Record<string, unknown> => ({
    payrollSettings: [upsertPayrollSettingsRecord(instanceKey, requirePayload(payload) as never)],
});

export const resolvePayrollOwnerUid = (payload?: Record<string, unknown>): string | undefined =>
    readString(payload?.employeeUid) ||
    (Array.isArray(payload?.employees) ? readString(payload.employees[0]) : undefined);
