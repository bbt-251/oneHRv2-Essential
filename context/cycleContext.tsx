"use client";

import { EvaluationCampaignModel } from "@/lib/models/performance";
import type React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { useFirestore } from "./firestore-context";
import dayjs from "dayjs";
import { dateFormat } from "@/lib/util/dayjs_format";
import { useAuth } from "./authContext";

interface ExtendedCampaignModel extends EvaluationCampaignModel {
    periodName: string;
    roundName: string;
    periodYear: number;
    cycleEnded: boolean;
}

export interface ScoreModel {
    performanceScore: number;
    objectiveScore: number;
    competencyScore: number;
}

interface CycleContextType {
    cycles: ExtendedCampaignModel[];
    currentCycle: ExtendedCampaignModel | null;
    totalScores: ScoreModel;
    currentCampaignScores: ScoreModel;
    setCurrentCycle: (cycle: ExtendedCampaignModel) => void;
    isActionAllowed: (action: string) => boolean;
    getTimeRemaining: () => string;
    getCycleProgress: () => number;
    getCycleStatusIndicator: () => "Closed" | "Open" | "Incoming";
    canAccessPhase: (phaseType: string) => boolean;
    setEmployeeFilter: (filter: boolean) => void;
    context: "employee" | "manager";
    setContext: (context: "employee" | "manager") => void;
}

const CycleContext = createContext<CycleContextType | undefined>(undefined);

