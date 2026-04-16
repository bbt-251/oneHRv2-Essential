"use client";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCycle } from "@/context/cycleContext";
import { useFirestore } from "@/context/firestore-context";
import getEmployeeFullName from "@/lib/util/getEmployeeFullName";
import { Building2, Calendar, Target, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { CompanyViewTab } from "./tabs/company-view-tab";
import { DepartmentViewTab } from "./tabs/department-view-tab";
import { ObjectivesViewTab } from "./tabs/objectives-view-tab";
import type { CompanyPerformance } from "./type/performance-models";

interface CompanyPerformanceDashboardProps {
    cycleId: string;
    userRole: string;
}

export function CompanyPerformanceDashboard({
    cycleId,
    userRole,
}: CompanyPerformanceDashboardProps) {
    const { objectives, employees, hrSettings, loading: firestoreLoading } = useFirestore();
    const { cycles, currentCycle, setCurrentCycle } = useCycle();

    // Filter employee objectives by selected cycle
    const cycleObjectives = useMemo(() => {
        if (!currentCycle) return [];
        return objectives.filter(
            obj => obj.period === currentCycle.periodID && obj.round === currentCycle.roundID,
        );
    }, [objectives, currentCycle]);

    // Filter department KPIs by selected cycle
    const cycleKPIs = useMemo(() => {
        if (!currentCycle) return [];
        return hrSettings.departmentKPIs.filter(kpi => {
            if (currentCycle) {
                return kpi.period === currentCycle.periodID;
            }
            return false;
        });
    }, [hrSettings.departmentKPIs, currentCycle]);

    const [viewMode, setViewMode] = useState<"company" | "department" | "objectives">("company");
    const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
    const [selectedKPIDepartment, setSelectedKPIDepartment] = useState<string>("all");
    const [selectedKPIStrategicObjective, setSelectedKPIStrategicObjective] =
        useState<string>("all");
    const [companyPerformance, setCompanyPerformance] = useState<CompanyPerformance | null>(null);

    // Calculate company performance from real data
    const calculatedPerformance = useMemo(() => {
        if (firestoreLoading) return null;
        if (!currentCycle) return null;

        const totalEmployeeObjectives = cycleObjectives.length;
        const completedEmployeeObjectives = cycleObjectives.filter(
            obj => obj.managerEvaluation?.value && obj.managerEvaluation.value >= 4,
        ).length;

        const strategicObjectives =
            hrSettings.strategicObjectives.length > 0 && cycleKPIs.length > 0
                ? hrSettings.strategicObjectives.map(so => {
                    const linkedKPIs = cycleKPIs.filter(kpi =>
                        kpi.linkedObjectiveId.includes(so.id),
                    );

                    const kpiPerformances = linkedKPIs.map(kpi => {
                        const kpiObjectives = cycleObjectives.filter(
                            obj => obj.deptKPI === kpi.id,
                        );
                        const completedKPIObjectives = kpiObjectives.filter(
                            obj =>
                                obj.managerEvaluation?.value && obj.managerEvaluation.value >= 4,
                        );

                        const attainmentPct =
                              kpiObjectives.length > 0
                                  ? (completedKPIObjectives.length / kpiObjectives.length) * 100
                                  : 0;

                        return {
                            kpiId: kpi.id,
                            kpiName: kpi.title,
                            targetValue: 100,
                            actualValue: attainmentPct,
                            attainmentPct,
                            status:
                                  attainmentPct >= 80
                                      ? ("on-track" as const)
                                      : attainmentPct >= 60
                                          ? ("at-risk" as const)
                                          : ("off-track" as const),
                            trend: "stable" as const,
                            variance: attainmentPct - 100,
                            lastUpdated: new Date(),
                        };
                    });

                    const contributingEmployeeObjectives = cycleObjectives.filter(
                        obj => obj.deptKPI && linkedKPIs.some(kpi => kpi.id === obj.deptKPI),
                    ).length;

                    const weightedScore =
                          kpiPerformances.length > 0
                              ? kpiPerformances.reduce((sum, kpi) => sum + kpi.attainmentPct, 0) /
                                kpiPerformances.length
                              : 0;

                    return {
                        strategicObjectiveId: so.id,
                        title: so.title,
                        weightPct: so.weight,
                        weightedScore,
                        status:
                              weightedScore >= 80
                                  ? "on-track"
                                  : weightedScore >= 60
                                      ? "at-risk"
                                      : "off-track",
                        contributingEmployeeObjectives,
                        departmentKPICount: linkedKPIs.length,
                        kpiPerformances,
                    };
                })
                : hrSettings.strategicObjectives.length > 0
                    ? hrSettings.strategicObjectives.map(so => ({
                        strategicObjectiveId: so.id,
                        title: so.title,
                        weightPct: so.weight,
                        weightedScore: 0,
                        status: "off-track" as const,
                        contributingEmployeeObjectives: 0,
                        departmentKPICount: 0,
                        kpiPerformances: [],
                    }))
                    : [];

        const totalWeight = strategicObjectives.reduce((sum, so) => sum + so.weightPct, 0);
        const overallScore =
            totalWeight > 0
                ? (strategicObjectives.reduce(
                    (sum, so) => sum + (so.weightedScore * so.weightPct) / 100,
                    0,
                ) /
                      totalWeight) *
                  100
                : 0;

        const departments = [...new Set(employees.map(emp => emp.department))].filter(Boolean);
        const departmentBreakdown = departments.map(dept => {
            const deptEmployees = employees.filter(emp => emp.department === dept);
            const deptObjectives = cycleObjectives.filter(obj =>
                deptEmployees.some(emp => emp.id === obj.employee),
            );
            const completedObjectives = deptObjectives.filter(
                obj => obj.managerEvaluation?.value && obj.managerEvaluation.value >= 4,
            );

            const avgScore =
                deptObjectives.length > 0
                    ? (deptObjectives
                        .filter(obj => obj.managerEvaluation?.value)
                        .reduce((sum, obj) => sum + (obj.managerEvaluation?.value || 0), 0) /
                          deptObjectives.length) *
                      20
                    : 0;

            const deptKPIs = cycleKPIs.filter(kpi => kpi.department === dept);
            const kpiContributions = deptKPIs.map(kpi => {
                const contributingObjectives = cycleObjectives.filter(
                    obj => obj.deptKPI === kpi.id,
                );
                const completedContributingObjectives = contributingObjectives.filter(
                    obj => obj.managerEvaluation?.value && obj.managerEvaluation.value >= 4,
                );

                const contributionPct =
                    contributingObjectives.length > 0
                        ? (completedContributingObjectives.length / contributingObjectives.length) *
                          100
                        : 0;

                return {
                    kpiId: kpi.id,
                    kpiName: kpi.title,
                    employeeObjectiveCount: contributingObjectives.length,
                    contributionValue: contributionPct,
                    contributionPct,
                };
            });

            return {
                department: dept,
                employeeCount: deptEmployees.length,
                objectiveCount: deptObjectives.length,
                completionRate:
                    deptObjectives.length > 0
                        ? (completedObjectives.length / deptObjectives.length) * 100
                        : 0,
                averageScore: avgScore,
                kpiContributions,
            };
        });

        return {
            cycleId: currentCycle.id,
            cycleName: `Performance Cycle ${currentCycle.id}`,
            overallScore: strategicObjectives.length > 0 ? overallScore : 0,
            totalEmployeeObjectives: totalEmployeeObjectives || 0,
            completedEmployeeObjectives: completedEmployeeObjectives || 0,
            lastCalculated: new Date(),
            strategicObjectives,
            departmentBreakdown,
        } as CompanyPerformance;
    }, [objectives, employees, hrSettings, cycleId, firestoreLoading]);

    useEffect(() => {
        if (calculatedPerformance) {
            setCompanyPerformance(calculatedPerformance);
        }
    }, [calculatedPerformance]);

    if (firestoreLoading || !companyPerformance) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
                    <p>Loading company performance data...</p>
                </div>
            </div>
        );
    }

    // Helper function to get department name from ID
    const getDepartmentName = (departmentId: string) => {
        const dept = hrSettings.departmentSettings.find(d => d.id === departmentId);
        return dept ? dept.name : departmentId;
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "on-track":
                return "text-green-600 bg-green-50";
            case "at-risk":
                return "text-yellow-600 bg-yellow-50";
            case "off-track":
                return "text-red-600 bg-red-50";
            default:
                return "text-gray-600 bg-gray-50";
        }
    };

    // Helper function to get employee name
    const getEmployeeName = (employeeId: string) => {
        const employee = employees.find(emp => emp.uid === employeeId);
        return employee ? getEmployeeFullName(employee) : employeeId;
    };

    // Helper function to get cycle name from selected cycle
    const getCycleName = () => {
        if (!currentCycle) return "unknown_cycle";
        const period = hrSettings.periodicOptions.find(p => p.id === currentCycle.periodID);
        const periodName = period?.periodName || currentCycle.periodID;
        return `${periodName}`.replace(/\s+/g, "_");
    };

    return (
        <div className="min-h-screen">
            {/* Header Section */}
            <div
                className="border-b px-6 py-4"
                style={{
                    borderColor: "rgba(63, 61, 86, 0.1)",
                    background:
                        "linear-gradient(to right, rgba(255, 230, 167, 0.08), rgba(63, 61, 86, 0.02))",
                }}
            >
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl">Company Performance</h1>
                        <p className="text-sm mt-1">
                            Real-time performance analytics and strategic objective tracking
                        </p>
                    </div>
                </div>

                {/* View Toggle */}
                <Tabs
                    value={viewMode}
                    onValueChange={(value: any) => setViewMode(value)}
                    className="mt-4"
                >
                    <TabsList className="grid w-fit grid-cols-3">
                        <TabsTrigger value="company" className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            Company View
                        </TabsTrigger>
                        <TabsTrigger value="department" className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Department View
                        </TabsTrigger>
                        <TabsTrigger value="objectives" className="flex items-center gap-2">
                            <Target className="h-4 w-4" />
                            Objectives
                        </TabsTrigger>
                    </TabsList>
                </Tabs>

                {/* Cycle Selector */}
                <div className="mt-4">
                    <Select
                        value={currentCycle?.id || ""}
                        onValueChange={val => {
                            const cycle = cycles.find(c => c.id === val);
                            if (cycle) setCurrentCycle(cycle);
                        }}
                    >
                        <SelectTrigger className="w-64">
                            <Calendar className="h-4 w-4 mr-2" />
                            <SelectValue placeholder="Select performance cycle" />
                        </SelectTrigger>
                        <SelectContent>
                            {cycles.length > 0 ? (
                                cycles.map(cycle => (
                                    <SelectItem key={cycle.id} value={cycle.id ?? ""}>
                                        {cycle.periodName} - {cycle.roundName} ({cycle.periodYear})
                                    </SelectItem>
                                ))
                            ) : (
                                <SelectItem value="" disabled>
                                    No cycles available
                                </SelectItem>
                            )}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Main Dashboard Content */}
            <div className="p-6">
                <Tabs value={viewMode} className="space-y-6">
                    {/* Company View */}
                    <TabsContent value="company">
                        <CompanyViewTab
                            companyPerformance={companyPerformance}
                            cycleObjectives={cycleObjectives}
                            cycleKPIs={cycleKPIs}
                            hrSettings={hrSettings}
                            selectedKPIDepartment={selectedKPIDepartment}
                            setSelectedKPIDepartment={setSelectedKPIDepartment}
                            selectedKPIStrategicObjective={selectedKPIStrategicObjective}
                            setSelectedKPIStrategicObjective={setSelectedKPIStrategicObjective}
                            getDepartmentName={getDepartmentName}
                            getStatusColor={getStatusColor}
                        />
                    </TabsContent>

                    {/* Department View */}
                    <TabsContent value="department">
                        <DepartmentViewTab
                            companyPerformance={companyPerformance}
                            objectives={objectives}
                            employees={employees}
                            cycleObjectives={cycleObjectives}
                            selectedDepartment={selectedDepartment}
                            setSelectedDepartment={setSelectedDepartment}
                            getDepartmentName={getDepartmentName}
                        />
                    </TabsContent>

                    {/* Objectives View */}
                    <TabsContent value="objectives">
                        <ObjectivesViewTab
                            cycleObjectives={cycleObjectives}
                            allObjectives={objectives}
                            employees={employees}
                            hrSettings={hrSettings}
                            currentCycle={currentCycle}
                            getDepartmentName={getDepartmentName}
                            getEmployeeName={getEmployeeName}
                        />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
