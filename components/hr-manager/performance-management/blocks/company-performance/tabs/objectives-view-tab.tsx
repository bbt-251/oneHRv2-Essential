"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/util/dayjs_format";
import getEmployeeFullName from "@/lib/util/getEmployeeFullName";
import { useState, useMemo } from "react";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
    PaginationEllipsis,
} from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import type { ObjectiveModel } from "@/lib/models/objective-model";
import type { EmployeeModel } from "@/lib/models/employee";
import type { HrSettingsByType } from "@/context/firestore-context";
import { MultiSelectDropdown } from "../components/multi-select-dropdown";
import { Download, Pencil } from "lucide-react";
import { exportObjectives } from "../utils/export-utils";
import { ObjectiveDetailModal } from "@/components/employee/performance/blocks/objectives/modals/objective-detail-modal";
import DeleteConfirm from "@/components/hr-manager/core-settings/blocks/delete-confirm";
import { deleteObjective } from "@/lib/backend/api/objective/objective-service";
import { AddObjectiveModal } from "@/components/manager/team-performance/modals/add-objective-modal";
import { useAuth } from "@/context/authContext";
import { useToast } from "@/context/toastContext";

interface ObjectivesViewTabProps {
    cycleObjectives: ObjectiveModel[];
    allObjectives: ObjectiveModel[]; // All objectives without cycle filter
    employees: EmployeeModel[];
    hrSettings: HrSettingsByType;
    currentCycle: {
        id?: string | null;
        periodID: string;
        roundID: string;
    } | null;
    getDepartmentName: (departmentId: string) => string;
    getEmployeeName: (employeeId: string) => string;
}

