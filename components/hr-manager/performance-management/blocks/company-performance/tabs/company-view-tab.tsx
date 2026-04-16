"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Filter } from "lucide-react";
import {
    Line,
    LineChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import type { CompanyPerformance } from "../type/performance-models";
import type { ObjectiveModel } from "@/lib/models/objective-model";
import type { EmployeeModel } from "@/lib/models/employee";
import type { HrSettingsByType } from "@/context/firestore-context";

interface CompanyViewTabProps {
    companyPerformance: CompanyPerformance | null;
    cycleObjectives: ObjectiveModel[];
    cycleKPIs: HrSettingsByType["departmentKPIs"];
    hrSettings: HrSettingsByType;
    selectedKPIDepartment: string;
    setSelectedKPIDepartment: (value: string) => void;
    selectedKPIStrategicObjective: string;
    setSelectedKPIStrategicObjective: (value: string) => void;
    getDepartmentName: (departmentId: string) => string;
    getStatusColor: (status: string) => string;
}

export function CompanyViewTab({
    companyPerformance,
    cycleObjectives,
    cycleKPIs,
    hrSettings,
    selectedKPIDepartment,
    setSelectedKPIDepartment,
    selectedKPIStrategicObjective,
    setSelectedKPIStrategicObjective,
    getDepartmentName,
    getStatusColor,
}: CompanyViewTabProps) {
    if (!companyPerformance) return null;

    const kpiTrendData = companyPerformance.strategicObjectives
        .flatMap(so => so.kpiPerformances)
        .map((kpi, index) => ({
            name: kpi.kpiName,
            target: kpi.targetValue,
            actual: kpi.actualValue,
            attainment: kpi.attainmentPct,
            month: `Month ${index + 1}`,
        }));

    return (
        <div className="space-y-6">
            {/* KPI Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card style={{ borderColor: "rgba(63, 61, 86, 0.1)" }}>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Overall Score</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div className="text-3xl">
                                {companyPerformance.overallScore.toFixed(1)}%
                            </div>
                            <Badge className={getStatusColor("on-track")}>On Track</Badge>
                        </div>
                        <Progress value={companyPerformance.overallScore} className="mt-3" />
                    </CardContent>
                </Card>

                <Card style={{ borderColor: "rgba(63, 61, 86, 0.1)" }}>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Objective Completion</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div className="text-3xl">
                                {companyPerformance.totalEmployeeObjectives > 0
                                    ? Math.round(
                                        (companyPerformance.completedEmployeeObjectives /
                                              companyPerformance.totalEmployeeObjectives) *
                                              100,
                                    )
                                    : 0}
                                %
                            </div>
                            <div className="text-sm">
                                {companyPerformance.completedEmployeeObjectives}/
                                {companyPerformance.totalEmployeeObjectives}
                            </div>
                        </div>
                        <Progress
                            value={
                                companyPerformance.totalEmployeeObjectives > 0
                                    ? (companyPerformance.completedEmployeeObjectives /
                                          companyPerformance.totalEmployeeObjectives) *
                                      100
                                    : 0
                            }
                            className="mt-3"
                        />
                    </CardContent>
                </Card>

                <Card style={{ borderColor: "rgba(63, 61, 86, 0.1)" }}>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Strategic Objectives</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div className="text-3xl">
                                {companyPerformance.strategicObjectives.length}
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="text-xs">
                                    {
                                        companyPerformance.strategicObjectives.filter(
                                            so => so.status === "on-track",
                                        ).length
                                    }{" "}
                                    On Track
                                </span>
                            </div>
                        </div>
                        <div className="mt-3 space-y-1">
                            {companyPerformance.strategicObjectives.map(so => (
                                <div
                                    key={so.strategicObjectiveId}
                                    className="flex items-center justify-between text-xs"
                                >
                                    <span className="truncate">{so.title}</span>
                                    <Badge
                                        variant="outline"
                                        className={`text-xs ${getStatusColor(so.status)}`}
                                    >
                                        {so.weightedScore.toFixed(1)}%
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card style={{ borderColor: "rgba(63, 61, 86, 0.1)" }}>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Departments</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div className="text-3xl">
                                {companyPerformance.departmentBreakdown.length}
                            </div>
                            <div className="text-sm">
                                Avg:{" "}
                                {(
                                    companyPerformance.departmentBreakdown.reduce(
                                        (sum, dept) => sum + dept.averageScore,
                                        0,
                                    ) / companyPerformance.departmentBreakdown.length
                                ).toFixed(1)}
                                %
                            </div>
                        </div>
                        <div className="mt-3 space-y-1">
                            {companyPerformance.departmentBreakdown.slice(0, 3).map(dept => (
                                <div
                                    key={dept.department}
                                    className="flex items-center justify-between text-xs"
                                >
                                    <span className="truncate">
                                        {getDepartmentName(dept.department)}
                                    </span>
                                    <span className="font-medium">
                                        {dept.averageScore.toFixed(1)}%
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Strategic Objectives Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card style={{ borderColor: "rgba(63, 61, 86, 0.1)" }}>
                    <CardHeader>
                        <CardTitle className="text-lg font-bold">
                            Strategic Objectives Performance
                        </CardTitle>
                        <CardDescription>
                            Weighted performance by strategic objective
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {companyPerformance.strategicObjectives.map(so => (
                                <div key={so.strategicObjectiveId} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">{so.title}</span>
                                                <Badge variant="outline" className="text-xs">
                                                    {so.weightPct}% weight
                                                </Badge>
                                            </div>
                                            <div className="text-sm">
                                                {so.contributingEmployeeObjectives} employee
                                                objectives • {so.departmentKPICount || 0} department
                                                KPIs
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-lg font-bold">
                                                {so.weightedScore.toFixed(1)}%
                                            </div>
                                            <Badge className={getStatusColor(so.status)}>
                                                {so.status}
                                            </Badge>
                                        </div>
                                    </div>
                                    <Progress value={so.weightedScore} className="h-2" />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card style={{ borderColor: "rgba(63, 61, 86, 0.1)" }}>
                    <CardHeader>
                        <CardTitle className="text-lg font-bold">KPI Performance Trends</CardTitle>
                        <CardDescription>Target vs actual performance over time</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={kpiTrendData}>
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="rgba(63, 61, 86, 0.1)"
                                />
                                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{
                                        border: "1px solid rgba(63, 61, 86, 0.1)",
                                        borderRadius: "6px",
                                    }}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="target"
                                    stroke="rgba(255, 230, 167, 0.7)"
                                    strokeWidth={2}
                                    name="Target"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="actual"
                                    stroke="rgba(63, 61, 86, 0.7)"
                                    strokeWidth={2}
                                    name="Actual"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* KPI Details Grid */}
            <Card style={{ borderColor: "rgba(63, 61, 86, 0.1)" }}>
                <CardHeader>
                    <CardTitle className="text-lg font-bold">Key Performance Indicators</CardTitle>
                    <CardDescription>Department KPIs with employee contributions</CardDescription>
                </CardHeader>
                <CardContent>
                    {/* KPI Filters */}
                    <div className="flex items-center gap-4 mb-6">
                        <Select
                            value={selectedKPIDepartment}
                            onValueChange={setSelectedKPIDepartment}
                        >
                            <SelectTrigger
                                className="w-48"
                                style={{
                                    borderColor: "rgba(63, 61, 86, 0.2)",
                                }}
                            >
                                <Filter className="h-4 w-4 mr-2" />
                                <SelectValue placeholder="Filter by department" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Departments</SelectItem>
                                {companyPerformance.departmentBreakdown.map(dept => (
                                    <SelectItem key={dept.department} value={dept.department}>
                                        {getDepartmentName(dept.department)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={selectedKPIStrategicObjective}
                            onValueChange={setSelectedKPIStrategicObjective}
                        >
                            <SelectTrigger
                                className="w-48"
                                style={{
                                    borderColor: "rgba(63, 61, 86, 0.2)",
                                }}
                            >
                                <Filter className="h-4 w-4 mr-2" />
                                <SelectValue placeholder="Filter by strategic objective" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Strategic Objectives</SelectItem>
                                {companyPerformance.strategicObjectives.length > 0 ? (
                                    companyPerformance.strategicObjectives.map(so => (
                                        <SelectItem
                                            key={so.strategicObjectiveId}
                                            value={so.strategicObjectiveId}
                                        >
                                            {so.title}
                                        </SelectItem>
                                    ))
                                ) : (
                                    <SelectItem value="none" disabled>
                                        No strategic objectives available
                                    </SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {cycleKPIs
                            .filter(kpi => {
                                const deptMatch =
                                    selectedKPIDepartment === "all" ||
                                    kpi.department === selectedKPIDepartment;
                                const soMatch =
                                    selectedKPIStrategicObjective === "all" ||
                                    kpi.linkedObjectiveId.includes(selectedKPIStrategicObjective);
                                return deptMatch && soMatch;
                            })
                            .map(kpi => {
                                // Calculate metrics for this KPI
                                const contributingObjectives = cycleObjectives.filter(
                                    obj => obj.deptKPI === kpi.id,
                                );
                                const contributingEmployees = [
                                    ...new Set(contributingObjectives.map(obj => obj.employee)),
                                ].length;
                                const associatedSOs = hrSettings.strategicObjectives.filter(so =>
                                    kpi.linkedObjectiveId.includes(so.id),
                                );

                                return (
                                    <div
                                        key={kpi.id}
                                        className="p-4 border rounded-lg"
                                        style={{
                                            borderColor: "rgba(63, 61, 86, 0.1)",
                                            backgroundColor: "rgba(255, 230, 167, 0.05)",
                                        }}
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1">
                                                <h4 className="font-medium">{kpi.title}</h4>
                                                <p className="text-xs mt-1">
                                                    {getDepartmentName(kpi.department)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm">
                                                    Employees Contributing
                                                </span>
                                                <span className="font-medium">
                                                    {contributingEmployees}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm">Objectives</span>
                                                <span className="font-medium">
                                                    {contributingObjectives.length}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm">
                                                    Strategic Objective(s)
                                                </span>
                                                <span className="font-medium text-xs">
                                                    {associatedSOs.map(so => so.title).join(", ")}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        {cycleKPIs.filter(kpi => {
                            const deptMatch =
                                selectedKPIDepartment === "all" ||
                                kpi.department === selectedKPIDepartment;
                            const soMatch =
                                selectedKPIStrategicObjective === "all" ||
                                kpi.linkedObjectiveId.includes(selectedKPIStrategicObjective);
                            return deptMatch && soMatch;
                        }).length === 0 && (
                            <div className="col-span-full text-center py-8 text-gray-500">
                                No KPIs found matching the selected filters for this cycle.
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
