import { mutateCompactData, queryCompactData } from "@/lib/backend/client/data-client";

export interface BackendPayrollSettings {
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
}

export const getBackendPayrollSettings = async (): Promise<BackendPayrollSettings | null> => {
    const payload = await queryCompactData<{ payrollSettings: BackendPayrollSettings[] }>({
        resource: "payrollSettings",
    });

    return payload.payrollSettings[0] ?? null;
};

export const saveBackendPayrollSettings = async (
    settings: BackendPayrollSettings,
): Promise<BackendPayrollSettings | null> => {
    const payload = await mutateCompactData<{ payrollSettings: BackendPayrollSettings[] }>({
        resource: "payrollSettings",
        action: "update",
        payload: settings as Record<string, unknown>,
    });

    return payload.payrollSettings[0] ?? null;
};
