"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, CheckCircle } from "lucide-react";
import { ObjectiveModel } from "@/lib/models/objective-model";
import { EvaluationCampaignModel } from "@/lib/models/performance";
import { ObjectiveWeightModel } from "@/lib/models/objective-weight";

interface ObjectiveCycleProgressProps {
    objectives: ObjectiveModel[];
    currentCycle: EvaluationCampaignModel | null;
    userUid?: string;
    objectiveWeights: ObjectiveWeightModel[];
    type: "Manager" | "Employee";
}

export function ObjectiveCycleProgress({
    objectives,
    currentCycle,
    userUid,
    objectiveWeights,
    type,
}: ObjectiveCycleProgressProps) {
    const hasAcknowledgedObjective = objectives.some(obj => obj.status === "Acknowledged");
    const hasWeightedObjective = objectiveWeights.some(
        ow =>
            ow.campaignId === currentCycle?.id &&
            ow.objectiveWeights.some(w =>
                objectives.some(obj => obj.id === w.objectiveId) &&
                w.weight != null &&
                type == "Manager"
                    ? true
                    : w.employeeUid === userUid,
            ),
    );
    const hasSelfAssessedObjective = objectives.some(obj => obj.selfEvaluation != null);
    const hasReviewedObjective = objectives.some(obj => obj.managerEvaluation != null);
    function getCycleSteps() {
        if (!currentCycle) return [];

        return [
            {
                label: "Objective Setting",
                status: hasAcknowledgedObjective ? "completed" : "current",
                description: "Set your performance objectives",
            },
            {
                label: "Weighting",
                status: hasWeightedObjective
                    ? "completed"
                    : hasAcknowledgedObjective
                        ? "current"
                        : "pending",
                description: "Manager assigns objective weights",
            },
            {
                label: "Self-Assessment",
                status: hasSelfAssessedObjective
                    ? "completed"
                    : hasWeightedObjective
                        ? "current"
                        : "pending",
                description: "Rate your progress and provide evidence",
            },
            {
                label: "Final Review",
                status: hasReviewedObjective
                    ? "completed"
                    : hasSelfAssessedObjective
                        ? "current"
                        : "pending",
                description: "Manager reviews your performance",
            },
            {
                label: "Result Agreement",
                description: "Agree on final performance rating",
            },
        ];
    }

    const cycleSteps = getCycleSteps();

    return (
        <Card className="border-accent-200 shadow-sm bg-white dark:bg-card dark:border-border">
            <CardHeader>
                <CardTitle className="text-lg font-semibold text-brand-800 dark:text-foreground flex items-center gap-2">
                    <Target className="h-5 w-5 text-brand-600" />
                    Objective Cycle Progress
                </CardTitle>
            </CardHeader>
            <CardContent>
                {/* Desktop Progress Tracker */}
                <div className="hidden md:block">
                    <div className="relative">
                        {/* Progress Line */}
                        <div className="absolute z-0 top-4 left-4 right-4 h-0.5 bg-gray-200 dark:bg-gray-700"></div>
                        <div
                            className="absolute z-1 top-4 left-4 h-0.5 bg-green-500 transition-all duration-500"
                            style={{
                                width: `${(cycleSteps.filter(step => step.status === "completed").length / (cycleSteps.length - 1)) * 100}%`,
                            }}
                        ></div>

                        <div className="flex relative justify-between z-10">
                            {cycleSteps.map((step, index) => (
                                <div
                                    key={step.label}
                                    className="flex flex-col items-center max-w-32"
                                >
                                    <div
                                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold mb-3 border-2 transition-all ${
                                            step.status === "completed"
                                                ? "bg-green-500 text-white border-green-500"
                                                : step.status === "current"
                                                    ? "bg-brand-600 text-white border-brand-600 ring-4 ring-brand-200 dark:ring-brand-800"
                                                    : "bg-white text-gray-500 border-gray-300 dark:bg-gray-800 dark:border-gray-600"
                                        }`}
                                    >
                                        {step.status === "completed" ? (
                                            <CheckCircle className="h-4 w-4" />
                                        ) : (
                                            index + 1
                                        )}
                                    </div>
                                    <span
                                        className={`text-sm font-semibold text-center mb-1 ${
                                            step.status === "current"
                                                ? "text-brand-700 dark:text-brand-300"
                                                : step.status === "completed"
                                                    ? "text-green-700 dark:text-green-300"
                                                    : "text-gray-500"
                                        }`}
                                    >
                                        {step.label}
                                    </span>
                                    <span className="text-xs text-gray-500 text-center dark:text-gray-400">
                                        {step.description}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Mobile Progress Tracker */}
                <div className="md:hidden space-y-4">
                    {cycleSteps.map((step, index) => (
                        <div key={step.label} className="flex items-center gap-4">
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold border-2 flex-shrink-0 ${
                                    step.status === "completed"
                                        ? "bg-green-500 text-white border-green-500"
                                        : step.status === "current"
                                            ? "bg-brand-600 text-white border-brand-600"
                                            : "bg-white text-gray-500 border-gray-300 dark:bg-gray-800 dark:border-gray-600"
                                }`}
                            >
                                {step.status === "completed" ? (
                                    <CheckCircle className="h-4 w-4" />
                                ) : (
                                    index + 1
                                )}
                            </div>
                            <div className="flex-1">
                                <div
                                    className={`font-semibold ${
                                        step.status === "current"
                                            ? "text-brand-700 dark:text-brand-300"
                                            : step.status === "completed"
                                                ? "text-green-700 dark:text-green-300"
                                                : "text-gray-500"
                                    }`}
                                >
                                    {step.label}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                    {step.description}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
