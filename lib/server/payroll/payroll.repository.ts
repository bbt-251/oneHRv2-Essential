import { Filter, ObjectId, WithId } from "mongodb";
import { ManualApiError } from "@/lib/server/shared/errors";
import { SessionClaims } from "@/lib/server/shared/types";
import { getMongoCollection } from "@/lib/server/shared/db/mongo";
import { publishRealtimeResource } from "@/lib/server/shared/realtime/publish";
import {
    filterDocumentsForSession,
    readString,
    requirePayload,
} from "@/lib/server/shared/service-helpers";
import { EmployeeCompensationModel } from "@/lib/models/employeeCompensation";
import { EmployeeLoanModel } from "@/lib/models/employeeLoan";
import { PayrollSettingsModel } from "@/lib/models/hr-settings";

type StoredPayrollSettings = PayrollSettingsModel & {
    header?: string | null;
    footer?: string | null;
    signature?: string | null;
    stamp?: string | null;
    updatedAt?: string;
};

interface LoanDocument extends Omit<EmployeeLoanModel, "id"> {
    _id: string;
}

interface CompensationDocument extends Omit<EmployeeCompensationModel, "id"> {
    _id: string;
}

interface PayrollSettingsDocument extends Omit<StoredPayrollSettings, "id"> {
    _id: string;
}

const loansCollection = "employeeLoan";
const compensationCollection = "employeeCompensation";
const payrollCollection = "payrollSettings";

const toLoanModel = (document: WithId<LoanDocument>): EmployeeLoanModel => ({
    id: document._id,
    timestamp: document.timestamp,
    employeeUid: document.employeeUid,
    loanType: document.loanType,
    loanAmount: document.loanAmount,
    loanTotalAmount: document.loanTotalAmount,
    duration: document.duration,
    monthlyRepaymentAmount: document.monthlyRepaymentAmount,
    loanRepaymentStartMonth: document.loanRepaymentStartMonth,
    loanRepaymentEndMonth: document.loanRepaymentEndMonth,
    loanStatus: document.loanStatus,
    months: document.months,
});

const toCompensationModel = (
    document: WithId<CompensationDocument>,
): EmployeeCompensationModel => ({
    id: document._id,
    timestamp: document.timestamp,
    employees: document.employees,
    type: document.type,
    paymentType: document.paymentType,
    paymentAmount: document.paymentAmount,
    deduction: document.deduction,
    deductionType: document.deductionType,
    deductionAmount: document.deductionAmount,
});

const toPayrollSettingsModel = (
    document: WithId<PayrollSettingsDocument> | null,
    instanceKey: string,
): StoredPayrollSettings => ({
    id: document?._id ?? instanceKey,
    baseCurrency: document?.baseCurrency,
    taxRate: document?.taxRate,
    monthlyWorkingHours: document?.monthlyWorkingHours,
    header: document?.header ?? null,
    footer: document?.footer ?? null,
    signature: document?.signature ?? null,
    stamp: document?.stamp ?? null,
    updatedAt: document?.updatedAt,
});

const listAllLoans = async (): Promise<EmployeeLoanModel[]> => {
    const collection = await getMongoCollection<LoanDocument>(loansCollection);
    return (await collection.find({}).toArray()).map(toLoanModel);
};

const listAllCompensations = async (): Promise<EmployeeCompensationModel[]> => {
    const collection = await getMongoCollection<CompensationDocument>(compensationCollection);
    return (await collection.find({}).toArray()).map(toCompensationModel);
};

const listAllPayrollSettings = async (): Promise<StoredPayrollSettings[]> => {
    const collection = await getMongoCollection<PayrollSettingsDocument>(payrollCollection);
    const documents = await collection.find({}).toArray();
    return documents.map(document => toPayrollSettingsModel(document, document._id));
};

export class PayrollServerRepository {
    static async listCompensations(
        filters: Record<string, unknown> | undefined,
        instanceKey: string,
        session: SessionClaims,
    ): Promise<Record<string, unknown>> {
        const employeeUid = readString(filters?.employeeUid);
        const collection = await getMongoCollection<CompensationDocument>(compensationCollection);
        const query: Filter<CompensationDocument> = employeeUid ? { employees: employeeUid } : {};
        const compensations = (await collection.find(query).toArray()).map(toCompensationModel);

        return {
            compensations: filterDocumentsForSession(
                compensations,
                "compensations",
                instanceKey,
                session,
            ),
        };
    }

    static async listLoans(
        filters: Record<string, unknown> | undefined,
        instanceKey: string,
        session: SessionClaims,
    ): Promise<Record<string, unknown>> {
        const employeeUid = readString(filters?.employeeUid);
        const collection = await getMongoCollection<LoanDocument>(loansCollection);
        const query: Filter<LoanDocument> = employeeUid ? { employeeUid } : {};
        const loans = (await collection.find(query).toArray()).map(toLoanModel);

        return {
            employeeLoans: filterDocumentsForSession(loans, "employeeLoans", instanceKey, session),
        };
    }

    static async listSettings(instanceKey: string): Promise<Record<string, unknown>> {
        const collection = await getMongoCollection<PayrollSettingsDocument>(payrollCollection);
        const document = await collection.findOne({ _id: instanceKey });
        return {
            payrollSettings: [toPayrollSettingsModel(document, instanceKey)],
        };
    }

