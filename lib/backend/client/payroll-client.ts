import { mutateCompactData } from "@/lib/backend/client/data-client";
import { EmployeeCompensationModel } from "@/lib/models/employeeCompensation";
import { EmployeeLoanModel } from "@/lib/models/employeeLoan";

export const createCompensationWithBackend = (payload: Omit<EmployeeCompensationModel, "id">) =>
    mutateCompactData<{ compensation: EmployeeCompensationModel }>({
        resource: "compensations",
        action: "create",
        payload: payload as Record<string, unknown>,
    });

export const updateCompensationWithBackend = (
    payload: Partial<EmployeeCompensationModel> & { id: string },
) =>
    mutateCompactData<{ compensation: EmployeeCompensationModel | null }>({
        resource: "compensations",
        action: "update",
        targetId: payload.id,
        payload: payload as Record<string, unknown>,
    });

export const deleteCompensationWithBackend = (compensationId: string) =>
    mutateCompactData<{ deleted: true }>({
        resource: "compensations",
        action: "delete",
        targetId: compensationId,
    });

export const createLoanWithBackend = (payload: Omit<EmployeeLoanModel, "id">) =>
    mutateCompactData<{ loan: EmployeeLoanModel }>({
        resource: "employeeLoans",
        action: "create",
        payload: payload as Record<string, unknown>,
    });

export const updateLoanWithBackend = (payload: Partial<EmployeeLoanModel> & { id: string }) =>
    mutateCompactData<{ loan: EmployeeLoanModel | null }>({
        resource: "employeeLoans",
        action: "update",
        targetId: payload.id,
        payload: payload as Record<string, unknown>,
    });

export const deleteLoanWithBackend = (loanId: string) =>
    mutateCompactData<{ deleted: true }>({
        resource: "employeeLoans",
        action: "delete",
        targetId: loanId,
    });
