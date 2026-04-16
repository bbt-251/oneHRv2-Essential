"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Download } from "lucide-react";
import { ColumnSelector } from "./column-selector";
import type { EmployeeModel } from "@/lib/models/employee";
import { AdvancedFilter, type FilterConfig } from "./advanced-filter";
import { DensitySelector, type DensityType } from "./density-selector";
import { EmployeeActions } from "./employee-actions";
import { ExportModal } from "../modals/export-modal";
import { ColumnConfig } from "@/lib/models/type";
import { useTheme } from "@/components/theme-provider";
import { useFirestore } from "@/context/firestore-context";
import getEmployeeFullName from "@/lib/util/getEmployeeFullName";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
    PaginationEllipsis,
} from "@/components/ui/pagination";

interface EmployeeTableProps {
    employees: EmployeeModel[];
    onAddEmployee: () => void;
    onEditEmployee: (employee: EmployeeModel) => void;
    onRowClick: (employee: EmployeeModel) => void;
    onViewProfile: (employee: EmployeeModel) => void;
    onChangePassword: (employee: EmployeeModel) => void;
    onViewEmployeeLog: (employee: EmployeeModel) => void;
    onViewCompensation: (employee: EmployeeModel) => void;
    onManageDependents: (employee: EmployeeModel) => void;
    onDeleteEmployee: (employee: EmployeeModel) => void;
}

