"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Star,
    Users,
    Clock,
    TrendingDown,
    TrendingUp,
    FileText,
    Link2,
    CheckCircle,
    Save,
    Lock,
    Eye,
} from "lucide-react";
import type {
    ManagerCompetencyReview,
    EmployeeSelfAssessment,
    SkillEvidence,
    Skill,
    PositionSkill,
} from "@/lib/models/competency-model";
import { useCycle } from "@/context/cycleContext";
import { useFirestore } from "@/context/firestore-context";
import { EmployeeModel } from "@/lib/models/employee";
import { CompetencePositionAssociationModel } from "@/lib/backend/firebase/hrSettingsService";

interface ManagerCompetencyReviewProps {
    managerId: string;
    onSubmit?: (reviews: ManagerCompetencyReview[]) => void;
}

interface Employee {
    id: string;
    name: string;
    position: string;
    department: string;
    skills: PositionSkill[];
    selfAssessments: EmployeeSelfAssessment[];
    skillWeights?: Record<string, number>;
}

function ManagerCompetencyReviewComponent({ managerId, onSubmit }: ManagerCompetencyReviewProps) {
    const { currentCycle, isActionAllowed } = useCycle();
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
    const [managerReviews, setManagerReviews] = useState<
        Record<string, { score: number; comment: string }>
    >({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);

    const hasUnsavedChanges = useRef(false);
    const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Get data from Firebase
    const { activeEmployees: allEmployees, hrSettings, competenceValues, loading } = useFirestore();
    const competences = hrSettings.competencies;
    const competencePositionAssociations = hrSettings.competencePositionAssociations;

    // Transform employees with their skills and self-assessments
    const employees: Employee[] = allEmployees
        .filter(emp => emp.reportingLineManager === managerId)
        .map(emp => {
            // Get position skills for this employee's position
            const positionSkills = competencePositionAssociations
                .filter(cpa => cpa.pid === emp.employmentPosition && cpa.active === "Yes")
                .map(cpa => ({
                    skillId: cpa.cid,
                    positionId: cpa.pid,
                    threshold: cpa.threshold,
                    weight: undefined,
                    isRequired: true,
                    createdAt: new Date(cpa.createdAt),
                }));

            // Get self-assessments for this employee
            const selfAssessments = competenceValues
                .filter(cv => cv.employeeUid === emp.uid && cv.campaignId === currentCycle?.id)
                .map(cv => ({
                    id: cv.id,
                    employeeId: emp.uid,
                    skillId: cv.competenceId,
                    cycleId: cv.campaignId,
                    selfScore: cv.value || 0,
                    comment: cv.employeeComment || "",
                    evidence: cv.evidenceFile
                        ? [
                            {
                                id: `ev-${cv.id}`,
                                type: "file" as const,
                                name: "Evidence File",
                                url: cv.evidenceFile,
                                uploadedAt: new Date(),
                            },
                        ]
                        : [],
                    submittedAt: new Date(),
                    isDraft: false,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                }));

            return {
                id: emp.uid,
                name: `${emp.firstName} ${emp.surname}`,
                position: emp.employmentPosition,
                department: emp.department,
                skills: positionSkills,
                selfAssessments,
                skillWeights: undefined,
            };
        });

    // Transform competences to skills
    const skills: Skill[] = competences
        .filter(comp => comp.active === "Yes")
        .map(comp => ({
            id: comp.id,
            name: comp.competenceName,
            description: comp.competenceType,
            category: comp.competenceType,
            isActive: comp.active === "Yes",
            createdAt: new Date(comp.createdAt),
            updatedAt: new Date(comp.updatedAt),
        }));

    const canReview = isActionAllowed("manager-review");
    const deadline = (currentCycle as any)?.managerReviewDeadline;
    const selectedEmployee = employees.find(emp => emp.id === selectedEmployeeId);

    useEffect(() => {
        if (
            hasUnsavedChanges.current &&
            selectedEmployeeId &&
            Object.keys(managerReviews).length > 0
        ) {
            // Clear existing timeout
            if (autoSaveTimeoutRef.current) {
                clearTimeout(autoSaveTimeoutRef.current);
            }

            // Set new timeout
            autoSaveTimeoutRef.current = setTimeout(() => {
                handleSave();
            }, 2000);
        }

        return () => {
            if (autoSaveTimeoutRef.current) {
                clearTimeout(autoSaveTimeoutRef.current);
            }
        };
    }, [selectedEmployeeId]);

    const handleSave = useCallback(async () => {
        if (!hasUnsavedChanges.current) return;

        setLastSaved(new Date());
        hasUnsavedChanges.current = false;
    }, [selectedEmployeeId, managerReviews]);

    const handleSubmit = async () => {
        if (!canReview || !selectedEmployee) return;

        setIsSubmitting(true);

        const reviews: ManagerCompetencyReview[] = Object.entries(managerReviews).map(
            ([skillId, review]) => ({
                id: `review-${skillId}-${Date.now()}`,
                managerId,
                employeeId: selectedEmployeeId,
                skillId,
                cycleId: currentCycle?.id || "",
                managerScore: review.score,
                managerComment: review.comment,
                finalizedAt: new Date(),
                isDraft: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            }),
        );

        await new Promise(resolve => setTimeout(resolve, 1000));

        onSubmit?.(reviews);
        setIsSubmitting(false);
    };

    const handleManagerScoreChange = (skillId: string, score: number) => {
        setManagerReviews(prev => ({
            ...prev,
            [skillId]: {
                ...prev[skillId],
                score,
                comment: prev[skillId]?.comment || "",
            },
        }));
        hasUnsavedChanges.current = true;
    };

    const handleManagerCommentChange = (skillId: string, comment: string) => {
        setManagerReviews(prev => ({
            ...prev,
            [skillId]: {
                ...prev[skillId],
                score: prev[skillId]?.score || 0,
                comment,
            },
        }));
        hasUnsavedChanges.current = true;
    };

    const getSkillGap = (skillId: string, managerScore: number) => {
        if (!selectedEmployee) return null;

        const positionSkill = selectedEmployee.skills.find(ps => ps.skillId === skillId);
        if (!positionSkill || !managerScore) return null;

        const gap = positionSkill.threshold - managerScore;
        return {
            gap,
            isBelowThreshold: gap > 0,
            isAboveThreshold: gap < 0,
            meetsThreshold: gap === 0,
        };
    };

    const getSummaryMetrics = () => {
        if (!selectedEmployee)
            return { skillsBelowThreshold: 0, surplusSkills: 0, collectiveThresholdMet: 0 };

        let totalWeightedScore = 0;
        let totalWeightedThreshold = 0;
        let skillsBelowThreshold = 0;
        let surplusSkills = 0;

        selectedEmployee.skills.forEach(positionSkill => {
            const managerReview = managerReviews[positionSkill.skillId];
            if (!managerReview?.score) return;

            const weight = selectedEmployee.skillWeights?.[positionSkill.skillId] || 25; // Default equal weight
            const gap = getSkillGap(positionSkill.skillId, managerReview.score);

            if (gap?.isBelowThreshold) {
                skillsBelowThreshold++;
            } else if (gap?.isAboveThreshold) {
                surplusSkills++;
            }

            totalWeightedScore += (managerReview.score * weight) / 100;
            totalWeightedThreshold += (positionSkill.threshold * weight) / 100;
        });

        const collectiveThresholdMet =
            totalWeightedThreshold > 0 ? (totalWeightedScore / totalWeightedThreshold) * 100 : 0;

        return {
            skillsBelowThreshold,
            surplusSkills,
            collectiveThresholdMet: Math.round(collectiveThresholdMet),
        };
    };

    const renderStarRating = (skillId: string, currentScore: number, disabled: boolean) => {
        return (
            <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                    <button
                        key={star}
                        type="button"
                        disabled={disabled}
                        onClick={() => !disabled && handleManagerScoreChange(skillId, star)}
                        className={`p-1 rounded transition-colors ${
                            disabled
                                ? "cursor-not-allowed opacity-50"
                                : "hover:bg-gray-100 dark:hover:bg-gray-800"
                        }`}
                    >
                        <Star
                            className={`w-5 h-5 transition-colors ${
                                star <= currentScore
                                    ? "fill-blue-500 text-blue-500"
                                    : "text-gray-300 dark:text-gray-600"
                            }`}
                        />
                    </button>
                ))}
                <span className="ml-2 text-sm font-medium">
                    {currentScore > 0 ? `${currentScore}/5` : "Not rated"}
                </span>
            </div>
        );
    };

    const renderEvidence = (evidence: SkillEvidence[]) => {
        if (evidence.length === 0)
            return <span className="text-sm text-gray-500">No evidence provided</span>;

        return (
            <div className="space-y-1">
                {evidence.map(item => (
                    <div key={item.id} className="flex items-center gap-2 text-sm">
                        {item.type === "file" ? (
                            <FileText className="w-4 h-4 text-blue-500" />
                        ) : (
                            <Link2 className="w-4 h-4 text-green-500" />
                        )}
                        <span className="flex-1 truncate">{item.name}</span>
                        <Button variant="ghost" size="sm" className="h-6 px-2">
                            <Eye className="w-3 h-3" />
                        </Button>
                    </div>
                ))}
            </div>
        );
    };

    const summaryMetrics = getSummaryMetrics();

    return (
        <div className="space-y-6">
            {/* Info Bar */}
            <Alert
                className={`${!canReview ? "border-red-200 bg-red-50 dark:bg-red-950" : "border-blue-200 bg-blue-50 dark:bg-blue-950"}`}
            >
                <Clock className="w-4 h-4" />
                <AlertDescription>
                    {canReview ? (
                        deadline ? (
                            <>
                                Review due by <strong>{deadline.toLocaleDateString()}</strong>. See
                                employee self-scores and assess 1–5.
                            </>
                        ) : (
                            "Review employee self-assessments and provide your evaluation for each skill."
                        )
                    ) : (
                        "Manager Review period has ended. You can no longer modify evaluations."
                    )}
                </AlertDescription>
            </Alert>

            {/* Employee Selection */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Select Employee to Review
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Select
                        value={selectedEmployeeId}
                        onValueChange={setSelectedEmployeeId}
                        disabled={!canReview}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Choose an employee to review..." />
                        </SelectTrigger>
                        <SelectContent>
                            {employees.map(employee => (
                                <SelectItem key={employee.id} value={employee.id}>
                                    <div className="flex flex-col">
                                        <span className="font-medium">{employee.name}</span>
                                        <span className="text-sm text-gray-500">
                                            {employee.position} • {employee.department}
                                        </span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            {selectedEmployee && (
                <>
                    {/* Summary Ribbon */}
                    <Card className="border-2 border-blue-200 bg-blue-50 dark:bg-blue-950">
                        <CardContent className="py-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                                <div>
                                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                                        {summaryMetrics.skillsBelowThreshold}
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                        Skills Below Threshold
                                    </div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                        {summaryMetrics.collectiveThresholdMet}%
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                        Collective Threshold Met
                                    </div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                        {summaryMetrics.surplusSkills}
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                        Surplus Skills
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Skills Review */}
                    <div className="space-y-4">
                        {selectedEmployee.skills.map(positionSkill => {
                            const skill = skills.find(s => s.id === positionSkill.skillId);
                            const selfAssessment = selectedEmployee.selfAssessments.find(
                                sa => sa.skillId === positionSkill.skillId,
                            );
                            const managerReview = managerReviews[positionSkill.skillId];
                            const gap = getSkillGap(
                                positionSkill.skillId,
                                managerReview?.score || 0,
                            );
                            const weight = selectedEmployee.skillWeights?.[positionSkill.skillId];

                            if (!skill) return null;

                            return (
                                <Card key={skill.id} className="relative">
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <CardTitle className="text-base">
                                                        {skill.name}
                                                    </CardTitle>
                                                    <Badge variant="secondary" className="text-xs">
                                                        Expected ≥{positionSkill.threshold}
                                                    </Badge>
                                                    {weight && (
                                                        <Badge
                                                            variant="outline"
                                                            className="text-xs"
                                                        >
                                                            Weight {weight}%
                                                        </Badge>
                                                    )}
                                                </div>
                                                {skill.description && (
                                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                                                        {skill.description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="space-y-6">
                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                            {/* Employee Self-Assessment */}
                                            <div className="space-y-3">
                                                <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300">
                                                    Employee Self-Assessment
                                                </h4>
                                                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium">
                                                            Score:
                                                        </span>
                                                        <div className="flex items-center gap-1">
                                                            {[1, 2, 3, 4, 5].map(star => (
                                                                <Star
                                                                    key={star}
                                                                    className={`w-4 h-4 ${
                                                                        star <=
                                                                        (selfAssessment?.selfScore ||
                                                                            0)
                                                                            ? "fill-yellow-400 text-yellow-400"
                                                                            : "text-gray-300 dark:text-gray-600"
                                                                    }`}
                                                                />
                                                            ))}
                                                            <span className="ml-1 text-sm">
                                                                {selfAssessment?.selfScore || 0}/5
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {selfAssessment?.comment && (
                                                        <div>
                                                            <span className="text-sm font-medium">
                                                                Comment:
                                                            </span>
                                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                                {selfAssessment.comment}
                                                            </p>
                                                        </div>
                                                    )}
                                                    <div>
                                                        <span className="text-sm font-medium">
                                                            Evidence:
                                                        </span>
                                                        <div className="mt-1">
                                                            {renderEvidence(
                                                                selfAssessment?.evidence || [],
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Manager Assessment */}
                                            <div className="space-y-3">
                                                <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300">
                                                    Your Assessment
                                                </h4>
                                                <div className="space-y-3">
                                                    <div>
                                                        <label className="text-sm font-medium mb-2 block">
                                                            Manager Score
                                                        </label>
                                                        {renderStarRating(
                                                            skill.id,
                                                            managerReview?.score || 0,
                                                            !canReview,
                                                        )}
                                                    </div>
                                                    <div>
                                                        <label className="text-sm font-medium mb-2 block">
                                                            Manager Comment (Optional)
                                                        </label>
                                                        <Textarea
                                                            placeholder="Provide feedback on the employee's performance..."
                                                            value={managerReview?.comment || ""}
                                                            onChange={e =>
                                                                handleManagerCommentChange(
                                                                    skill.id,
                                                                    e.target.value,
                                                                )
                                                            }
                                                            disabled={!canReview}
                                                            className="min-h-[80px]"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Gap Analysis */}
                                            <div className="space-y-3">
                                                <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300">
                                                    Gap Analysis
                                                </h4>
                                                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                                    {gap && managerReview?.score ? (
                                                        <div className="space-y-2">
                                                            <div
                                                                className={`flex items-center gap-2 text-sm ${
                                                                    gap.isBelowThreshold
                                                                        ? "text-red-600 dark:text-red-400"
                                                                        : gap.isAboveThreshold
                                                                            ? "text-green-600 dark:text-green-400"
                                                                            : "text-blue-600 dark:text-blue-400"
                                                                }`}
                                                            >
                                                                {gap.isBelowThreshold ? (
                                                                    <>
                                                                        <TrendingDown className="w-4 h-4" />
                                                                        Below threshold by {gap.gap}
                                                                    </>
                                                                ) : gap.isAboveThreshold ? (
                                                                    <>
                                                                        <TrendingUp className="w-4 h-4" />
                                                                        Above threshold by{" "}
                                                                        {Math.abs(gap.gap)}
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <CheckCircle className="w-4 h-4" />
                                                                        Meets threshold
                                                                    </>
                                                                )}
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                Target: {positionSkill.threshold} |
                                                                Current: {managerReview.score}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="text-sm text-gray-500">
                                                            Rate skill to see gap analysis
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    {/* Actions */}
                    <Card>
                        <CardContent className="flex items-center justify-between py-4">
                            <div className="flex items-center gap-4">
                                {lastSaved && (
                                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                        <Save className="w-4 h-4" />
                                        Last saved: {lastSaved.toLocaleTimeString()}
                                    </div>
                                )}
                            </div>

                            <Button
                                onClick={handleSubmit}
                                disabled={
                                    !canReview ||
                                    isSubmitting ||
                                    Object.keys(managerReviews).length === 0
                                }
                                className="min-w-[180px]"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                        Finalizing...
                                    </>
                                ) : (
                                    <>
                                        <Lock className="w-4 h-4 mr-2" />
                                        Finalize Competency Review
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}

export default ManagerCompetencyReviewComponent;

export { ManagerCompetencyReviewComponent as ManagerCompetencyReview };
