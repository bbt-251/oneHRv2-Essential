"use client";

import { useState } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, BarChart3, CheckCircle } from "lucide-react";
import { CompetencySelfAssessment } from "./competency-self-assessment";
import CompetencyGapAnalysisComponent from "./competency-gap-analysis";
import { useCycle } from "@/context/cycleContext";
import { useAuth } from "@/context/authContext";
import { useFirestore } from "@/context/firestore-context";
import type {
    CompetenceValueModel,
    CompetenceAssessmentModel,
} from "@/lib/models/competenceAssessment";

type CompetencyPhase = "self-assessment" | "manager-weighting" | "manager-review" | "gap-analysis";

export function CompetencyModule() {
    const { currentCycle, isActionAllowed } = useCycle();
    const { userData } = useAuth();
    const { competenceValues, competenceAssessments } = useFirestore();
    const [activePhase, setActivePhase] = useState<CompetencyPhase>("self-assessment");

    // Get current employee data
    const currentEmployeeId = userData?.uid;

    // Check if self-assessment is completed
    const selfAssessmentCompleted = competenceValues.some(
        (cv: CompetenceValueModel) => cv.employeeUid === currentEmployeeId && cv.value !== null,
    );

    // Check if manager review is completed
    const managerReviewCompleted = competenceAssessments.some(
        (ca: CompetenceAssessmentModel) => ca.for === currentEmployeeId && ca.assessment.length > 0,
    );

    // Determine competency cycle status based on real data
    const competencyStatus = {
        selfAssessmentCompleted: selfAssessmentCompleted,
        managerWeightingCompleted: false, // Would check if weights are set
        managerReviewCompleted: managerReviewCompleted,
        gapAnalysisGenerated: managerReviewCompleted, // Gap analysis can be generated if review is complete
        phases: [
            {
                phase: "self-assessment" as const,
                isOpen: isActionAllowed("self-assessment"),
                deadline: currentCycle?.endDate,
                isOverdue: false,
                completedAt: selfAssessmentCompleted ? new Date() : undefined,
            },
            {
                phase: "manager-weighting" as const,
                isOpen: isActionAllowed("manager-weighting"),
                deadline: currentCycle?.endDate,
                isOverdue: false,
                completedAt: undefined,
            },
            {
                phase: "manager-review" as const,
                isOpen: isActionAllowed("manager-review"),
                deadline: currentCycle?.endDate,
                isOverdue: false,
                completedAt: managerReviewCompleted ? new Date() : undefined,
            },
            {
                phase: "gap-analysis" as const,
                isOpen: managerReviewCompleted,
                deadline: undefined,
                isOverdue: false,
                completedAt: managerReviewCompleted ? new Date() : undefined,
            },
        ],
    };

    const getPhaseStatus = (phase: CompetencyPhase) => {
        const phaseInfo = competencyStatus.phases.find(p => p.phase === phase);
        if (!phaseInfo) return { status: "locked", color: "gray" };

        if (phaseInfo.completedAt) return { status: "completed", color: "green" };
        if (phaseInfo.isOpen) return { status: "active", color: "blue" };
        if (phaseInfo.isOverdue) return { status: "overdue", color: "red" };
        return { status: "locked", color: "gray" };
    };

    const renderEmployeeView = () => {
        return (
            <Tabs
                value={activePhase}
                onValueChange={value => setActivePhase(value as CompetencyPhase)}
            >
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="self-assessment" className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Self-Assessment
                        {getPhaseStatus("self-assessment").status === "completed" && (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="gap-analysis" className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        Results & Analysis
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="self-assessment" className="mt-6">
                    <CompetencySelfAssessment />
                </TabsContent>

                <TabsContent value="gap-analysis" className="mt-6">
                    <CompetencyGapAnalysisComponent
                        employeeId={currentEmployeeId || ""}
                        viewMode="employee"
                    />
                </TabsContent>
            </Tabs>
        );
    };

    return <div className="space-y-6">{renderEmployeeView()}</div>;
}
