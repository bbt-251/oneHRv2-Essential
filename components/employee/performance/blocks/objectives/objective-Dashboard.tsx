"use client";

import { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Target, Clock, CheckCircle, Star, AlertTriangle } from "lucide-react";

import { useFirestore } from "@/context/firestore-context";
import { useTheme } from "@/components/theme-provider";
import { AddObjectiveModal } from "./modals/add-objective-modal";
import { ObjectivesFilterModal } from "./modals/objectives-filter-modal";
import { ObjectiveDetailModal } from "./modals/objective-detail-modal";
import { ObjectiveCycleProgress } from "@/components/ui/objective-cycle-progress";

import { ObjectivesListing } from "./blocks/objectives-listing";
import { ObjectiveManagementNav } from "./blocks/objective-management-nav";
import { ObjectiveSelfAssessment } from "./blocks/objective-self-assessment";
import { updateObjectiveById } from "@/lib/backend/api/Performance/objective.service";
import { useToast } from "@/context/toastContext";
import { useAuth } from "@/context/authContext";
import { sendNotification } from "@/lib/util/notification/send-notification";
import { PERFORMANCE_MANAGEMENT_LOG_MESSAGES } from "@/lib/log-descriptions/performance-management";

import { ObjectiveModel } from "@/lib/models/objective-model";
import { useCycle } from "@/context/cycleContext";
import dayjs from "dayjs";
import { dateFormat } from "@/lib/util/dayjs_format";
import getFullName from "@/lib/util/getEmployeeFullName";
import { EmployeeModel } from "@/lib/models/employee";

export interface ObjectiveModelWithWeight extends ObjectiveModel {
    weight: number | null;
}

