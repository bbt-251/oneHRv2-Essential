import { EvaluationCampaignModel } from "@/lib/models/performance";
import { hrSettingsService } from "../../firebase/hrSettingsService";
import { LogInfo } from "@/lib/log-descriptions/performance-management";

export const evaluationCampaignService = {
    /**
     * Create a new evaluation campaign
     * @param data Evaluation campaign data without id
     * @param actionBy User ID performing the action
     * @param logInfo Log information for the action
     * @returns Document ID of created evaluation campaign
     */
    async create(
        data: Omit<EvaluationCampaignModel, "id">,
        actionBy?: string,
        logInfo?: LogInfo,
    ): Promise<string> {
        return await hrSettingsService.create("evaluationCampaigns", data, actionBy, logInfo);
    },

    /**
     * Get a specific evaluation campaign by ID
     * @param id Document ID
     * @returns Evaluation campaign data or null if not found
     */
    async get(id: string): Promise<EvaluationCampaignModel | null> {
        return (await hrSettingsService.get(
            "evaluationCampaigns",
            id,
        )) as EvaluationCampaignModel | null;
    },

    /**
     * Get all evaluation campaigns
     * @returns Array of evaluation campaigns
     */
    async getAll(): Promise<EvaluationCampaignModel[]> {
        return (await hrSettingsService.getAll("evaluationCampaigns")) as EvaluationCampaignModel[];
    },

    /**
     * Update an evaluation campaign
     * @param id Document ID
     * @param data Partial evaluation campaign data
     * @param actionBy User ID performing the action
     * @param logInfo Log information for the action
     * @returns Success boolean
     */
    async update(
        id: string,
        data: Partial<EvaluationCampaignModel>,
        actionBy?: string,
        logInfo?: LogInfo,
    ): Promise<boolean> {
        return await hrSettingsService.update("evaluationCampaigns", id, data, actionBy, logInfo);
    },

    /**
     * Delete an evaluation campaign
     * @param id Document ID
     * @param actionBy User ID performing the action
     * @param logInfo Log information for the action
     * @returns Promise<void>
     */
    async delete(id: string, actionBy?: string, logInfo?: LogInfo): Promise<boolean> {
        return await hrSettingsService.remove("evaluationCampaigns", id, actionBy, logInfo);
    },

    /**
     * Get campaigns by promotion trigger status
     * @param promotionTriggered Boolean to filter by promotion trigger
     * @returns Array of filtered campaigns
     */
    async getByPromotionTrigger(promotionTriggered: boolean): Promise<EvaluationCampaignModel[]> {
        const allCampaigns = await this.getAll();
        return allCampaigns.filter(campaign => campaign.promotionTriggered === promotionTriggered);
    },

    /**
     * Get campaigns by period ID
     * @param periodID Period ID to filter by
     * @returns Array of campaigns for the period
     */
    async getByPeriodID(periodID: string): Promise<EvaluationCampaignModel[]> {
        const allCampaigns = await this.getAll();
        return allCampaigns.filter(campaign => campaign.periodID === periodID);
    },

    /**
     * Get campaigns by period and round IDs
     * @param periodID Period ID to filter by
     * @param roundID Round ID to filter by
     * @returns Array of campaigns for the period and round
     */
    async getByPeriodAndRound(
        periodID: string,
        roundID: string,
    ): Promise<EvaluationCampaignModel[]> {
        const allCampaigns = await this.getAll();
        return allCampaigns.filter(
            campaign => campaign.periodID === periodID && campaign.roundID === roundID,
        );
    },
};
