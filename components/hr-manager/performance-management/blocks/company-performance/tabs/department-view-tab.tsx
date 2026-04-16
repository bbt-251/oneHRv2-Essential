"use client";

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
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { CompanyPerformance } from "../type/performance-models";
import type { ObjectiveModel } from "@/lib/models/objective-model";
import type { EmployeeModel } from "@/lib/models/employee";
import type { HrSettingsByType } from "@/context/firestore-context";

interface DepartmentViewTabProps {
    companyPerformance: CompanyPerformance | null;
    objectives: ObjectiveModel[];
    employees: EmployeeModel[];
    cycleObjectives: ObjectiveModel[];
    selectedDepartment: string;
    setSelectedDepartment: (value: string) => void;
    getDepartmentName: (departmentId: string) => string;
}

export function DepartmentViewTab({
    companyPerformance,
    objectives,
    employees,
    cycleObjectives,
    selectedDepartment,
    setSelectedDepartment,
    getDepartmentName,
}: DepartmentViewTabProps) {
    if (!companyPerformance) return null;

    const departmentChartData = companyPerformance.departmentBreakdown.map(dept => ({
        name: getDepartmentName(dept.department),
        score: dept.averageScore,
        completion: dept.completionRate,
        employees: dept.employeeCount,
    }));

    return (
        <div className="space-y-6">
            {/* Department Filter */}
            <div className="flex items-center gap-4">
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                    <SelectTrigger
                        className="w-48"
                        style={{
                            borderColor: "rgba(63, 61, 86, 0.2)",
                        }}
                    >
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Select department" />
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
            </div>

            {/* Department Performance Comparison */}
            <Card style={{ borderColor: "rgba(63, 61, 86, 0.1)" }}>
                <CardHeader>
                    <CardTitle className="text-lg font-bold">
                        Department Performance Comparison
                    </CardTitle>
                    <CardDescription>
                        Average scores and completion rates by department
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                        <BarChart
                            data={departmentChartData}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(63, 61, 86, 0.1)" />
                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                            <YAxis tick={{ fontSize: 12 }} />
                            <Tooltip
                                contentStyle={{
                                    border: "1px solid rgba(63, 61, 86, 0.1)",
                                    borderRadius: "6px",
                                }}
                            />
                            <Bar
                                dataKey="score"
                                fill="rgba(255, 230, 167, 0.7)"
                                name="Average Score"
                            />
                            <Bar
                                dataKey="completion"
                                fill="rgba(63, 61, 86, 0.7)"
                                name="Completion Rate"
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Department Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {companyPerformance.departmentBreakdown
                    .filter(
                        dept =>
                            selectedDepartment === "all" || dept.department === selectedDepartment,
                    )
                    .map(dept => (
                        <Card
                            key={dept.department}
                            style={{ borderColor: "rgba(63, 61, 86, 0.1)" }}
                        >
                            <CardHeader>
                                <CardTitle className="text-lg font-bold">
                                    {getDepartmentName(dept.department)}
                                </CardTitle>
                                <CardDescription>{dept.employeeCount} employees</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-2xl">
                                            {dept.averageScore.toFixed(1)}%
                                        </div>
                                        <div className="text-sm">Average Score</div>
                                    </div>
                                    <div>
                                        <div className="text-2xl">
                                            {dept.completionRate.toFixed(1)}%
                                        </div>
                                        <div className="text-sm">Completion Rate</div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm">Objectives</span>
                                        <span className="font-medium">
                                            {(() => {
                                                // Calculate reviewed vs assigned objectives
                                                const deptEmployees = employees.filter(
                                                    emp => emp.department === dept.department,
                                                );
                                                const deptObjectives = objectives.filter(obj =>
                                                    deptEmployees.some(
                                                        emp => emp.id === obj.employee,
                                                    ),
                                                );
                                                const reviewedObjectives = deptObjectives.filter(
                                                    obj =>
                                                        obj.managerEvaluation?.value !== null &&
                                                        obj.managerEvaluation?.value !== undefined,
                                                ).length;
                                                const assignedObjectives = deptObjectives.length;

                                                return `${reviewedObjectives} (reviewed) / ${assignedObjectives} (assigned)`;
                                            })()}
                                        </span>
                                    </div>
                                    <Progress value={dept.completionRate} className="h-2" />
                                </div>
                                <div className="space-y-2">
                                    <h4 className="font-medium">KPI Contributions</h4>
                                    {dept.kpiContributions.map(contrib => (
                                        <div key={contrib.kpiId} className="text-sm">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[hsl(var(--dashboard-muted-foreground))]">
                                                    {contrib.kpiName}
                                                </span>
                                                <span className="font-medium text-[hsl(var(--dashboard-foreground))]">
                                                    {contrib.contributionPct.toFixed(1)}%
                                                </span>
                                            </div>
                                            <div className="text-xs text-[hsl(var(--dashboard-muted-foreground))]">
                                                {contrib.employeeObjectiveCount} objectives
                                                contributing
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
            </div>
        </div>
    );
}
