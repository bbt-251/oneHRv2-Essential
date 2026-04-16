"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
} from "recharts";
import {
    TrendingDown,
    TrendingUp,
    Target,
    Download,
    Plus,
    BookOpen,
    Users,
    Calendar,
    AlertTriangle,
    BarChart3,
    PieChart,
} from "lucide-react";
import type {
    CompetencyGapAnalysis,
    SkillGap,
    DevelopmentAction,
    Skill,
    PositionSkill,
    ManagerCompetencyReview,
    EmployeeSelfAssessment,
    ManagerSkillWeight,
} from "@/lib/models/competency-model";
import { useCycle } from "@/context/cycleContext";
import { useFirestore } from "@/context/firestore-context";
import { useAuth } from "@/context/authContext";

interface CompetencyGapAnalysisProps {
    employeeId?: string;
    managerId?: string;
    viewMode: "manager" | "employee";
    onCreateDevelopmentPlan?: (actions: DevelopmentAction[]) => void;
}

interface Employee {
    id: string;
    name: string;
    position: string;
    department: string;
    skills: PositionSkill[];
    managerReviews: ManagerCompetencyReview[];
    skillWeights?: Record<string, number>;
}

export function CompetencyGapAnalysisComponent({
    employeeId,
    managerId,
    viewMode,
    onCreateDevelopmentPlan,
}: CompetencyGapAnalysisProps) {
    const { currentCycle } = useCycle();
    const { userData } = useAuth();
    const { activeEmployees, hrSettings, competenceValues, competenceAssessments } = useFirestore();
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(employeeId || "");
    const [developmentPlanOpen, setDevelopmentPlanOpen] = useState<boolean>(false);
    const [developmentActions, setDevelopmentActions] = useState<Partial<DevelopmentAction>[]>([]);
    const [isExporting, setIsExporting] = useState<boolean>(false);

    // Get current employee or manager data
    const currentUserId = userData?.uid;
    const currentEmployee = activeEmployees.find(emp => emp.uid === currentUserId);

    // Get skills from hrSettings
    const skills = hrSettings.competencies || [];

    // Get competence position associations
    const competencePositionAssociations = hrSettings.competencePositionAssociations || [];

    // Get competence values for the current cycle
    const cycleId = currentCycle?.id || "";
    const competenceValuesForCycle = competenceValues.filter(
        cv => cv.campaignId === cycleId && cv.employeeUid === selectedEmployeeId,
    );

    // Get competence assessments for the current cycle
    const competenceAssessmentsForCycle = competenceAssessments.filter(ca =>
        ca.assessment.some(a => a.campaignId === cycleId),
    );

    // Find the assessment for the selected employee
    const employeeAssessment = competenceAssessmentsForCycle.find(
        ca => ca.for === selectedEmployeeId,
    );

    // Get manager reviews from assessments
    const managerReviews: ManagerCompetencyReview[] = [];
    if (employeeAssessment) {
        employeeAssessment.assessment.forEach(assessment => {
            // Only include assessments from managers (not self-assessments)
            // A manager is someone who is NOT the employee themselves
            if (assessment.evaluatedBy !== selectedEmployeeId) {
                assessment.competenceValues.forEach(cv => {
                    managerReviews.push({
                        id: cv.id,
                        managerId: assessment.evaluatedBy,
                        employeeId: selectedEmployeeId,
                        skillId: cv.competenceId,
                        cycleId: assessment.campaignId,
                        managerScore: cv.value || 0,
                        managerComment: cv.managerComment || "",
                        finalizedAt: new Date(),
                        isDraft: false,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    });
                });
            }
        });
    }

    // Get skill weights from competence values
    const skillWeights: Record<string, number> = {};
    competenceValuesForCycle.forEach(cv => {
        if (cv.weight) {
            skillWeights[cv.competenceId] = cv.weight;
        }
    });

    // Get position skills for the employee
    const positionSkills: PositionSkill[] = [];
    if (currentEmployee?.employmentPosition) {
        const positionAssociations = competencePositionAssociations.filter(
            assoc => assoc.pid === currentEmployee.employmentPosition,
        );
        positionAssociations.forEach(assoc => {
            positionSkills.push({
                skillId: assoc.cid,
                positionId: assoc.pid,
                threshold: assoc.threshold,
                weight: 25, // Default weight
                isRequired: true,
                createdAt: new Date(),
            });
        });
    }

    // Build employee data
    const selectedEmployee: Employee | null = selectedEmployeeId
        ? {
            id: selectedEmployeeId,
            name:
                  currentEmployee?.firstName && currentEmployee?.surname
                      ? `${currentEmployee.firstName} ${currentEmployee.surname}`
                      : "Employee",
            position: currentEmployee?.employmentPosition || "Unknown",
            department: currentEmployee?.department || "Unknown",
            skills: positionSkills,
            managerReviews: managerReviews,
            skillWeights: skillWeights,
        }
        : null;

    const generateGapAnalysis = (): CompetencyGapAnalysis | null => {
        if (!selectedEmployee) return null;

        const gaps: SkillGap[] = [];
        let totalWeightedScore = 0;
        let totalWeightedThreshold = 0;

        selectedEmployee.skills.forEach(positionSkill => {
            const skill = skills.find(s => s.id === positionSkill.skillId);
            const managerReview = selectedEmployee.managerReviews.find(
                mr => mr.skillId === positionSkill.skillId,
            );

            if (!skill || !managerReview) return;

            const weight = selectedEmployee.skillWeights?.[positionSkill.skillId] || 25;
            const gap = positionSkill.threshold - managerReview.managerScore;
            const isBelowThreshold = gap > 0;
            const isSurplus = gap < 0;

            gaps.push({
                skillId: skill.id,
                skillName: skill.competenceName,
                threshold: positionSkill.threshold,
                managerScore: managerReview.managerScore,
                comment: managerReview.managerComment,
                gap: Math.abs(gap),
                weight,
                isBelowThreshold,
                isSurplus,
            });

            totalWeightedScore += (managerReview.managerScore * weight) / 100;
            totalWeightedThreshold += (positionSkill.threshold * weight) / 100;
        });

        const collectiveThresholdMet =
            totalWeightedThreshold > 0 ? (totalWeightedScore / totalWeightedThreshold) * 100 : 0;

        return {
            employeeId: selectedEmployee.id,
            cycleId: currentCycle?.id || "",
            skillsAnalyzed: gaps.length,
            skillsBelowThreshold: gaps.filter(g => g.isBelowThreshold).length,
            surplusSkills: gaps.filter(g => g.isSurplus).length,
            collectiveThresholdMet: Math.round(collectiveThresholdMet),
            gaps,
            overallScore: Math.round(totalWeightedScore),
            createdAt: new Date(),
        };
    };

    const gapAnalysis = generateGapAnalysis();

    const handleAddDevelopmentAction = () => {
        setDevelopmentActions(prev => [
            ...prev,
            {
                type: "training",
                title: "",
                description: "",
                targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
                status: "planned",
            },
        ]);
    };

    const handleUpdateDevelopmentAction = (index: number, field: string, value: any) => {
        setDevelopmentActions(prev =>
            prev.map((action, i) => (i === index ? { ...action, [field]: value } : action)),
        );
    };

    const handleRemoveDevelopmentAction = (index: number) => {
        setDevelopmentActions(prev => prev.filter((_, i) => i !== index));
    };

    const handleCreateDevelopmentPlan = () => {
        const validActions = developmentActions.filter(
            action => action.title && action.description,
        );

        const fullActions: DevelopmentAction[] = validActions.map((action, index) => ({
            id: `dev-action-${Date.now()}-${index}`,
            skillId: gapAnalysis?.gaps.find(g => g.isBelowThreshold)?.skillId || "",
            employeeId: selectedEmployeeId,
            cycleId: currentCycle?.id || "",
            type: action.type || "training",
            title: action.title || "",
            description: action.description || "",
            targetDate: action.targetDate,
            status: action.status || "planned",
            assignedBy: managerId || "",
            createdAt: new Date(),
            updatedAt: new Date(),
        }));

        onCreateDevelopmentPlan?.(fullActions);
        setDevelopmentPlanOpen(false);
        setDevelopmentActions([]);
    };

    const handleExport = async (format: "pdf" | "csv") => {
        setIsExporting(true);

        // Mock export delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        // In real app, this would trigger actual export
        const filename = `competency-gap-analysis-${selectedEmployee?.name.replace(" ", "-")}-${currentCycle?.campaignName || "current"}.${format}`;

        setIsExporting(false);
    };

    const chartData = gapAnalysis?.gaps.map(gap => ({
        skill: gap.skillName,
        threshold: gap.threshold,
        score: gap.managerScore,
        gap: gap.isBelowThreshold ? gap.gap : 0,
    }));

    const radarData = gapAnalysis?.gaps.map(gap => ({
        skill: gap.skillName.split(" ")[0],
        score: gap.managerScore,
        threshold: gap.threshold,
    }));

    if (!gapAnalysis || !selectedEmployee) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                    <AlertTriangle className="w-12 h-12 text-amber-500 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Analysis Available</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
                        {viewMode === "manager"
                            ? "Select an employee to view their competency gap analysis."
                            : "Your competency review has not been completed yet."}
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header Banner */}
            <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950">
                <Target className="w-4 h-4" />
                <AlertDescription>
                    <strong>
                        Gap Analysis for {selectedEmployee.name},{" "}
                        {currentCycle?.campaignName || "Current Cycle"}
                    </strong>
                </AlertDescription>
            </Alert>

            {/* Employee Selection (Manager View Only) */}
            {viewMode === "manager" && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="w-5 h-5" />
                            Select Employee
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Choose an employee to analyze..." />
                            </SelectTrigger>
                            <SelectContent>
                                {activeEmployees.map(employee => (
                                    <SelectItem key={employee.uid} value={employee.uid}>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{`${employee.firstName} ${employee.surname}`}</span>
                                            <span className="text-sm text-gray-500">
                                                {employee.employmentPosition} •{" "}
                                                {employee.department}
                                            </span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </CardContent>
                </Card>
            )}

            {/* Overall Coverage Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-6">
                        <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                            {gapAnalysis.collectiveThresholdMet}%
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 text-center">
                            Collective Threshold Met
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-6">
                        <div className="text-3xl font-bold text-red-600 dark:text-red-400 mb-2">
                            {gapAnalysis.skillsBelowThreshold}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 text-center">
                            Skills Below Threshold
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-6">
                        <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                            {gapAnalysis.surplusSkills}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 text-center">
                            Surplus Skills
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-6">
                        <div className="text-3xl font-bold text-gray-600 dark:text-gray-400 mb-2">
                            {gapAnalysis.overallScore.toFixed(1)}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 text-center">
                            Overall Score
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Visual Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="w-5 h-5" />
                            Skills Performance
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="skill" />
                                <YAxis domain={[0, 5]} />
                                <Tooltip />
                                <Bar dataKey="threshold" fill="#94a3b8" name="Threshold" />
                                <Bar dataKey="score" fill="#3b82f6" name="Current Score" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <PieChart className="w-5 h-5" />
                            Skills Radar
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <RadarChart data={radarData}>
                                <PolarGrid />
                                <PolarAngleAxis dataKey="skill" />
                                <PolarRadiusAxis domain={[0, 5]} />
                                <Radar
                                    name="Current Score"
                                    dataKey="score"
                                    stroke="#3b82f6"
                                    fill="#3b82f6"
                                    fillOpacity={0.3}
                                />
                                <Radar
                                    name="Threshold"
                                    dataKey="threshold"
                                    stroke="#94a3b8"
                                    fill="transparent"
                                />
                                <Tooltip />
                            </RadarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Skills Below Threshold */}
            {gapAnalysis.skillsBelowThreshold > 0 && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <TrendingDown className="w-5 h-5 text-red-500" />
                                Skills Below Threshold ({gapAnalysis.skillsBelowThreshold})
                            </CardTitle>
                            {viewMode === "manager" && (
                                <Dialog
                                    open={developmentPlanOpen}
                                    onOpenChange={setDevelopmentPlanOpen}
                                >
                                    <DialogTrigger asChild>
                                        <Button variant="outline" size="sm">
                                            <Plus className="w-4 h-4 mr-2" />
                                            Create Development Plan
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-2xl">
                                        <DialogHeader>
                                            <DialogTitle>Create Development Plan</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4 max-h-96 overflow-y-auto">
                                            {developmentActions.map((action, index) => (
                                                <Card key={index}>
                                                    <CardContent className="pt-4 space-y-3">
                                                        <div className="flex items-center justify-between">
                                                            <Label>
                                                                Development Action {index + 1}
                                                            </Label>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() =>
                                                                    handleRemoveDevelopmentAction(
                                                                        index,
                                                                    )
                                                                }
                                                            >
                                                                Remove
                                                            </Button>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div>
                                                                <Label>Type</Label>
                                                                <Select
                                                                    value={action.type}
                                                                    onValueChange={value =>
                                                                        handleUpdateDevelopmentAction(
                                                                            index,
                                                                            "type",
                                                                            value,
                                                                        )
                                                                    }
                                                                >
                                                                    <SelectTrigger>
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="training">
                                                                            Training
                                                                        </SelectItem>
                                                                        <SelectItem value="mentoring">
                                                                            Mentoring
                                                                        </SelectItem>
                                                                        <SelectItem value="project">
                                                                            Project
                                                                        </SelectItem>
                                                                        <SelectItem value="course">
                                                                            Course
                                                                        </SelectItem>
                                                                        <SelectItem value="other">
                                                                            Other
                                                                        </SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                            <div>
                                                                <Label>Target Date</Label>
                                                                <Input
                                                                    type="date"
                                                                    value={
                                                                        action.targetDate
                                                                            ?.toISOString()
                                                                            .split("T")[0]
                                                                    }
                                                                    onChange={e =>
                                                                        handleUpdateDevelopmentAction(
                                                                            index,
                                                                            "targetDate",
                                                                            new Date(
                                                                                e.target.value,
                                                                            ),
                                                                        )
                                                                    }
                                                                />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <Label>Title</Label>
                                                            <Input
                                                                value={action.title}
                                                                onChange={e =>
                                                                    handleUpdateDevelopmentAction(
                                                                        index,
                                                                        "title",
                                                                        e.target.value,
                                                                    )
                                                                }
                                                                placeholder="e.g., API Design Workshop"
                                                            />
                                                        </div>
                                                        <div>
                                                            <Label>Description</Label>
                                                            <Textarea
                                                                value={action.description}
                                                                onChange={e =>
                                                                    handleUpdateDevelopmentAction(
                                                                        index,
                                                                        "description",
                                                                        e.target.value,
                                                                    )
                                                                }
                                                                placeholder="Describe the development action and expected outcomes..."
                                                            />
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                            <Button
                                                variant="outline"
                                                onClick={handleAddDevelopmentAction}
                                                className="w-full bg-transparent"
                                            >
                                                <Plus className="w-4 h-4 mr-2" />
                                                Add Development Action
                                            </Button>
                                        </div>
                                        <div className="flex justify-end gap-2 pt-4">
                                            <Button
                                                variant="outline"
                                                onClick={() => setDevelopmentPlanOpen(false)}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                onClick={handleCreateDevelopmentPlan}
                                                disabled={developmentActions.length === 0}
                                            >
                                                Create Plan
                                            </Button>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Skill</TableHead>
                                    <TableHead>Threshold</TableHead>
                                    <TableHead>Manager Score</TableHead>
                                    <TableHead>Gap</TableHead>
                                    <TableHead>Weight</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {gapAnalysis.gaps
                                    .filter(gap => gap.isBelowThreshold)
                                    .map(gap => (
                                        <TableRow key={gap.skillId}>
                                            <TableCell className="font-medium">
                                                {gap.skillName}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary">≥{gap.threshold}</Badge>
                                            </TableCell>
                                            <TableCell>{gap.managerScore}/5</TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="destructive"
                                                    className="flex items-center gap-1 w-fit"
                                                >
                                                    <TrendingDown className="w-3 h-3" />-{gap.gap}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{gap.weight}%</TableCell>
                                        </TableRow>
                                    ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {/* All Competencies Overview */}
            {gapAnalysis.gaps.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-blue-500" />
                            All Competencies ({gapAnalysis.gaps.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Skill</TableHead>
                                    <TableHead>Threshold</TableHead>
                                    <TableHead>Manager Score</TableHead>
                                    <TableHead>Manager Comment</TableHead>
                                    <TableHead>Weight</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {gapAnalysis.gaps.map(gap => (
                                    <TableRow key={gap.skillId}>
                                        <TableCell className="font-medium">
                                            {gap.skillName}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">≥{gap.threshold}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <span
                                                className={
                                                    gap.isBelowThreshold
                                                        ? "text-red-600 font-medium"
                                                        : gap.isSurplus
                                                            ? "text-green-600 font-medium"
                                                            : ""
                                                }
                                            >
                                                {gap.managerScore}/5
                                            </span>
                                        </TableCell>
                                        <TableCell>{gap.comment || "-"}</TableCell>
                                        <TableCell>{gap.weight}%</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {/* Surplus Skills */}
            {gapAnalysis.surplusSkills > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-green-500" />
                            Surplus Skills ({gapAnalysis.surplusSkills})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Skill</TableHead>
                                    <TableHead>Threshold</TableHead>
                                    <TableHead>Manager Score</TableHead>
                                    <TableHead>Manager Comment</TableHead>
                                    <TableHead>Surplus</TableHead>
                                    <TableHead>Weight</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {gapAnalysis.gaps
                                    .filter(gap => gap.isSurplus)
                                    .map(gap => (
                                        <TableRow key={gap.skillId}>
                                            <TableCell className="font-medium">
                                                {gap.skillName}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary">≥{gap.threshold}</Badge>
                                            </TableCell>
                                            <TableCell>{gap.managerScore}/5</TableCell>
                                            <TableCell>{gap.comment}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="default"
                                                    className="flex items-center gap-1 w-fit bg-green-500"
                                                >
                                                    <TrendingUp className="w-3 h-3" />+{gap.gap}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{gap.weight}%</TableCell>
                                        </TableRow>
                                    ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {/* Actions */}
            {/* <Card>
                <CardContent className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {currentCycle?.campaignName || "Current Cycle"}
                        </Badge>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            onClick={() => handleExport("csv")}
                            disabled={isExporting}
                            className="min-w-[120px]"
                        >
                            {isExporting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2" />
                                    Exporting...
                                </>
                            ) : (
                                <>
                                    <Download className="w-4 h-4 mr-2" />
                                    Export CSV
                                </>
                            )}
                        </Button>

                        <Button
                            variant="outline"
                            onClick={() => handleExport("pdf")}
                            disabled={isExporting}
                            className="min-w-[120px]"
                        >
                            {isExporting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2" />
                                    Exporting...
                                </>
                            ) : (
                                <>
                                    <Download className="w-4 h-4 mr-2" />
                                    Export PDF
                                </>
                            )}
                        </Button>

                        {viewMode === "manager" && (
                            <Button>
                                <BookOpen className="w-4 h-4 mr-2" />
                                Assign Training
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card> */}
        </div>
    );
}

export { CompetencyGapAnalysisComponent as CompetencyGapAnalysis };
export default CompetencyGapAnalysisComponent;
