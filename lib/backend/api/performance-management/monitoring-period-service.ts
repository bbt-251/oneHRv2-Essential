import { MonitoringPeriodModel } from "@/lib/models/performance";
import { hrSettingsService } from "../../firebase/hrSettingsService";
import { LogInfo } from "@/lib/log-descriptions/performance-management";

export const monitoringPeriodService = {
    /**
     * Create a new monitoring period
     * @param data Monitoring period data without id
     * @param actionBy User ID performing the action
     * @param logInfo Log information for the action
     * @returns Document ID of created monitoring period
     */
    async create(
        data: Omit<MonitoringPeriodModel, "id">,
        actionBy?: string,
        logInfo?: LogInfo,
    ): Promise<string> {
        return await hrSettingsService.create("monitoringPeriods", data, actionBy, logInfo);
    },

    /**
     * Get a specific monitoring period by ID
     * @param id Document ID
     * @returns Monitoring period data or null if not found
     */
    async get(id: string): Promise<MonitoringPeriodModel | null> {
        return (await hrSettingsService.get(
            "monitoringPeriods",
            id,
        )) as MonitoringPeriodModel | null;
    },

    /**
     * Get all monitoring periods
     * @returns Array of monitoring periods
     */
    async getAll(): Promise<MonitoringPeriodModel[]> {
        return (await hrSettingsService.getAll("monitoringPeriods")) as MonitoringPeriodModel[];
    },

    /**
     * Update a monitoring period
     * @param id Document ID
     * @param data Partial monitoring period data
     * @param actionBy User ID performing the action
     * @param logInfo Log information for the action
     * @returns Success boolean
     */
    async update(
        id: string,
        data: Partial<MonitoringPeriodModel>,
        actionBy?: string,
        logInfo?: LogInfo,
    ): Promise<boolean> {
        return await hrSettingsService.update("monitoringPeriods", id, data, actionBy, logInfo);
    },

    /**
     * Delete a monitoring period
     * @param id Document ID
     * @param actionBy User ID performing the action
     * @param logInfo Log information for the action
     * @returns Promise<void>
     */
    async delete(id: string, actionBy?: string, logInfo?: LogInfo): Promise<boolean> {
        return await hrSettingsService.remove("monitoringPeriods", id, actionBy, logInfo);
    },

    /**
     * Get active monitoring periods (current date within start/end range)
     * @returns Array of active monitoring periods
     */
    async getActivePeriods(): Promise<MonitoringPeriodModel[]> {
        const allPeriods = await this.getAll();
        const currentDate = new Date();

        return allPeriods.filter(period => {
            const startDate = new Date(period.startDate);
            const endDate = new Date(period.endDate);
            return currentDate >= startDate && currentDate <= endDate;
        });
    },

    /**
     * Get monitoring periods by period ID
     * @param periodID Period ID to filter by
     * @returns Array of monitoring periods for the period
     */
    async getByPeriodID(periodID: string): Promise<MonitoringPeriodModel[]> {
        const allPeriods = await this.getAll();
        return allPeriods.filter(period => period.periodID === periodID);
    },

    /**
     * Get monitoring periods by period and round IDs
     * @param periodID Period ID to filter by
     * @param roundID Round ID to filter by
     * @returns Array of monitoring periods for the period and round
     */
    async getByPeriodAndRound(periodID: string, roundID: string): Promise<MonitoringPeriodModel[]> {
        const allPeriods = await this.getAll();
        return allPeriods.filter(
            period => period.periodID === periodID && period.roundID === roundID,
        );
    },
};
