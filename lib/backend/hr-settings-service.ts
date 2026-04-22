import { createLog, type LogInfo } from "@/lib/backend/api/logCollection";
import { mutateCompactData, queryCompactData } from "@/lib/backend/client/data-client";
import { CompactDataResource } from "@/lib/backend/services/resource-types";

export * from "@/lib/models/hr-settings";
export type { CompanyInfoModel } from "@/lib/models/companyInfo";

type BatchCreateResult = {
    success: boolean;
    error?: string;
    ids?: string[];
};

const logIfNeeded = async (userId?: string, logInfo?: LogInfo): Promise<void> => {
    if (!userId || !logInfo) return;
    await createLog(logInfo, userId, "Success");
};

export const hrSettingsService = {
    async getAll<T = Record<string, unknown>>(type: CompactDataResource): Promise<T[]> {
        const response = await queryCompactData<Record<string, T[]>>({ resource: type });
        return response[type] ?? [];
    },

    async getOne<T = Record<string, unknown>>(
        type: CompactDataResource,
        id: string,
    ): Promise<T | null> {
        const response = await queryCompactData<Record<string, T[]>>({
            resource: type,
            filters: { id },
        });
        return response[type]?.[0] ?? null;
    },

    async create<T extends Record<string, unknown>>(
        type: CompactDataResource,
        data: T,
        userId?: string,
        logInfo?: LogInfo,
    ): Promise<string | false> {
        try {
            const response = await mutateCompactData<Record<string, Array<T & { id: string }>>>({
                resource: type,
                action: "create",
                payload: data,
            });
            await logIfNeeded(userId, logInfo);
            return response[type]?.[0]?.id ?? false;
        } catch (error) {
            console.error(`Failed to create ${type}:`, error);
            return false;
        }
    },

    async update<T extends Record<string, unknown>>(
        type: CompactDataResource,
        id: string,
        data: T,
        userId?: string,
        logInfo?: LogInfo,
    ): Promise<boolean> {
        try {
            await mutateCompactData({
                resource: type,
                action: "update",
                targetId: id,
                payload: data,
            });
            await logIfNeeded(userId, logInfo);
            return true;
        } catch (error) {
            console.error(`Failed to update ${type}/${id}:`, error);
            return false;
        }
    },

    async remove(
        type: CompactDataResource,
        id: string,
        userId?: string,
        logInfo?: LogInfo,
    ): Promise<boolean> {
        try {
            await mutateCompactData({
                resource: type,
                action: "delete",
                targetId: id,
            });
            await logIfNeeded(userId, logInfo);
            return true;
        } catch (error) {
            console.error(`Failed to remove ${type}/${id}:`, error);
            return false;
        }
    },

    async batchCreate<T extends Record<string, unknown>>(
        type: CompactDataResource,
        items: T[],
        userId?: string,
        logInfo?: LogInfo,
    ): Promise<BatchCreateResult> {
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
    },
};
