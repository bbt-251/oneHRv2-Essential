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
import { useFirestore } from "@/context/firestore-context";
import { ObjectiveModel } from "@/lib/models/objective-model";
import dayjs from "dayjs";
import { useTheme } from "@/components/theme-provider";

interface ObjectiveDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    objective: ObjectiveModel | null;
    weight: number;
}

export function ObjectiveDetailModal({
    isOpen,
    onClose,
    objective,
    weight,
}: ObjectiveDetailModalProps) {
    const { theme } = useTheme();
    if (!objective) return null;
    const { employees, hrSettings } = useFirestore();
    const { periodicOptions } = hrSettings;

    const getDepartmentKpiName = (kpiId: string) => {
        return hrSettings?.departmentKPIs?.find(kpi => kpi.id === kpiId)?.title || "N/A";
    };

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
            case "completed":
                return "bg-success-100 text-success-800 border-success-200";
            case "active":
                return "bg-brand-100  border-brand-200";
            case "overdue":
                return "bg-danger-100 text-danger-800 border-danger-200";
            case "draft":
                return "bg-secondary-100 text-secondary-800 border-secondary-200";
            case "pending":
                return "bg-warning-100 text-warning-800 border-warning-200";
            default:
                return "bg-secondary-100 text-secondary-800 border-secondary-200";
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "completed":
                return <CheckCircle className="h-4 w-4" />;
            case "active":
                return <Target className="h-4 w-4" />;
            case "overdue":
                return <AlertCircle className="h-4 w-4" />;
            case "draft":
                return <Edit className="h-4 w-4" />;
            case "pending":
                return <Clock className="h-4 w-4" />;
            default:
                return <Target className="h-4 w-4" />;
        }
    };

    const rating = objective.selfEvaluation?.value ?? null;
    const percent = rating != null ? Math.round((rating / 5) * 100) : null;
    const selfAssessment = {
        rating,
        percent,
        justification: objective.selfEvaluation?.justification || "",
        actualResult: objective.selfEvaluation?.actualResult || "",
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
                <DialogHeader className="pb-6 border-b border-accent-200">
                    <div className="flex items-center justify-between">
                        <DialogTitle
                            className={`text-2xl font-bold flex items-center gap-3 ${theme === "dark" ? "text-brand-100" : ""}`}
                        >
                            <div
                                className={
                                    "p-2 rounded-xl" + theme === "dark" ? "bg-accent-100" : ""
                                }
                            >
                                <Target className="h-6 w-6 text-accent-600" />
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
                        <Card
                            className={`"border-accent-200" ${theme === "dark" ? "bg-black " : "bg-gradient-to-br from-accent-50 to-white"}`}
                        >
                            <CardHeader className="pb-4">
                                <CardTitle className="text-lg font-semibold flex items-center gap-2">
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
                                            {new Date(objective.timestamp).toLocaleString()}
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
                                            <span className="font-medium ">Title</span>
                                        </div>
                                        <p className=" font-semibold text-lg">{objective.title}</p>
                                    </div>

                                    <div className="flex justify-between items-center py-3 border-b border-accent-200">
                                        <div className="flex items-center gap-2">
                                            <BarChart3 className="h-4 w-4 " />
                                            <span className="font-medium ">Weight</span>
                                        </div>
                                        <span className=" font-semibold">{weight}%</span>
                                    </div>

                                    <div className="flex justify-between items-center py-3">
                                        <div className="flex items-center gap-2">
                                            <TrendingUp className="h-4 w-4 " />
                                            <span className="font-medium ">Related KPI</span>
                                        </div>
                                        <span className=" font-semibold">
                                            {objective.deptKPI
                                                ? getDepartmentKpiName(objective.deptKPI)
                                                : "N/A"}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Right Column - SMART Objective Details */}
                        <Card
                            className={`"border-accent-200" ${theme === "dark" ? "bg-black " : "bg-gradient-to-br from-accent-50 to-white"}`}
                        >
                            <CardHeader className="pb-4">
                                <CardTitle className="text-lg font-semibold  flex items-center gap-2">
                                    <Star className="h-5 w-5 " />
                                    SMART Objective
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
                                            {dayjs(objective.targetDate).format("MMM D, YYYY")}
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
                                            <span className=" font-semibold">
                                                {
                                                    employees.find(
                                                        emp => emp.uid === objective.employee,
                                                    )?.firstName
                                                }
                                            </span>
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Description Section */}
                    <Card className="border-accent-200">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold ">Description</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className=" leading-relaxed">{objective.SMARTObjective}</p>
                        </CardContent>
                    </Card>

                    {/* Assessment Section */}
                    <div className="grid grid-cols-1  gap-8">
                        {/* Employee Self Assessment */}
                        <Card
                            className={`"border-accent-200" ${theme === "dark" ? "bg-black " : "bg-gradient-to-br from-success-50 to-white"}`}
                        >
                            <CardHeader className="pb-4">
                                <CardTitle className="text-lg font-semibold  flex items-center gap-2">
                                    <User className="h-5 w-5 text-success-600" />
                                    Employee Self Assessment
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4">
                                    <div>
                                        <Label className="text-sm font-medium  mb-2 block">
                                            Self Rating (1-5)
                                        </Label>
                                        <div className="flex items-center gap-3">
                                            <span className="text-lg font-bold text-success-700">
                                                {selfAssessment.rating ?? "Not specified"}
                                            </span>
                                            {selfAssessment.percent != null && (
                                                <Badge className="text-xs bg-success-100 text-success-800 border-success-200">
                                                    {selfAssessment.percent}%
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    {/* <div>
                                        <Label className="text-sm font-medium  mb-2 block">Percentage</Label>
                                        <Input
                                            value={`${selfAssessment.percentage}%`}
                                            readOnly
                                            className="bg-success-50 border-success-200"
                                        />
                                    </div> */}

                                    <div>
                                        <Label className="text-sm font-medium  mb-2 block">
                                            Justification
                                        </Label>
                                        <Textarea
                                            value={selfAssessment.justification}
                                            readOnly
                                            className={`"min-h-[100px]" ${theme === "dark" ? "" : "bg-gradient-to-br from-success-50 to-white"}`}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Action Items Section */}
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
                                                <p className="font-medium ">{item.actionItem}</p>
                                                {item.description && (
                                                    <p className="text-sm text-brand-600 mt-1">
                                                        {item.description}
                                                    </p>
                                                )}
                                                <p className="text-sm text-brand-500 mt-1">
                                                    Created:{" "}
                                                    {new Date(item.timestamp).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <Badge className="text-xs px-2 py-1 bg-brand-100 text-brand-700">
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
                </div>
            </DialogContent>
        </Dialog>
    );
}
