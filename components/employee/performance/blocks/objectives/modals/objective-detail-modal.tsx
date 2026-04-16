"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Target,
    Calendar,
    User,
    BarChart3,
    TrendingUp,
    Clock,
    CheckCircle,
    Edit,
    AlertCircle,
    FileText,
    Star,
    Activity,
} from "lucide-react";
import { ObjectiveModel } from "@/lib/models/objective-model";
import { useFirestore } from "@/context/firestore-context";
import { getEmployeeFullName } from "@/lib/util/performance/employee-performance-utils";
import { EmployeeModel } from "@/lib/models/employee";
import { useAuth } from "@/context/authContext";

interface ObjectiveDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    onEdit?: (objective: ObjectiveModel) => void;
    objective: ObjectiveModel | null;
    isEndCycle?: boolean;
}

export function ObjectiveDetailModal({
    isOpen,
    onClose,
    objective,
    onEdit,
    isEndCycle,
}: ObjectiveDetailModalProps) {
    if (!objective) return null;
    const { employees, hrSettings } = useFirestore();
    const { user } = useAuth();
    const { periodicOptions, departmentKPIs } = hrSettings;

    const getPeriodName = (periodId: string) => {
        const period = periodicOptions?.find(p => p.id === periodId);
        return period?.periodName || "Unknown";
    };
    const getRoundName = (periodId: string, roundId: string) => {
        const evaluations = periodicOptions?.find(p => p.id === periodId)?.evaluations;
        return evaluations?.find(e => e.id === roundId)?.round || "Unknown";
    };
    const getStatusColor = (status: string) => {
        switch (status) {
            case "Approved":
            case "Acknowledged":
                return "bg-success-100 text-success-800 border-success-200";
            case "Created":
                return "bg-brand-100  border-brand-200";
            default:
                return "bg-secondary-100 text-secondary-800 border-secondary-200";
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "Approved":
            case "Acknowledged":
                return <CheckCircle className="h-4 w-4" />;
            case "Created":
                return <Target className="h-4 w-4" />;
            default:
                return <Target className="h-4 w-4" />;
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
                <DialogHeader className="pb-6 border-b border-accent-200">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                            <div className="p-2 rounded-xl">
                                <Target className="h-6 w-6" />
                            </div>
                            Objective Details
                        </DialogTitle>
                        <div className="flex items-center gap-2">
                            <Badge
                                className={`text-xs px-3 py-1 border ${getStatusColor(objective.status)}`}
                            >
                                <div className="flex items-center gap-1">
                                    {getStatusIcon(objective.status)}
                                    <span className="capitalize">{objective.status}</span>
                                </div>
                            </Badge>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-8 py-6">
                    {/* Objective Information Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Left Column - Basic Information */}
                        <Card className="border-accent-200">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-lg font-semibold  flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-accent-600" />
                                    Objective Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="flex justify-between items-center py-3 border-b border-accent-200">
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4 " />
                                            <span className="font-medium ">Timestamp</span>
                                        </div>
                                        <span className=" font-semibold">
                                            {objective.timestamp}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center py-3 border-b border-accent-200">
                                        <div className="flex items-center gap-2">
                                            <Activity className="h-4 w-4 " />
                                            <span className="font-medium ">Status</span>
                                        </div>
                                        <Badge
                                            className={`text-xs px-2 py-1 border ${getStatusColor(objective.status)}`}
                                        >
                                            <span className="capitalize">{objective.status}</span>
                                        </Badge>
                                    </div>

                                    <div className="py-3 border-b border-accent-200">
                                        <div className="flex items-center gap-2 mb-2">
                                            <FileText className="h-4 w-4 " />
                                            <span className="font-medium ">SMART Objective</span>
                                        </div>
                                        <p className=" font-semibold text-lg">
                                            {objective.SMARTObjective}
                                        </p>
                                    </div>

                                    <div className="flex justify-between items-center py-3 border-b border-accent-200">
                                        <div className="flex items-center gap-2">
                                            <TrendingUp className="h-4 w-4 " />
                                            <span className="font-medium ">Dept KPI</span>
                                        </div>
                                        <span className=" font-semibold">
                                            {departmentKPIs.find(kpi => kpi.id == objective.deptKPI)
                                                ?.title ?? ""}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center py-3">
                                        <div className="flex items-center gap-2">
                                            <BarChart3 className="h-4 w-4 " />
                                            <span className="font-medium ">Progress</span>
                                        </div>
                                        <span className=" font-semibold">
                                            {objective.selfEvaluation?.value
                                                ? Math.round(
                                                    (objective.selfEvaluation.value / 5) * 100,
                                                )
                                                : 0}
                                            %
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Right Column - SMART Objective Details */}
                        <Card className="border-brand-200">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-lg font-semibold  flex items-center gap-2">
                                    <Star className="h-5 w-5 " />
                                    SMART Objective Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="flex justify-between items-center py-3 border-b border-brand-200">
                                        <div className="flex items-center gap-2">
                                            <Target className="h-4 w-4 " />
                                            <span className="font-medium ">Objective</span>
                                        </div>
                                        <span className=" font-semibold">{objective.title}</span>
                                    </div>

                                    <div className="flex justify-between items-center py-3 border-b border-brand-200">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 " />
                                            <span className="font-medium ">Target Date</span>
                                        </div>
                                        <span className=" font-semibold">
                                            {new Date(objective.targetDate).toLocaleDateString()}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center py-3 border-b border-brand-200">
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4 " />
                                            <span className="font-medium ">Period</span>
                                        </div>
                                        <span className=" font-semibold">
                                            {getPeriodName(objective.period)}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center py-3 border-b border-brand-200">
                                        <div className="flex items-center gap-2">
                                            <Activity className="h-4 w-4 " />
                                            <span className="font-medium ">Round</span>
                                        </div>
                                        <span className=" font-semibold">
                                            {getRoundName(objective.period, objective.round)}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center py-3">
                                        <div className="flex items-center gap-2">
                                            <User className="h-4 w-4 " />
                                            <span className="font-medium ">Employee</span>
                                        </div>
                                        <span className=" font-semibold">
                                            {getEmployeeFullName(
                                                employees.find(
                                                    emp => emp.uid === objective.employee,
                                                ) as EmployeeModel,
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Self Evaluation Section */}
                    {objective.selfEvaluation && (
                        <Card className="border-success-200">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-lg font-semibold  flex items-center gap-2">
                                    <User className="h-5 w-5 text-success-600" />
                                    Self Evaluation
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4">
                                    <div>
                                        <Badge
                                            variant="outline"
                                            className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800"
                                        >
                                            <Target className="h-3 w-3 mr-1" />
                                            Self Rating: {objective.selfEvaluation.value} / 5.0
                                        </Badge>
                                    </div>

                                    <div>
                                        <Label className="text-sm font-medium  mb-2 block">
                                            Justification
                                        </Label>
                                        <Textarea
                                            value={objective.selfEvaluation.justification || ""}
                                            readOnly
                                            className="border-success-200 min-h-[100px]"
                                        />
                                    </div>

                                    <div>
                                        <Label className="text-sm font-medium  mb-2 block">
                                            Actual Result
                                        </Label>
                                        <Textarea
                                            value={objective.selfEvaluation.actualResult}
                                            readOnly
                                            className="border-success-200 min-h-[80px]"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Manager Evaluation Section */}
                    {objective.managerEvaluation && (
                        <Card className="border-brand-200">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-lg font-semibold  flex items-center gap-2">
                                    <User className="h-5 w-5 text-brand-600" />
                                    Manager Evaluation
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4">
                                    <div>
                                        <Badge
                                            variant="outline"
                                            className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800"
                                        >
                                            <Target className="h-3 w-3 mr-1" />
                                            Manager Rating: {objective.managerEvaluation.value} /
                                            5.0
                                        </Badge>
                                    </div>

                                    <div>
                                        <Label className="text-sm font-medium  mb-2 block">
                                            Manager Justification
                                        </Label>
                                        <Textarea
                                            value={objective.managerEvaluation.justification || ""}
                                            readOnly
                                            className="border-brand-200 min-h-[100px]"
                                        />
                                    </div>

                                    <div>
                                        <Label className="text-sm font-medium  mb-2 block">
                                            Manager Comments
                                        </Label>
                                        <Textarea
                                            value={objective.managerEvaluation.managerMessage || ""}
                                            readOnly
                                            className="border-brand-200 min-h-[80px]"
                                        />
                                    </div>

                                    {objective.managerEvaluation.timestamp && (
                                        <div className="text-sm text-muted-foreground">
                                            Evaluated on:{" "}
                                            {new Date(
                                                objective.managerEvaluation.timestamp,
                                            ).toLocaleString()}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Action Items Section */}
                    {objective.actionItems?.length > 0 && (
                        <Card className="border-brand-200">
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold  flex items-center gap-2">
                                    <CheckCircle className="h-5 w-5 " />
                                    Action Items
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {objective.actionItems.map(item => (
                                        <div
                                            key={item.id}
                                            className="p-4 border border-accent-200 rounded-lg hover:shadow-sm transition-all"
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    <CheckCircle className="h-4 w-4 text-success-600" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-medium ">
                                                        {item.actionItem}
                                                    </p>
                                                    {item.description && (
                                                        <p className="text-sm text-accent-600 mt-1">
                                                            {item.description}
                                                        </p>
                                                    )}
                                                    <p className="text-sm text-accent-500 mt-1">
                                                        Created: {item.timestamp}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2 flex-shrink-0">
                                                    <Badge className="text-xs px-2 py-1">
                                                        {item.employee && item.manager
                                                            ? "Both"
                                                            : item.employee
                                                                ? "Employee"
                                                                : "Manager"}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 pt-6 border-t border-accent-200">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="border-accent-300 bg-transparent"
                    >
                        Close
                    </Button>
                    {onEdit &&
                        !isEndCycle &&
                        objective.createdBy === user?.uid &&
                        objective.status !== "Approved" &&
                        objective.status !== "Acknowledged" && (
                        <Button
                            onClick={() => onEdit(objective)}
                            className="bg-brand-600 hover:bg-brand-700 text-white"
                        >
                            <Edit className="h-4 w-4 mr-2" />
                                Edit Objective
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
