"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Calendar, CalendarDays, X, Users, Filter, Download } from "lucide-react";
import { DensitySelector, type DensityType } from "../blocks/density-selector";
import { ColumnSelector } from "../blocks/column-selector";
import { EmployeeActions } from "../blocks/employee-actions";
import { EmployeeModel } from "@/lib/models/employee";
import { ColumnConfig } from "@/lib/models/type";
import { useTheme } from "@/components/theme-provider";
import { useFirestore } from "@/context/firestore-context";
import getEmployeeFullName from "@/lib/util/getEmployeeFullName";
import dayjs from "dayjs";
import { EmployeeDetailsModal } from "./employee-details-modal";

interface OffboardingModalProps {
    employees: EmployeeModel[];
    onClose: () => void;
    onEditEmployee: (employee: EmployeeModel) => void;
    onViewProfile: (employee: EmployeeModel) => void;
    onChangePassword: (employee: EmployeeModel) => void;
    onManageDocuments: (employee: EmployeeModel) => void;
    onViewEmployeeLog: (employee: EmployeeModel) => void;
    onViewCompensation: (employee: EmployeeModel) => void;
    onViewDisciplinary: (employee: EmployeeModel) => void;
    onManageDependents: (employee: EmployeeModel) => void;
}

export function OffboardingModal({
    employees,
    onClose,
    onEditEmployee,
    onViewProfile,
    onChangePassword,
    onManageDocuments,
    onViewEmployeeLog,
    onViewCompensation,
    onViewDisciplinary,
    onManageDependents,
}: OffboardingModalProps) {
    const { theme } = useTheme();
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
    const getContractHourName = (contractHourId: string) => {
        const contractHour = contractHours.find(contractHour => contractHour.id === contractHourId);
        return contractHour?.hourPerWeek || "Unknown";
    };

    const getGradeLevelName = (gradeLevelId: string) => {
        const gradeLevel = grades.find(gradeLevel => gradeLevel.id === gradeLevelId);
        return gradeLevel?.grade || "Unknown";
    };
    const getManagerFullName = (managerId: string) => {
        const manager = employees.find(employee => employee.uid === managerId);
        return manager ? getEmployeeFullName(manager) : "Unknown";
    };

    const filterDepartments = departmentSettings.filter(department => department.active == true);

    const [showProbation, setShowProbation] = useState<boolean>(true);
    const [startDate, setStartDate] = useState<string>(
        dayjs().startOf("month").format("YYYY-MM-DD"),
    );
    const [endDate, setEndDate] = useState<string>(dayjs().endOf("month").format("YYYY-MM-DD"));
    const [selectedDepartment, setSelectedDepartment] = useState<string>("All Departments");
    const [density, setDensity] = useState<DensityType>("standard");
    const [selectedEmployee, setSelectedEmployee] = useState<EmployeeModel | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState<boolean>(false);

    const [columns, setColumns] = useState<ColumnConfig[]>([
        { key: "firstName", label: "First Name", visible: true },
        { key: "middleName", label: "Middle Name", visible: true },
        { key: "surname", label: "Surname", visible: true },
        { key: "gender", label: "Gender", visible: true },
        { key: "employeeID", label: "Employee ID", visible: true },
        { key: "contractType", label: "Contract Type", visible: true },
        { key: "contractStatus", label: "Contract Status", visible: true },
        { key: "employmentPosition", label: "Employment Position", visible: true },
        { key: "department", label: "Department", visible: true },
        { key: "reportingLineManager", label: "Manager", visible: true },
        {
            key: "reportingLineManagerPosition",
            label: "Manager Position",
            visible: false,
        },
        { key: "gradeLevel", label: "Position Level", visible: true },
        { key: "step", label: "Step", visible: true },
        { key: "personalEmail", label: "Email", visible: false },
        { key: "personalPhoneNumber", label: "Phone", visible: false },
        { key: "birthDate", label: "Birth Date", visible: false },
        { key: "maritalStatus", label: "Marital Status", visible: false },
        { key: "levelOfEducation", label: "Education", visible: false },
        { key: "yearsOfExperience", label: "Experience", visible: false },
        { key: "section", label: "Section", visible: false },
        { key: "shiftType", label: "Shift", visible: false },
        { key: "contractHour", label: "Hours", visible: false },
        { key: "salary", label: "Salary", visible: false },
        { key: "currency", label: "Currency", visible: false },
        { key: "contractStartingDate", label: "Contract Start", visible: false },
        { key: "contractTerminationDate", label: "Contract End", visible: false },
        { key: "probationPeriodEndDate", label: "Probation End", visible: false },
        { key: "hireDate", label: "Hire Date", visible: false },
        { key: "eligibleLeaveDays", label: "Leave Days", visible: false },
    ]);

    // Get current month dates for default filtering
    const currentMonth = dayjs().month();
    const currentYear = dayjs().year();

    // Filter employees based on probation end date or contract termination date in current month
    const mockOffboardingEmployees: EmployeeModel[] = employees.filter(employee => {
        const probationEndDate = employee.probationPeriodEndDate;
        const contractEndDate = employee.contractTerminationDate;

        if (probationEndDate) {
            const probationDate = dayjs(probationEndDate);
            if (probationDate.month() === currentMonth && probationDate.year() === currentYear) {
                return true;
            }
        }

        if (contractEndDate) {
            const terminationDate = dayjs(contractEndDate);

            if (
                terminationDate.month() === currentMonth &&
                terminationDate.year() === currentYear
            ) {
                return true;
            }
        }

        return false;
    });
    const filteredEmployees = mockOffboardingEmployees.filter(employee => {
        // For probation toggle, check if probation end date exists
        // For terminating toggle, check if contract termination date exists
        const hasProbationDate = employee.probationPeriodEndDate;
        const hasTerminationDate = employee.contractTerminationDate;

        if (showProbation && !hasProbationDate) return false;
        if (!showProbation && !hasTerminationDate) return false;

        if (selectedDepartment !== "All Departments" && employee.department !== selectedDepartment)
            return false;

        const relevantDate = showProbation
            ? employee.probationPeriodEndDate
            : employee.contractTerminationDate;
        if (startDate && relevantDate && dayjs(relevantDate).isBefore(dayjs(startDate)))
            return false;
        if (endDate && relevantDate && dayjs(relevantDate).isAfter(dayjs(endDate))) return false;

        return true;
    });

    const handleColumnToggle = (key: string, visible: boolean) => {
        setColumns(prev => prev.map(col => (col.key === key ? { ...col, visible } : col)));
    };

    const visibleColumns = columns.filter(col => col.visible);

    const renderCellValue = (employee: EmployeeModel, key: keyof EmployeeModel) => {
        const value = employee[key];

        // Handle different field types with appropriate utility functions
        switch (key) {
            case "section":
                return value ? getSectionName(value as string) : "-";
            case "contractType":
                return value ? getContractTypeName(value as string) : "-";
            case "contractHour":
                return value ? getContractHourName(value as string) : "-";
            case "maritalStatus":
                return value ? getMaritalStatusName(value as string) : "-";
            case "employmentPosition":
                return value ? getEmploymentPositionName(value as string) : "-";
            case "department":
                return value ? getDepartmentName(value as string) : "-";
            case "salary":
                return value ? `${value} ${employee.currency || ""}` : "-";
            case "gradeLevel":
                return value ? getGradeLevelName(value as string) : "-";
            case "shiftType":
                return value ? getShiftTypeName(value as string) : "-";
            case "managerPosition":
                return value ? getEmploymentPositionName(value as string) : "-";
            case "reportingLineManagerPosition":
                return value ? getEmploymentPositionName(value as string) : "-";
            case "reportingLineManager":
                return value ? getManagerFullName(value as string) : "-";
            case "contractStatus":
                return value ? (
                    <Badge
                        variant={
                            value === "Active"
                                ? "default"
                                : value === "Probation"
                                    ? "secondary"
                                    : "destructive"
                        }
                    >
                        {value}
                    </Badge>
                ) : (
                    "-"
                );
            default:
                return typeof value === "string" || typeof value === "number"
                    ? String(value)
                    : Array.isArray(value)
                        ? value.join(", ")
                        : "-";
        }
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

    // Dynamic Style Definitions
    const modalBgClasses =
        theme === "dark" ? "bg-gray-900 text-gray-200" : "bg-white text-gray-900";
    const headerClasses =
        theme === "dark"
            ? "bg-gray-800/50 border-b border-gray-700"
            : "bg-gradient-to-r from-primary-50 to-secondary-50 border-b border-gray-200";
    const closeButtonClasses =
        theme === "dark" ? "text-gray-400 hover:bg-gray-700" : "text-gray-600 hover:bg-black/5";
    const iconWrapperClasses = theme === "dark" ? "bg-blue-900/50" : "bg-primary-100";
    const iconClasses = theme === "dark" ? "text-blue-400" : "text-primary-600";
    const filtersContainerClasses = theme === "dark" ? "bg-gray-800/70" : "bg-gray-50";
    const inputClasses =
        theme === "dark"
            ? "pl-10 bg-gray-900 border-gray-600 focus:border-blue-500 focus:ring-blue-500"
            : "pl-10 border-gray-300 focus:border-primary-500 focus:ring-primary-500";
    const selectTriggerClasses =
        theme === "dark" ? "mt-1 bg-gray-900 border-gray-600" : "mt-1 border-gray-300 bg-white";
    const selectContentClasses =
        theme === "dark" ? "bg-gray-900 border-gray-700 text-white" : "bg-white";
    const clearButtonClasses =
        theme === "dark"
            ? "bg-gray-700 border-gray-600 hover:bg-gray-600"
            : "bg-white border-gray-300 hover:bg-gray-100";
    const toggleSectionClasses =
        theme === "dark"
            ? "bg-transparent border border-gray-700"
            : "bg-white border border-gray-200";
    const tableContainerClasses =
        theme === "dark"
            ? "border border-gray-700 bg-transparent"
            : "border border-gray-200 bg-white";
    const tableHeaderRowClasses =
        theme === "dark"
            ? "bg-gray-800 border-b border-gray-700"
            : "bg-secondary-100 border-b border-gray-200";
    const tableHeaderCellClasses =
        theme === "dark" ? "text-gray-300 font-semibold" : "text-primary-800 font-semibold";
    const tableRowClasses =
        theme === "dark"
            ? "hover:bg-gray-800/70 border-b border-gray-700"
            : "hover:bg-secondary-50 border-b border-gray-100";
    const emptyTableCellClasses = theme === "dark" ? "text-gray-500" : "text-gray-500";
    const footerClasses =
        theme === "dark" ? "text-gray-400 bg-gray-800/50" : "text-gray-600 bg-gray-50";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <div
                className={`${modalBgClasses} rounded-lg w-full max-w-7xl max-h-[95vh] overflow-hidden shadow-xl flex flex-col`}
            >
                <div className={`flex items-center justify-between p-6 ${headerClasses}`}>
                    <div className="flex items-center gap-3">
                        <div
                            className={`w-10 h-10 ${iconWrapperClasses} rounded-full flex items-center justify-center`}
                        >
                            <Users className={`w-5 h-5 ${iconClasses}`} />
                        </div>
                        <div>
                            <h2
                                className={`text-xl font-semibold ${
                                    theme === "dark" ? "text-gray-100" : "text-primary-900"
                                }`}
                            >
                                Off-boarding Employees
                            </h2>
                            <p
                                className={`text-sm ${
                                    theme === "dark" ? "text-gray-400" : "text-primary-600"
                                }`}
                            >
                                Manage employees in probation or contract termination
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        className={closeButtonClasses}
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto">
                    <div className={`rounded-lg p-4 space-y-4 ${filtersContainerClasses}`}>
                        <div className="flex items-center gap-2 mb-3">
                            <Filter className={`w-4 h-4 ${iconClasses}`} />
                            <h3
                                className={`font-medium ${
                                    theme === "dark" ? "text-gray-200" : "text-primary-900"
                                }`}
                            >
                                Filter Options
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {/* Date and Department Filters */}
                            <div>
                                <Label
                                    htmlFor="startDate"
                                    className={`${
                                        theme === "dark" ? "text-gray-300" : "text-primary-800"
                                    }`}
                                >
                                    Start Date
                                </Label>
                                <div className="relative mt-1">
                                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="startDate"
                                        type="date"
                                        value={startDate}
                                        onChange={e => setStartDate(e.target.value)}
                                        className={inputClasses}
                                    />
                                </div>
                            </div>
                            <div>
                                <Label
                                    htmlFor="endDate"
                                    className={`${
                                        theme === "dark" ? "text-gray-300" : "text-primary-800"
                                    }`}
                                >
                                    End Date
                                </Label>
                                <div className="relative mt-1">
                                    <CalendarDays className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        id="endDate"
                                        type="date"
                                        value={endDate}
                                        onChange={e => setEndDate(e.target.value)}
                                        className={inputClasses}
                                    />
                                </div>
                            </div>
                            <div>
                                <Label
                                    htmlFor="department"
                                    className={`${
                                        theme === "dark" ? "text-gray-300" : "text-primary-800"
                                    }`}
                                >
                                    Department
                                </Label>
                                <Select
                                    value={selectedDepartment}
                                    onValueChange={setSelectedDepartment}
                                >
                                    <SelectTrigger className={selectTriggerClasses}>
                                        <SelectValue placeholder="All Departments" />
                                    </SelectTrigger>
                                    <SelectContent className={selectContentClasses}>
                                        <SelectItem value="All Departments">
                                            All Departments
                                        </SelectItem>
                                        {filterDepartments.map(dept => (
                                            <SelectItem key={dept.id} value={dept.name}>
                                                {dept.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-end">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setStartDate("");
                                        setEndDate("");
                                        setSelectedDepartment("All Departments");
                                    }}
                                    className={clearButtonClasses}
                                >
                                    Clear Filters
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div
                        className={`rounded-lg p-4 ${toggleSectionClasses} flex items-center justify-between`}
                    >
                        <div className="flex items-center gap-4">
                            <h3
                                className={`text-lg font-semibold ${
                                    theme === "dark" ? "text-gray-100" : "text-primary-900"
                                }`}
                            >
                                {showProbation
                                    ? "Employees on Probation"
                                    : "Employees Terminating Contract"}
                            </h3>
                            <Badge
                                className={
                                    showProbation
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-red-100 text-red-800"
                                }
                            >
                                {filteredEmployees.length} employees
                            </Badge>
                        </div>
                        <div className="flex items-center gap-3">
                            <Label
                                htmlFor="toggle-mode"
                                className={`${
                                    theme === "dark" ? "text-gray-300" : "text-primary-800"
                                }`}
                            >
                                {showProbation ? "Probation" : "Terminating"}
                            </Label>
                            <Switch
                                id="toggle-mode"
                                checked={showProbation}
                                onCheckedChange={setShowProbation}
                                className="data-[state=checked]:bg-yellow-500 data-[state=unchecked]:bg-red-500"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <ColumnSelector columns={columns} onColumnToggle={handleColumnToggle} />
                        <DensitySelector density={density} onDensityChange={setDensity} />
                        <Button variant="outline" size="sm" className={clearButtonClasses}>
                            <Download className="w-4 h-4 mr-2" />
                            Export
                        </Button>
                    </div>

                    <div className={`rounded-lg overflow-hidden ${tableContainerClasses}`}>
                        <Table>
                            <TableHeader>
                                <TableRow className={tableHeaderRowClasses}>
                                    {visibleColumns.map(column => (
                                        <TableHead
                                            key={column.key}
                                            className={tableHeaderCellClasses}
                                        >
                                            {column.label}
                                        </TableHead>
                                    ))}
                                    <TableHead className={tableHeaderCellClasses}>
                                        Actions
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredEmployees.length > 0 ? (
                                    filteredEmployees.map(employee => (
                                        <TableRow
                                            key={employee.id}
                                            className={`${tableRowClasses} cursor-pointer`}
                                            onClick={() => {
                                                setSelectedEmployee(employee);
                                                setShowDetailsModal(true);
                                            }}
                                        >
                                            {visibleColumns.map(column => (
                                                <TableCell
                                                    key={column.key}
                                                    className={`${getDensityClasses()} ${
                                                        theme === "dark"
                                                            ? "text-gray-300"
                                                            : "text-primary-800"
                                                    }`}
                                                >
                                                    {renderCellValue(
                                                        employee,
                                                        column.key as keyof EmployeeModel,
                                                    )}
                                                </TableCell>
                                            ))}
                                            <TableCell className={getDensityClasses()}>
                                                <EmployeeActions
                                                    employee={employee}
                                                    onEdit={onEditEmployee}
                                                    onViewProfile={onViewProfile}
                                                    onChangePassword={onChangePassword}
                                                    onManageDocuments={onManageDocuments}
                                                    onViewEmployeeLog={onViewEmployeeLog}
                                                    onViewCompensation={onViewCompensation}
                                                    onViewDisciplinary={onViewDisciplinary}
                                                    onManageDependents={onManageDependents}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={visibleColumns.length + 1}
                                            className={`text-center py-12 ${emptyTableCellClasses}`}
                                        >
                                            <div className="flex flex-col items-center gap-3">
                                                <Users className="w-12 h-12 opacity-40" />
                                                <div>
                                                    <p className="font-medium">
                                                        No Employees Found
                                                    </p>
                                                    <p className="text-sm">
                                                        {showProbation
                                                            ? "No one is in their probation period with these filters."
                                                            : "No one is terminating with these filters."}
                                                    </p>
                                                </div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                <div
                    className={`p-4 mt-auto border-t ${
                        theme === "dark" ? "border-gray-700" : ""
                    } ${footerClasses}`}
                >
                    <div className="flex items-center justify-between text-sm">
                        <div>
                            Showing {filteredEmployees.length} of {mockOffboardingEmployees.length}{" "}
                            employees
                        </div>
                        <div className="flex items-center gap-2">
                            <span>
                                {showProbation ? "Probation Period" : "Contract Termination"} •{" "}
                                {selectedDepartment}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {showDetailsModal && selectedEmployee && (
                <EmployeeDetailsModal
                    employee={selectedEmployee}
                    onClose={() => {
                        setShowDetailsModal(false);
                        setSelectedEmployee(null);
                    }}
                    onEdit={onEditEmployee}
                />
            )}
        </div>
    );
}
