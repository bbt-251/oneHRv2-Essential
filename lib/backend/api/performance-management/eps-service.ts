/**
 * EPS (Employee Performance Score) Calculation Service
 * Automatically calculates EPS when both objectives and competency reviews are finalized
 */

import { CompetenceAssessmentModel } from "@/lib/models/competenceAssessment";
import { EmployeeModel, PastPerformanceModel } from "@/lib/models/employee";
import { ObjectiveModel } from "@/lib/models/objective-model";
import { ObjectiveWeightModel } from "@/lib/models/objective-weight";
import { EvaluationCampaignModel } from "@/lib/models/performance";
import { computeRoundMetrics } from "@/lib/util/performance-rating";
import { doc, updateDoc } from "firebase/firestore";
import { employeeCollection } from "../../firebase/collections";
import { createLog } from "../logCollection";
import { PERFORMANCE_MANAGEMENT_LOG_MESSAGES } from "@/lib/log-descriptions/performance-management";

/**
 * Result of EPS calculation containing individual scores
 */
export interface EPSCalculationResult {
    success: boolean;
    objectiveScore?: number; // Score out of 5
    competencyScore?: number; // Score out of 5
    epsScore?: number; // Score out of 5
    epsPct?: number; // Percentage (0-100)
    error?: string;
}

/**
 * Calculates and updates EPS for a single employee
 * Called when manager finalizes their review (objectives or competency)
 * @param justFinalized - Optional flag to indicate what was just finalized (to handle timing issues with context updates)
 */
export async function calculateEmployeeEPS(
    employee: EmployeeModel,
    campaignId: string,
    campaign: EvaluationCampaignModel,
    objectives: ObjectiveModel[],
    competenceAssessments: CompetenceAssessmentModel[],
    objectiveWeights: ObjectiveWeightModel[],
    managerUid?: string, // Optional: UID of the manager who triggered the calculation
    justFinalized?: { objectives?: boolean; competency?: boolean }, // Optional: what was just finalized
): Promise<EPSCalculationResult> {
    try {
        // Filter objectives for this employee and campaign
        const empObjectives = objectives.filter(
            o =>
                o.employee === employee.uid &&
                o.period === campaign.periodID &&
                o.round === campaign.roundID &&
                (o.status === "Approved" || o.status === "Acknowledged"),
        );

        // Check if objectives are finalized (manager evaluation locked)
        // Use justFinalized flag if provided (handles timing issue where context hasn't updated yet)
        let objectivesFinalized = justFinalized?.objectives ?? false;
        if (!objectivesFinalized) {
            objectivesFinalized =
                empObjectives.length > 0 &&
                empObjectives.every(o => o.managerEvaluation?.isAbleToEdit === false);
        }

        // Get competency assessment for this employee
        const empCompetence = competenceAssessments.find(
            assessment => assessment.for === employee.uid,
        );

        // Get manager's assessment (not employee's self-assessment)
        const managerAssessment = empCompetence?.assessment.find(
            a => a.evaluatedBy !== employee.uid && a.campaignId === campaignId,
        );

        // Check if competency is finalized
        // Use justFinalized flag if provided (handles timing issue where context hasn't updated yet)
        let competencyFinalized = justFinalized?.competency ?? false;
        if (!competencyFinalized) {
            competencyFinalized = empCompetence?.isAbleToEdit === false;
        }

        // Only calculate EPS if BOTH are finalized
        if (!objectivesFinalized || !competencyFinalized) {
            return {
                success: true,
                error: `Waiting for finalization: objectives=${objectivesFinalized}, competency=${competencyFinalized}`,
            };
        }

        // Get weights for this campaign
        const weightsForCampaign =
            objectiveWeights.find(ow => ow.campaignId === campaignId) ?? null;

        // Calculate metrics using shared helper
        const { objectivePct, competencyPct, epsPct } = computeRoundMetrics({
            objectives: empObjectives,
            weightsForCampaign,
            competenceValues: managerAssessment?.competenceValues ?? [],
        });

        // Convert to 0..5 scale for storage
        const objectiveVal = Math.round((objectivePct / 100) * 5 * 100) / 100;
        const competencyVal = Math.round((competencyPct / 100) * 5 * 100) / 100;
        const performanceScore = Math.round((epsPct / 100) * 5 * 100) / 100;

        // Create past performance record
        const pastPerformance: PastPerformanceModel = {
            id: crypto.randomUUID(),
            campaignId,
            campaignName: campaign.campaignName,
            period: campaign.periodID,
            round: campaign.roundID,
            startDate: campaign.startDate,
            endDate: campaign.endDate,
            competencyScore: competencyVal,
            objectiveScore: objectiveVal,
            performanceScore,
        };

        // Update employee's performance history
        const existingPerformance = employee.performance ?? [];
        const updatedPerformance = [
            ...existingPerformance.filter(p => p.campaignId !== campaignId),
            pastPerformance,
        ];

        // Calculate average performance score across all campaigns
        let totalScore = 0;
        updatedPerformance.forEach(p => {
            totalScore += p.performanceScore;
        });
        const avgPerformanceScore =
            updatedPerformance.length > 0 ? totalScore / updatedPerformance.length : 0;

        // Update employee document
        const employeeRef = doc(employeeCollection, employee.id);
        await updateDoc(employeeRef, {
            performance: updatedPerformance,
            performanceScore: avgPerformanceScore,
        });

        // Create HR activity log for EPS calculation
        const employeeName = `${employee.firstName} ${employee.surname}`;
        const logInfo = PERFORMANCE_MANAGEMENT_LOG_MESSAGES.EPS_CALCULATED(
            employeeName,
            objectiveVal,
            competencyVal,
            performanceScore,
            campaign.campaignName,
        );

        // Use managerUid if provided, otherwise use employee uid (self-triggered)
        await createLog(logInfo, managerUid || employee.uid || "system", "Success");

        return {
            success: true,
            objectiveScore: objectiveVal,
            competencyScore: competencyVal,
            epsScore: performanceScore,
            epsPct,
        };
    } catch (error: any) {
        console.error("Error calculating EPS:", error);

        // Log failure
        const logInfo = PERFORMANCE_MANAGEMENT_LOG_MESSAGES.EPS_CALCULATION_FAILED(
            `${employee.firstName} ${employee.surname}`,
            error.message,
        );
        await createLog(logInfo, managerUid || employee.uid || "system", "Failure");

        return {
            success: false,
            error: error.message,
        };
    }
}

