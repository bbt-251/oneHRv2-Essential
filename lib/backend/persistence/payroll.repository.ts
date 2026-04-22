import { inMemoryStore } from "@/lib/backend/persistence/in-memory-store";
import { EmployeeCompensationModel } from "@/lib/models/employeeCompensation";
import { EmployeeLoanModel } from "@/lib/models/employeeLoan";
import { PayrollSettingsModel } from "@/lib/models/hr-settings";
import {
    getInMemoryDocumentByPath,
    listInMemoryCollection,
    stripUndefined,
} from "@/lib/backend/persistence/in-memory-utils";
import { publishRealtimeResource } from "@/lib/backend/persistence/realtime-publish";

const loansCollection = "employeeLoan";
const compensationCollection = "employeeCompensation";
const payrollCollection = "payrollSettings";

export async function listLoans(employeeUid?: string): Promise<EmployeeLoanModel[]> {
    return employeeUid
        ? listInMemoryCollection<EmployeeLoanModel>(loansCollection, [
            { kind: "where", field: "employeeUid", op: "==", value: employeeUid },
        ])
        : listInMemoryCollection<EmployeeLoanModel>(loansCollection);
}

export async function createLoanRecord(
    data: Omit<EmployeeLoanModel, "id">,
): Promise<EmployeeLoanModel> {
    const created = inMemoryStore.createDocument(loansCollection, data as Record<string, unknown>);
    const loan = { ...data, id: created.id } as EmployeeLoanModel;
    inMemoryStore.setDocument(`${loansCollection}/${created.id}`, loan as Record<string, unknown>);
    await publishRealtimeResource({
        resource: "employeeLoans",
        resourceId: created.id,
        payload: await listLoans(),
        resourceOwnerUid: loan.employeeUid,
    });
    return loan;
}

export async function updateLoanRecord(
    id: string,
    data: Partial<EmployeeLoanModel>,
): Promise<EmployeeLoanModel | null> {
    const current = await getInMemoryDocumentByPath<EmployeeLoanModel>(`${loansCollection}/${id}`);
    inMemoryStore.updateDocument(
        `${loansCollection}/${id}`,
        stripUndefined(data as Record<string, unknown>),
    );
    const updated = await getInMemoryDocumentByPath<EmployeeLoanModel>(`${loansCollection}/${id}`);
    await publishRealtimeResource({
        resource: "employeeLoans",
        resourceId: id,
        payload: await listLoans(),
        resourceOwnerUid: updated?.employeeUid ?? current?.employeeUid,
    });
    return updated;
}

export async function deleteLoanRecord(id: string): Promise<boolean> {
    const current = await getInMemoryDocumentByPath<EmployeeLoanModel>(`${loansCollection}/${id}`);
    inMemoryStore.deleteDocument(`${loansCollection}/${id}`);
    await publishRealtimeResource({
        resource: "employeeLoans",
        resourceId: id,
        payload: await listLoans(),
        resourceOwnerUid: current?.employeeUid,
    });
    return true;
}

export async function listCompensation(employeeUid?: string): Promise<EmployeeCompensationModel[]> {
    const all = listInMemoryCollection<EmployeeCompensationModel>(compensationCollection);

    if (!employeeUid) {
        return all;
    }

    return all.filter(item => item.employees.includes(employeeUid));
}

export async function createCompensationRecord(
    data: Omit<EmployeeCompensationModel, "id">,
): Promise<EmployeeCompensationModel> {
    const created = inMemoryStore.createDocument(
        compensationCollection,
        data as Record<string, unknown>,
    );
    const compensation = { ...data, id: created.id } as EmployeeCompensationModel;
    inMemoryStore.setDocument(
        `${compensationCollection}/${created.id}`,
        compensation as Record<string, unknown>,
    );
    await publishRealtimeResource({
        resource: "compensations",
        resourceId: created.id,
        payload: await listCompensation(),
    });
    return compensation;
}

export async function updateCompensationRecord(
    id: string,
    data: Partial<EmployeeCompensationModel>,
): Promise<EmployeeCompensationModel | null> {
    inMemoryStore.updateDocument(
        `${compensationCollection}/${id}`,
        stripUndefined(data as Record<string, unknown>),
    );
    const updated = await getInMemoryDocumentByPath<EmployeeCompensationModel>(
        `${compensationCollection}/${id}`,
    );
    await publishRealtimeResource({
        resource: "compensations",
        resourceId: id,
        payload: await listCompensation(),
    });
    return updated;
}

export async function deleteCompensationRecord(id: string): Promise<boolean> {
    inMemoryStore.deleteDocument(`${compensationCollection}/${id}`);
    await publishRealtimeResource({
        resource: "compensations",
        resourceId: id,
        payload: await listCompensation(),
    });
    return true;
}

export function getPayrollSettingsRecord(instanceKey: string): PayrollSettingsModel {
    const settings = inMemoryStore.getDocument(`${payrollCollection}/${instanceKey}`);

    return settings
        ? ({ id: settings.id, ...settings.data } as PayrollSettingsModel)
        : {
            id: instanceKey,
        };
}

export function upsertPayrollSettingsRecord(
    instanceKey: string,
    payload: Partial<PayrollSettingsModel>,
): PayrollSettingsModel {
    const current = getPayrollSettingsRecord(instanceKey);
    const nextSettings = {
        ...current,
        ...payload,
        id: instanceKey,
    };

    inMemoryStore.setDocument(
        `${payrollCollection}/${instanceKey}`,
        nextSettings as Record<string, unknown>,
    );

    return nextSettings;
}

export function applyLoanPaymentRecord(loanId: string, amount: number): EmployeeLoanModel | null {
    const existingLoan = inMemoryStore.getDocument(`${loansCollection}/${loanId}`);

    if (!existingLoan) {
        return null;
    }

    const updatedLoan: EmployeeLoanModel = {
        ...(existingLoan.data as unknown as EmployeeLoanModel),
        id: existingLoan.id,
        loanTotalAmount: Math.max(
            Number((existingLoan.data as Record<string, unknown>).loanTotalAmount ?? 0) - amount,
            0,
        ),
    };

    inMemoryStore.setDocument(
        `${loansCollection}/${loanId}`,
        updatedLoan as unknown as Record<string, unknown>,
    );

    return updatedLoan;
}