export function EmployeeTable({
    employees,
    onAddEmployee,
    onEditEmployee,
    onRowClick,
    onViewProfile,
    onChangePassword,
    onViewEmployeeLog,
    onViewCompensation,
    onManageDependents,
    onDeleteEmployee,
}: EmployeeTableProps) {
    const { hrSettings } = useFirestore();
    const {
        sectionSettings,
        locations,
        contractTypes,
        contractHours,
        maritalStatuses,
        positions,
        departmentSettings,
        grades,
        shiftTypes,
        yearsOfExperiences,
        levelOfEducations,
    } = hrSettings;

    const getName = (items: { id: string; name: string }[], id: string) =>
        items.find(item => item.id === id)?.name || "Unknown";

    const getLocationName = (locationId: string) => getName(locations, locationId);
    const getSectionName = (sectionId: string) => getName(sectionSettings, sectionId);
    const getContractTypeName = (contractTypeId: string) => getName(contractTypes, contractTypeId);
    const getMaritalStatusName = (maritalStatusId: string) =>
        getName(maritalStatuses, maritalStatusId);
    const getEmploymentPositionName = (positionId: string) => getName(positions, positionId);
    const getDepartmentName = (departmentId: string) => getName(departmentSettings, departmentId);
    const getShiftTypeName = (shiftTypeId: string) => getName(shiftTypes, shiftTypeId);
    const getYearsOfExperienceName = (yearsOfExperienceId: string) =>
        getName(yearsOfExperiences, yearsOfExperienceId);
    const getLevelOfEducationName = (levelOfEducationId: string) =>
        getName(levelOfEducations, levelOfEducationId);
    const getContractHourName = (contractHourId: string) => {
        const contractHour = contractHours.find(contractHour => contractHour.id === contractHourId);
        return contractHour?.hourPerWeek?.toString() || "";
    };

    const getGradeLevelName = (gradeLevelId: string) => {
        const gradeLevel = grades.find(gradeLevel => gradeLevel.id === gradeLevelId);
        return gradeLevel?.grade || "Unknown";
    };
    const getManagerFullName = (managerId: string) => {
        const manager = employees.find(employee => employee.uid === managerId);
        return manager ? getEmployeeFullName(manager) : "Unknown";
    };

    const [searchTerm, setSearchTerm] = useState("");
    const [columns, setColumns] = useState<ColumnConfig[]>([
        { key: "firstName", label: "First Name", visible: true },
        { key: "middleName", label: "Middle Name", visible: true },
        { key: "surname", label: "Surname", visible: true },
        { key: "gender", label: "Gender", visible: false },
        { key: "personalPhoneNumber", label: "Personal Phone Number", visible: true },
        { key: "employeeID", label: "Employee ID", visible: true },
        { key: "contractType", label: "Contract Type", visible: true },
        { key: "contractStatus", label: "Contract Status", visible: true },
        { key: "employmentPosition", label: "Employment Position", visible: true },
        { key: "section", label: "Section", visible: false },
        { key: "department", label: "Department", visible: true },
        { key: "workingLocation", label: "Working Location", visible: false },
        { key: "managerPosition", label: "Manager Position", visible: false },
        { key: "reportees", label: "Reportees", visible: false },
        { key: "shiftType", label: "Shift Type", visible: false },
        { key: "role", label: "Role(s)", visible: false },
        { key: "contractStartingDate", label: "Contract Starting Date", visible: false },
        { key: "probationPeriodEndDate", label: "Probation Period End Date", visible: false },
        { key: "birthDate", label: "Birth Date", visible: false },
        { key: "birthPlace", label: "Birth Place", visible: false },
        { key: "levelOfEducation", label: "Level of Education", visible: false },
        { key: "yearsOfExperience", label: "Years of Experience", visible: false },
        { key: "maritalStatus", label: "Marital Status", visible: false },
        { key: "personalEmail", label: "Personal Email", visible: false },
        { key: "companyEmail", label: "Company Email", visible: true },
        { key: "bankAccount", label: "Bank Account", visible: false },
        { key: "providentFundAccount", label: "Provident Fund Account", visible: false },
        { key: "hourlyWage", label: "Hourly Wage", visible: false },
        { key: "tinNumber", label: "TIN Number", visible: false },
        { key: "lastChanged", label: "Last Changed", visible: false },
        { key: "contractHour", label: "Contract Hour", visible: false },
        { key: "contractTerminationDate", label: "Contract Termination Date", visible: false },
        { key: "contractDocument", label: "Contract Document", visible: false },
        { key: "lastDateOfProbation", label: "Last Date of Probation", visible: false },
        { key: "reasonOfLeaving", label: "Reason of Leaving", visible: false },
        { key: "salary", label: "Salary", visible: false },
        { key: "currency", label: "Currency", visible: false },
        { key: "associatedTax", label: "Associated Tax", visible: false },
        { key: "eligibleLeaveDays", label: "Eligible Leave Days", visible: false },
        { key: "companyPhoneNumber", label: "Company Phone Number", visible: false },
        { key: "positionLevel", label: "Position Level", visible: false },
        { key: "homeLocation", label: "Home Location", visible: false },
        {
            key: "reportingLineManagerPosition",
            label: "Reporting Line Manager Position",
            visible: false,
        },
        { key: "reportingLineManager", label: "Reporting Line Manager", visible: true },
        { key: "gradeLevel", label: "Grade Level", visible: false },
        { key: "step", label: "Step", visible: false },
        { key: "emergencyContactName", label: "Emergency Contact Name", visible: false },
        { key: "relationshipToEmployee", label: "Relationship to Employee", visible: false },
        { key: "phoneNumber1", label: "Phone Number 1", visible: false },
        { key: "phoneNumber2", label: "Phone Number 2", visible: false },
        { key: "emailAddress1", label: "Email Address 1", visible: false },
        { key: "emailAddress2", label: "Email Address 2", visible: false },
        { key: "physicalAddress1", label: "Physical Address 1", visible: false },
        { key: "physicalAddress2", label: "Physical Address 2", visible: false },
        { key: "timestamp", label: "Timestamp", visible: false },
    ]);

    const { theme } = useTheme();
    const [filters, setFilters] = useState<FilterConfig[]>([]);
    const [showExportModal, setShowExportModal] = useState<boolean>(false);
    const [density, setDensity] = useState<DensityType>("standard");
    const [sortConfig, setSortConfig] = useState<{
        key: string;
        direction: "ascending" | "descending";
    }>({
        key: "firstName",
        direction: "ascending",
    });
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const getComparableValue = (employee: EmployeeModel, field: keyof EmployeeModel) => {
        const raw = employee[field];
        // For fields that are references to hrSettings, we prefer to compare ids for equals/in
        if (field === "department") return raw as string;
        if (field === "employmentPosition") return raw as string;
        if (field === "contractType") return raw as string;
        if (field === "section") return raw as string;
        if (field === "shiftType") return raw as string;

        // For other fields, return the stringified lowercased value
        return raw ? String(raw).toLowerCase() : "";
    };

    const filteredEmployees = employees.filter(employee => {
        // Text search filter
        const matchesSearch =
            searchTerm === "" ||
            employee.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            employee.surname.toLowerCase().includes(searchTerm.toLowerCase()) ||
            employee.employeeID.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (employee.personalEmail &&
                employee.personalEmail.toLowerCase().includes(searchTerm.toLowerCase()));

        // Advanced filters
        // Debug: log active filters (remove or guard with env flag in production)
        // console.debug('Active filters:', filters)

        const matchesFilters = filters.every(filter => {
            // Special-case department: allow matching by id OR by display name (resilient to inconsistent data)
            if (filter.field === "department") {
                const deptId = (employee.department || "") as string;
                const deptName = deptId ? getDepartmentName(deptId) : "";

                if (filter.operator === "in") {
                    if (!Array.isArray(filter.value)) return false;
                    return filter.value.some(v => {
                        const vv = String(v).toLowerCase();
                        return vv === String(deptId).toLowerCase() || vv === deptName.toLowerCase();
                    });
                }

                const filterValue =
                    typeof filter.value === "string" ? filter.value.toLowerCase() : "";
                switch (filter.operator) {
                    case "equals":
                        return (
                            String(deptId).toLowerCase() === filterValue ||
                            deptName.toLowerCase() === filterValue
                        );
                    case "contains":
                        return (
                            deptName.toLowerCase().includes(filterValue) ||
                            String(deptId).toLowerCase().includes(filterValue)
                        );
                    case "startsWith":
                        return (
                            deptName.toLowerCase().startsWith(filterValue) ||
                            String(deptId).toLowerCase().startsWith(filterValue)
                        );
                    case "endsWith":
                        return (
                            deptName.toLowerCase().endsWith(filterValue) ||
                            String(deptId).toLowerCase().endsWith(filterValue)
                        );
                    default:
                        return true;
                }
            }

            const comparable = getComparableValue(employee, filter.field);
            if (!comparable && filter.value) return false;

            if (filter.operator === "in") {
                if (!Array.isArray(filter.value)) return false;
                // for in: compare ids or lowercased values
                return filter.value.some(
                    v => String(v).toLowerCase() === String(comparable).toLowerCase(),
                );
            }

            const filterValue = typeof filter.value === "string" ? filter.value.toLowerCase() : "";

            switch (filter.operator) {
                case "equals":
                    return String(comparable).toLowerCase() === filterValue;
                case "contains":
                    return String(comparable).toLowerCase().includes(filterValue);
                case "startsWith":
                    return String(comparable).toLowerCase().startsWith(filterValue);
                case "endsWith":
                    return String(comparable).toLowerCase().endsWith(filterValue);
                default:
                    return true;
            }
        });

        return matchesSearch && matchesFilters;
    });

    const handleColumnToggle = (key: string, visible: boolean) => {
        setColumns(prev => prev.map(col => (col.key === key ? { ...col, visible } : col)));
    };

    const visibleColumns = columns.filter(col => col.visible);

    const requestSort = (key: string) => {
        let direction: "ascending" | "descending" = "ascending";
        if (sortConfig.key === key) {
            direction = sortConfig.direction === "ascending" ? "descending" : "ascending";
        }
        setSortConfig({ key, direction });
    };

    const getSortDirection = (key: string) => {
        if (sortConfig.key !== key) return null;
        return sortConfig.direction;
    };

    const sortedEmployees = [...filteredEmployees].sort((a, b) => {
        const key = sortConfig.key as keyof EmployeeModel;

        // Handle special cases for reference fields
        if (key === "department") {
            const aDept = getDepartmentName(a.department || "");
            const bDept = getDepartmentName(b.department || "");
            return sortConfig.direction === "ascending"
                ? aDept.localeCompare(bDept)
                : bDept.localeCompare(aDept);
        }

        if (key === "employmentPosition") {
            const aPos = getEmploymentPositionName(a.employmentPosition || "");
            const bPos = getEmploymentPositionName(b.employmentPosition || "");
            return sortConfig.direction === "ascending"
                ? aPos.localeCompare(bPos)
                : bPos.localeCompare(aPos);
        }

        if (key === "contractType") {
            const aType = getContractTypeName(a.contractType || "");
            const bType = getContractTypeName(b.contractType || "");
            return sortConfig.direction === "ascending"
                ? aType.localeCompare(bType)
                : bType.localeCompare(aType);
        }

        if (key === "section") {
            const aSec = getSectionName(a.section || "");
            const bSec = getSectionName(b.section || "");
            return sortConfig.direction === "ascending"
                ? aSec.localeCompare(bSec)
                : bSec.localeCompare(aSec);
        }

        if (key === "shiftType") {
            const aShift = getShiftTypeName(a.shiftType || "");
            const bShift = getShiftTypeName(b.shiftType || "");
            return sortConfig.direction === "ascending"
                ? aShift.localeCompare(bShift)
                : bShift.localeCompare(aShift);
        }

        if (key === "reportingLineManager") {
            const aManager = getManagerFullName(a.reportingLineManager || "");
            const bManager = getManagerFullName(b.reportingLineManager || "");
            return sortConfig.direction === "ascending"
                ? aManager.localeCompare(bManager)
                : bManager.localeCompare(aManager);
        }

        // Handle date fields
        if (key === "timestamp" && a.timestamp && b.timestamp) {
            const dateA = new Date(a.timestamp).getTime();
            const dateB = new Date(b.timestamp).getTime();
            return sortConfig.direction === "ascending" ? dateA - dateB : dateB - dateA;
        }

        // Default string comparison
        const aValue = String(a[key] || "").toLowerCase();
        const bValue = String(b[key] || "").toLowerCase();

        return sortConfig.direction === "ascending"
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
    });

    // Pagination logic
    const paginatedEmployees = sortedEmployees.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage,
    );

    const totalPages = Math.ceil(sortedEmployees.length / itemsPerPage);

    const handlePageChange = (page: number) => {
        setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    };

    const renderCellValue = (employee: EmployeeModel, key: keyof EmployeeModel): ReactNode => {
        const value = employee[key];

        if (key === "contractStatus") {
            const status = (value as string)?.toLowerCase();
            const displayStatus = status ? status.charAt(0).toUpperCase() + status.slice(1) : "";
            return status ? (
                <Badge
                    className={
                        status === "active"
                            ? "bg-green-100 text-green-800 border-green-200"
                            : status === "inactive"
                                ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                                : status === "terminated"
                                    ? "bg-red-100 text-red-800 border-red-200"
                                    : "bg-gray-100 text-gray-800 border-gray-200"
                    }
                >
                    {displayStatus}
                </Badge>
            ) : (
                "-"
            );
        }

        if (key === "gender") {
            const gender = value as string;
            return gender ? gender.charAt(0).toUpperCase() + gender.slice(1) : "-";
        }

        if (key === "contractType") {
            const typeId = value as string;
            return typeId ? (
                <Badge
                    variant="secondary"
                    className="bg-secondary-200 border-secondary-300 dark:text-black"
                >
                    {getContractTypeName(typeId)}
                </Badge>
            ) : (
                "-"
            );
        }

        if ((key === "salary" || key === "hourlyWage") && value) {
            return `${value} ${employee.currency || ""}`;
        }
        if (key === "contractHour" && value) {
            return getContractHourName(value as string);
        }
        if (key === "section" && value) {
            return getSectionName(value as string);
        }
        if (key === "maritalStatus" && value) {
            return getMaritalStatusName(value as string);
        }
        if (key === "homeLocation" && value) {
            return getLocationName(value as string);
        }
        if (key === "employmentPosition" && value) {
            return getEmploymentPositionName(value as string);
        }
        if (key === "workingLocation" && value) {
            return getLocationName(value as string);
        }
        if (key === "shiftType" && value) {
            return getShiftTypeName(value as string);
        }
        if (key === "contractHour" && value) {
            return getContractHourName(value as string);
        }
        if (key === "gradeLevel" && value) {
            return getGradeLevelName(value as string);
        }
        if (key === "managerPosition" && value) {
            return getEmploymentPositionName(value as string);
        }
        if (key === "reportingLineManager" && value) {
            return getManagerFullName(value as string);
        }
        if (key === "reportingLineManagerPosition" && value) {
            return getEmploymentPositionName(value as string);
        }
        if (key === "timestamp" && value) {
            return new Date(value as string).toLocaleDateString();
        }
        if (key === "employmentPosition" && value) {
            return getEmploymentPositionName(value as string);
        }
        if (key === "department" && value) {
            return getDepartmentName(value as string);
        }
        if (key === "yearsOfExperience" && value) {
            return getYearsOfExperienceName(value as string);
        }
        if (key === "levelOfEducation" && value) {
            return getLevelOfEducationName(value as string);
        }

        if (Array.isArray(value)) {
            if (key === "role" || key === "reportees") {
                return (value as string[]).join(", ");
            }
            return `(${value.length} items)`;
        }

        if (typeof value === "boolean") {
            return value ? "Yes" : "No";
        }

        if (typeof value === "object" && value !== null) {
            return "[Object]";
        }
        return value ? String(value) : "-";
    };

    const getDensityClasses = () => {
        switch (density) {
            case "compact":
                return "py-1 px-2 text-sm";
            case "comfortable":
                return "py-4 px-4";
            default:
                return "py-2 px-3";
        }
    };

    return (
        <div
            className={`space-y-6 p-6 ${theme === "dark" ? "bg-black text-white" : "bg-gray-50 text-gray-900"}`}
        >
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Employees</h1>
                <div className="flex gap-3 items-center">
                    <Button
                        onClick={onAddEmployee}
                        className={`${theme === "dark" ? "bg-white text-black" : "bg-green-500 hover:bg-green-600"}`}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Add
                    </Button>
                </div>
            </div>

            <div
                className={`rounded-lg border p-4 ${theme === "dark" ? "bg-black border-gray-700" : "bg-white border-gray-200"}`}
            >
                <div className="flex items-center gap-4 mb-4">
                    <ColumnSelector columns={columns} onColumnToggle={handleColumnToggle} />
                    <AdvancedFilter
                        employees={employees}
                        hrSettings={hrSettings}
                        onFiltersChange={setFilters}
                    />
                    <DensitySelector density={density} onDensityChange={setDensity} />
                    <Button
                        variant="outline"
                        size="sm"
                        className={`${theme === "dark" ? "bg-black border-gray-600 hover:bg-gray-700" : "bg-white border-gray-300 hover:bg-gray-100"}`}
                        onClick={() => setShowExportModal(true)}
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </Button>
                </div>

                <div className="relative mb-4">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search employees..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className={`pl-10 ${theme === "dark" ? "bg-black border-gray-600 focus:border-blue-500 focus:ring-blue-500" : "border-gray-300 focus:border-primary-500 focus:ring-primary-500"}`}
                    />
                </div>

                <div className="rounded-lg overflow-x-auto w-full max-w-[88vw] mx-auto">
                    <Table className="w-full border-collapse">
                        <TableHeader>
                            <TableRow
                                className={`border-b ${theme === "dark" ? "bg-black border-gray-700" : "bg-gray-50 border-gray-200"}`}
                            >
                                {visibleColumns.map(column => (
                                    <TableHead
                                        key={column.key}
                                        className={`font-semibold ${getDensityClasses()} cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors`}
                                        onClick={() => requestSort(column.key)}
                                    >
                                        <div className="flex items-center justify-between">
                                            {column.label}
                                            {getSortDirection(column.key) && (
                                                <span className="ml-1">
                                                    {getSortDirection(column.key) === "ascending"
                                                        ? "↑"
                                                        : "↓"}
                                                </span>
                                            )}
                                        </div>
                                    </TableHead>
                                ))}
                                <TableHead className={`font-semibold ${getDensityClasses()}`}>
                                    Actions
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedEmployees.map((employee, i) => (
                                <TableRow
                                    key={i}
                                    className={`border-b cursor-pointer transition-colors ${theme === "dark" ? "border-gray-700 hover:bg-black" : "border-gray-200 hover:bg-gray-100"}`}
                                    onClick={() => onRowClick(employee)}
                                >
                                    {visibleColumns.map(column => (
                                        <TableCell
                                            key={column.key}
                                            className={`${getDensityClasses()}`}
                                        >
                                            {renderCellValue(
                                                employee,
                                                column.key as keyof EmployeeModel,
                                            )}
                                        </TableCell>
                                    ))}
                                    <TableCell
                                        className={getDensityClasses()}
                                        onClick={e => e.stopPropagation()}
                                    >
                                        <EmployeeActions
                                            employee={employee}
                                            onEdit={onEditEmployee}
                                            onViewProfile={onViewProfile}
                                            onChangePassword={onChangePassword}
                                            onViewEmployeeLog={onViewEmployeeLog}
                                            onViewCompensation={onViewCompensation}
                                            onManageDependents={onManageDependents}
                                            onDelete={onDeleteEmployee}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                {sortedEmployees.length > 0 && (
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

                                        {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                                            let page = currentPage - 1 + i;
                                            if (currentPage === 1) page = i + 2;
                                            if (currentPage === totalPages)
                                                page = totalPages - 2 + i;
                                            return Math.max(2, Math.min(page, totalPages - 1));
                                        }).map(page => (
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
                                    className={`border rounded px-2 py-1 ${theme === "dark" ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
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
                                {Math.min(currentPage * itemsPerPage, sortedEmployees.length)} of{" "}
                                {sortedEmployees.length} employees
                            </div>
                        </div>
                    </div>
                )}
            </div>
            {showExportModal && (
                <ExportModal
                    employees={filteredEmployees}
                    columns={columns}
                    onClose={() => setShowExportModal(false)}
                />
            )}
        </div>
    );
}
