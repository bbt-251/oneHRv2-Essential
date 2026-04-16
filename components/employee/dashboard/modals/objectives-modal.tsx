"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
    Target,
    Search,
    Edit,
    CheckCircle,
    TrendingUp,
    Clock,
    AlertCircle,
    BarChart3,
    Filter,
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ObjectiveDetailModal } from "./objective-detail-modal";
import { useFirestore } from "@/context/firestore-context";
import { ObjectiveModel } from "@/lib/models/objective-model";
import { useAuth } from "@/context/authContext";
import { useTheme } from "@/components/theme-provider";
import dayjs from "dayjs";

interface ObjectivesModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ObjectivesModal({ isOpen, onClose }: ObjectivesModalProps) {
    const { objectives, objectiveWeights } = useFirestore();
    const { theme } = useTheme();
    const { user } = useAuth();

    const objectiveByEmployee = objectives.filter(
        obj => obj.employee === user?.uid && ["Acknowledged", "Approved"].includes(obj.status),
    );
    const getObjectiveWeight = (objectiveId: string) => {
        if (!objectiveWeights || objectiveWeights.length === 0) return 0;
        const weightObj = objectiveWeights[0].objectiveWeights.find(
            (ow: any) => ow.objectiveId === objectiveId,
        );
        return weightObj ? Number(weightObj.weight) : 0;
    };

    const getObjectiveProgress = (objective: ObjectiveModel) => {
        // If manager has evaluated, use action items completion
        if (objective.managerEvaluation && objective.managerEvaluation.value !== null) {
            if (!objective.actionItems || objective.actionItems.length === 0) return 0;

            const completedItems = objective.actionItems.filter(
                item => item.employee && item.manager,
            ).length;

            return completedItems > 0
                ? Math.round((completedItems / objective.actionItems.length) * 100)
                : 0;
        }
        // Otherwise, use self-assessment rating
        else if (objective.selfEvaluation && objective.selfEvaluation.value) {
            return Math.round((objective.selfEvaluation.value / 5) * 100);
        }

        return 0;
    };

