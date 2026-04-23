import { buildBackendUrl } from "@/lib/shared/config";
import { EmployeeCompensationModel } from "@/lib/models/employeeCompensation";
import { EmployeeLoanModel } from "@/lib/models/employeeLoan";
import PayrollPDFSettingsModel from "@/lib/models/payrollPDFSettings";
import {
    RepositoryResult,
    repositoryFailure,
    repositorySuccess,
} from "@/lib/repository/shared/result";

type BackendPayrollSettings = {
    id?: string;
    baseCurrency?: string | null;
    taxRate?: number | null;
    monthlyWorkingHours?: number | null;
    currency?: string | null;
    paySchedule?: "monthly" | "biweekly" | null;
    overtimeMultiplier?: number | null;
    header?: string | null;
    footer?: string | null;
    signature?: string | null;
    stamp?: string | null;
    updatedAt?: string;
};

const DEFAULT_PAYROLL_PDF_SETTINGS_ID = "default";

const toPayrollPdfSettings = (
    settings: BackendPayrollSettings | null,
): PayrollPDFSettingsModel | null => {
    if (!settings) {
        return null;
    }

    return {
        id: settings.id ?? DEFAULT_PAYROLL_PDF_SETTINGS_ID,
        createdAt: "",
        updatedAt: settings.updatedAt ?? "",
        header: settings.header ?? null,
        footer: settings.footer ?? null,
        signature: settings.signature ?? null,
        stamp: settings.stamp ?? null,
    };
};

type BackendErrorShape = {
    error?:
        | string
        | {
              code?: string;
              message?: string;
              details?: unknown;
          };
};

const parseError = (payload: BackendErrorShape, fallback: string) => {
    if (typeof payload.error === "string" && payload.error.trim()) {
        return { message: payload.error, code: undefined, details: undefined };
    }

    if (payload.error && typeof payload.error === "object") {
        return {
            message: payload.error.message || fallback,
            code: payload.error.code,
            details: payload.error.details,
        };
    }

    return { message: fallback, code: undefined, details: undefined };
};

export class PayrollRepository {
    private static async request<T>(
        path: string,
        init: RequestInit,
        select: (payload: Record<string, unknown>) => T | null,
        fallbackError: string,
    ): Promise<RepositoryResult<T>> {
        try {
            const response = await fetch(buildBackendUrl(path), {
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    ...(init.headers ?? {}),
                },
                ...init,
            });

            const payload = (await response.json().catch(() => ({}))) as Record<string, unknown> &
                BackendErrorShape;

            if (!response.ok) {
                const error = parseError(payload, fallbackError);
                return repositoryFailure(error.message, {
                    code: error.code,
                    details: error.details,
                });
            }

            const data = select(payload);
            if (data === null || data === undefined) {
                return repositoryFailure("Payroll response did not include expected data.");
            }

            return repositorySuccess(
                typeof payload.message === "string"
                    ? payload.message
                    : "Payroll request completed successfully.",
                data,
            );
        } catch (error) {
            return repositoryFailure(
                error instanceof Error ? error.message : "Payroll request failed unexpectedly.",
            );
        }
    }

    static async createCompensation(
        payload: Omit<EmployeeCompensationModel, "id">,
    ): Promise<RepositoryResult<EmployeeCompensationModel>> {
        return this.request<EmployeeCompensationModel>(
            "/api/payroll/compensations",
            {
                method: "POST",
                body: JSON.stringify({ payload }),
            },
            response => (response.compensation as EmployeeCompensationModel | null) ?? null,
            "Failed to create compensation.",
        );
    }

    static async updateCompensation(
        payload: Partial<EmployeeCompensationModel> & { id: string },
    ): Promise<RepositoryResult<EmployeeCompensationModel | null>> {
        return this.request<EmployeeCompensationModel | null>(
            "/api/payroll/compensations",
            {
                method: "PATCH",
                body: JSON.stringify({ id: payload.id, payload }),
            },
            response => (response.compensation as EmployeeCompensationModel | null) ?? null,
            "Failed to update compensation.",
        );
    }

    static async deleteCompensation(
        compensationId: string,
    ): Promise<RepositoryResult<{ deleted: true }>> {
        return this.request<{ deleted: true }>(
            "/api/payroll/compensations",
            {
                method: "DELETE",
                body: JSON.stringify({ id: compensationId }),
            },
            response => ((response.deleted as boolean) ? { deleted: true } : null),
            "Failed to delete compensation.",
        );
    }

    static async createLoan(
        payload: Omit<EmployeeLoanModel, "id">,
    ): Promise<RepositoryResult<EmployeeLoanModel>> {
        return this.request<EmployeeLoanModel>(
            "/api/payroll/loans",
            {
                method: "POST",
                body: JSON.stringify({ payload }),
            },
            response => (response.loan as EmployeeLoanModel | null) ?? null,
            "Failed to create loan.",
        );
    }

    static async updateLoan(
        payload: Partial<EmployeeLoanModel> & { id: string },
    ): Promise<RepositoryResult<EmployeeLoanModel | null>> {
        return this.request<EmployeeLoanModel | null>(
            "/api/payroll/loans",
            {
                method: "PATCH",
                body: JSON.stringify({ id: payload.id, payload }),
            },
            response => (response.loan as EmployeeLoanModel | null) ?? null,
            "Failed to update loan.",
        );
    }

    static async deleteLoan(loanId: string): Promise<RepositoryResult<{ deleted: true }>> {
        return this.request<{ deleted: true }>(
            "/api/payroll/loans",
            {
                method: "DELETE",
                body: JSON.stringify({ id: loanId }),
            },
            response => ((response.deleted as boolean) ? { deleted: true } : null),
            "Failed to delete loan.",
        );
    }

    static async getPayrollPdfSettings(): Promise<
        RepositoryResult<PayrollPDFSettingsModel | null>
        > {
        return this.request<PayrollPDFSettingsModel | null>(
            "/api/payroll/settings",
            { method: "GET" },
            response =>
                toPayrollPdfSettings(
                    ((response.payrollSettings as BackendPayrollSettings[] | undefined) ?? [])[0] ??
                        null,
                ),
            "Failed to load payroll settings.",
        );
    }

    static async savePayrollPdfSettings(
        settings: Partial<Omit<PayrollPDFSettingsModel, "id" | "createdAt" | "updatedAt">> &
            Partial<BackendPayrollSettings>,
    ): Promise<RepositoryResult<PayrollPDFSettingsModel | null>> {
        return this.request<PayrollPDFSettingsModel | null>(
            "/api/payroll/settings",
            {
                method: "PATCH",
                body: JSON.stringify({ payload: settings }),
            },
            response =>
                toPayrollPdfSettings(
                    ((response.payrollSettings as BackendPayrollSettings[] | undefined) ?? [])[0] ??
                        null,
                ),
            "Failed to save payroll settings.",
        );
    }
}