/**
 * Checks if both objectives and competency reviews are finalized for an employee
 * @param justFinalized - Optional flag to indicate what was just finalized (to handle timing issues with context updates)
 */
export function checkReviewsFinalized(
    employeeUid: string,
    campaignId: string,
    campaign: EvaluationCampaignModel,
    objectives: ObjectiveModel[],
    competenceAssessments: CompetenceAssessmentModel[],
    justFinalized?: { objectives?: boolean; competency?: boolean },
): { objectivesFinalized: boolean; competencyFinalized: boolean; allFinalized: boolean } {
    // Check objectives
    const empObjectives = objectives.filter(
        o =>
            o.employee === employeeUid &&
            o.period === campaign.periodID &&
            o.round === campaign.roundID &&
            (o.status === "Approved" || o.status === "Acknowledged"),
    );

    // Use justFinalized flag if provided (handles timing issue where context hasn't updated yet)
    let objectivesFinalized = justFinalized?.objectives ?? false;
    if (!objectivesFinalized) {
        objectivesFinalized =
            empObjectives.length > 0 &&
            empObjectives.every(o => o.managerEvaluation?.isAbleToEdit === false);
    }

    // Check competency
    let competencyFinalized = justFinalized?.competency ?? false;
    if (!competencyFinalized) {
        const empCompetence = competenceAssessments.find(
            assessment => assessment.for === employeeUid,
        );
        competencyFinalized = empCompetence?.isAbleToEdit === false;
    }

    return {
        objectivesFinalized,
        competencyFinalized,
        allFinalized: objectivesFinalized && competencyFinalized,
    };
}