export function ObjectivesViewTab({
    cycleObjectives,
    allObjectives,
    employees,
    hrSettings,
    currentCycle,
    getDepartmentName,
    getEmployeeName,
}: ObjectivesViewTabProps) {
    const { user } = useAuth();
    const { showToast } = useToast();

    // Details modal state
    const [selectedObjective, setSelectedObjective] = useState<ObjectiveModel | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    // Edit modal state
    const [editingObjective, setEditingObjective] = useState<ObjectiveModel | null>(null);
    const [editModalOpen, setEditModalOpen] = useState(false);

    // Filter states
    const [objectivesTitleFilter, setObjectivesTitleFilter] = useState<string>("");
    const [objectivesEmployeeFilter, setObjectivesEmployeeFilter] = useState<string[]>([]);
    const [objectivesDepartmentFilter, setObjectivesDepartmentFilter] = useState<string[]>([]);
    const [objectivesKPIFilter, setObjectivesKPIFilter] = useState<string[]>([]);
    const [objectivesStrategicFilter, setObjectivesStrategicFilter] = useState<string[]>([]);

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Get unique departments from employees
    const departments = useMemo(() => {
        return [...new Set(employees.map(emp => emp.department).filter(Boolean))];
    }, [employees]);

    // Get cycle KPIs
    const cycleKPIs = useMemo(() => {
        if (!currentCycle) return [];
        return hrSettings.departmentKPIs.filter(kpi => kpi.period === currentCycle.periodID);
    }, [hrSettings.departmentKPIs, currentCycle]);

    // Filter objectives
    const filteredObjectives = useMemo(() => {
        return cycleObjectives.filter(obj => {
            const employee = employees.find(emp => emp.id === obj.employee);
            const kpi = hrSettings.departmentKPIs.find(k => k.id === obj.deptKPI);

            // Title filter
            if (
                objectivesTitleFilter &&
                !obj.title.toLowerCase().includes(objectivesTitleFilter.toLowerCase())
            )
                return false;

            // Employee filter
            if (
                objectivesEmployeeFilter.length > 0 &&
                !objectivesEmployeeFilter.includes(obj.employee)
            )
                return false;

            // Department filter
            if (
                objectivesDepartmentFilter.length > 0 &&
                employee &&
                !objectivesDepartmentFilter.includes(employee.department)
            )
                return false;

            // KPI filter
            if (objectivesKPIFilter.length > 0 && !objectivesKPIFilter.includes(obj.deptKPI || ""))
                return false;

            // Strategic objective filter
            if (objectivesStrategicFilter.length > 0 && kpi) {
                const hasMatchingSO = kpi.linkedObjectiveId.some(soId =>
                    objectivesStrategicFilter.includes(soId),
                );
                if (!hasMatchingSO) return false;
            }

            return true;
        });
    }, [
        cycleObjectives,
        employees,
        hrSettings.departmentKPIs,
        objectivesTitleFilter,
        objectivesEmployeeFilter,
        objectivesDepartmentFilter,
        objectivesKPIFilter,
        objectivesStrategicFilter,
    ]);

    // Pagination logic
    const totalPages = Math.ceil(filteredObjectives.length / itemsPerPage);
    const paginatedObjectives = filteredObjectives.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage,
    );

    const handlePageChange = (page: number) => {
        setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    };

    // Clear filters
    const clearFilters = () => {
        setObjectivesTitleFilter("");
        setObjectivesEmployeeFilter([]);
        setObjectivesDepartmentFilter([]);
        setObjectivesKPIFilter([]);
        setObjectivesStrategicFilter([]);
        setCurrentPage(1);
    };

    // Get period and round info
    const period = hrSettings.periodicOptions.find(p => p.id === currentCycle?.periodID);
    const round = period?.evaluations?.find(e => e.id === currentCycle?.roundID);

    // Export table (filtered) objectives
    const handleExportTable = () => {
        if (!currentCycle) {
            alert("No cycle selected for export");
            return;
        }

        const periodName = period?.periodName || currentCycle.periodID || "";
        const evaluationRound = round?.round || currentCycle.roundID || "";
        // Filename: "{period} - {round}"
        const filename = `${periodName}${evaluationRound ? " - " + evaluationRound : ""}`;

        exportObjectives(
            filteredObjectives,
            employees,
            hrSettings,
            periodName,
            evaluationRound,
            filename,
            getDepartmentName,
        );
    };

    // Export all objectives
    const handleExportAll = () => {
        const periodName = period?.periodName || currentCycle?.periodID || "";
        const evaluationRound = round?.round || currentCycle?.roundID || "";
        // Filename: "All Objectives"
        const filename = "All Objectives";

        exportObjectives(
            allObjectives,
            employees,
            hrSettings,
            periodName,
            evaluationRound,
            filename,
            getDepartmentName,
        );
    };

    // Delete objective
    const handleDeleteObjective = async (objectiveId: string) => {
        if (!user?.uid) {
            showToast("You must be logged in to delete objectives", "Error", "error");
            return;
        }
        const result = await deleteObjective(objectiveId, user.uid);
        if (result.success) {
            showToast("Objective deleted successfully", "Success", "success");
            setShowDetailsModal(false);
            setSelectedObjective(null);
        } else {
            showToast(result.error || "Failed to delete objective", "Error", "error");
        }
    };

    // Open details modal when row is clicked
    const handleRowClick = (obj: ObjectiveModel) => {
        setSelectedObjective(obj);
        setShowDetailsModal(true);
    };

    // Prepare options for multiselect dropdowns
    const employeeOptions = employees.map(emp => ({
        value: emp.id,
        label: getEmployeeFullName(emp),
    }));

    const departmentOptions = departments.map(dept => ({
        value: dept,
        label: getDepartmentName(dept),
    }));

    const kpiOptions = cycleKPIs.map(kpi => ({
        value: kpi.id,
        label: kpi.title,
    }));

    const strategicOptions = hrSettings.strategicObjectives.map(so => ({
        value: so.id,
        label: so.title,
    }));

    return (
        <div className="space-y-6 w-full max-w-[75vw] mx-auto">
            {/* Filter Controls */}
            <Card style={{ borderColor: "rgba(63, 61, 86, 0.1)" }}>
                <CardHeader>
                    <CardTitle className="text-lg font-bold">Filters</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                        {/* Title Search */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Title</label>
                            <Input
                                type="text"
                                placeholder="Search by title..."
                                value={objectivesTitleFilter}
                                onChange={e => {
                                    setObjectivesTitleFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full"
                                style={{ borderColor: "rgba(63, 61, 86, 0.2)" }}
                            />
                        </div>

                        {/* Employee Name Filter */}
                        <MultiSelectDropdown
                            options={employeeOptions}
                            selected={objectivesEmployeeFilter}
                            onChange={selected => {
                                setObjectivesEmployeeFilter(selected);
                                setCurrentPage(1);
                            }}
                            placeholder="Select employees"
                            label="Employee Name"
                        />

                        {/* Department Filter */}
                        <MultiSelectDropdown
                            options={departmentOptions}
                            selected={objectivesDepartmentFilter}
                            onChange={selected => {
                                setObjectivesDepartmentFilter(selected);
                                setCurrentPage(1);
                            }}
                            placeholder="Select departments"
                            label="Department"
                        />

                        {/* Department KPI Filter */}
                        <MultiSelectDropdown
                            options={kpiOptions}
                            selected={objectivesKPIFilter}
                            onChange={selected => {
                                setObjectivesKPIFilter(selected);
                                setCurrentPage(1);
                            }}
                            placeholder="Select KPIs"
                            label="Department KPI"
                        />

                        {/* Strategic Objectives Filter */}
                        <MultiSelectDropdown
                            options={strategicOptions}
                            selected={objectivesStrategicFilter}
                            onChange={selected => {
                                setObjectivesStrategicFilter(selected);
                                setCurrentPage(1);
                            }}
                            placeholder="Select strategic objectives"
                            label="Strategic Objective"
                        />
                    </div>

                    {/* Clear Filters Button */}
                    <div className="mt-4 flex justify-end">
                        <Button variant="outline" size="sm" onClick={clearFilters}>
                            Clear Filters
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Objectives Table */}
            <Card style={{ borderColor: "rgba(63, 61, 86, 0.1)" }}>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg font-bold">Employee Objectives</CardTitle>
                            <CardDescription>
                                List of all employee objectives for the selected cycle
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" onClick={handleExportTable}>
                                <Download className="h-4 w-4 mr-2" />
                                Export Table
                            </Button>
                            <Button variant="outline" size="sm" onClick={handleExportAll}>
                                <Download className="h-4 w-4 mr-2" />
                                Export All Objectives
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="text-sm text-muted-foreground mb-2">
                            Showing {filteredObjectives.length} objectives
                        </div>
                        {/* Table container with horizontal scroll */}
                        <div className="rounded-md border overflow-hidden">
                            <div className="overflow-x-auto max-h-[600px]">
                                <table
                                    className="text-sm text-left border-collapse"
                                    style={{ minWidth: "max-content" }}
                                >
                                    <thead className="text-xs uppercase bg-muted sticky top-0 z-10">
                                        <tr>
                                            <th className="px-3 py-2 border-b whitespace-nowrap">
                                                Period
                                            </th>
                                            <th className="px-3 py-2 border-b whitespace-nowrap">
                                                Evaluation Round
                                            </th>
                                            <th className="px-3 py-2 border-b whitespace-nowrap">
                                                Objective Title
                                            </th>
                                            <th className="px-3 py-2 border-b whitespace-nowrap">
                                                SMART Objective
                                            </th>
                                            <th className="px-3 py-2 border-b whitespace-nowrap">
                                                Employee Name
                                            </th>
                                            <th className="px-3 py-2 border-b whitespace-nowrap">
                                                Employee ID
                                            </th>
                                            <th className="px-3 py-2 border-b whitespace-nowrap">
                                                Department
                                            </th>
                                            <th className="px-3 py-2 border-b whitespace-nowrap">
                                                Department KPI
                                            </th>
                                            <th className="px-3 py-2 border-b whitespace-nowrap">
                                                Strategic Objectives
                                            </th>
                                            <th className="px-3 py-2 border-b whitespace-nowrap">
                                                Target Date
                                            </th>
                                            <th className="px-3 py-2 border-b whitespace-nowrap">
                                                Status
                                            </th>
                                            <th className="px-3 py-2 border-b whitespace-nowrap">
                                                Self Rating
                                            </th>
                                            <th className="px-3 py-2 border-b whitespace-nowrap">
                                                Self Result
                                            </th>
                                            <th className="px-3 py-2 border-b whitespace-nowrap">
                                                Self Justification
                                            </th>
                                            <th className="px-3 py-2 border-b whitespace-nowrap">
                                                Manager Rating
                                            </th>
                                            <th className="px-3 py-2 border-b whitespace-nowrap">
                                                Manager Justification
                                            </th>
                                            <th className="px-3 py-2 border-b whitespace-nowrap">
                                                Manager Message
                                            </th>
                                            <th className="px-3 py-2 border-b whitespace-nowrap">
                                                Created At
                                            </th>
                                            <th className="px-3 py-2 border-b whitespace-nowrap">
                                                Created By
                                            </th>
                                            <th className="px-3 py-2 border-b whitespace-nowrap">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedObjectives.map(obj => {
                                            const employee = employees.find(
                                                emp => emp.id === obj.employee,
                                            );
                                            const kpi = hrSettings.departmentKPIs.find(
                                                k => k.id === obj.deptKPI,
                                            );
                                            const strategicObjectives = kpi
                                                ? hrSettings.strategicObjectives
                                                    .filter(so =>
                                                        kpi.linkedObjectiveId.includes(so.id),
                                                    )
                                                    .map(so => so.title)
                                                    .join("; ")
                                                : "";
                                            const createdBy = employees.find(
                                                e => e.uid === obj.createdBy,
                                            );

                                            return (
                                                <tr
                                                    key={obj.id}
                                                    className="border-b hover:bg-accent/50 cursor-pointer"
                                                    onClick={() => handleRowClick(obj)}
                                                >
                                                    <td className="px-3 py-2 whitespace-nowrap">
                                                        {period?.periodName || ""}
                                                    </td>
                                                    <td className="px-3 py-2 whitespace-nowrap">
                                                        {round?.round || ""}
                                                    </td>
                                                    <td className="px-3 py-2 font-medium whitespace-nowrap">
                                                        {obj.title}
                                                    </td>
                                                    <td
                                                        className="px-3 py-2 max-w-[200px] truncate"
                                                        title={obj.SMARTObjective || ""}
                                                    >
                                                        {obj.SMARTObjective || "-"}
                                                    </td>
                                                    <td className="px-3 py-2 whitespace-nowrap">
                                                        {getEmployeeName(obj.employee)}
                                                    </td>
                                                    <td className="px-3 py-2 whitespace-nowrap">
                                                        {employee?.employeeID || "-"}
                                                    </td>
                                                    <td className="px-3 py-2 whitespace-nowrap">
                                                        {employee
                                                            ? getDepartmentName(employee.department)
                                                            : "-"}
                                                    </td>
                                                    <td className="px-3 py-2 whitespace-nowrap">
                                                        {kpi?.title || "-"}
                                                    </td>
                                                    <td
                                                        className="px-3 py-2 max-w-[150px] truncate"
                                                        title={strategicObjectives}
                                                    >
                                                        {strategicObjectives || "-"}
                                                    </td>
                                                    <td className="px-3 py-2 whitespace-nowrap">
                                                        {formatDate(obj.targetDate) || "-"}
                                                    </td>
                                                    <td className="px-3 py-2 whitespace-nowrap">
                                                        <Badge>{obj.status || "-"}</Badge>
                                                    </td>
                                                    <td className="px-3 py-2 text-center whitespace-nowrap">
                                                        {obj.selfEvaluation?.value || "-"}
                                                    </td>
                                                    <td
                                                        className="px-3 py-2 max-w-[150px] truncate"
                                                        title={
                                                            obj.selfEvaluation?.actualResult || ""
                                                        }
                                                    >
                                                        {obj.selfEvaluation?.actualResult || "-"}
                                                    </td>
                                                    <td
                                                        className="px-3 py-2 max-w-[150px] truncate"
                                                        title={
                                                            obj.selfEvaluation?.justification || ""
                                                        }
                                                    >
                                                        {obj.selfEvaluation?.justification || "-"}
                                                    </td>
                                                    <td className="px-3 py-2 text-center whitespace-nowrap">
                                                        {obj.managerEvaluation?.value ? (
                                                            <Badge variant="outline">
                                                                {obj.managerEvaluation.value}/5
                                                            </Badge>
                                                        ) : (
                                                            "-"
                                                        )}
                                                    </td>
                                                    <td
                                                        className="px-3 py-2 max-w-[150px] truncate"
                                                        title={
                                                            obj.managerEvaluation?.justification ||
                                                            ""
                                                        }
                                                    >
                                                        {obj.managerEvaluation?.justification ||
                                                            "-"}
                                                    </td>
                                                    <td
                                                        className="px-3 py-2 max-w-[150px] truncate"
                                                        title={
                                                            obj.managerEvaluation?.managerMessage ||
                                                            ""
                                                        }
                                                    >
                                                        {obj.managerEvaluation?.managerMessage ||
                                                            "-"}
                                                    </td>
                                                    <td className="px-3 py-2 whitespace-nowrap">
                                                        {formatDate(obj.timestamp) || "-"}
                                                    </td>
                                                    <td className="px-3 py-2 whitespace-nowrap">
                                                        {createdBy
                                                            ? getEmployeeFullName(createdBy)
                                                            : "-"}
                                                    </td>
                                                    <td
                                                        className="px-3 py-2 whitespace-nowrap"
                                                        onClick={e => e.stopPropagation()}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                                                onClick={() => {
                                                                    setEditingObjective(obj);
                                                                    setEditModalOpen(true);
                                                                }}
                                                                title="Edit objective"
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                            <DeleteConfirm
                                                                onConfirm={async () =>
                                                                    await handleDeleteObjective(
                                                                        obj.id,
                                                                    )
                                                                }
                                                                itemName={`Objective (${obj.title})`}
                                                                description="Are you sure you want to delete this employee objective? This action cannot be undone."
                                                            />
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Pagination */}
                        {filteredObjectives.length > 0 && (
                            <div className="mt-4">
                                <Pagination>
                                    <PaginationContent>
                                        <PaginationItem>
                                            <PaginationPrevious
                                                href="#"
                                                onClick={e => {
                                                    e.preventDefault();
                                                    handlePageChange(currentPage - 1);
                                                }}
                                                className={
                                                    currentPage === 1
                                                        ? "pointer-events-none opacity-50"
                                                        : ""
                                                }
                                            />
                                        </PaginationItem>

                                        {totalPages <= 7 ? (
                                            Array.from({ length: totalPages }, (_, i) => i + 1).map(
                                                page => (
                                                    <PaginationItem key={page}>
                                                        <PaginationLink
                                                            href="#"
                                                            onClick={e => {
                                                                e.preventDefault();
                                                                handlePageChange(page);
                                                            }}
                                                            isActive={page === currentPage}
                                                        >
                                                            {page}
                                                        </PaginationLink>
                                                    </PaginationItem>
                                                ),
                                            )
                                        ) : (
                                            <>
                                                <PaginationItem>
                                                    <PaginationLink
                                                        href="#"
                                                        onClick={e => {
                                                            e.preventDefault();
                                                            handlePageChange(1);
                                                        }}
                                                        isActive={1 === currentPage}
                                                    >
                                                        1
                                                    </PaginationLink>
                                                </PaginationItem>

                                                {currentPage > 3 && (
                                                    <PaginationItem>
                                                        <PaginationEllipsis />
                                                    </PaginationItem>
                                                )}

                                                {Array.from(
                                                    { length: Math.min(3, totalPages) },
                                                    (_, i) => {
                                                        let page = currentPage - 1 + i;
                                                        if (currentPage === 1) page = i + 2;
                                                        if (currentPage === totalPages)
                                                            page = totalPages - 2 + i;
                                                        return Math.max(
                                                            2,
                                                            Math.min(page, totalPages - 1),
                                                        );
                                                    },
                                                ).map(page => (
                                                    <PaginationItem key={page}>
                                                        <PaginationLink
                                                            href="#"
                                                            onClick={e => {
                                                                e.preventDefault();
                                                                handlePageChange(page);
                                                            }}
                                                            isActive={page === currentPage}
                                                        >
                                                            {page}
                                                        </PaginationLink>
                                                    </PaginationItem>
                                                ))}

                                                {currentPage < totalPages - 2 && (
                                                    <PaginationItem>
                                                        <PaginationEllipsis />
                                                    </PaginationItem>
                                                )}

                                                <PaginationItem>
                                                    <PaginationLink
                                                        href="#"
                                                        onClick={e => {
                                                            e.preventDefault();
                                                            handlePageChange(totalPages);
                                                        }}
                                                        isActive={totalPages === currentPage}
                                                    >
                                                        {totalPages}
                                                    </PaginationLink>
                                                </PaginationItem>
                                            </>
                                        )}

                                        <PaginationItem>
                                            <PaginationNext
                                                href="#"
                                                onClick={e => {
                                                    e.preventDefault();
                                                    handlePageChange(currentPage + 1);
                                                }}
                                                className={
                                                    currentPage === totalPages
                                                        ? "pointer-events-none opacity-50"
                                                        : ""
                                                }
                                            />
                                        </PaginationItem>
                                    </PaginationContent>
                                </Pagination>
                                <div className="mt-2 flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <span>Items per page:</span>
                                        <select
                                            value={itemsPerPage}
                                            onChange={e => {
                                                setItemsPerPage(Number(e.target.value));
                                                setCurrentPage(1);
                                            }}
                                            className="border rounded px-2 py-1 bg-background border-input text-foreground"
                                        >
                                            <option value={5}>5</option>
                                            <option value={10}>10</option>
                                            <option value={20}>20</option>
                                            <option value={50}>50</option>
                                            <option value={100}>100</option>
                                        </select>
                                    </div>
                                    <div>
                                        Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                                        {Math.min(
                                            currentPage * itemsPerPage,
                                            filteredObjectives.length,
                                        )}{" "}
                                        of {filteredObjectives.length} objectives
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Objective Details Modal */}
            <ObjectiveDetailModal
                isOpen={showDetailsModal}
                onClose={() => {
                    setShowDetailsModal(false);
                    setSelectedObjective(null);
                }}
                objective={selectedObjective}
            />

            {/* Edit Objective Modal */}
            <AddObjectiveModal
                open={editModalOpen}
                onOpenChange={open => {
                    setEditModalOpen(open);
                    if (!open) setEditingObjective(null);
                }}
                editObjective={editingObjective}
                employeeUid={
                    employees.find(emp => emp.id === editingObjective?.employee)?.uid ?? ""
                }
            />
        </div>
    );
}
