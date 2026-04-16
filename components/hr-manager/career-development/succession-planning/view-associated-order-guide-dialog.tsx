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
import { OrderGuideModel } from "@/lib/models/order-guide-and-order-item";
import { EmployeeModel } from "@/lib/models/employee";
import { useMemo } from "react";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    plan: SuccessionPlanningModel | null;
    orderGuides: OrderGuideModel[];
    employees: EmployeeModel[];
}

export function ViewAssociatedOrderGuideDialog({
    open,
    onOpenChange,
    plan,
    orderGuides,
    employees,
}: Props) {
    const { orderGuide, rows } = useMemo(() => {
        if (!plan?.orderGuide) {
            return { orderGuide: null, rows: [] as any[] };
        }
        const og = orderGuides.find(o => o.orderGuideID === plan.orderGuide) ?? null;
        if (!og) return { orderGuide: null, rows: [] as any[] };

        const candidateEmployees = employees.filter(e =>
            (plan.candidates ?? []).includes(e.employeeID),
        );

        const rows = candidateEmployees.map(e => {
            const assigned = og.associatedEmployees?.find(ae => ae.uid === e.uid);
            return {
                id: e.employeeID,
                orderGuideID: og.orderGuideID,
                orderGuideName: og.orderGuideName,
                candidateID: e.employeeID,
                candidateName: `${e.firstName} ${e.surname}`,
                status: assigned?.status ?? "Not Started",
            };
        });

        return { orderGuide: og, rows };
    }, [plan, orderGuides, employees]);

    if (!plan || !orderGuide) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Order Guide – {orderGuide.orderGuideName}</DialogTitle>
                </DialogHeader>
                <div className="mt-4 overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Timestamp</TableHead>
                                <TableHead>OrderGuide ID</TableHead>
                                <TableHead>OrderGuide Name</TableHead>
                                <TableHead>Candidate ID</TableHead>
                                <TableHead>Candidate Name</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rows.map(r => (
                                <TableRow key={r.id}>
                                    <TableCell>{orderGuide.timestamp}</TableCell>
                                    <TableCell>{r.orderGuideID}</TableCell>
                                    <TableCell>{r.orderGuideName}</TableCell>
                                    <TableCell>{r.candidateID}</TableCell>
                                    <TableCell>{r.candidateName}</TableCell>
                                    <TableCell>{r.status}</TableCell>
                                </TableRow>
                            ))}
                            {rows.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={6}
                                        className="text-center text-sm text-muted-foreground"
                                    >
                                        No candidates associated with this order guide.
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
