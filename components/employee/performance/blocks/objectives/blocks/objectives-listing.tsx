"use client";

import type React from "react";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
    Search,
    Filter,
    Eye,
    Edit,
    Calendar,
    Target,
    Clock,
    CheckCircle,
    AlertCircle,
    LinkIcon,
    MoreHorizontal,
    SortAsc,
    SortDesc,
    CheckCircle2,
    Lock,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ObjectiveModel } from "@/lib/models/objective-model";
import { useFirestore } from "@/context/firestore-context";
import { useTheme } from "@/components/theme-provider";
import { useAuth } from "@/context/authContext";
import getFullName from "@/lib/util/getEmployeeFullName";
import { EmployeeModel } from "@/lib/models/employee";

interface ObjectivesListingProps {
    objectives: ObjectiveModel[];
    onEdit?: (objective: ObjectiveModel) => void;
    onView?: (objective: ObjectiveModel) => void;
    onFilter?: () => void;
    onAcknowledgement?: (objective: ObjectiveModel) => void;
    showActions?: boolean;
    title?: string;
    description?: string;
    isEndCycle?: boolean;
}

type SortField = "title" | "targetDate" | "percentage" | "status" | "timestamp";
type SortDirection = "asc" | "desc";

export function ObjectivesListing({
    objectives,
    onEdit,
    onView,
    onFilter,
    onAcknowledgement,
    showActions = true,
    isEndCycle = false,
    title = "Objectives",
    description = "Manage and track your performance objectives",
}: ObjectivesListingProps) {
    const { employees, hrSettings } = useFirestore();
    const { userData, user } = useAuth();
    const { theme } = useTheme();

    const findRoleFromById = (id: string) => employees.find(emp => emp.uid === id)?.role;

    const getDepartmentKpiName = (kpiId: string) => {
        return hrSettings?.departmentKPIs?.find(kpi => kpi.id === kpiId)?.title || "N/A";
    };

    const [searchQuery, setSearchQuery] = useState<string>("");
    const [sortField, setSortField] = useState<SortField>("timestamp");
    const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
    const [viewMode, setViewMode] = useState<"table" | "cards">("table");

    const getStatusColor = (status: string) => {
        switch (status) {
            case "Created":
            case "pending":
                return "bg-yellow-100 text-yellow-900 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-200 dark:border-yellow-600 shadow-sm";
            case "Approved":
            case "approved":
                return "bg-green-100 text-green-900 border-green-300 dark:bg-green-900/30 dark:text-green-200 dark:border-green-600 shadow-sm";
            case "Refused":
            case "rejected":
                return "bg-red-100 text-red-900 border-red-300 dark:bg-red-900/30 dark:text-red-200 dark:border-red-600 shadow-sm";
            case "Acknowledged":
            case "acknowledged":
                return "bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-600 shadow-sm";
            default:
                return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700";
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "Created":
            case "pending":
                return <Clock className="h-3 w-3 animate-pulse" />;
            case "Approved":
            case "approved":
                return <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />;
            case "Refused":
            case "rejected":
                return <AlertCircle className="h-3 w-3 text-red-600 dark:text-red-400" />;
            case "Acknowledged":
            case "acknowledged":
                return <CheckCircle className="h-3 w-3 text-blue-600 dark:text-blue-400" />;
            default:
                return <Clock className="h-3 w-3" />;
        }
    };

    const getStatusPriority = (status: string) => {
        switch (status) {
            case "Created":
            case "pending":
                return 1;
            case "Approved":
            case "approved":
                return 2;
            case "Acknowledged":
            case "acknowledged":
                return 3;
            case "Refused":
            case "rejected":
                return 4;
            default:
                return 0;
        }
    };

    const getStatusDescription = (status: string) => {
        switch (status) {
            case "Created":
                return "Objective created and awaiting manager approval";
            case "Approved":
                return "Objective approved by manager and ready for execution";
            case "Refused":
                return "Objective requires revision before approval";
            case "Acknowledged":
                return "Objective acknowledged and in progress";
            default:
                return "Status unknown";
        }
    };

    const getObjectiveProgress = (objective: ObjectiveModel) => {
        // Calculate progress based on action items completion only
        if (!objective.actionItems || objective.actionItems.length === 0) return 0;

        const completedItems = objective.actionItems.filter(
            item => item.employee && item.manager,
        ).length;

        return completedItems > 0
            ? Math.round((completedItems / objective.actionItems.length) * 100)
            : 0;
    };

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortDirection("asc");
        }
    };

    const filteredAndSortedObjectives = useMemo(() => {
        const filtered = objectives.filter(
            objective =>
                objective.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                objective.SMARTObjective.toLowerCase().includes(searchQuery.toLowerCase()) ||
                objective.employee.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (objective.deptKPI &&
                    objective.deptKPI.toLowerCase().includes(searchQuery.toLowerCase())),
        );

        return filtered.sort((a, b) => {
            let aValue: any = (a as any)[sortField];
            let bValue: any = (b as any)[sortField];

            // Handle date fields
            if (sortField === "targetDate" || sortField === "timestamp") {
                aValue = new Date(aValue).getTime();
                bValue = new Date(bValue).getTime();
            }

            // Handle percentage field
            if (sortField === "percentage") {
                aValue = (a as any).percentage || 0;
                bValue = (b as any).percentage || 0;
            }

            if (sortField === "status") {
                aValue = getStatusPriority(a.status);
                bValue = getStatusPriority(b.status);
            }

            if (sortDirection === "asc") {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });
    }, [objectives, searchQuery, sortField, sortDirection]);

    const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
        <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSort(field)}
            className="h-auto p-0 font-semibold text-brand-700 hover:text-brand-800 dark:text-foreground"
        >
            {children}
            {sortField === field &&
                (sortDirection === "asc" ? (
                    <SortAsc className="ml-1 h-3 w-3" />
                ) : (
                    <SortDesc className="ml-1 h-3 w-3" />
                ))}
        </Button>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2
                        className={`text-2xl font-bold ${theme === "dark" ? "text-white" : "text-brand-700"}`}
                    >
                        {title}
                    </h2>
                    <p className="text-sm text-brand-600 dark:text-muted-foreground mt-1">
                        {description}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setViewMode(viewMode === "table" ? "cards" : "table")}
                        className="border-brand-300 text-brand-600 hover:bg-brand-50 dark:border-brand-600 dark:text-brand-400 dark:hover:bg-brand-950"
                    >
                        {viewMode === "table" ? "Card View" : "Table View"}
                    </Button>
                    {onFilter && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onFilter}
                            className="border-brand-300 text-brand-600 hover:bg-brand-50 dark:border-brand-600 dark:text-brand-400 dark:hover:bg-brand-950 bg-transparent"
                        >
                            <Filter className="h-4 w-4 mr-2" />
                            Advanced Filter
                        </Button>
                    )}
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                    placeholder="Search objectives by title, description, employee, or KPI..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Results Count */}
            <div className="flex items-center justify-between text-sm text-brand-600 dark:text-muted-foreground">
                <span>
                    Showing {filteredAndSortedObjectives.length} of {objectives.length} objectives
                </span>
                {searchQuery && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSearchQuery("")}
                        className="text-brand-600 hover:text-brand-700 dark:text-brand-400"
                    >
                        Clear search
                    </Button>
                )}
            </div>

            {/* Table View */}
            {viewMode === "table" && (
                <Card
                    className={`border-accent-200 shadow-sm bg- dark:bg-card dark:border-border ${theme === "dark" ? "bg-black border-border" : "bg-white border-accent-200"}`}
                >
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow
                                    className={`border-accent-200 dark:border-border ${theme === "dark" ? "border-border" : "border-accent-200"}`}
                                >
                                    <TableHead className="w-[300px]">
                                        <SortButton field="title">Objective</SortButton>
                                    </TableHead>
                                    <TableHead>
                                        <SortButton field="status">Status</SortButton>
                                    </TableHead>
                                    <TableHead>
                                        <SortButton field="percentage">Progress</SortButton>
                                    </TableHead>
                                    <TableHead>
                                        <SortButton field="targetDate">Due Date</SortButton>
                                    </TableHead>
                                    <TableHead>Self-Assessment</TableHead>
                                    <TableHead>Manager Rating</TableHead>
                                    <TableHead>Manager Comment</TableHead>
                                    <TableHead>KPI</TableHead>
                                    {showActions && (
                                        <TableHead className="w-[100px]">Actions</TableHead>
                                    )}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredAndSortedObjectives.map(objective => (
                                    <TableRow
                                        key={objective.id}
                                        className="border-accent-200 dark:border-border dark:hover:bg-accent/10 hover:cursor-pointer"
                                        onClick={() => onView && onView(objective)}
                                    >
                                        <TableCell>
                                            <div className="space-y-1">
                                                <div className="font-semibold text-brand-800 dark:text-foreground">
                                                    {objective.title}
                                                </div>
                                                <div className="text-sm text-brand-600 dark:text-muted-foreground line-clamp-2">
                                                    {objective.SMARTObjective}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="group relative">
                                                <Badge
                                                    className={`${getStatusColor(objective.status)} flex items-center gap-1.5 w-fit font-medium px-3 py-1 transition-all duration-200 hover:scale-105`}
                                                >
                                                    {getStatusIcon(objective.status)}
                                                    <span className="font-semibold">
                                                        {objective.status}
                                                    </span>
                                                </Badge>
                                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10 dark:bg-gray-100 dark:text-gray-900">
                                                    {getStatusDescription(objective.status)}
                                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-100"></div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="space-y-1">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="font-medium">
                                                        {getObjectiveProgress(objective)}%
                                                    </span>
                                                </div>
                                                <Progress
                                                    value={getObjectiveProgress(objective)}
                                                    className="h-2 w-20"
                                                />
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1 text-sm text-brand-600 dark:text-muted-foreground">
                                                <Calendar className="h-3 w-3" />
                                                {new Date(
                                                    objective.targetDate,
                                                ).toLocaleDateString()}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm font-medium text-brand-700 dark:text-foreground">
                                                {objective.selfEvaluation?.value || "-"}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm font-medium text-brand-700 dark:text-foreground">
                                                {objective.managerEvaluation?.value || "-"}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm text-brand-600 dark:text-muted-foreground line-clamp-2 max-w-[200px]">
                                                {objective.managerEvaluation?.managerMessage || "-"}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1 text-sm text-brand-600 dark:text-muted-foreground">
                                                <LinkIcon className="h-3 w-3" />
                                                {getDepartmentKpiName(objective.deptKPI || "")}
                                            </div>
                                        </TableCell>
                                        {showActions && (
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 w-8 p-0"
                                                        >
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        {onView && (
                                                            <DropdownMenuItem
                                                                onClick={() => onView(objective)}
                                                            >
                                                                <Eye className="h-4 w-4 mr-2" />
                                                                View Details
                                                            </DropdownMenuItem>
                                                        )}
                                                        {onEdit &&
                                                            !isEndCycle &&
                                                            objective.createdBy === user?.uid &&
                                                            objective.status !== "Approved" &&
                                                            objective.status !== "Acknowledged" && (
                                                            <DropdownMenuItem
                                                                onClick={() =>
                                                                    onEdit(objective)
                                                                }
                                                            >
                                                                <Edit className="h-4 w-4 mr-2" />
                                                                    Edit Objective
                                                            </DropdownMenuItem>
                                                        )}
                                                        {objective.status === "Created" &&
                                                            objective.createdBy !== userData?.uid &&
                                                            findRoleFromById(
                                                                objective.createdBy,
                                                            )?.includes("Manager") &&
                                                            !isEndCycle && (
                                                            <DropdownMenuItem
                                                                onClick={() =>
                                                                    onAcknowledgement &&
                                                                        onAcknowledgement(objective)
                                                                }
                                                            >
                                                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                                                    Acknowledge
                                                            </DropdownMenuItem>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}

            {/* Card View */}
            {viewMode === "cards" && (
                <div className="grid gap-4">
                    {filteredAndSortedObjectives.map(objective => (
                        <Card
                            key={objective.id}
                            className="border-accent-200 shadow-sm bg-white hover:shadow-md transition-all duration-200 dark:bg-card dark:border-border"
                        >
                            <CardHeader className="pb-4">
                                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <CardTitle className="text-lg font-semibold text-brand-800 mb-2 dark:text-foreground">
                                            {objective.title}
                                        </CardTitle>
                                        <p className="text-sm text-brand-600 dark:text-muted-foreground mb-3">
                                            {objective.SMARTObjective}
                                        </p>
                                        <div className="flex items-center gap-2 text-sm text-brand-500 dark:text-brand-400">
                                            <LinkIcon className="h-3 w-3" />
                                            <span>
                                                KPI: {getDepartmentKpiName(objective.deptKPI || "")}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex flex-row lg:flex-col items-start lg:items-end gap-3 lg:gap-2">
                                        <div className="group relative">
                                            <Badge
                                                className={`${getStatusColor(objective.status)} flex items-center gap-1.5 whitespace-nowrap font-medium px-3 py-1.5 transition-all duration-200 hover:scale-105`}
                                            >
                                                {getStatusIcon(objective.status)}
                                                <span className="font-semibold">
                                                    {objective.status}
                                                </span>
                                            </Badge>
                                            <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10 dark:bg-gray-100 dark:text-gray-900">
                                                {getStatusDescription(objective.status)}
                                                <div className="absolute top-full right-4 border-4 border-transparent border-t-gray-900 dark:border-t-gray-100"></div>
                                            </div>
                                        </div>
                                        <span className="text-sm font-semibold text-brand-700 dark:text-brand-300 whitespace-nowrap">
                                            {getFullName(
                                                employees.find(
                                                    emp => emp.uid === objective.employee,
                                                ) as EmployeeModel,
                                            )}
                                        </span>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <div className="space-y-4">
                                    {/* Progress Section */}
                                    <div>
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="text-brand-600 font-medium dark:text-muted-foreground">
                                                Progress
                                            </span>
                                            <span className="text-brand-700 font-semibold dark:text-brand-300">
                                                {getObjectiveProgress(objective)}%
                                            </span>
                                        </div>
                                        <Progress
                                            value={getObjectiveProgress(objective)}
                                            className="h-2"
                                        />
                                    </div>

                                    {/* Ratings Section */}
                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                        <div>
                                            <span className="text-brand-600 font-medium dark:text-muted-foreground">
                                                Self-Assessment
                                            </span>
                                            <span className="text-brand-700 font-semibold dark:text-brand-300">
                                                {objective.selfEvaluation?.value || "-"}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-brand-600 font-medium dark:text-muted-foreground">
                                                Manager Rating
                                            </span>
                                            <span className="text-brand-700 font-semibold dark:text-brand-300">
                                                {objective.managerEvaluation?.value || "-"}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-brand-600 font-medium dark:text-muted-foreground">
                                                Manager Comment
                                            </span>
                                            <span className="text-brand-700 font-semibold dark:text-brand-300 line-clamp-2">
                                                {objective.managerEvaluation?.managerMessage || "-"}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Footer Actions */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-accent-100 dark:border-border">
                                        <div className="flex items-center gap-2 text-sm text-brand-600 dark:text-muted-foreground">
                                            <Calendar className="h-4 w-4" />
                                            <span>
                                                Due:{" "}
                                                {new Date(
                                                    objective.targetDate,
                                                ).toLocaleDateString()}
                                            </span>
                                        </div>
                                        {showActions && (
                                            <div className="flex gap-2">
                                                {onView && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => onView(objective)}
                                                        className="border-brand-300 text-brand-600 hover:bg-brand-50 dark:border-brand-600 dark:text-brand-400 dark:hover:bg-brand-950 bg-transparent"
                                                    >
                                                        <Eye className="h-4 w-4 mr-2" />
                                                        View Details
                                                    </Button>
                                                )}
                                                {onEdit &&
                                                    !isEndCycle &&
                                                    objective.createdBy === user?.uid &&
                                                    objective.status !== "Approved" &&
                                                    objective.status !== "Acknowledged" && (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => onEdit(objective)}
                                                        className="bg-brand-600 hover:bg-brand-700 text-white"
                                                    >
                                                        <Edit className="h-4 w-4 mr-2" />
                                                            Edit
                                                    </Button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Empty State */}
            {filteredAndSortedObjectives.length === 0 && (
                <Card
                    className={`shadow-sm ${theme === "dark" ? "bg-black border-border" : "bg-white border-accent-200"}`}
                >
                    <CardContent className="py-12 text-center">
                        <Target
                            className={`h-12 w-12 text-gray-400 mx-auto mb-4 ${theme === "dark" ? "text-white" : "text-brand-700"}`}
                        />
                        <h3 className="text-lg font-semibold text-brand-800 mb-2 dark:text-foreground">
                            {searchQuery ? "No objectives found" : "No objectives available"}
                        </h3>
                        <p className="text-brand-600 mb-6 dark:text-muted-foreground">
                            {searchQuery
                                ? `No objectives match your search for "${searchQuery}"`
                                : "There are no objectives to display at this time."}
                        </p>
                        {searchQuery && (
                            <Button
                                onClick={() => setSearchQuery("")}
                                variant="outline"
                                className="border-brand-300 text-brand-600 hover:bg-brand-50 dark:border-brand-600 dark:text-brand-400 dark:hover:bg-brand-950"
                            >
                                Clear search
                            </Button>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
