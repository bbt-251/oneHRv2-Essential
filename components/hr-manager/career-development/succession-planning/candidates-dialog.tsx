"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useMemo, useState } from "react";
import { SuccessionPlanningModel } from "@/lib/models/succession-planning";
import { EmployeeModel, SuccessorInformationModel } from "@/lib/models/employee";
import { usePerformanceData } from "@/hooks/use-performance-data";
import { calculateCandidateScore } from "@/lib/domain/succession/candidate-scoring";
import { useToast } from "@/context/toastContext";
import { useAuth } from "@/context/authContext";
import { updateEmployee } from "@/lib/backend/api/employee-management/employee-management-service";
import { updateSuccessionPlan } from "@/lib/backend/api/succession-planning/succession-planning-service";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    plan: SuccessionPlanningModel | null;
    employees: EmployeeModel[];
}

export function SuccessionCandidatesDialog({ open, onOpenChange, plan, employees }: Props) {
    const { objectives, competenceAssessments, objectiveWeights } = usePerformanceData();
    const { showToast } = useToast();
    const { userData } = useAuth();
    const [loadingEmployeeId, setLoadingEmployeeId] = useState<string | null>(null);

    const rows = useMemo(() => {
        if (!plan?.candidates?.length) return [];

        return plan.candidates
            .map(employeeID => {
                const employee = employees.find(e => e.employeeID === employeeID);
                if (!employee) return null;

                const successorInfo: SuccessorInformationModel | undefined =
                    employee.successorInformation?.find(
                        info => info.planningID === plan.planningID,
                    );

                const score = calculateCandidateScore({
                    employeeId: employee.employeeID,
                    competenceAssessments,
                    objectives,
                    objectiveWeights,
                    commonCompetenceIds: plan.commonCompetence,
                });

                return {
                    id: employee.employeeID,
                    employee,
                    name: `${employee.firstName} ${employee.surname}`,
                    position: employee.employmentPosition,
                    rank: successorInfo?.rank ?? "N/A",
                    successor: successorInfo?.successor === "Yes" ? "Yes" : "No",
                    averageCompetenceLevel: score.averageCompetenceLevel,
                    averageTargetAchievement: score.averageTargetAchievement,
                };
            })
            .filter(Boolean) as {
            id: string;
            employee: EmployeeModel;
            name: string;
            position: string;
            rank: string;
            successor: string;
            averageCompetenceLevel: number;
            averageTargetAchievement: number;
        }[];
    }, [plan, employees, objectives, competenceAssessments, objectiveWeights]);

    const handleFlagSuccessor = async (row: { employee: EmployeeModel }) => {
        if (!plan) return;
        const employee = row.employee;

        setLoadingEmployeeId(employee.id);
        try {
            const existingInfo =
                employee.successorInformation?.find(info => info.planningID === plan.planningID) ??
                null;

            let updatedInfo: SuccessorInformationModel[] = employee.successorInformation ?? [];

            if (existingInfo) {
                existingInfo.successor = "Yes";
            } else {
                const newInfo: SuccessorInformationModel = {
                    planningID: plan.planningID,
                    successor: "Yes",
                    rank: "N/A",
                };
                updatedInfo = [...updatedInfo, newInfo];
            }

            const updatedEmployee: Partial<EmployeeModel> & { id: string } = {
                id: employee.id,
                successorInformation: updatedInfo,
            } as any;

            const updatedPlan: SuccessionPlanningModel = {
                ...plan,
                planningStage: "Successor Identified",
            };

            const employeeRes = await updateEmployee(updatedEmployee, userData?.uid, undefined);
            if (!employeeRes) {
                showToast("Failed to update employee successor info", "Error", "error");
                setLoadingEmployeeId(null);
                return;
            }

            const planRes = await updateSuccessionPlan(updatedPlan);
            if (!planRes) {
                showToast("Failed to update succession plan", "Error", "error");
                setLoadingEmployeeId(null);
                return;
            }

            showToast("Successor flagged successfully", "Success", "success");
        } catch (e) {
            console.error(e);
            showToast("Something went wrong. Please try again.", "Error", "error");
        } finally {
            setLoadingEmployeeId(null);
        }
    };

    if (!plan) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl">
                <DialogHeader>
                    <DialogTitle>Succession Candidates – {plan.positionName}</DialogTitle>
                </DialogHeader>
                <div className="overflow-x-auto mt-4">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Employee ID</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Position</TableHead>
                                <TableHead>Avg. Competence</TableHead>
                                <TableHead>Avg. Target Achievement</TableHead>
                                <TableHead>Rank</TableHead>
                                <TableHead>Successor</TableHead>
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rows.map(row => (
                                <TableRow key={row.id}>
                                    <TableCell>{row.employee.employeeID}</TableCell>
                                    <TableCell>{row.name}</TableCell>
                                    <TableCell>{row.position}</TableCell>
                                    <TableCell>{row.averageCompetenceLevel}</TableCell>
                                    <TableCell>{row.averageTargetAchievement}</TableCell>
                                    <TableCell>{row.rank}</TableCell>
                                    <TableCell>{row.successor}</TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                disabled={
                                                    row.successor === "Yes" ||
                                                    loadingEmployeeId === row.employee.id
                                                }
                                                onClick={() => handleFlagSuccessor(row)}
                                            >
                                                Flag Successor
                                            </Button>
                                            {/* Placeholder for Assign Rank dialog wiring */}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {rows.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={8}
                                        className="text-center text-sm text-muted-foreground"
                                    >
                                        No candidates found for this plan.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </DialogContent>
        </Dialog>
    );
}
