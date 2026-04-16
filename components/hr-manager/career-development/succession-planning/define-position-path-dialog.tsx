"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/context/toastContext";
import { useAuth } from "@/context/authContext";
import { useState } from "react";
import { SuccessionPlanningModel } from "@/lib/models/succession-planning";
import { EmployeeModel } from "@/lib/models/employee";
import {
    CompetencePositionAssociationModel,
    PositionDefinitionModel,
} from "@/lib/backend/firebase/hrSettingsService";
import { updateSuccessionPlan } from "@/lib/backend/api/succession-planning/succession-planning-service";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    plan: SuccessionPlanningModel | null;
    employees: EmployeeModel[];
    positions: PositionDefinitionModel[];
    competencePositionAssociations: CompetencePositionAssociationModel[];
}

export function DefinePositionPathDialog({
    open,
    onOpenChange,
    plan,
    employees,
    positions,
    competencePositionAssociations,
}: Props) {
    const { showToast } = useToast();
    const { userData } = useAuth();
    const [saving, setSaving] = useState(false);
    const [selectedPositions, setSelectedPositions] = useState<string[]>(plan?.positionPath ?? []);

    if (!plan) return null;

    const handleTogglePosition = (id: string) => {
        setSelectedPositions(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id],
        );
    };

    const handleSubmit = async () => {
        if (!plan) return;

        setSaving(true);
        try {
            const filteredEmpIds: string[] = [];
            employees.forEach(employee => {
                if (
                    employee.employmentPosition === plan.positionID ||
                    selectedPositions.includes(employee.employmentPosition)
                ) {
                    filteredEmpIds.push(employee.employeeID);
                }
            });

            const linkedPositions = [plan.positionID, ...selectedPositions];

            const positionByCompetence: Record<string, string[]> = {};
            competencePositionAssociations.forEach(cpa => {
                if (!positionByCompetence[cpa.cid]) {
                    positionByCompetence[cpa.cid] = [];
                }
                positionByCompetence[cpa.cid].push(cpa.pid);
            });

            const commonCompetenceIds: string[] = [];
            Object.entries(positionByCompetence).forEach(([cid, pids]) => {
                const isCommon = linkedPositions.every(pid => pids.includes(pid));
                if (isCommon) {
                    commonCompetenceIds.push(cid);
                }
            });

            const updatedPlan: SuccessionPlanningModel = {
                ...plan,
                candidates: filteredEmpIds,
                commonCompetence: commonCompetenceIds,
                positionPath: selectedPositions,
            };

            const result = await updateSuccessionPlan(updatedPlan);
            if (!result) {
                showToast("Failed to update succession planning position path", "Error", "error");
                setSaving(false);
                return;
            }

            showToast("Position path updated successfully", "Success", "success");
            onOpenChange(false);
        } catch (e) {
            console.error(e);
            showToast("Something went wrong. Please try again.", "Error", "error");
        } finally {
            setSaving(false);
        }
    };

    const availablePositions = positions.filter(p => p.id !== plan.positionID);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Define Position Path</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                        <Label className="text-sm">Current Position</Label>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline">
                                {positions.find(p => p.id === plan.positionID)?.name ??
                                    plan.positionName ??
                                    plan.positionID}
                            </Badge>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm">Path Positions</Label>
                        <div className="flex flex-wrap gap-2">
                            {availablePositions.map(position => {
                                const active = selectedPositions.includes(position.id);
                                return (
                                    <button
                                        key={position.id}
                                        type="button"
                                        onClick={() => handleTogglePosition(position.id)}
                                        className={cn(
                                            "px-3 py-1 rounded-full border text-xs",
                                            active
                                                ? "bg-primary text-primary-foreground border-primary"
                                                : "bg-muted text-muted-foreground border-border hover:bg-accent",
                                        )}
                                    >
                                        {position.name}
                                    </button>
                                );
                            })}
                            {availablePositions.length === 0 && (
                                <span className="text-xs text-muted-foreground">
                                    No additional positions defined yet.
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onOpenChange(false)}
                            disabled={saving}
                        >
                            Cancel
                        </Button>
                        <Button size="sm" onClick={handleSubmit} disabled={saving}>
                            {saving ? "Saving..." : "Save"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
