import { authorizeRequest } from "@/lib/server/shared/auth/authorization";
import { ManualApiError } from "@/lib/server/shared/errors";
import { SessionClaims } from "@/lib/server/shared/types";
import { getCurrentInstanceKey } from "@/lib/server/shared/config";
import { serviceSuccess } from "@/lib/server/shared/result";
import { PayrollServerRepository } from "@/lib/server/payroll/payroll.repository";
import {
    CompensationListPayload,
    CompensationRecordPayload,
    LoanListPayload,
    LoanRecordPayload,
    PayrollSettingsRecordPayload,
} from "@/lib/server/payroll/payroll.types";

export class PayrollService {
    static async listCompensations(
        filters: Record<string, unknown>,
        session: SessionClaims | null,
    ) {
        const instanceKey = getCurrentInstanceKey();
        const authorizedSession = authorizeRequest({
            session,
            instanceKey,
            resource: "compensations",
            action: "read",
        });

        const data = await PayrollServerRepository.listCompensations(
            filters,
            instanceKey,
            authorizedSession,
        );
        return serviceSuccess<CompensationListPayload>(
            "Compensations loaded successfully.",
            data as CompensationListPayload,
        );
    }

    static async listLoans(filters: Record<string, unknown>, session: SessionClaims | null) {
        const instanceKey = getCurrentInstanceKey();
        const authorizedSession = authorizeRequest({
            session,
            instanceKey,
            resource: "employeeLoans",
            action: "read",
        });

        const data = await PayrollServerRepository.listLoans(
            filters,
            instanceKey,
            authorizedSession,
        );
        return serviceSuccess<LoanListPayload>(
            "Loans loaded successfully.",
            data as LoanListPayload,
        );
    }

    static async getSettings(session: SessionClaims | null) {
        const instanceKey = getCurrentInstanceKey();
        authorizeRequest({
            session,
            instanceKey,
            resource: "payrollSettings",
            action: "read",
        });

        const data = await PayrollServerRepository.listSettings(instanceKey);
        return serviceSuccess<PayrollSettingsRecordPayload>(
            "Payroll settings loaded successfully.",
            data as PayrollSettingsRecordPayload,
        );
    }

    static async createCompensation(
        payload: Record<string, unknown>,
        session: SessionClaims | null,
    ) {
        const instanceKey = getCurrentInstanceKey();
        authorizeRequest({ session, instanceKey, resource: "compensations", action: "create" });
        const data = await PayrollServerRepository.createCompensation(payload);
        return serviceSuccess<CompensationRecordPayload>(
            "Compensation created successfully.",
            data as CompensationRecordPayload,
        );
    }

    static async updateCompensation(
        id: string,
        payload: Record<string, unknown>,
        session: SessionClaims | null,
    ) {
        const instanceKey = getCurrentInstanceKey();
        authorizeRequest({ session, instanceKey, resource: "compensations", action: "update" });
        const data = await PayrollServerRepository.updateCompensation(id, payload);
        return serviceSuccess<CompensationRecordPayload>(
            "Compensation updated successfully.",
            data as CompensationRecordPayload,
        );
    }

    static async deleteCompensation(id: string, session: SessionClaims | null) {
        const instanceKey = getCurrentInstanceKey();
        authorizeRequest({ session, instanceKey, resource: "compensations", action: "delete" });
        const data = await PayrollServerRepository.deleteCompensation(id);
        return serviceSuccess("Compensation deleted successfully.", data);
    }

    static async createLoan(payload: Record<string, unknown>, session: SessionClaims | null) {
        const instanceKey = getCurrentInstanceKey();
        authorizeRequest({ session, instanceKey, resource: "employeeLoans", action: "create" });
        const data = await PayrollServerRepository.createLoan(instanceKey, payload);
        return serviceSuccess<LoanRecordPayload>(
            "Loan created successfully.",
            data as LoanRecordPayload,
        );
    }

    static async updateLoan(
        id: string,
        payload: Record<string, unknown>,
        session: SessionClaims | null,
    ) {
        const instanceKey = getCurrentInstanceKey();
        authorizeRequest({ session, instanceKey, resource: "employeeLoans", action: "update" });
        const data = await PayrollServerRepository.updateLoan(instanceKey, id, payload);
        return serviceSuccess<LoanRecordPayload>(
            "Loan updated successfully.",
            data as LoanRecordPayload,
        );
    }

    static async deleteLoan(id: string, session: SessionClaims | null) {
        const instanceKey = getCurrentInstanceKey();
        authorizeRequest({ session, instanceKey, resource: "employeeLoans", action: "delete" });
        const data = await PayrollServerRepository.deleteLoan(instanceKey, id);
        return serviceSuccess("Loan deleted successfully.", data);
    }

    static async updateSettings(payload: Record<string, unknown>, session: SessionClaims | null) {
        const instanceKey = getCurrentInstanceKey();
        authorizeRequest({ session, instanceKey, resource: "payrollSettings", action: "update" });
        const data = await PayrollServerRepository.updateSettings(instanceKey, payload);
        return serviceSuccess<PayrollSettingsRecordPayload>(
            "Payroll settings updated successfully.",
            data as PayrollSettingsRecordPayload,
        );
    }

    static getResource(resource: string) {
        if (!["compensations", "loans", "settings"].includes(resource)) {
            throw new ManualApiError(
                404,
                "PAYROLL_RESOURCE_NOT_FOUND",
                "Payroll resource was not found.",
            );
        }

        return resource as "compensations" | "loans" | "settings";
    }
}
