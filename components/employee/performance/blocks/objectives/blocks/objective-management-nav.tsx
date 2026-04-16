"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Target, Plus, Filter, TrendingUp, Clock, CheckCircle } from "lucide-react";
import { EvaluationCampaignModel } from "@/lib/models/performance";
import { useTheme } from "@/components/theme-provider";
import { useCycle } from "@/context/cycleContext";
import dayjs from "dayjs";
import { dateFormat } from "@/lib/util/dayjs_format";

interface ObjectiveManagementNavProps {
    activeView?: string;
    onViewChange?: (view: string) => void;
    onCreateObjective?: () => void;
    onOpenFilter?: () => void;
    objectiveStats?: {
        total: number;
        pending: number;
        approved: number;
        inProgress: number;
        refused: number;
    };
    evaluationCampaign: EvaluationCampaignModel[];
}

export function ObjectiveManagementNav({
    activeView = "list",
    onViewChange,
    onCreateObjective,
    onOpenFilter,
    objectiveStats = { total: 0, pending: 0, approved: 0, inProgress: 0, refused: 0 },
}: ObjectiveManagementNavProps) {
    const { theme } = useTheme();
    const { currentCycle } = useCycle();
    const navigationItems = [
        {
            id: "list",
            label: "All Objectives",
            icon: Target,
            count: objectiveStats.total,
            description: "View all your objectives",
        },
        {
            id: "created",
            label: "Created",
            icon: Clock,
            count: objectiveStats.pending,
            description: "Newly created objectives",
            variant: "warning" as const,
        },
        {
            id: "approved",
            label: "Approved",
            icon: CheckCircle,
            count: objectiveStats.approved,
            description: "Manager approved objectives",
            variant: "success" as const,
        },
        {
            id: "refused",
            label: "Refused",
            icon: Target,
            count: objectiveStats.refused,
            description: "Objectives requiring revision",
            variant: "error" as const,
        },
        {
            id: "acknowledged",
            label: "Acknowledged",
            icon: TrendingUp,
            count: objectiveStats.inProgress,
            description: "Employee acknowledged objectives",
            variant: "info" as const,
        },
    ];
    // Get all evaluation campaigns from the HR settings

    const canAddObjectives = () => {
        if (!currentCycle) return false;

        const startDate = dayjs(currentCycle.startDate, dateFormat);
        const endDate = dayjs(currentCycle.endDate, dateFormat);

        return (
            (startDate.isBefore(dayjs()) || startDate.isSame(dayjs())) &&
            (endDate.isAfter(dayjs()) || endDate.isSame(dayjs()))
        );
    };

    const getVariantStyles = (variant?: string, isActive?: boolean) => {
        if (isActive) {
            return "bg-brand-600 text-white border-brand-600 hover:bg-brand-700";
        }

        switch (variant) {
            case "warning":
                return "border-yellow-200 bg-yellow-50 text-yellow-800 hover:bg-yellow-100 dark:border-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300 dark:hover:bg-yellow-900/30";
            case "success":
                return "border-green-200 bg-green-50 text-green-800 hover:bg-green-100 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300 dark:hover:bg-green-900/30";
            case "error":
                return "border-red-200 bg-red-50 text-red-800 hover:bg-red-100 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/30";
            case "info":
                return "border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/30";
            default:
                return "border-accent-200 bg-white text-brand-700 hover:bg-accent-50 dark:border-border dark:bg-card dark:text-foreground dark:hover:bg-accent/50";
        }
    };

    const getBadgeStyles = (variant?: string) => {
        switch (variant) {
            case "warning":
                return "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800";
            case "success":
                return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800";
            case "error":
                return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800";
            case "info":
                return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800";
            default:
                return "bg-brand-100 text-brand-800 border-brand-200 dark:bg-brand-900/20 dark:text-brand-300 dark:border-brand-800";
        }
    };

    return (
        <div className="space-y-6">
            {/* Quick Actions */}
            <Card
                className={`border-accent-200 shadow-sm ${theme === "dark" ? "bg-black" : "bg-white"}`}
            >
                <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h3
                                className={`text-lg font-semibold mb-2 ${theme === "dark" ? "text-white" : "text-brand-800"}`}
                            >
                                Objective Management
                            </h3>
                            <p
                                className={`text-sm ${theme === "dark" ? "text-white" : "text-brand-600"}`}
                            >
                                Create, track, and manage your performance objectives
                            </p>
                        </div>
                        <div className="flex gap-3">
                            {onOpenFilter && (
                                <Button
                                    variant="outline"
                                    onClick={onOpenFilter}
                                    className="border-brand-300 text-brand-600 hover:bg-brand-50 dark:border-brand-600 dark:text-brand-400 dark:hover:bg-brand-950 bg-transparent"
                                >
                                    <Filter className="h-4 w-4 mr-2" />
                                    Advanced Filter
                                </Button>
                            )}
                            {onCreateObjective && (
                                <Button
                                    onClick={onCreateObjective}
                                    className="bg-brand-600 hover:bg-brand-700 text-white"
                                    disabled={!canAddObjectives()}
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Objective
                                </Button>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Navigation Tabs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {navigationItems.map(item => {
                    const isActive = activeView === item.id;
                    return (
                        <Card
                            key={item.id}
                            className={`cursor-pointer transition-all duration-200 hover:shadow-md ${getVariantStyles(item.variant, isActive)}`}
                            onClick={() => onViewChange?.(item.id)}
                        >
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <item.icon className="h-5 w-5" />
                                    <Badge className={getBadgeStyles(item.variant)}>
                                        {item.count}
                                    </Badge>
                                </div>
                                <h4 className="font-semibold text-sm mb-1">{item.label}</h4>
                                <p className="text-xs opacity-80">{item.description}</p>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-2 text-sm text-brand-600 dark:text-muted-foreground">
                <Target className="h-4 w-4" />
                <span>Performance</span>
                <span>/</span>
                <span>Objectives</span>
                {activeView !== "list" && (
                    <>
                        <span>/</span>
                        <span
                            className={`font-medium ${theme === "dark" ? "text-white" : "text-brand-700"}`}
                        >
                            {navigationItems.find(item => item.id === activeView)?.label}
                        </span>
                    </>
                )}
            </div>
        </div>
    );
}