export function ObjectiveDashboard() {
    const { theme } = useTheme();
    const { showToast } = useToast();
    const { user, userData } = useAuth();
    const { objectives, hrSettings, employees, objectiveWeights } = useFirestore();

    const { currentCycle, context } = useCycle();
    const isEndCycle = dayjs(currentCycle?.endDate, dateFormat).isBefore(dayjs());
    const reporteeUids = employees
        .filter(e => e.reportingLineManager === user?.uid)
        .map(e => e.uid);
    const objectiveByEmployee =
        context === "employee"
            ? objectives.filter(o => o.employee === user?.uid)
            : objectives.filter(
                o => o.createdBy === user?.uid || reporteeUids.includes(o.createdBy),
            );

    const evaluationCampaign = hrSettings?.evaluationCampaigns;

    const [currentView, setCurrentView] = useState<
        "dashboard" | "objective-setting" | "self-assessment"
    >("dashboard");
    const [activeObjectiveView, setActiveObjectiveView] = useState<string>("list");
    const [isObjectiveModalOpen, setIsObjectiveModalOpen] = useState<boolean>(false);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState<boolean>(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
    const [editingObjective, setEditingObjective] = useState<ObjectiveModel | null>(null);
    const [selectedObjective, setSelectedObjective] = useState<ObjectiveModel | null>(null);
    const [activeFilters, setActiveFilters] = useState<any>({});

    const filteredObjectives = useMemo(() => {
        if (!user || !currentCycle) {
            console.debug("returning empty array");
            return [];
        }

        return objectiveByEmployee.filter(obj => {
            const isCorrectCycle =
                obj.period === currentCycle?.periodID && obj.round === currentCycle?.roundID;
            if (!isCorrectCycle) {
                return false;
            }
            if (activeObjectiveView !== "list") {
                switch (activeObjectiveView) {
                    case "pending":
                        return obj.status === "Created";
                    case "approved":
                        return obj.status === "Approved";
                    case "in-progress":
                        return obj.status === "Acknowledged";
                    case "refused":
                        return obj.status === "Refused";
                    default:
                        return true;
                }
            }

            if (Object.keys(activeFilters).length > 0) {
                return matchesFilters(obj, activeFilters);
            }

            return true;
        });
    }, [objectives, currentCycle, user, activeObjectiveView, activeFilters]);

    const handleAcknowledgement = async (objective: ObjectiveModel) => {
        try {
            const updatedObjective = {
                ...objective,
                status: "Acknowledged" as const,
            };
            await updateObjectiveById(
                objective.id,
                updatedObjective,
                user?.uid ?? "",
                PERFORMANCE_MANAGEMENT_LOG_MESSAGES.OBJECTIVE_ACKNOWLEDGED(
                    objective.title,
                    userData?.firstName + " " + userData?.surname || "Employee",
                ),
            );

            // Send notification to manager when employee acknowledges objective
            const manager = employees.find(emp => emp.uid === userData?.reportingLineManager);
            if (manager) {
                await sendNotification({
                    users: [
                        {
                            uid: manager.uid,
                            email: manager.companyEmail || manager.personalEmail || "",
                            telegramChatID: manager.telegramChatID || "",
                            recipientType: "manager" as const,
                        },
                    ],
                    channels: ["inapp", "telegram"],
                    messageKey: "EMPLOYEE_OBJECTIVE_ACKNOWLEDGED",
                    payload: {
                        employeeName: userData?.firstName + " " + userData?.surname || "Employee",
                        objectiveTitle: objective.title,
                    },
                    title: "Employee Objective Acknowledged",
                    getCustomMessage: () => ({
                        inapp: `Your objective ${objective.title} has been acknowledged by ${userData?.firstName + " " + userData?.surname || "Employee"}.`,
                        telegram: `Your objective ${objective.title} has been acknowledged by ${userData?.firstName + " " + userData?.surname || "Employee"}.`,
                    }),
                });
            }

            showToast("Objective acknowledged successfully", "success", "success");
        } catch (error) {
            showToast("Error acknowledging objective", "error", "error");
            console.error("Error acknowledging objective:", error);
        }
    };

    const handleEditObjective = useCallback((objective: ObjectiveModel) => {
        setEditingObjective(objective);
        setIsObjectiveModalOpen(true);
    }, []);

    const handleViewObjective = useCallback((objective: ObjectiveModel) => {
        setSelectedObjective(objective);
        setIsDetailModalOpen(true);
    }, []);

    const handleOpenFilterModal = useCallback(() => {
        setIsFilterModalOpen(true);
    }, []);

    const handleApplyFilters = useCallback((filters: any) => {
        setActiveFilters(filters);
    }, []);

    // Extended filtering to support selfEvaluationValue (min/max)
    function matchesFilters(obj: ObjectiveModel, filters: any): boolean {
        if (!filters || Object.keys(filters).length === 0) return true;
        return Object.entries(filters).every(([key, value]) => {
            if (value === undefined || value === null || value === "All" || value === "")
                return true;
            if (key === "selfEvaluationValue") {
                const v = obj.selfEvaluation?.value ?? undefined;
                const filterVal = value as { min?: number; max?: number };
                const minOk =
                    filterVal.min !== undefined ? v !== undefined && v >= filterVal.min : true;
                const maxOk =
                    filterVal.max !== undefined ? v !== undefined && v <= filterVal.max : true;
                return minOk && maxOk;
            }
            if (key === "managerEvaluationValue") {
                const v = obj.managerEvaluation?.value ?? undefined;
                const filterVal = value as { min?: number; max?: number };
                const minOk =
                    filterVal.min !== undefined ? v !== undefined && v >= filterVal.min : true;
                const maxOk =
                    filterVal.max !== undefined ? v !== undefined && v <= filterVal.max : true;
                return minOk && maxOk;
            }
            const objValue = (obj as any)[key];
            if (typeof objValue === "string") {
                return objValue.toLowerCase().includes(String(value).toLowerCase());
            }
            return objValue === value;
        });
    }

    const objectiveStats = useMemo(
        () => ({
            total: filteredObjectives.length,
            created: filteredObjectives.filter(obj => obj.status === "Created").length,
            approved: filteredObjectives.filter(obj => obj.status === "Approved").length,
            acknowledged: filteredObjectives.filter(obj => obj.status === "Acknowledged").length,
            refused: filteredObjectives.filter(obj => obj.status === "Refused").length,
            // Legacy stats for backward compatibility
            pending: filteredObjectives.filter(obj => obj.status === "Created").length,
            inProgress: filteredObjectives.filter(obj => obj.status === "Acknowledged").length,
        }),
        [filteredObjectives],
    );

    if (!currentCycle) {
        return (
            <div className="space-y-8">
                <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                        No evaluation cycle is currently selected. Please contact your manager to
                        set up an active performance cycle.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {isEndCycle && (
                <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
                    <AlertTriangle className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800 dark:text-blue-200">
                        This evaluation cycle has ended You can view your objectives but cannot make
                        changes.
                    </AlertDescription>
                </Alert>
            )}

            {/* {isTestingMode && (
                <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription className="text-green-800 dark:text-green-200">
                        <strong>Testing Mode Enabled:</strong> All objective and self-assessment actions are available regardless of
                        cycle restrictions.
                    </AlertDescription>
                </Alert>
            )} */}

            {currentView === "self-assessment" ? (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2
                                className={`text-2xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}
                            >
                                Objective Self-Assessment
                            </h2>
                            <p
                                className={`text-sm text-brand-600 dark:text-muted-foreground mt-1 ${theme === "dark" ? "text-white" : "text-gray-900"}`}
                            >
                                Rate your progress on objectives for {currentCycle.campaignName}
                            </p>
                        </div>
                        <Button
                            onClick={() => setCurrentView("dashboard")}
                            variant="outline"
                            className="border-brand-300 text-brand-600 hover:bg-brand-50 dark:border-brand-600 dark:text-brand-400 dark:hover:bg-brand-950"
                        >
                            Back to Dashboard
                        </Button>
                    </div>
                    <ObjectiveSelfAssessment objectives={filteredObjectives} />
                </div>
            ) : (
                <>
                    <ObjectiveCycleProgress
                        objectives={filteredObjectives}
                        currentCycle={currentCycle}
                        userUid={user?.uid}
                        objectiveWeights={objectiveWeights}
                        type="Employee"
                    />

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-2xl font-bold text-brand-800 dark:text-foreground">
                                My Objectives
                            </h2>
                            <p className="text-sm text-brand-600 dark:text-muted-foreground mt-1">
                                Track your progress and manage your performance objectives for{" "}
                                {currentCycle.campaignName}
                                {Object.keys(activeFilters).length > 0 && (
                                    <span className="ml-2">
                                        <Badge className="bg-brand-100 text-brand-800 border-brand-200 dark:bg-brand-900/20 dark:text-brand-300">
                                            {Object.keys(activeFilters).length} filter
                                            {Object.keys(activeFilters).length !== 1 ? "s" : ""}{" "}
                                            active
                                        </Badge>
                                    </span>
                                )}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                onClick={() => setCurrentView("self-assessment")}
                                variant="outline"
                                disabled={isEndCycle}
                                className="border-brand-300 text-brand-600 hover:bg-brand-50 dark:border-brand-600 dark:text-brand-400 dark:hover:bg-brand-950 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Star className="h-4 w-4 mr-2" />
                                Self-Assessment
                                {isEndCycle && <Clock className="h-3 w-3 ml-2" />}
                            </Button>
                        </div>
                    </div>

                    {(isEndCycle || isEndCycle) && (
                        <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20">
                            <AlertTriangle className="h-4 w-4 text-orange-600" />
                            <AlertDescription className="text-orange-800 dark:text-orange-200">
                                {isEndCycle && "Objective setting deadline has passed. "}
                                {isEndCycle &&
                                    "Self-assessment is not yet available or deadline has passed. "}
                                Contact your manager if you need assistance.
                            </AlertDescription>
                        </Alert>
                    )}

                    <ObjectiveManagementNav
                        activeView={activeObjectiveView}
                        onViewChange={setActiveObjectiveView}
                        onCreateObjective={() => {
                            setEditingObjective(null);
                            setIsObjectiveModalOpen(true);
                        }}
                        onOpenFilter={() => setIsFilterModalOpen(true)}
                        objectiveStats={objectiveStats}
                        evaluationCampaign={evaluationCampaign}
                    />

                    <ObjectivesListing
                        objectives={filteredObjectives}
                        onEdit={handleEditObjective}
                        onView={handleViewObjective}
                        onAcknowledgement={handleAcknowledgement}
                        onFilter={handleOpenFilterModal}
                        title={`${activeObjectiveView === "list" ? "All" : "My"} Objectives`}
                        description={`Manage your performance objectives for ${currentCycle.campaignName}`}
                        isEndCycle={isEndCycle}
                        showActions={true}
                    />
                </>
            )}

            <AddObjectiveModal
                open={isObjectiveModalOpen}
                onOpenChange={open => {
                    setIsObjectiveModalOpen(open);
                    if (!open) setEditingObjective(null);
                }}
                editObjective={editingObjective}
            />

            <ObjectivesFilterModal
                open={isFilterModalOpen}
                onOpenChange={setIsFilterModalOpen}
                onApplyFilters={handleApplyFilters}
                currentFilters={activeFilters}
                objectives={filteredObjectives}
            />

            <ObjectiveDetailModal
                isOpen={isDetailModalOpen}
                onClose={() => {
                    setIsDetailModalOpen(false);
                    setSelectedObjective(null);
                }}
                onEdit={handleEditObjective}
                objective={selectedObjective}
                isEndCycle={isEndCycle}
            />
        </div>
    );
}