export function CycleProvider({ children }: { children: React.ReactNode }) {
    const { userData } = useAuth();
    const { hrSettings, employees } = useFirestore();
    const evaluationCampaigns = hrSettings.evaluationCampaigns;
    const periods = hrSettings.periodicOptions;

    const [cycles, setCycles] = useState<ExtendedCampaignModel[]>([]);
    const [currentCycle, setCurrentCycle] = useState<ExtendedCampaignModel | null>(null);
    const [testingMode] = useState(true); // Set to true for testing purposes

    const [totalScores, setTotalScores] = useState<{
        performanceScore: number;
        objectiveScore: number;
        competencyScore: number;
    }>({
        performanceScore: 0,
        objectiveScore: 0,
        competencyScore: 0,
    });
    const [currentCampaignScores, setCurrentCampaignScores] = useState<{
        performanceScore: number;
        objectiveScore: number;
        competencyScore: number;
    }>({
        performanceScore: 0,
        objectiveScore: 0,
        competencyScore: 0,
    });
    const [employeeFilter, setEmployeeFilter] = useState<boolean>(false);
    const [context, setContext] = useState<"employee" | "manager">("employee");

    // Eps averaging
    useEffect(() => {
        let totalPerformanceScore = 0;
        let totalObjectiveScore = 0;
        let totalCompetencyScore = 0;
        let length = 0;

        let performanceScore = 0;
        let objectiveScore = 0;
        let competencyScore = 0;

        const filteredEmployees =
            context === "manager"
                ? employees.filter(e => userData?.reportees?.includes(e.uid))
                : employees.filter(e => userData?.uid == e.uid);

        filteredEmployees.map(emp => {
            const pastPerformances = emp.performance || [];
            const currentPerformance = pastPerformances?.find(
                doc => doc.campaignId === currentCycle?.id,
            );
            const allPerformance = pastPerformances?.filter(p =>
                cycles.some(c => c.id == p.campaignId),
            );

            allPerformance?.map(p => {
                totalPerformanceScore += p.performanceScore;
                totalObjectiveScore += p.objectiveScore;
                totalCompetencyScore += p.competencyScore;
                length += 1;
            });

            if (currentPerformance) {
                performanceScore += currentPerformance.performanceScore;
                objectiveScore += currentPerformance.objectiveScore;
                competencyScore += currentPerformance.competencyScore;
            }
        });

        setTotalScores({
            performanceScore: length > 0 ? totalPerformanceScore / length : 0,
            objectiveScore: length > 0 ? totalObjectiveScore / length : 0,
            competencyScore: length > 0 ? totalCompetencyScore / length : 0,
        });

        if (context === "employee") {
            setCurrentCampaignScores({
                performanceScore:
                    userData?.performance?.find(p => p.campaignId === currentCycle?.id)
                        ?.performanceScore ?? 0,
                objectiveScore:
                    userData?.performance?.find(p => p.campaignId === currentCycle?.id)
                        ?.objectiveScore ?? 0,
                competencyScore:
                    userData?.performance?.find(p => p.campaignId === currentCycle?.id)
                        ?.competencyScore ?? 0,
            });
        } else if (context === "manager") {
            // Calculate current campaign scores for manager (team averages)
            const teamSize = filteredEmployees.length;
            if (teamSize > 0) {
                setCurrentCampaignScores({
                    performanceScore: performanceScore / teamSize,
                    objectiveScore: objectiveScore / teamSize,
                    competencyScore: competencyScore / teamSize,
                });
            } else {
                setCurrentCampaignScores({
                    performanceScore: 0,
                    objectiveScore: 0,
                    competencyScore: 0,
                });
            }
        }
    }, [employees, currentCycle?.id, cycles, context, userData?.reportees]);

    useEffect(() => {
        const campaigns = evaluationCampaigns.map(c => {
            const period = periods.find(p => p.id == c.periodID);
            const cycleEnded = dayjs(c.endDate, dateFormat).isBefore(dayjs(), "days");

            return {
                ...c,
                periodName: period?.periodName ?? "",
                periodYear: period?.year ?? 0,
                roundName: period?.evaluations.find(r => r.id == c.roundID)?.round ?? "",
                cycleEnded,
            };
        });

        setCycles(campaigns);

        setCurrentCycle(prev => {
            if (prev && campaigns.some(c => c.id === prev.id)) {
                return campaigns.find(c => c.id === prev.id) || prev;
            }

            const now = dayjs().valueOf();
            const activeCampaign = campaigns.find(c => {
                const start = dayjs(c.startDate, dateFormat).startOf("day").valueOf();
                const end = dayjs(c.endDate, dateFormat).endOf("day").valueOf();
                return now >= start && now <= end;
            });
            return activeCampaign || campaigns[0] || null;
        });
    }, [evaluationCampaigns, periods]);

    const isActionAllowed = (action: string): boolean => {
        if (!currentCycle) return false;
        if (testingMode) return true;

        switch (action) {
            case "set_objectives":
                return canAccessPhase("objective-setting");
            case "self_assessment":
                return canAccessPhase("self-assessment");
            case "manager_review":
                return canAccessPhase("manager-review");
            case "calibration":
                return canAccessPhase("calibration");
            case "feedback":
                return canAccessPhase("feedback");
            default:
                return true;
        }
    };

    const getCycleProgress = (): number => {
        if (!currentCycle) return 0;

        const now = dayjs();
        const start = dayjs(currentCycle.startDate, "MMMM, DD YYYY");
        const end = dayjs(currentCycle.endDate, "MMMM, DD YYYY");

        if (!start.isValid() || !end.isValid()) return 0;

        if (now.isBefore(start)) return 0;
        if (now.isAfter(end)) return 100;

        const progress =
            ((now.valueOf() - start.valueOf()) / (end.valueOf() - start.valueOf())) * 100;
        return Math.round(progress);
    };

    const canAccessPhase = (phaseType: string): boolean => {
        return true;
    };

    const getTimeRemaining = (): string => {
        if (!currentCycle) return "No cycle selected";

        const now = dayjs();
        const end = dayjs(currentCycle.endDate, "MMMM DD, YYYY");

        if (!end.isValid()) return "Invalid date";
        if (now.isAfter(end)) return "Ended";

        const diffDays = end.diff(now, "day");

        if (diffDays === 1) return "1 day remaining";
        if (diffDays < 30) return `${diffDays} days remaining`;

        const diffMonths = Math.floor(diffDays / 30);
        return `${diffMonths} month${diffMonths > 1 ? "s" : ""} remaining`;
    };

    const getCycleStatusIndicator = (): "Closed" | "Open" | "Incoming" => {
        if (!currentCycle) return "Closed";

        const now = dayjs();
        const start = dayjs(currentCycle.startDate, dateFormat);
        const end = dayjs(currentCycle.endDate, dateFormat);

        if (!start.isValid() || !end.isValid()) return "Closed";

        if (now.isBefore(start, "day")) return "Incoming";
        if (now.isAfter(end, "day")) return "Closed";

        return "Open";
    };

    return (
        <CycleContext.Provider
            value={{
                cycles,
                currentCycle,
                totalScores,
                currentCampaignScores,
                setCurrentCycle,
                isActionAllowed,
                getTimeRemaining,
                getCycleProgress,
                getCycleStatusIndicator,
                canAccessPhase,
                setEmployeeFilter,
                context,
                setContext,
            }}
        >
            {children}
        </CycleContext.Provider>
    );
}

export function useCycle() {
    const context = useContext(CycleContext);
    if (context === undefined) {
        throw new Error("useCycle must be used within a CycleProvider");
    }
    return context;
}
