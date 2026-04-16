"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Download, Eye, X, Target, Award, CheckCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useFirestore } from "@/context/firestore-context";
import {
    calculateEmployeePerformanceScores,
    getEmployeeFullName,
    getDepartmentName,
    getPositionName,
    EnhancedPerformanceEvaluationModel,
} from "@/lib/util/performance/employee-performance-utils";
import { EmployeeModel } from "@/lib/models/employee";
import { ObjectiveModel } from "@/lib/models/objective-model";
import { PDFDownloadLink } from "@react-pdf/renderer";
import EmployeePerformanceReport from "../blocks/performance-report/employee-performance-report";
import { ObjectiveDetailModal } from "../../../employee/performance/blocks/objectives/modals/objective-detail-modal";
import { PeriodicOptionRoundsModel } from "@/lib/models/performance";
import generateID from "@/lib/util/generateID";

interface ViewEmployeePerformanceModalProps {
    isOpen: boolean;
    onClose: () => void;
    employeeUid: string;
    performanceData?: EnhancedPerformanceEvaluationModel;
    selectedYear?: number;
}

export function ViewEmployeePerformanceModal({
    isOpen,
    onClose,
    employeeUid,
    performanceData,
    selectedYear,
}: ViewEmployeePerformanceModalProps) {
    const { employees, objectives, hrSettings, performanceEvaluations, competenceAssessments } =
        useFirestore();
    const [employee, setEmployee] = useState<EmployeeModel | null>(null);
    const [employeeObjectives, setEmployeeObjectives] = useState<ObjectiveModel[]>([]);
    const [showObjectivesModal, setShowObjectivesModal] = useState(false);
    const [showCompetenciesModal, setShowCompetenciesModal] = useState(false);
    const [selectedRound, setSelectedRound] = useState<PeriodicOptionRoundsModel | null>(null);
    const [selectedObjective, setSelectedObjective] = useState<ObjectiveModel | null>(null);

    // Get selected period from hrSettings based on selectedYear prop
    const selectedPeriod = hrSettings.periodicOptions?.find(p => p.year === selectedYear);

    useEffect(() => {
        if (isOpen && employeeUid && selectedPeriod) {
            const emp = employees.find(e => e.uid === employeeUid);
            if (emp) {
                setEmployee(emp);

                // Get objectives for this employee for the selected period
                const empObjectives = objectives.filter(
                    obj => obj.employee === employeeUid && obj.period === selectedPeriod.id,
                );
                setEmployeeObjectives(empObjectives);
            }
        }
    }, [isOpen, employeeUid, employees, objectives, selectedPeriod]);

    if (!isOpen || !employee) return null;

    const performanceScores =
        performanceData?.performanceScores ||
        calculateEmployeePerformanceScores(employee, selectedPeriod, performanceEvaluations);

    const getPerformanceColor = (score: number) => {
        if (score >= 4.0) return "bg-green-50 text-green-700 border-green-200";
        if (score >= 3.0) return "bg-yellow-50 text-yellow-700 border-yellow-200";
        return "bg-red-50 text-red-700 border-red-200";
    };

    // Filter objectives for selected round
    const getObjectivesForRound = (round: string) => {
        if (!selectedPeriod) return [];

        return employeeObjectives.filter(
            obj =>
                obj.employee === employeeUid &&
                obj.period === selectedPeriod.id &&
                obj.round === round.toString(),
        );
    };

    // Filter competencies for selected round - competencies are linked to campaigns, not rounds
    const getCompetenciesForRound = (roundId: string) => {
        if (!selectedPeriod || !roundId) return [];

        // Find the campaign that matches this period and round
        const campaign = hrSettings.evaluationCampaigns?.find(
            c =>
                c.periodID === selectedPeriod.id &&
                c.roundID === roundId &&
                c.associatedEmployees.includes(employeeUid),
        );

        if (!campaign) return [];

        if (!campaign) return [];

        // Find the competence assessment for this employee
        const employeeAssessment = competenceAssessments.find(ca => ca.for === employeeUid);
        if (!employeeAssessment) return [];

        // Get assessments for this specific campaign
        return employeeAssessment.assessment.filter(
            assessment => assessment.campaignId === campaign.id,
        );
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Employee Performance Details</DialogTitle>
                    </DialogHeader>
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <p className="text-gray-600 dark:text-muted-foreground">
                                {getEmployeeFullName(employee)}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="dark:bg-gray-900 dark:border-gray-700"
                            >
                                <Download className="h-4 w-4 mr-2" />
                                {selectedPeriod ? (
                                    <PDFDownloadLink
                                        document={
                                            <EmployeePerformanceReport
                                                employeeUid={employee.uid}
                                                hrSettings={hrSettings}
                                                employees={employees}
                                                objectives={employeeObjectives}
                                                competenceValues={[]}
                                                performanceEvaluations={performanceEvaluations}
                                                competenceAssessments={competenceAssessments}
                                            />
                                        }
                                        fileName={`EmployeePerformanceReport_${selectedPeriod.year}.pdf`}
                                    >
                                        {({ loading }) =>
                                            loading ? "Generating..." : "Export PDF"
                                        }
                                    </PDFDownloadLink>
                                ) : (
                                    <span>Export PDF</span>
                                )}
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Employee Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Employee Information</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-600 dark:text-muted-foreground">
                                            Full Name
                                        </label>
                                        <p className="text-lg font-semibold dark:text-foreground">
                                            {getEmployeeFullName(employee)}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600 dark:text-muted-foreground">
                                            Position
                                        </label>
                                        <p className="text-lg dark:text-foreground">
                                            {getPositionName(
                                                employee.employmentPosition,
                                                hrSettings,
                                            )}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600 dark:text-muted-foreground">
                                            Department
                                        </label>
                                        <p className="text-lg dark:text-foreground">
                                            {getDepartmentName(employee.department, hrSettings)}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600 dark:text-muted-foreground">
                                            Employee ID
                                        </label>
                                        <p className="text-lg dark:text-foreground">
                                            {employee.employeeID}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600 dark:text-muted-foreground">
                                            Performance Year
                                        </label>
                                        <p className="text-lg dark:text-foreground">
                                            {selectedPeriod?.year ||
                                                selectedYear ||
                                                new Date().getFullYear()}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Overall Performance Scores */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Overall Performance Scores</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="text-center">
                                        <div className="text-3xl font-bold mb-2">
                                            <Badge
                                                className={getPerformanceColor(
                                                    performanceScores.overallObjectiveScore,
                                                )}
                                            >
                                                {performanceScores.overallObjectiveScore.toFixed(1)}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-muted-foreground">
                                            Objective Score
                                        </p>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-3xl font-bold mb-2">
                                            <Badge
                                                className={getPerformanceColor(
                                                    performanceScores.overallCompetencyScore,
                                                )}
                                            >
                                                {performanceScores.overallCompetencyScore.toFixed(
                                                    1,
                                                )}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-muted-foreground">
                                            Competency Score
                                        </p>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-3xl font-bold mb-2">
                                            <Badge
                                                className={getPerformanceColor(
                                                    performanceScores.overallPerformanceScore,
                                                )}
                                            >
                                                {performanceScores.overallPerformanceScore.toFixed(
                                                    1,
                                                )}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-muted-foreground">
                                            Overall Performance Score
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Round-by-Round Performance */}
                        {selectedPeriod?.evaluations && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Round-by-Round Performance</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="dark:text-foreground">
                                                    Round
                                                </TableHead>
                                                <TableHead className="dark:text-foreground">
                                                    Period
                                                </TableHead>
                                                <TableHead className="dark:text-foreground">
                                                    Objective Score
                                                </TableHead>
                                                <TableHead className="dark:text-foreground">
                                                    Competency Score
                                                </TableHead>
                                                <TableHead className="dark:text-foreground">
                                                    Performance Score
                                                </TableHead>
                                                <TableHead className="dark:text-foreground">
                                                    Actions
                                                </TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {selectedPeriod.evaluations.map(
                                                (evaluation: any, evalIndex: number) => {
                                                    const roundScore =
                                                        performanceScores.roundScores[
                                                            `round${evaluation.round}`
                                                        ];
                                                    return (
                                                        <TableRow
                                                            key={`round-${evaluation.round}-${evalIndex}`}
                                                            className="dark:border-border"
                                                        >
                                                            <TableCell className="font-medium dark:text-foreground">
                                                                Round {evaluation.round}
                                                            </TableCell>
                                                            <TableCell className="dark:text-foreground">
                                                                {evaluation.from} - {evaluation.to}
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge
                                                                    variant="outline"
                                                                    className={
                                                                        roundScore?.objectiveScore &&
                                                                        roundScore.objectiveScore !==
                                                                            "N/A"
                                                                            ? getPerformanceColor(
                                                                                Number(
                                                                                    roundScore.objectiveScore,
                                                                                ),
                                                                            )
                                                                            : "bg-gray-50 text-gray-600 border-gray-200"
                                                                    }
                                                                >
                                                                    {roundScore?.objectiveScore ||
                                                                        "N/A"}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge
                                                                    variant="outline"
                                                                    className={
                                                                        roundScore?.competencyScore &&
                                                                        roundScore.competencyScore !==
                                                                            "N/A"
                                                                            ? getPerformanceColor(
                                                                                Number(
                                                                                    roundScore.competencyScore,
                                                                                ),
                                                                            )
                                                                            : "bg-gray-50 text-gray-600 border-gray-200"
                                                                    }
                                                                >
                                                                    {roundScore?.competencyScore ||
                                                                        "N/A"}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge
                                                                    variant="outline"
                                                                    className={
                                                                        roundScore?.performanceScore &&
                                                                        roundScore.performanceScore !==
                                                                            "N/A"
                                                                            ? getPerformanceColor(
                                                                                Number(
                                                                                    roundScore.performanceScore,
                                                                                ),
                                                                            )
                                                                            : "bg-gray-50 text-gray-600 border-gray-200"
                                                                    }
                                                                >
                                                                    {roundScore?.performanceScore ||
                                                                        "N/A"}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex gap-2">
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => {
                                                                            setSelectedRound(
                                                                                evaluation,
                                                                            );
                                                                            setShowObjectivesModal(
                                                                                true,
                                                                            );
                                                                        }}
                                                                    >
                                                                        <Target className="h-4 w-4 mr-1" />
                                                                        View Objectives
                                                                    </Button>
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => {
                                                                            setSelectedRound(
                                                                                evaluation,
                                                                            );
                                                                            setShowCompetenciesModal(
                                                                                true,
                                                                            );
                                                                        }}
                                                                    >
                                                                        <Award className="h-4 w-4 mr-1" />
                                                                        View Competencies
                                                                    </Button>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                },
                                            )}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        )}

                        {/* Objectives Summary */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Objectives Overview</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium dark:text-muted-foreground">
                                            Total Objectives:
                                        </span>
                                        <span className="text-lg font-semibold dark:text-foreground">
                                            {employeeObjectives.length}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium dark:text-muted-foreground">
                                            Completed Objectives:
                                        </span>
                                        <span className="text-lg font-semibold text-green-600 dark:text-green-400">
                                            {
                                                employeeObjectives.filter(
                                                    obj => obj.status === "Approved",
                                                ).length
                                            }
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium dark:text-muted-foreground">
                                            Pending Objectives:
                                        </span>
                                        <span className="text-lg font-semibold text-yellow-600 dark:text-yellow-400">
                                            {
                                                employeeObjectives.filter(
                                                    obj => obj.status === "Created",
                                                ).length
                                            }
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Objectives Modal */}
            {showObjectivesModal && (
                <Dialog open={showObjectivesModal} onOpenChange={setShowObjectivesModal}>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Objectives for Round {selectedRound?.round}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            {selectedRound &&
                            getObjectivesForRound(selectedRound?.id!).length > 0 ? (
                                    getObjectivesForRound(selectedRound?.id!).map(
                                        (objective, index) => (
                                            <Card
                                                key={`objective-${objective.id}-${selectedRound?.id}-${index}`}
                                                className="p-4"
                                            >
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1">
                                                        <h3 className="font-semibold text-lg">
                                                            {objective.title}
                                                        </h3>
                                                        <p className="text-sm text-gray-600 dark:text-muted-foreground mt-1">
                                                            {objective.SMARTObjective}
                                                        </p>
                                                        <div className="flex items-center gap-4 mt-2">
                                                            <Badge
                                                                variant="outline"
                                                                className={
                                                                    objective.status === "Approved"
                                                                        ? "bg-green-50 text-green-700"
                                                                        : "bg-yellow-50 text-yellow-700"
                                                                }
                                                            >
                                                                {objective.status}
                                                            </Badge>
                                                            <span className="text-sm text-gray-500">
                                                            Target:{" "}
                                                                {new Date(
                                                                    objective.targetDate,
                                                                ).toLocaleDateString()}
                                                            </span>
                                                        </div>

                                                        {/* Action Items */}
                                                        {objective.actionItems &&
                                                        objective.actionItems.length > 0 && (
                                                            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                                                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                                    Action Items:
                                                                </h4>
                                                                <div className="space-y-2">
                                                                    {objective.actionItems.map(
                                                                        item => (
                                                                            <div
                                                                                key={item.id}
                                                                                className="flex items-start gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded"
                                                                            >
                                                                                <div className="flex-shrink-0 mt-1">
                                                                                    <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
                                                                                </div>
                                                                                <div className="flex-1">
                                                                                    <p className="text-sm font-medium">
                                                                                        {
                                                                                            item.actionItem
                                                                                        }
                                                                                    </p>
                                                                                    {item.description && (
                                                                                        <p className="text-xs text-gray-600 dark:text-gray-400">
                                                                                            {
                                                                                                item.description
                                                                                            }
                                                                                        </p>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        ),
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Self Evaluation */}
                                                        {objective.selfEvaluation && (
                                                            <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                                                                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                                                                Self Evaluation
                                                                </h4>
                                                                <div className="space-y-1">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-sm">
                                                                        Score:
                                                                        </span>
                                                                        <Badge
                                                                            variant="outline"
                                                                            className="bg-blue-100 text-blue-800"
                                                                        >
                                                                            {
                                                                                objective.selfEvaluation
                                                                                    .value
                                                                            }
                                                                        /5
                                                                        </Badge>
                                                                    </div>
                                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                                        <strong>Result:</strong>{" "}
                                                                        {
                                                                            objective.selfEvaluation
                                                                                .actualResult
                                                                        }
                                                                    </p>
                                                                    {objective.selfEvaluation
                                                                        .justification && (
                                                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                                                            <strong>
                                                                            Justification:
                                                                            </strong>{" "}
                                                                            {
                                                                                objective.selfEvaluation
                                                                                    .justification
                                                                            }
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Manager Evaluation */}
                                                        {objective.managerEvaluation && (
                                                            <div className="mt-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                                                                <h4 className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
                                                                Manager Evaluation
                                                                </h4>
                                                                <div className="space-y-1">
                                                                    {objective.managerEvaluation
                                                                        .value && (
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-sm">
                                                                            Score:
                                                                            </span>
                                                                            <Badge
                                                                                variant="outline"
                                                                                className="bg-green-100 text-green-800"
                                                                            >
                                                                                {
                                                                                    objective
                                                                                        .managerEvaluation
                                                                                        .value
                                                                                }
                                                                            /5
                                                                            </Badge>
                                                                        </div>
                                                                    )}
                                                                    {objective.managerEvaluation
                                                                        .justification && (
                                                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                                                            <strong>
                                                                            Justification:
                                                                            </strong>{" "}
                                                                            {
                                                                                objective
                                                                                    .managerEvaluation
                                                                                    .justification
                                                                            }
                                                                        </p>
                                                                    )}
                                                                    {objective.managerEvaluation
                                                                        .managerMessage && (
                                                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                                                            <strong>
                                                                            Manager Message:
                                                                            </strong>{" "}
                                                                            {
                                                                                objective
                                                                                    .managerEvaluation
                                                                                    .managerMessage
                                                                            }
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setSelectedObjective(objective)}
                                                    >
                                                        <Eye className="h-4 w-4 mr-2" />
                                                    View Details
                                                    </Button>
                                                </div>
                                            </Card>
                                        ),
                                    )
                                ) : (
                                    <p className="text-center text-gray-500 py-8">
                                    No objectives found for this round.
                                    </p>
                                )}
                        </div>
                    </DialogContent>
                </Dialog>
            )}

            {/* Competencies Modal */}
            {showCompetenciesModal && (
                <Dialog open={showCompetenciesModal} onOpenChange={setShowCompetenciesModal}>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Competencies for Round {selectedRound?.round}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            {selectedRound &&
                            getCompetenciesForRound(selectedRound?.id!).length > 0 ? (
                                    (() => {
                                    // Group competence values by competenceId
                                        const groupedCompetencies: {
                                        [key: string]: {
                                            competence: any;
                                            self?: any;
                                            manager?: any;
                                        };
                                    } = {};

                                        getCompetenciesForRound(selectedRound?.id!).forEach(
                                            assessment => {
                                                const isSelfAssessment =
                                                assessment.evaluatedBy === employeeUid;

                                                assessment.competenceValues.forEach(competencyValue => {
                                                    if (
                                                        !groupedCompetencies[
                                                            competencyValue.competenceId
                                                        ]
                                                    ) {
                                                        const competence =
                                                        hrSettings.competencies?.find(
                                                            c =>
                                                                c.id ===
                                                                competencyValue.competenceId,
                                                        );
                                                        groupedCompetencies[
                                                            competencyValue.competenceId
                                                        ] = {
                                                            competence,
                                                            self: undefined,
                                                            manager: undefined,
                                                        };
                                                    }

                                                    if (isSelfAssessment) {
                                                        groupedCompetencies[
                                                            competencyValue.competenceId
                                                        ].self = competencyValue;
                                                    } else {
                                                        groupedCompetencies[
                                                            competencyValue.competenceId
                                                        ].manager = competencyValue;
                                                    }
                                                });
                                            },
                                        );

                                        return Object.entries(groupedCompetencies).map(
                                            ([competenceId, data], index) => (
                                                <Card
                                                    key={`competency-${competenceId}-${selectedRound?.id}-${index}`}
                                                    className="p-4"
                                                >
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex-1">
                                                            <h3 className="font-semibold text-lg">
                                                                {data.competence?.competenceName ||
                                                                `Competency ${competenceId}`}
                                                            </h3>

                                                            {/* Self Evaluation */}
                                                            {data.self && (
                                                                <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                                                                    <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                                                                    Self Evaluation
                                                                    </h4>
                                                                    <div className="space-y-1">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-sm">
                                                                            Score:
                                                                            </span>
                                                                            <Badge
                                                                                variant="outline"
                                                                                className="bg-blue-100 text-blue-800"
                                                                            >
                                                                                {data.self.value !==
                                                                                null &&
                                                                            data.self.value !==
                                                                                undefined
                                                                                    ? `${data.self.value}/5`
                                                                                    : "Not rated"}
                                                                            </Badge>
                                                                            <span className="text-sm">
                                                                            Threshold:{" "}
                                                                                {data.self.threshold ||
                                                                                "N/A"}
                                                                            </span>
                                                                            <span className="text-sm">
                                                                            Weight:{" "}
                                                                                {data.self.weight ||
                                                                                "N/A"}
                                                                            </span>
                                                                        </div>
                                                                        {data.self.employeeComment && (
                                                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                                                <strong>
                                                                                Comment:
                                                                                </strong>{" "}
                                                                                {
                                                                                    data.self
                                                                                        .employeeComment
                                                                                }
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Manager Evaluation */}
                                                            {data.manager && (
                                                                <div className="mt-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                                                                    <h4 className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
                                                                    Manager Evaluation
                                                                    </h4>
                                                                    <div className="space-y-1">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-sm">
                                                                            Score:
                                                                            </span>
                                                                            <Badge
                                                                                variant="outline"
                                                                                className="bg-green-100 text-green-800"
                                                                            >
                                                                                {data.manager.value !==
                                                                                null &&
                                                                            data.manager.value !==
                                                                                undefined
                                                                                    ? `${data.manager.value}/5`
                                                                                    : "Not rated"}
                                                                            </Badge>
                                                                            <span className="text-sm">
                                                                            Threshold:{" "}
                                                                                {data.manager
                                                                                    .threshold || "N/A"}
                                                                            </span>
                                                                            <span className="text-sm">
                                                                            Weight:{" "}
                                                                                {data.manager.weight ||
                                                                                "N/A"}
                                                                            </span>
                                                                        </div>
                                                                        {data.manager
                                                                            .managerComment && (
                                                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                                                <strong>
                                                                                Comment:
                                                                                </strong>{" "}
                                                                                {
                                                                                    data.manager
                                                                                        .managerComment
                                                                                }
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </Card>
                                            ),
                                        );
                                    })()
                                ) : (
                                    <p className="text-center text-gray-500 py-8">
                                    No competencies found for this round.
                                    </p>
                                )}
                        </div>
                    </DialogContent>
                </Dialog>
            )}

            {/* Objective Detail Modal */}
            {selectedObjective && (
                <ObjectiveDetailModal
                    isOpen={!!selectedObjective}
                    onClose={() => setSelectedObjective(null)}
                    objective={selectedObjective}
                    isEndCycle={false}
                />
            )}
        </>
    );
}
