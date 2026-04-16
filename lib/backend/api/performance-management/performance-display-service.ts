import { PeriodicOptionModel } from "@/lib/models/performance";
import { periodicOptionService } from "./periodic-option-service";

export const performanceDisplayService = {
    /**
     * Get period name by period ID
     * @param periodID Period ID
     * @returns Period name with year or null if not found
     */
    async getPeriodDisplayName(periodID: string): Promise<string | null> {
        try {
            const periodicOption = await periodicOptionService.get(periodID);
            if (periodicOption) {
                return `${periodicOption.periodName} (${periodicOption.year})`;
            }
            return null;
        } catch (error) {
            console.error("Error getting period display name:", error);
            return null;
        }
    },

    /**
     * Get round name by period ID and round ID
     * @param periodID Period ID
     * @param roundID Round ID
     * @returns Round name or null if not found
     */
    async getRoundDisplayName(periodID: string, roundID: string): Promise<string | null> {
        try {
            const periodicOption = await periodicOptionService.get(periodID);
            if (periodicOption) {
                const round = periodicOption.evaluations.find(
                    evaluation => evaluation.id === roundID,
                );
                return round ? round.round : null;
            }
            return null;
        } catch (error) {
            console.error("Error getting round display name:", error);
            return null;
        }
    },

    /**
     * Get period and round display names
     * @param periodID Period ID
     * @param roundID Round ID
     * @returns Object with period and round display names
     */
    async getPeriodAndRoundDisplayNames(
        periodID: string,
        roundID: string,
    ): Promise<{
        periodName: string | null;
        roundName: string | null;
    }> {
        try {
            const periodicOption = await periodicOptionService.get(periodID);
            if (periodicOption) {
                const round = periodicOption.evaluations.find(
                    evaluation => evaluation.id === roundID,
                );
                return {
                    periodName: `${periodicOption.periodName} (${periodicOption.year})`,
                    roundName: round ? round.round : null,
                };
            }
            return {
                periodName: null,
                roundName: null,
            };
        } catch (error) {
            console.error("Error getting period and round display names:", error);
            return {
                periodName: null,
                roundName: null,
            };
        }
    },

    /**
     * Get all periodic options for display purposes
     * @returns Array of periodic options with formatted display names
     */
    async getAllPeriodicOptionsForDisplay(): Promise<PeriodicOptionModel[]> {
        try {
            return await periodicOptionService.getAll();
        } catch (error) {
            console.error("Error getting all periodic options for display:", error);
            return [];
        }
    },

    /**
     * Validate that period and round IDs exist
     * @param periodID Period ID
     * @param roundID Round ID
     * @returns Boolean indicating if both IDs are valid
     */
    async validatePeriodAndRoundIDs(periodID: string, roundID: string): Promise<boolean> {
        try {
            const periodicOption = await periodicOptionService.get(periodID);
            if (periodicOption) {
                const round = periodicOption.evaluations.find(
                    evaluation => evaluation.id === roundID,
                );
                return !!round;
            }
            return false;
        } catch (error) {
            console.error("Error validating period and round IDs:", error);
            return false;
        }
    },
};