    static async createCompensation(payload: Record<string, unknown>) {
        const collection = await getMongoCollection<CompensationDocument>(compensationCollection);
        const document: CompensationDocument = {
            _id: new ObjectId().toHexString(),
            ...(requirePayload(payload) as Omit<EmployeeCompensationModel, "id">),
        };

        await collection.insertOne(document);
        const compensation = toCompensationModel(document as WithId<CompensationDocument>);
        await publishRealtimeResource({
            resource: "compensations",
            resourceId: compensation.id,
            payload: await listAllCompensations(),
        });

        return { compensation };
    }

    static async updateCompensation(id: string, payload: Record<string, unknown>) {
        const collection = await getMongoCollection<CompensationDocument>(compensationCollection);
        const updateData = Object.fromEntries(
            Object.entries(requirePayload(payload)).filter(
                ([key, value]) => key !== "id" && value !== undefined && value !== null,
            ),
        );

        if (Object.keys(updateData).length > 0) {
            await collection.updateOne({ _id: id }, { $set: updateData });
        }

        const updated = await collection.findOne({ _id: id });
        await publishRealtimeResource({
            resource: "compensations",
            resourceId: id,
            payload: await listAllCompensations(),
        });

        return { compensation: updated ? toCompensationModel(updated) : null };
    }

    static async deleteCompensation(id: string) {
        const collection = await getMongoCollection<CompensationDocument>(compensationCollection);
        await collection.deleteOne({ _id: id });
        await publishRealtimeResource({
            resource: "compensations",
            resourceId: id,
            payload: await listAllCompensations(),
        });

        return { deleted: true };
    }

    static async createLoan(_instanceKey: string, payload: Record<string, unknown>) {
        const collection = await getMongoCollection<LoanDocument>(loansCollection);
        const document: LoanDocument = {
            _id: new ObjectId().toHexString(),
            ...(requirePayload(payload) as Omit<EmployeeLoanModel, "id">),
        };

        await collection.insertOne(document);
        const loan = toLoanModel(document as WithId<LoanDocument>);
        await publishRealtimeResource({
            resource: "employeeLoans",
            resourceId: loan.id,
            payload: await listAllLoans(),
            resourceOwnerUid: loan.employeeUid,
        });

        return { loan };
    }

    static async updateLoan(_instanceKey: string, id: string, payload: Record<string, unknown>) {
        const collection = await getMongoCollection<LoanDocument>(loansCollection);
        const input = requirePayload(payload);

        if (typeof input.amount === "number") {
            const existingLoan = await collection.findOne({ _id: id });
            if (!existingLoan) {
                return { loan: null };
            }

            const nextLoanTotalAmount = Math.max(
                Number(existingLoan.loanTotalAmount ?? 0) - input.amount,
                0,
            );
            await collection.updateOne(
                { _id: id },
                {
                    $set: {
                        loanTotalAmount: nextLoanTotalAmount,
                    },
                },
            );

            const updated = await collection.findOne({ _id: id });
            await publishRealtimeResource({
                resource: "employeeLoans",
                resourceId: id,
                payload: await listAllLoans(),
                resourceOwnerUid: updated?.employeeUid ?? existingLoan.employeeUid,
            });

            return { loan: updated ? toLoanModel(updated) : null };
        }

        const updateData = Object.fromEntries(
            Object.entries(input).filter(
                ([key, value]) => key !== "id" && value !== undefined && value !== null,
            ),
        );

        if (Object.keys(updateData).length > 0) {
            await collection.updateOne({ _id: id }, { $set: updateData });
        }

        const updated = await collection.findOne({ _id: id });
        await publishRealtimeResource({
            resource: "employeeLoans",
            resourceId: id,
            payload: await listAllLoans(),
            resourceOwnerUid: updated?.employeeUid,
        });

        return { loan: updated ? toLoanModel(updated) : null };
    }

    static async deleteLoan(_instanceKey: string, id: string) {
        const collection = await getMongoCollection<LoanDocument>(loansCollection);
        const current = await collection.findOne({ _id: id });
        await collection.deleteOne({ _id: id });
        await publishRealtimeResource({
            resource: "employeeLoans",
            resourceId: id,
            payload: await listAllLoans(),
            resourceOwnerUid: current?.employeeUid,
        });

        return { deleted: true };
    }

    static async updateSettings(instanceKey: string, payload: Record<string, unknown>) {
        const collection = await getMongoCollection<PayrollSettingsDocument>(payrollCollection);
        const current = await collection.findOne({ _id: instanceKey });
        const { id: _currentId, ...currentSettings } = toPayrollSettingsModel(current, instanceKey);
        const nextSettings: PayrollSettingsDocument = {
            _id: instanceKey,
            ...currentSettings,
            ...Object.fromEntries(
                Object.entries(requirePayload(payload)).filter(
                    ([key, value]) => key !== "id" && value !== undefined,
                ),
            ),
            updatedAt: new Date().toISOString(),
        };

        await collection.updateOne({ _id: instanceKey }, { $set: nextSettings }, { upsert: true });

        await publishRealtimeResource({
            resource: "payrollSettings",
            resourceId: instanceKey,
            payload: await listAllPayrollSettings(),
        });

        return {
            payrollSettings: [
                toPayrollSettingsModel(await collection.findOne({ _id: instanceKey }), instanceKey),
            ],
        };
    }

    static resolveOwnerUid(payload?: Record<string, unknown>): string | undefined {
        return (
            readString(payload?.employeeUid) ||
            (Array.isArray(payload?.employees) ? readString(payload.employees[0]) : undefined)
        );
    }

    static requireTargetId(id?: string): string {
        if (!id) {
            throw new ManualApiError(400, "TARGET_ID_REQUIRED", "targetId is required.");
        }

        return id;
    }
}
