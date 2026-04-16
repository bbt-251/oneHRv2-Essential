// Performance score interfaces
interface RoundScore {
    objectiveScore: number | "N/A";
    competencyScore: number | "N/A";
    performanceScore: number | "N/A";
}

interface EmployeePerformanceScores {
    overallObjectiveScore: number;
    overallCompetencyScore: number;
    overallPerformanceScore: number;
    roundScores: Record<string, RoundScore>;
}

interface EnhancedPerformanceEvaluationModel {
    id: string;
    employeeUid: string;
    campaignID: string;
    periodID: string;
    roundID: string;
    employeeName: string;
    department: string;
    position: string;
    performanceYear: number;
    performanceScores: EmployeePerformanceScores;
}

import { EmployeeModel } from "@/lib/models/employee";
import { PeriodicOptionModel } from "@/lib/models/performance";
import { PerformanceEvaluationModel } from "@/lib/models/performance-evaluation";

/**
 * Calculate performance scores for an employee based on their past performance data
 */
export const calculateEmployeePerformanceScores = (
    employee: EmployeeModel,
    currentPeriod: PeriodicOptionModel | undefined,
    performanceEvaluations: PerformanceEvaluationModel[],
): EmployeePerformanceScores => {
    let overallObjective = 0;
    let overallCompetency = 0;
    let overallPerformance = 0;
    let totalEvaluation = 0;
    const roundScores: Record<string, RoundScore> = {};

    currentPeriod?.evaluations?.forEach(evaluation => {
        const current = performanceEvaluations?.filter(p => p.roundID === evaluation.id);
        const currentEmployeePerformance = current?.find(p => p.employeeUid === employee.uid);
        const pastPerformances = employee?.performance ?? [];
        const currentRound = pastPerformances.find(
            doc => doc.round === currentEmployeePerformance?.roundID,
        );

        // Calculate round-specific scores
        roundScores[`round${evaluation.round}`] = {
            objectiveScore: currentRound?.objectiveScore ?? "N/A",
            competencyScore: currentRound?.competencyScore ?? "N/A",
            performanceScore: currentRound?.performanceScore ?? "N/A",
        };

        // Calculate overall scores
        if (!Number.isNaN(Number(currentRound?.objectiveScore))) {
            overallObjective += currentRound?.objectiveScore ?? 0;
        }
        if (!Number.isNaN(Number(currentRound?.competencyScore))) {
            overallCompetency += currentRound?.competencyScore ?? 0;
        }
        if (!Number.isNaN(Number(currentRound?.performanceScore))) {
            overallPerformance += currentRound?.performanceScore ?? 0;
            totalEvaluation += 1;
        }
    });

    return {
        overallObjectiveScore: totalEvaluation
            ? Math.round((overallObjective * 100) / totalEvaluation) / 100
            : 0,
        overallCompetencyScore: totalEvaluation
            ? Math.round((overallCompetency * 100) / totalEvaluation) / 100
            : 0,
        overallPerformanceScore: totalEvaluation
            ? Math.round((overallPerformance * 100) / totalEvaluation) / 100
            : 0,
        roundScores,
    };
};

/**
 * Get employee full name from EmployeeModel
 */
export const getEmployeeFullName = (employee: EmployeeModel): string => {
    return `${employee.firstName} ${employee.surname}`;
};

/**
 * Get department name from hrSettings
 */
export const getDepartmentName = (departmentId: string, hrSettings: any): string => {
    const dept = hrSettings.departmentSettings?.find((d: any) => d.id === departmentId);
    return dept ? dept.name : departmentId;
};

/**
 * Get position name from hrSettings
 */
export const getPositionName = (positionId: string, hrSettings: any): string => {
    const position = hrSettings.positions?.find((p: any) => p.id === positionId);
    return position ? position.name : positionId;
};

export type { RoundScore, EmployeePerformanceScores, EnhancedPerformanceEvaluationModel };
