"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
} from "recharts";
import {
    TrendingUp,
    Users,
    Target,
    Award,
    BarChart3,
    Calendar,
    CheckCircle,
    Clock,
    AlertTriangle,
    Download,
    ThumbsUp,
    ThumbsDown,
} from "lucide-react";
import { useCycle } from "@/context/cycleContext";
import { useAuth } from "@/context/authContext";
import { useFirestore } from "@/context/firestore-context";
import { performanceEvaluationService } from "@/lib/backend/api/performance-management/performance-evaluation-service";
import { dateFormat } from "@/lib/util/dayjs_format";
import { toast } from "sonner";

interface PerformanceAnalyticsDashboardProps {
    userRole?: "employee" | "manager" | "hr";
    employeeId?: string;
    managerId?: string;
}

export function PerformanceAnalyticsDashboard({
    userRole = "employee",
    employeeId = "emp-1",
    managerId = "mgr-1",
}: PerformanceAnalyticsDashboardProps) {
    const { currentCycle } = useCycle();
    const { userData } = useAuth();
    const {
        performanceEvaluations,
        employees,
        objectives,
        competenceAssessments,
        competenceValues,
        hrSettings,
    } = useFirestore();
    const [activeTab, setActiveTab] = useState("overview");
    const [showRefusalDialog, setShowRefusalDialog] = useState(false);
    const [refusalReason, setRefusalReason] = useState("");
    const [selectedEvaluation, setSelectedEvaluation] = useState<any>(null);
    const [isAccepting, setIsAccepting] = useState(false);
    const [isRefusing, setIsRefusing] = useState(false);
    const [showAcceptConfirm, setShowAcceptConfirm] = useState(false);

    // Calculate current employee's scores from their performance array
    const getCurrentEmployeeScores = () => {
        if (!userData?.uid || !currentCycle?.id) {
            return { objectiveScore: 0, competencyScore: 0, performanceScore: 0 };
        }

        // Find current employee
        const currentEmployee = employees.find(emp => emp.uid === userData.uid);

        if (!currentEmployee?.performance) {
            return { objectiveScore: 0, competencyScore: 0, performanceScore: 0 };
        }

        // Find performance record for current cycle
        const currentPerformance = currentEmployee.performance.find(
            perf => perf.campaignId === currentCycle.id,
        );

        // If performance record exists, return actual scores
        if (currentPerformance) {
            return {
                objectiveScore: currentPerformance.objectiveScore,
                competencyScore: currentPerformance.competencyScore,
                performanceScore: currentPerformance.performanceScore,
            };
        }

        // If no performance record found, return 0
        return { objectiveScore: 0, competencyScore: 0, performanceScore: 0 };
    };

    const currentEmployeeScores = getCurrentEmployeeScores();

    // Calculate real analytics data from employee's evaluation and objectives
    const getPerformanceData = () => {
        const employeeObjectives = objectives.filter(obj => obj.employee === userData?.uid);
        const employeeCompetencies = competenceValues.filter(
            comp => comp.employeeUid === userData?.uid,
        );

        const approvedObjectives = employeeObjectives.filter(
            obj => obj.status === "Approved" || obj.status === "Acknowledged",
        ).length;
        const createdObjectives = employeeObjectives.filter(obj => obj.status === "Created").length;
        const refusedObjectives = employeeObjectives.filter(obj => obj.status === "Refused").length;

        const assessedCompetencies = employeeCompetencies.length;
        const aboveThresholdCompetencies = employeeCompetencies.filter(
            comp => comp.value !== null && comp.value >= comp.threshold,
        ).length;
        const belowThresholdCompetencies = employeeCompetencies.filter(
            comp => comp.value !== null && comp.value < comp.threshold,
        ).length;

        return {
            objectives: {
                total: employeeObjectives.length,
                completed: approvedObjectives,
                inProgress: createdObjectives,
                overdue: refusedObjectives,
                averageProgress:
                    employeeObjectives.length > 0
                        ? Math.round((approvedObjectives / employeeObjectives.length) * 100)
                        : 0,
                averageRating: currentEmployeeScores.objectiveScore,
            },
            competencies: {
                total: competenceValues.length,
                assessed: assessedCompetencies,
                aboveThreshold: aboveThresholdCompetencies,
                belowThreshold: belowThresholdCompetencies,
                averageScore: currentEmployeeScores.competencyScore,
                gapAnalysisScore:
                    assessedCompetencies > 0
                        ? Math.round((belowThresholdCompetencies / assessedCompetencies) * 100)
                        : 0,
            },
            team: {
                size: 1,
                activeMembers: 1,
                completionRate:
                    currentEmployeeScores.objectiveScore > 0
                        ? Math.round((currentEmployeeScores.objectiveScore / 5) * 100)
                        : 0,
                averagePerformance: currentEmployeeScores.objectiveScore,
                pendingReviews: performanceEvaluations.filter(
                    pe =>
                        pe.employeeUid === userData?.uid &&
                        pe.confirmationStatus === "Not Confirmed",
                ).length,
            },
        };
    };

    const performanceData = getPerformanceData();

    // Generate real objective progress data from employee's objectives
    const getObjectiveProgressData = () => {
        const employeeObjectives = objectives.filter(obj => obj.employee === userData?.uid);

        // Group objectives by month based on target date
        const monthlyData: {
            [key: string]: { completed: number; inProgress: number; planned: number };
        } = {};

        employeeObjectives.forEach(obj => {
            const month = new Date(obj.targetDate).toLocaleDateString("en-US", { month: "short" });
            if (!monthlyData[month]) {
                monthlyData[month] = { completed: 0, inProgress: 0, planned: 0 };
            }

            if (obj.status === "Approved") {
                monthlyData[month].completed++;
            } else if (obj.status === "Created") {
                monthlyData[month].inProgress++;
            } else {
                monthlyData[month].planned++;
            }
        });

        // Convert to array format and take last 4 months
        return Object.entries(monthlyData)
            .slice(-4)
            .map(([month, data]) => ({
                month,
                completed: data.completed,
                inProgress: data.inProgress,
                planned: data.planned,
            }));
    };

    const objectiveProgressData = getObjectiveProgressData();

    // Generate real competency radar data from employee's assessments
    const getCompetencyRadarData = () => {
        const employeeCompetencies = competenceValues.filter(
            comp => comp.employeeUid === userData?.uid,
        );

        if (employeeCompetencies.length === 0) {
            return [
                { skill: "Technical", score: 0, threshold: 3.0, managerScore: 0 },
                { skill: "Leadership", score: 0, threshold: 3.0, managerScore: 0 },
                { skill: "Communication", score: 0, threshold: 3.0, managerScore: 0 },
                { skill: "Problem Solving", score: 0, threshold: 3.0, managerScore: 0 },
                { skill: "Teamwork", score: 0, threshold: 3.0, managerScore: 0 },
            ];
        }

        // Get manager assessments for this employee
        const managerAssessments = competenceAssessments.filter(
            ca =>
                ca.for === userData?.uid &&
                ca.assessment.some(a => a.campaignId === currentCycle?.id),
        );

        // Group competencies by skill and calculate averages
        const competencyGroups: {
            [key: string]: {
                total: number;
                count: number;
                threshold: number;
                managerTotal: number;
                managerCount: number;
            };
        } = {};

        employeeCompetencies.forEach(comp => {
            const competency = hrSettings.competencies.find(c => c.id === comp.competenceId);
            if (competency) {
                const skillName = competency.competenceName || "Unknown Skill";
                if (!competencyGroups[skillName]) {
                    competencyGroups[skillName] = {
                        total: 0,
                        count: 0,
                        threshold: comp.threshold,
                        managerTotal: 0,
                        managerCount: 0,
                    };
                }
                if (comp.value !== null) {
                    competencyGroups[skillName].total += comp.value;
                    competencyGroups[skillName].count += 1;
                }

                // Get manager score for this competency
                const managerAssessment = managerAssessments
                    .flatMap(ca => ca.assessment)
                    .find(a => a.campaignId === currentCycle?.id);
                if (managerAssessment) {
                    const managerValue = managerAssessment.competenceValues.find(
                        cv => cv.competenceId === comp.competenceId,
                    );
                    if (managerValue?.value !== null && managerValue?.value !== undefined) {
                        competencyGroups[skillName].managerTotal += managerValue.value;
                        competencyGroups[skillName].managerCount += 1;
                    }
                }
            }
        });

        // Convert to radar data format
        return Object.entries(competencyGroups)
            .slice(0, 5)
            .map(([skill, data]) => ({
                skill: skill,
                score: data.count > 0 ? data.total / data.count : 0,
                threshold: data.threshold,
                managerScore: data.managerCount > 0 ? data.managerTotal / data.managerCount : 0,
            }));
    };

    const competencyRadarData = getCompetencyRadarData();

    // Get manager competency assessment details for display
    const getManagerCompetencyAssessment = () => {
        if (!userData?.uid || !currentCycle?.id) return [];

        const managerAssessments = competenceAssessments.filter(
            ca =>
                ca.for === userData?.uid &&
                ca.assessment.some(a => a.campaignId === currentCycle?.id),
        );

        if (managerAssessments.length === 0) return [];

        const managerAssessment = managerAssessments
            .flatMap(ca => ca.assessment)
            .find(a => a.campaignId === currentCycle?.id);

        if (!managerAssessment) return [];

        return managerAssessment.competenceValues.map(cv => {
            const competency = hrSettings.competencies.find(c => c.id === cv.competenceId);
            return {
                skillName: competency?.competenceName || "Unknown",
                managerScore: cv.value,
                managerComment: cv.managerComment,
                threshold: cv.threshold,
            };
        });
    };

    const managerCompetencyAssessment = getManagerCompetencyAssessment();

    // Generate real team performance data for managers
    const getTeamPerformanceData = () => {
        if (userRole !== "manager" || !userData?.reportees) {
            return [];
        }

        return userData.reportees
            .slice(0, 4)
            .map((employeeUid, index) => {
                const employee = employees.find(emp => emp.uid === employeeUid);
                if (!employee) return null;

                // Find employee's performance for current cycle
                const employeePerformance = employee.performance?.find(
                    perf => perf.campaignId === currentCycle?.id,
                );

                return {
                    name: `${employee.firstName} ${employee.surname}`,
                    objectives: employeePerformance?.objectiveScore || 0,
                    competencies: employeePerformance?.competencyScore || 0,
                    overall: employeePerformance?.performanceScore || 0,
                };
            })
            .filter(Boolean);
    };

    const teamPerformanceData = getTeamPerformanceData();

    // Generate real status distribution from employee's objectives
    const getStatusDistribution = () => {
        const employeeObjectives = objectives.filter(obj => obj.employee === userData?.uid);

        const completed = employeeObjectives.filter(obj => obj.status === "Approved").length;
        const inProgress = employeeObjectives.filter(obj => obj.status === "Created").length;
        const overdue = employeeObjectives.filter(obj => obj.status === "Refused").length;

        return [
            { name: "Completed", value: completed, color: "#10b981" },
            { name: "In Progress", value: inProgress, color: "#3b82f6" },
            { name: "Overdue", value: overdue, color: "#ef4444" },
        ].filter(item => item.value > 0); // Only show categories with values
    };

    const statusDistribution = getStatusDistribution();

    const renderOverviewStats = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-muted-foreground">
                                Objectives Progress
                            </p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-foreground">
                                {performanceData.objectives.averageProgress}%
                            </p>
                            <div className="flex items-center gap-1 mt-1">
                                <TrendingUp className="h-3 w-3 text-green-500" />
                                <span className="text-xs text-green-600">+5% from last month</span>
                            </div>
                        </div>
                        <Target className="h-8 w-8 text-blue-500" />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-muted-foreground">
                                Competency Score
                            </p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-foreground">
                                {performanceData.competencies.averageScore.toFixed(1)}
                            </p>
                            <div className="flex items-center gap-1 mt-1">
                                <TrendingUp className="h-3 w-3 text-green-500" />
                                <span className="text-xs text-green-600">+0.3 from last cycle</span>
                            </div>
                        </div>
                        <Award className="h-8 w-8 text-yellow-500" />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-muted-foreground">
                                Objectives Completion
                            </p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-foreground">
                                {performanceData.team.completionRate}%
                            </p>
                            <div className="flex items-center gap-1 mt-1">
                                <CheckCircle className="h-3 w-3 text-green-500" />
                                <span className="text-xs text-green-600">
                                    Based on objective score
                                </span>
                            </div>
                        </div>
                        <Target className="h-8 w-8 text-purple-500" />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600 dark:text-muted-foreground">
                                {userRole === "manager" ? "Team Size" : "Overall Rating"}
                            </p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-foreground">
                                {userRole === "manager"
                                    ? performanceData.team.size
                                    : currentEmployeeScores.performanceScore.toFixed(1)}
                            </p>
                            <div className="flex items-center gap-1 mt-1">
                                <Users className="h-3 w-3 text-blue-500" />
                                <span className="text-xs text-blue-600">
                                    {userRole === "manager" ? "Active members" : "Overall Score"}
                                </span>
                            </div>
                        </div>
                        <Users className="h-8 w-8 text-green-500" />
                    </div>
                </CardContent>
            </Card>
        </div>
    );

    const renderObjectiveAnalytics = () => (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Objective Progress Trend</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={objectiveProgressData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="completed" stackId="a" fill="#10b981" name="Completed" />
                            <Bar
                                dataKey="inProgress"
                                stackId="a"
                                fill="#3b82f6"
                                name="In Progress"
                            />
                            <Bar dataKey="planned" stackId="a" fill="#6b7280" name="Planned" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={statusDistribution}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) =>
                                    `${name} ${(percent * 100).toFixed(0)}%`
                                }
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {statusDistribution.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );

    const renderCompetencyAnalytics = () => (
        <div className="space-y-6">
            {/* Competency Radar Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Competency Radar</CardTitle>
                        <CardDescription>
                            Self-assessment vs Manager assessment comparison
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <RadarChart data={competencyRadarData}>
                                <PolarGrid />
                                <PolarAngleAxis dataKey="skill" />
                                <PolarRadiusAxis domain={[0, 5]} />
                                <Radar
                                    name="Self Assessment"
                                    dataKey="score"
                                    stroke="#3b82f6"
                                    fill="#3b82f6"
                                    fillOpacity={0.3}
                                />
                                <Radar
                                    name="Manager Assessment"
                                    dataKey="managerScore"
                                    stroke="#10b981"
                                    fill="#10b981"
                                    fillOpacity={0.3}
                                />
                                <Radar
                                    name="Threshold"
                                    dataKey="threshold"
                                    stroke="#ef4444"
                                    fill="transparent"
                                    strokeDasharray="5 5"
                                />
                                <Tooltip />
                            </RadarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Competency Progress</CardTitle>
                        <CardDescription>Your self-assessment scores</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {competencyRadarData.map(item => (
                            <div key={item.skill} className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="font-medium">{item.skill}</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-600">
                                            {item.score.toFixed(1)}/5.0
                                        </span>
                                        {item.score >= item.threshold ? (
                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                        ) : (
                                            <AlertTriangle className="h-4 w-4 text-orange-500" />
                                        )}
                                    </div>
                                </div>
                                <Progress value={(item.score / 5) * 100} className="h-2" />
                                <div className="flex justify-between text-xs text-gray-500">
                                    <span>Threshold: {item.threshold}</span>
                                    <span>
                                        {item.score >= item.threshold
                                            ? "Above threshold"
                                            : `Gap: ${(item.threshold - item.score).toFixed(1)}`}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            {/* Manager Competency Assessment */}
            {managerCompetencyAssessment.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Award className="h-5 w-5 text-green-500" />
                            Manager Competency Assessment
                        </CardTitle>
                        <CardDescription>
                            Your manager's evaluation of your competencies
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {managerCompetencyAssessment.map((assessment, index) => (
                                <div
                                    key={index}
                                    className="border rounded-lg p-4 dark:border-gray-700"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <h4 className="font-medium text-gray-900 dark:text-foreground">
                                                {assessment.skillName}
                                            </h4>
                                            <span className="text-xs text-gray-500">
                                                Threshold: {assessment.threshold}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge
                                                className={`${
                                                    assessment.managerScore !== null &&
                                                    assessment.managerScore >= assessment.threshold
                                                        ? "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300"
                                                        : "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300"
                                                }`}
                                            >
                                                Score:{" "}
                                                {assessment.managerScore !== null
                                                    ? `${assessment.managerScore}/5`
                                                    : "Not rated"}
                                            </Badge>
                                            {assessment.managerScore !== null &&
                                            assessment.managerScore >= assessment.threshold ? (
                                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                                ) : (
                                                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                                                )}
                                        </div>
                                    </div>
                                    {assessment.managerComment && (
                                        <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                                <span className="font-medium">
                                                    Manager Comment:
                                                </span>{" "}
                                                {assessment.managerComment}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );

    const renderTeamAnalytics = () => (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Team Performance Overview</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={teamPerformanceData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="objectives" fill="#3b82f6" name="Objectives" />
                            <Bar dataKey="competencies" fill="#10b981" name="Competencies" />
                            <Bar dataKey="overall" fill="#8b5cf6" name="Overall" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-muted-foreground">
                                    Active Members
                                </p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-foreground">
                                    {performanceData.team.activeMembers}
                                </p>
                            </div>
                            <Users className="h-8 w-8 text-blue-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-muted-foreground">
                                    Pending Reviews
                                </p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-foreground">
                                    {performanceData.team.pendingReviews}
                                </p>
                            </div>
                            <Clock className="h-8 w-8 text-orange-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600 dark:text-muted-foreground">
                                    Avg Performance
                                </p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-foreground">
                                    {performanceData.team.averagePerformance.toFixed(1)}
                                </p>
                            </div>
                            <TrendingUp className="h-8 w-8 text-green-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );

    // Get current employee's performance evaluation
    const getCurrentEmployeeEvaluation = () => {
        if (!userData?.uid || !currentCycle?.id) return null;
        return performanceEvaluations.find(
            pe => pe.employeeUid === userData.uid && pe.campaignID === currentCycle.id,
        );
    };

    const currentEvaluation = getCurrentEmployeeEvaluation();

    const handleAcceptEvaluation = async () => {
        if (!currentEvaluation) return;

        setShowAcceptConfirm(false);
        setIsAccepting(true);
        try {
            await performanceEvaluationService.update(currentEvaluation.id, {
                confirmationStatus: "Accepted",
                stage: "Closed",
            });
            toast.success("Performance evaluation accepted successfully!");
        } catch (error) {
            console.error("Error accepting evaluation:", error);
            toast.error("Failed to accept performance evaluation");
        } finally {
            setIsAccepting(false);
        }
    };

    const handleRefuseEvaluation = async () => {
        if (!currentEvaluation || !refusalReason.trim()) return;

        setIsRefusing(true);
        try {
            await performanceEvaluationService.update(currentEvaluation.id, {
                confirmationStatus: "Refused",
                comment: refusalReason.trim(),
            });
            toast.success("Performance evaluation refused. Your feedback has been recorded.");
            setShowRefusalDialog(false);
            setRefusalReason("");
        } catch (error) {
            console.error("Error refusing evaluation:", error);
            toast.error("Failed to refuse performance evaluation");
        } finally {
            setIsRefusing(false);
        }
    };

    const renderCycleTimeline = () => (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Cycle Timeline
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {/* Placeholder for cycle phases - phases property doesn't exist on ExtendedCampaignModel */}
                    <div className="text-center py-8">
                        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 dark:text-muted-foreground">
                            Cycle phases information not available
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-foreground">
                        Performance Analytics
                    </h1>
                    <p className="text-gray-600 dark:text-muted-foreground">
                        {currentCycle
                            ? `Insights and analytics for ${currentCycle.campaignName}`
                            : "Comprehensive performance insights and analytics"}
                    </p>
                </div>
                <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                    <Download className="h-4 w-4" />
                    Export Report
                </Button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="objectives">Objectives</TabsTrigger>
                    <TabsTrigger value="competencies">Competencies</TabsTrigger>
                    {userRole === "manager" && <TabsTrigger value="team">Team</TabsTrigger>}
                    <TabsTrigger value="timeline">Timeline</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                    {renderOverviewStats()}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Performance Trend</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={200}>
                                    <LineChart data={objectiveProgressData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="month" />
                                        <YAxis />
                                        <Tooltip />
                                        <Line
                                            type="monotone"
                                            dataKey="completed"
                                            stroke="#10b981"
                                            strokeWidth={2}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                        {renderCycleTimeline()}
                    </div>
                </TabsContent>

                <TabsContent value="objectives">{renderObjectiveAnalytics()}</TabsContent>

                <TabsContent value="competencies">{renderCompetencyAnalytics()}</TabsContent>

                {userRole === "manager" && (
                    <TabsContent value="team">{renderTeamAnalytics()}</TabsContent>
                )}

                <TabsContent value="timeline">
                    <div className="space-y-6">{renderCycleTimeline()}</div>
                </TabsContent>
            </Tabs>

            {/* Accept Confirmation Dialog */}
            <Dialog open={showAcceptConfirm} onOpenChange={setShowAcceptConfirm}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Accept Performance Evaluation</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to accept this performance evaluation? This action
                            cannot be undone and will finalize your evaluation for{" "}
                            {currentCycle?.campaignName || "this period"}.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAcceptConfirm(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAcceptEvaluation}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            Yes, Accept Evaluation
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Refusal Reason Dialog */}
            <Dialog open={showRefusalDialog} onOpenChange={setShowRefusalDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Refuse Performance Evaluation</DialogTitle>
                        <DialogDescription>
                            Please provide a reason for refusing this performance evaluation. Your
                            feedback will be recorded and shared with management.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="refusal-reason">Reason for Refusal</Label>
                            <Textarea
                                id="refusal-reason"
                                placeholder="Please explain why you are refusing this evaluation..."
                                value={refusalReason}
                                onChange={e => setRefusalReason(e.target.value)}
                                rows={4}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowRefusalDialog(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleRefuseEvaluation}
                            disabled={!refusalReason.trim() || isRefusing}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {isRefusing ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Submitting...
                                </>
                            ) : (
                                "Submit Refusal"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
