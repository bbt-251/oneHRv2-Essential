import { LogRepository, type LogInfo } from "@/lib/repository/logs/log.repository";
import { ModuleSettingsResource } from "@/lib/server/hr-settings/module-settings/module-settings.types";
import { buildBackendUrl } from "@/lib/shared/config";
import {
    AccrualConfigurationModel,
    AnnouncementTypeModel,
    BackdateCapabilitiesModel,
    CurrencyModel,
    DeductionTypeModel,
    EligibleLeaveDaysModel,
    HolidayModel,
    LeaveSettingsModel,
    LeaveTypeModel,
    LoanTypeModel,
    OvertimeConfigurationModel,
    PaymentTypeModel,
    PayrollSettingsModel,
    PensionModel,
    ShiftHourModel,
    ShiftTypeModel,
    TaxModel,
} from "@/lib/models/hr-settings";
import { AttendanceLogicModel } from "@/lib/models/attendance-logic";
import { FileDocumentModel } from "@/lib/models/file-document";
import { FlexibilityParameterModel } from "@/lib/models/flexibilityParameter";

export type {
    AccrualConfigurationModel,
    AnnouncementTypeModel,
    BackdateCapabilitiesModel,
    CurrencyModel,
    DeductionTypeModel,
    EligibleLeaveDaysModel,
    HolidayModel,
    LeaveSettingsModel,
    LeaveTypeModel,
    LoanTypeModel,
    OvertimeConfigurationModel,
    PaymentTypeModel,
    PayrollSettingsModel,
    PensionModel,
    ShiftHourModel,
    ShiftTypeModel,
    TaxModel,
    AttendanceLogicModel,
    FlexibilityParameterModel,
    FileDocumentModel,
    LogInfo,
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

const getErrorMessage = (payload: BackendErrorShape, fallback: string) => {
    if (typeof payload.error === "string" && payload.error.trim()) {
        return payload.error;
    }

    if (payload.error && typeof payload.error === "object" && payload.error.message) {
        return payload.error.message;
    }

    return fallback;
};

const logIfNeeded = async (userId?: string, logInfo?: LogInfo): Promise<void> => {
    if (!userId || !logInfo) {
        return;
    }

    await LogRepository.create(logInfo, userId, "Success");
};

export class ModuleSettingsRepository {
    private static async request<T>(
        resource: ModuleSettingsResource,
        init?: RequestInit,
        searchParams?: URLSearchParams,
    ): Promise<T> {
        const query = searchParams?.toString();
        const response = await fetch(
            buildBackendUrl(
                `/api/hr-settings/module-settings/${resource}${query ? `?${query}` : ""}`,
            ),
            {
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    ...(init?.headers ?? {}),
                },
                ...init,
            },
        );

        const payload = (await response.json().catch(() => ({}))) as T & BackendErrorShape;
        if (!response.ok) {
            throw new Error(getErrorMessage(payload, `Request failed for ${resource}.`));
        }

        return payload;
    }

    static async getAll<T = Record<string, unknown>>(type: ModuleSettingsResource): Promise<T[]> {
        const payload = await this.request<Record<string, T[]>>(type, { method: "GET" });
        return payload[type] ?? [];
    }

    static async getOne<T = Record<string, unknown>>(
        type: ModuleSettingsResource,
        id: string,
    ): Promise<T | null> {
        const payload = await this.request<Record<string, T[]>>(
            type,
            { method: "GET" },
            new URLSearchParams({ id }),
        );
        return payload[type]?.[0] ?? null;
    }

    static async create<T extends Record<string, unknown>>(
        type: ModuleSettingsResource,
        data: T,
        userId?: string,
        logInfo?: LogInfo,
    ): Promise<string | false> {
        try {
            const payload = await this.request<Record<string, Array<T & { id: string }>>>(type, {
                method: "POST",
                body: JSON.stringify({ payload: data }),
            });
            await logIfNeeded(userId, logInfo);
            return payload[type]?.[0]?.id ?? false;
        } catch (error) {
            console.error(`Failed to create ${type}:`, error);
            return false;
        }
    }

    static async update<T extends Record<string, unknown>>(
        type: ModuleSettingsResource,
        id: string,
        data: T,
        userId?: string,
        logInfo?: LogInfo,
    ): Promise<boolean> {
        try {
            await this.request(type, {
                method: "PATCH",
                body: JSON.stringify({ id, payload: data }),
            });
            await logIfNeeded(userId, logInfo);
            return true;
        } catch (error) {
            console.error(`Failed to update ${type}/${id}:`, error);
            return false;
        }
    }

    static async remove(
        type: ModuleSettingsResource,
        id: string,
        userId?: string,
        logInfo?: LogInfo,
    ): Promise<boolean> {
        try {
            await this.request(type, {
                method: "DELETE",
                body: JSON.stringify({ id }),
            });
            await logIfNeeded(userId, logInfo);
            return true;
        } catch (error) {
            console.error(`Failed to remove ${type}/${id}:`, error);
            return false;
        }
    }

    static async batchCreate<T extends Record<string, unknown>>(
        type: ModuleSettingsResource,
        items: T[],
        userId?: string,
        logInfo?: LogInfo,
    ): Promise<{ success: boolean; error?: string; ids?: string[] }> {
        try {
            const ids: string[] = [];
            for (const item of items) {
                const createdId = await this.create(type, item);
                if (!createdId) {
                    return { success: false, error: `Failed to create ${type} batch item` };
                }
                ids.push(createdId);
            }
            await logIfNeeded(userId, logInfo);
            return { success: true, ids };
        } catch (error) {
            console.error(`Failed to batch create ${type}:`, error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown batch create error",
            };
        }
    }
}
