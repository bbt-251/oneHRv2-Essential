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
import { PositionDefinitionModel } from "@/lib/backend/firebase/hrSettingsService";
import { useMemo } from "react";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    plan: SuccessionPlanningModel | null;
    positions: PositionDefinitionModel[];
}

export function ViewPositionPathDialog({ open, onOpenChange, plan, positions }: Props) {
    const rows = useMemo(() => {
        if (!plan?.positionPath?.length) return [];
        const byId: Record<string, PositionDefinitionModel> = {};
        positions.forEach(p => {
            byId[p.id] = p;
        });
        return plan.positionPath.map(pid => byId[pid]).filter(Boolean) as PositionDefinitionModel[];
    }, [plan, positions]);

    if (!plan) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl">
                <DialogHeader>
                    <DialogTitle>Position Path – {plan.positionName}</DialogTitle>
                </DialogHeader>
                <div className="mt-4 overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Position ID</TableHead>
                                <TableHead>Position Name</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rows.map(p => (
                                <TableRow key={p.id}>
                                    <TableCell>{p.id}</TableCell>
                                    <TableCell>{p.name}</TableCell>
                                </TableRow>
                            ))}
                            {rows.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={2}
                                        className="text-center text-sm text-muted-foreground"
                                    >
                                        No position path defined.
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
