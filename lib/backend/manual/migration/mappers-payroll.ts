import { buildMigrationMetadata } from "@/lib/backend/manual/migration/metadata";
import {
    payrollRecordSchema,
    type FirestoreExportDocument,
    type PayrollRecord,
} from "@/lib/backend/manual/migration/types";

const asString = (value: unknown): string | undefined => (typeof value === "string" && value.trim() ? value : undefined);
const asNumber = (value: unknown): number => (typeof value === "number" && Number.isFinite(value) ? value : 0);

export const mapPayrollDocument = (document: FirestoreExportDocument, tenantId: string): PayrollRecord => {
    const baseSalary = asNumber(document.fields.baseSalary);
    const allowances = asNumber(document.fields.allowances);
    const deductions = asNumber(document.fields.deductions);

    const payload = {
        tenantId,
        employeeUid: asString(document.fields.employeeUid) ?? "unknown",
        payrollMonth: asString(document.fields.payrollMonth) ?? "1970-01",
        baseSalary,
        allowances,
        deductions,
        netPay: baseSalary + allowances - deductions,
        migration: buildMigrationMetadata(document.id, document.fields),
    };

    return payrollRecordSchema.parse(payload);
};
