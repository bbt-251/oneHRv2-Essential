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
import { SuccessionPlanningModel } from "@/lib/models/succession-planning";
import { CompetenceModel } from "@/lib/backend/firebase/hrSettingsService";
import { useMemo } from "react";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    plan: SuccessionPlanningModel | null;
    competencies: CompetenceModel[];
}

export function ViewCommonCompetenceDialog({ open, onOpenChange, plan, competencies }: Props) {
    const rows = useMemo(() => {
        if (!plan?.commonCompetence?.length) return [];
        const byId: Record<string, CompetenceModel> = {};
        competencies.forEach(c => {
            byId[c.id] = c;
        });
        return plan.commonCompetence.map(cid => byId[cid]).filter(Boolean) as CompetenceModel[];
    }, [plan, competencies]);

    if (!plan) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle>Common Competencies – {plan.positionName}</DialogTitle>
                </DialogHeader>
                <div className="mt-4 overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Competence ID</TableHead>
                                <TableHead>Competence Name</TableHead>
                                <TableHead>Type</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rows.map(c => (
                                <TableRow key={c.id}>
                                    <TableCell>{c.id}</TableCell>
                                    <TableCell>{c.competenceName}</TableCell>
                                    <TableCell>{c.competenceType}</TableCell>
                                </TableRow>
                            ))}
                            {rows.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={3}
                                        className="text-center text-sm text-muted-foreground"
                                    >
                                        No common competencies defined.
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
