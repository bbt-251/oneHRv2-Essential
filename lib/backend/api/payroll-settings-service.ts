import {
    getBackendPayrollSettings,
    saveBackendPayrollSettings,
} from "@/lib/backend/client/payroll-settings-client";
import PayrollPDFSettingsModel from "@/lib/models/payrollPDFSettings";

const DEFAULT_PAYROLL_PDF_SETTINGS_ID = "default";

const toPayrollPDFSettings = (
    settings: Awaited<ReturnType<typeof getBackendPayrollSettings>>,
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

export async function getPayrollPDFSettings(): Promise<PayrollPDFSettingsModel | null> {
    try {
        return toPayrollPDFSettings(await getBackendPayrollSettings());
    } catch (error) {
        console.error("Error getting payroll PDF settings:", error);
        return null;
    }
}

export async function createPayrollPDFSettings(
    data: Omit<PayrollPDFSettingsModel, "id" | "createdAt" | "updatedAt">,
): Promise<PayrollPDFSettingsModel | null> {
    try {
        return toPayrollPDFSettings(await saveBackendPayrollSettings(data));
    } catch (error) {
        console.error("Error creating payroll PDF settings:", error);
        return null;
    }
}

export async function updatePayrollPDFSettings(
    data: Partial<Omit<PayrollPDFSettingsModel, "id" | "createdAt" | "updatedAt">>,
): Promise<PayrollPDFSettingsModel | null> {
    try {
        return toPayrollPDFSettings(await saveBackendPayrollSettings(data));
    } catch (error) {
        console.error("Error updating payroll PDF settings:", error);
        return null;
    }
}

export async function deletePayrollPDFSettings(): Promise<boolean> {
    try {
        await saveBackendPayrollSettings({
            header: null,
            footer: null,
            signature: null,
            stamp: null,
        });
        return true;
    } catch (error) {
        console.error("Error deleting payroll PDF settings:", error);
        return false;
    }
}

export async function savePayrollPDFSettings(settings: {
    headerID: string;
    footerID: string;
    stampID: string;
    signatureID: string;
}): Promise<PayrollPDFSettingsModel | null> {
    try {
        return toPayrollPDFSettings(
            await saveBackendPayrollSettings({
                header: settings.headerID || null,
                footer: settings.footerID || null,
                signature: settings.signatureID || null,
                stamp: settings.stampID || null,
            }),
        );
    } catch (error) {
        console.error("Error saving payroll PDF settings:", error);
        return null;
    }
}