    const [searchTerm, setSearchTerm] = useState<string>("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [selectedObjective, setSelectedObjective] = useState<ObjectiveModel | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);

    const getStatusColor = (status: string) => {
        switch (status) {
            case "completed":
                return "bg-success-100 text-success-800 border-success-200";
            case "active":
                return "bg-brand-100 text-brand-800 border-brand-200";
            case "Approved":
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
            case "Acknowledged":
                return <CheckCircle className="h-4 w-4" />;
            case "Created":
                return <Target className="h-4 w-4" />;
            case "Approved":
                return <AlertCircle className="h-4 w-4" />;
            case "draft":
                return <Edit className="h-4 w-4" />;
            case "pending":
                return <Clock className="h-4 w-4" />;
            default:
                return <Target className="h-4 w-4" />;
        }
    };
    const filterObjectives = (objectives: ObjectiveModel[]) => {
        return objectives.filter(obj => {
            const matchesSearch =
                obj.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                obj.id.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === "all" || obj.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    };

    const handleObjectiveClick = (objective: ObjectiveModel) => {
        setSelectedObjective(objective);
        setIsDetailModalOpen(true);
    };

    const createdStats = {
        total: objectiveByEmployee.length,
        acknowledged: objectiveByEmployee.filter(obj => obj.status === "Acknowledged").length,
        Approved: objectiveByEmployee.filter(obj => obj.status === "Approved").length,
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden">
                <DialogHeader className="pb-6">
                    <DialogTitle
                        className={`text-2xl font-bold flex items-center gap-3 ${theme === "dark" ? "text-brand-100" : "text-brand-800"}`}
                    >
                        <div className={`p-2 rounded-xl ${theme === "dark" ? "" : "bg-black"}`}>
                            <Target className="h-6 w-6 text-accent-600" />
                        </div>
                        My Objectives
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        {/* Filters */}
                        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-brand-400" />
                                <Input
                                    placeholder="Search objectives..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="pl-10 w-full sm:w-64 border-accent-300 focus:border-brand-500"
                                />
                            </div>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-full sm:w-40 border-accent-300 focus:border-brand-500">
                                    <Filter className="h-4 w-4 mr-2" />
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="Acknowledged">Acknowledged</SelectItem>
                                    <SelectItem value="Approved">Approved</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Stats Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <Card className="border-accent-200 bg-gradient-to-br from-accent-50 to-accent-100">
                                <CardContent className="p-4 text-center">
                                    <div className="text-2xl font-bold text-brand-800">
                                        {createdStats.total}
                                    </div>
                                    <div className="text-sm font-medium text-brand-600">Total</div>
                                </CardContent>
                            </Card>
                            <Card className="border-success-200 bg-gradient-to-br from-success-50 to-success-100">
                                <CardContent className="p-4 text-center">
                                    <div className="text-2xl font-bold text-success-800">
                                        {createdStats.acknowledged}
                                    </div>
                                    <div className="text-sm font-medium text-success-700">
                                        Acknowledged
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-danger-200 bg-gradient-to-br from-danger-50 to-danger-100">
                                <CardContent className="p-4 text-center">
                                    <div className="text-2xl font-bold text-green-800">
                                        {createdStats.Approved}
                                    </div>
                                    <div className="text-sm font-medium text-green-700">
                                        Approved
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Created Objectives List */}
                        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                            {filterObjectives(objectiveByEmployee).map(objective => (
                                <Card
                                    key={objective.id}
                                    className="border-accent-200 hover:shadow-md transition-all duration-200 cursor-pointer"
                                    onClick={() => handleObjectiveClick(objective)}
                                >
                                    <CardContent className="p-6">
                                        <div className="space-y-4">
                                            {/* Header */}
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                <div className="flex items-center gap-3">
                                                    <Badge
                                                        className={`text-xs px-2 py-1 border ${getStatusColor(objective.status)}`}
                                                    >
                                                        <div className="flex items-center gap-1">
                                                            {getStatusIcon(objective.status)}
                                                            <span className="capitalize">
                                                                {objective.status}
                                                            </span>
                                                        </div>
                                                    </Badge>
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div>
                                                <h3 className={`font-bold text-lg mb-2`}>
                                                    {objective.title}
                                                </h3>
                                                <p className={`text-sm mb-4`}>
                                                    {objective.SMARTObjective}
                                                </p>
                                            </div>

                                            {/* Details Grid */}
                                            <div className="grid grid-cols-2 md:grid-cols-7 gap-4 text-sm">
                                                <div>
                                                    <div
                                                        className={`flex items-center gap-1font-medium mb-1 `}
                                                    >
                                                        <BarChart3 className="h-3 w-3" />
                                                        Weight
                                                    </div>
                                                    <div className={`font-semibold `}>
                                                        {getObjectiveWeight(objective.id)}%
                                                    </div>
                                                </div>
                                                <div>
                                                    <div
                                                        className={`flex items-center gap-1  font-medium mb-1 `}
                                                    >
                                                        <TrendingUp className="h-3 w-3" />
                                                        Related KPI
                                                    </div>
                                                    <div className={`font-semibold `}>
                                                        {objective.deptKPI}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div
                                                        className={`flex items-center gap-1 font-medium mb-1 `}
                                                    >
                                                        <Clock className="h-3 w-3" />
                                                        Due Date
                                                    </div>
                                                    <div className={`font-semibold `}>
                                                        {dayjs(objective.targetDate).format(
                                                            "MMM D, YYYY",
                                                        )}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div
                                                        className={`flex items-center gap-1 font-medium mb-1 `}
                                                    >
                                                        <BarChart3 className="h-3 w-3" />
                                                        Progress
                                                    </div>
                                                    <div className={`font-semibold `}>
                                                        {getObjectiveProgress(objective)}%
                                                    </div>
                                                </div>
                                                <div>
                                                    <div
                                                        className={`flex items-center gap-1 font-medium mb-1 `}
                                                    >
                                                        <BarChart3 className="h-3 w-3" />
                                                        Self-Assessment Rating
                                                    </div>
                                                    <div className={`font-semibold `}>
                                                        {objective.selfEvaluation?.value || "-"}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div
                                                        className={`flex items-center gap-1 font-medium mb-1 `}
                                                    >
                                                        <BarChart3 className="h-3 w-3" />
                                                        Manager Rating
                                                    </div>
                                                    <div className={`font-semibold `}>
                                                        {objective.managerEvaluation?.value || "-"}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-between items-center pt-6 border-t border-accent-200">
                    <div className={`text-sm `}>
                        Showing {filterObjectives(objectiveByEmployee).length} of{" "}
                        {objectiveByEmployee.length} created objectives
                    </div>
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            className="border-accent-300 bg-transparent"
                        >
                            Close
                        </Button>
                    </div>
                </div>
            </DialogContent>
            <ObjectiveDetailModal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                objective={selectedObjective}
                weight={getObjectiveWeight(selectedObjective?.id || "")}
            />
        </Dialog>
    );
}
