import { LogRepository, type LogInfo } from "@/lib/repository/logs/log.repository";
import { CompanyInfoModel } from "@/lib/models/companyInfo";
import {
    ContractHourModel,
    ContractTypeModel,
    DepartmentSettingsModel,
    GradeDefinitionModel,
    LocationModel,
    MaritalStatusModel,
    PositionDefinitionModel,
    ProbationDayModel,
    ReasonOfLeavingModel,
    SalaryScaleModel,
    SectionSettingsModel,
} from "@/lib/models/hr-settings";
import { CoreSettingsResource } from "@/lib/server/hr-settings/core-settings/core-settings.types";

export type {
    CompanyInfoModel,
    ContractHourModel,
    ContractTypeModel,
    DepartmentSettingsModel,
    GradeDefinitionModel,
    LocationModel,
    MaritalStatusModel,
    PositionDefinitionModel,
    ProbationDayModel,
    ReasonOfLeavingModel,
    SalaryScaleModel,
    SectionSettingsModel,
    LogInfo,
};

export type CoreSettingsType = CoreSettingsResource;

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

export class CoreSettingsRepository {
    private static async request<T>(
        resource: CoreSettingsResource,
        init?: RequestInit,
        searchParams?: URLSearchParams,
    ): Promise<T> {
        const query = searchParams?.toString();
        const response = await fetch(
            `/api/hr-settings/core-settings/${resource}${query ? `?${query}` : ""}`,
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

    static async getAll<T = Record<string, unknown>>(type: CoreSettingsResource): Promise<T[]> {
        const payload = await this.request<Record<string, T[]>>(type, { method: "GET" });
        return payload[type] ?? [];
    }

    static async getOne<T = Record<string, unknown>>(
        type: CoreSettingsResource,
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
        type: CoreSettingsResource,
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
        type: CoreSettingsResource,
        id: string,
        data: T,
        userId?: string,
        logInfo?: LogInfo,
    ): Promise<boolean> {
        try {
            await this.request<Record<string, Array<T & { id: string }>>>(type, {
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
        type: CoreSettingsResource,
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
}
