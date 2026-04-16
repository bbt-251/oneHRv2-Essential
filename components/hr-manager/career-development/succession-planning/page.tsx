"use client";

import { useMemo, useState } from "react";
import { useSuccessionPlanning } from "@/hooks/use-succession-planning";
import { useFirestore } from "@/context/firestore-context";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { getSuccessionStageLabel } from "@/lib/backend/api/succession-planning/succession-planning-service";
import { SuccessionCandidatesDialog } from "./candidates-dialog";
import { Button } from "@/components/ui/button";
import { SuccessionPlanningModel } from "@/lib/models/succession-planning";
import { DefinePositionPathDialog } from "./define-position-path-dialog";
import { AssociateOrderGuideDialog } from "./associate-order-guide-dialog";
import { ViewPositionPathDialog } from "./view-position-path-dialog";
import { ViewCommonCompetenceDialog } from "./view-common-competence-dialog";
import { ViewAssociatedOrderGuideDialog } from "./view-associated-order-guide-dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EllipsisVertical, Route, Users, Link2, MapPin, Sparkles, FileStack } from "lucide-react";

export function SuccessionPlanningPage() {
    const { successionPlans, loading, error } = useSuccessionPlanning();
    const { hrSettings, employees, orderGuides } = useFirestore();
    const [selectedPlan, setSelectedPlan] = useState<SuccessionPlanningModel | null>(null);
    const [candidatesOpen, setCandidatesOpen] = useState(false);
    const [definePathOpen, setDefinePathOpen] = useState(false);
    const [associateOrderGuideOpen, setAssociateOrderGuideOpen] = useState(false);
    const [viewPathOpen, setViewPathOpen] = useState(false);
    const [viewCommonCompetenceOpen, setViewCommonCompetenceOpen] = useState(false);
    const [viewAssociatedOrderGuideOpen, setViewAssociatedOrderGuideOpen] = useState(false);

    const positionsById = useMemo(() => {
        const map: Record<string, string> = {};
        hrSettings.positions.forEach(p => {
            map[p.id] = p.name;
        });
        return map;
    }, [hrSettings.positions]);

    const employeesById = useMemo(() => {
        const map: Record<string, string> = {};
        employees.forEach(e => {
            map[e.employeeID] = `${e.firstName} ${e.surname}`;
        });
        return map;
    }, [employees]);

    if (error) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Succession Planning</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-red-500 text-sm">Failed to load succession plans: {error}</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>Succession Planning</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <p className="text-sm text-muted-foreground">Loading succession plans...</p>
                    ) : successionPlans.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                            No succession plans found yet.
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="whitespace-nowrap">
                                            Timestamp
                                        </TableHead>
                                        <TableHead className="whitespace-nowrap">
                                            Planning ID
                                        </TableHead>
                                        <TableHead className="whitespace-nowrap">Stage</TableHead>
                                        <TableHead className="whitespace-nowrap">
                                            Position
                                        </TableHead>
                                        <TableHead className="whitespace-nowrap text-right">
                                            Actions
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {successionPlans
                                        .slice()
                                        .sort((a, b) =>
                                            (a.timestamp || "").localeCompare(b.timestamp || ""),
                                        )
                                        .map(plan => (
                                            <TableRow key={plan.id}>
                                                <TableCell>{plan.timestamp}</TableCell>
                                                <TableCell>{plan.planningID}</TableCell>
                                                <TableCell>
                                                    <Badge
                                                        className={
                                                            plan.planningStage ===
                                                            "Successor Identified"
                                                                ? "bg-green-100 text-green-800 border-green-200"
                                                                : "bg-gray-100 text-gray-800 border-gray-200"
                                                        }
                                                    >
                                                        {getSuccessionStageLabel(
                                                            plan.planningStage,
                                                        )}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {plan.positionName ||
                                                        positionsById[plan.positionID] ||
                                                        plan.positionID ||
                                                        "-"}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8"
                                                                onClick={() =>
                                                                    setSelectedPlan(plan)
                                                                }
                                                            >
                                                                <EllipsisVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent
                                                            align="end"
                                                            className="w-62"
                                                        >
                                                            <DropdownMenuItem
                                                                className="cursor-pointer"
                                                                onClick={() => {
                                                                    setSelectedPlan(plan);
                                                                    setDefinePathOpen(true);
                                                                }}
                                                            >
                                                                <Route className="mr-2 h-4 w-4" />
                                                                <span>Define position path</span>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                disabled={
                                                                    !plan.candidates ||
                                                                    plan.candidates.length === 0
                                                                }
                                                                className={
                                                                    !plan.candidates ||
                                                                    plan.candidates.length === 0
                                                                        ? ""
                                                                        : "cursor-pointer"
                                                                }
                                                                onClick={() => {
                                                                    setSelectedPlan(plan);
                                                                    setCandidatesOpen(true);
                                                                }}
                                                            >
                                                                <Users className="mr-2 h-4 w-4" />
                                                                <span>View candidates</span>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                className="cursor-pointer"
                                                                onClick={() => {
                                                                    setSelectedPlan(plan);
                                                                    setAssociateOrderGuideOpen(
                                                                        true,
                                                                    );
                                                                }}
                                                            >
                                                                <Link2 className="mr-2 h-4 w-4" />
                                                                <span>Associate order guide</span>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                disabled={
                                                                    !plan.positionPath ||
                                                                    plan.positionPath.length === 0
                                                                }
                                                                className={
                                                                    !plan.positionPath ||
                                                                    plan.positionPath.length === 0
                                                                        ? ""
                                                                        : "cursor-pointer"
                                                                }
                                                                onClick={() => {
                                                                    setSelectedPlan(plan);
                                                                    setViewPathOpen(true);
                                                                }}
                                                            >
                                                                <MapPin className="mr-2 h-4 w-4" />
                                                                <span>View position path</span>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                disabled={
                                                                    !plan.commonCompetence ||
                                                                    plan.commonCompetence.length ===
                                                                        0
                                                                }
                                                                className={
                                                                    !plan.commonCompetence ||
                                                                    plan.commonCompetence.length ===
                                                                        0
                                                                        ? ""
                                                                        : "cursor-pointer"
                                                                }
                                                                onClick={() => {
                                                                    setSelectedPlan(plan);
                                                                    setViewCommonCompetenceOpen(
                                                                        true,
                                                                    );
                                                                }}
                                                            >
                                                                <Sparkles className="mr-2 h-4 w-4" />
                                                                <span>
                                                                    View common competencies
                                                                </span>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                disabled={!plan.orderGuide}
                                                                className={
                                                                    !plan.orderGuide
                                                                        ? ""
                                                                        : "cursor-pointer"
                                                                }
                                                                onClick={() => {
                                                                    setSelectedPlan(plan);
                                                                    setViewAssociatedOrderGuideOpen(
                                                                        true,
                                                                    );
                                                                }}
                                                            >
                                                                <FileStack className="mr-2 h-4 w-4" />
                                                                <span>
                                                                    View associated order guide
                                                                </span>
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <SuccessionCandidatesDialog
                open={candidatesOpen}
                onOpenChange={setCandidatesOpen}
                plan={selectedPlan}
                employees={employees}
            />
            <DefinePositionPathDialog
                open={definePathOpen}
                onOpenChange={setDefinePathOpen}
                plan={selectedPlan}
                employees={employees}
                positions={hrSettings.positions}
                competencePositionAssociations={hrSettings.competencePositionAssociations}
            />
            <AssociateOrderGuideDialog
                open={associateOrderGuideOpen}
                onOpenChange={setAssociateOrderGuideOpen}
                plan={selectedPlan}
                orderGuides={orderGuides}
            />
            <ViewPositionPathDialog
                open={viewPathOpen}
                onOpenChange={setViewPathOpen}
                plan={selectedPlan}
                positions={hrSettings.positions}
            />
            <ViewCommonCompetenceDialog
                open={viewCommonCompetenceOpen}
                onOpenChange={setViewCommonCompetenceOpen}
                plan={selectedPlan}
                competencies={hrSettings.competencies}
            />
            <ViewAssociatedOrderGuideDialog
                open={viewAssociatedOrderGuideOpen}
                onOpenChange={setViewAssociatedOrderGuideOpen}
                plan={selectedPlan}
                orderGuides={orderGuides}
                employees={employees}
            />
        </div>
    );
}

export default SuccessionPlanningPage;
