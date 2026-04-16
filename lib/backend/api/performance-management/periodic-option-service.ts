import { PeriodicOptionModel } from "@/lib/models/performance";
import { hrSettingsService } from "../../firebase/hrSettingsService";
import { LogInfo } from "@/lib/log-descriptions/performance-management";

export const periodicOptionService = {
    /**
     * Create a new periodic option
     * @param data Periodic option data without id
     * @param actionBy User ID performing the action
     * @param logInfo Log information for the action
     * @returns Document ID of created periodic option
     */
    async create(
        data: Omit<PeriodicOptionModel, "id">,
        actionBy?: string,
        logInfo?: LogInfo,
    ): Promise<string> {
        return await hrSettingsService.create("periodicOptions", data, actionBy, logInfo);
    },

    /**
     * Get a specific periodic option by ID
     * @param id Document ID
     * @returns Periodic option data or null if not found
     */
    async get(id: string): Promise<PeriodicOptionModel | null> {
        return (await hrSettingsService.get("periodicOptions", id)) as PeriodicOptionModel | null;
    },

    /**
     * Get all periodic options
     * @returns Array of periodic options
     */
    async getAll(): Promise<PeriodicOptionModel[]> {
        return (await hrSettingsService.getAll("periodicOptions")) as PeriodicOptionModel[];
    },

    /**
     * Update a periodic option
     * @param id Document ID
     * @param data Partial periodic option data
     * @param actionBy User ID performing the action
     * @param logInfo Log information for the action
     * @returns Success boolean
     */
    async update(
        id: string,
        data: Partial<PeriodicOptionModel>,
        actionBy?: string,
        logInfo?: LogInfo,
    ): Promise<boolean> {
        return await hrSettingsService.update("periodicOptions", id, data, actionBy, logInfo);
    },

    /**
     * Delete a periodic option
     * @param id Document ID
     * @param actionBy User ID performing the action
     * @param logInfo Log information for the action
     * @returns Promise<void>
     */
    async delete(id: string, actionBy?: string, logInfo?: LogInfo): Promise<boolean> {
        return await hrSettingsService.remove("periodicOptions", id, actionBy, logInfo);
    },
};
