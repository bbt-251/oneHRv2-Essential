"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Download, X, FileText, File } from "lucide-react";
import type { EmployeeModel } from "@/lib/models/employee";
import { ColumnConfig } from "@/lib/models/type";
import { useData } from "@/context/app-data-context";
import getEmployeeFullName from "@/lib/util/getEmployeeFullName";

interface ExportModalProps {
    employees: EmployeeModel[];
    columns: ColumnConfig[];
    onClose: () => void;
}

export function ExportModal({ employees, columns, onClose }: ExportModalProps) {
    const {
        employees: allEmployees,
        locations,
        sectionSettings,
        contractTypes,
        maritalStatuses,
        positions,
        departmentSettings,
        shiftTypes,
        yearsOfExperiences,
        levelOfEducations,
        reasonOfLeaving,
        currencies,
        taxes,
        contractHours,
        grades,
    } = useData();

    const getName = (items: { id: string; name: string }[], id: string) =>
        items.find(item => item.id === id)?.name || "";

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
    const getReasonOfLeavingName = (reasonId: string) => getName(reasonOfLeaving, reasonId);
    const getCurrencyName = (currencyId: string) => getName(currencies, currencyId);
    const getTaxName = (taxId: string) => {
        const tax = taxes.find(tax => tax.id === taxId);
        return tax?.taxName || "";
    };

    const getContractHourName = (contractHourId: string) => {
        const contractHour = contractHours.find(contractHour => contractHour.id === contractHourId);
        return contractHour?.hourPerWeek || "";
    };

    const getGradeLevelName = (gradeLevelId: string) => {
        const gradeLevel = grades.find(gradeLevel => gradeLevel.id === gradeLevelId);
        return gradeLevel?.grade || "";
    };

    const getManagerFullName = (managerId: string) => {
        const manager = allEmployees.find(employee => employee.uid === managerId);
        return manager ? getEmployeeFullName(manager) : "";
    };

    const getReporteesNames = (reportees: string[]) => {
        return reportees
            .map(uid => {
                const emp = allEmployees.find(e => e.uid === uid);
                return emp ? getEmployeeFullName(emp) : uid;
            })
            .join(", ");
    };

    const getDisplayValue = (employee: EmployeeModel, key: string): string => {
        const value = employee[key as keyof EmployeeModel];
        switch (key) {
            case "contractType":
                return getContractTypeName(value as string);
            case "employmentPosition":
                return getEmploymentPositionName(value as string);
            case "section":
                return getSectionName(value as string);
            case "department":
                return getDepartmentName(value as string);
            case "workingLocation":
                return getLocationName(value as string);
            case "reportees":
                return getReporteesNames(value as string[]);
            case "shiftType":
                return getShiftTypeName(value as string);
            case "levelOfEducation":
                return getLevelOfEducationName(value as string);
            case "yearsOfExperience":
                return getYearsOfExperienceName(value as string);
            case "maritalStatus":
                return getMaritalStatusName(value as string);
            case "contractHour":
                return String(getContractHourName(value as string));
            case "reasonOfLeaving":
                return getReasonOfLeavingName(value as string);
            case "currency":
                return getCurrencyName(value as string);
            case "associatedTax":
                return getTaxName(value as string);
            case "homeLocation":
                return getLocationName(value as string);
            case "reportingLineManagerPosition":
                return getEmploymentPositionName(value as string);
            case "reportingLineManager":
                return getManagerFullName(value as string);
            case "gradeLevel":
                return getGradeLevelName(value as string);
            case "contractStatus":
            case "gender":
                const str = value as string;
                return str ? str.charAt(0).toUpperCase() + str.slice(1) : "";
            case "salary":
            case "hourlyWage":
                if (value) {
                    return `${value} ${getCurrencyName(employee.currency) || ""}`;
                }
                return "";
            case "role":
                if (Array.isArray(value)) {
                    return (value as string[]).join(", ");
                }
                return "";
            case "timestamp":
                if (value) {
                    return new Date(value as string).toLocaleDateString();
                }
                return "";
            default:
                if (Array.isArray(value)) {
                    return `(${value.length} items)`;
                }
                if (typeof value === "boolean") {
                    return value ? "Yes" : "No";
                }
                if (typeof value === "object" && value !== null) {
                    return "[Object]";
                }
                return value ? String(value) : "";
        }
    };

    const [selectedColumns, setSelectedColumns] = useState<string[]>(
        columns.filter(col => col.visible).map(col => col.key),
    );
    const [exportFormat, setExportFormat] = useState<"csv" | "pdf">("csv");
    const [fileName, setFileName] = useState<string>("employees_export");

    const handleColumnToggle = (columnKey: string, checked: boolean) => {
        if (checked) {
            setSelectedColumns([...selectedColumns, columnKey]);
        } else {
            setSelectedColumns(selectedColumns.filter(key => key !== columnKey));
        }
    };

    const generateCSV = () => {
        const selectedColumnConfigs = columns.filter(col => selectedColumns.includes(col.key));
        const filteredSelectedColumnConfigs = selectedColumnConfigs.filter(
            col => !["lastChanged", "timestamp"].includes(col.key),
        );
        const headers = filteredSelectedColumnConfigs.map(col => col.label);

        const csvContent = [
            headers.join(","),
            ...employees.map(employee =>
                filteredSelectedColumnConfigs
                    .map(col => `"${getDisplayValue(employee, col.key)}"`)
                    .join(","),
            ),
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `${fileName}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const generatePDF = () => {
        const selectedColumnConfigs = columns.filter(col => selectedColumns.includes(col.key));
        const filteredSelectedColumnConfigs = selectedColumnConfigs.filter(
            col => !["lastChanged", "timestamp"].includes(col.key),
        );

        // Create a simple HTML table for PDF generation
        const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Employee Export</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
          th { background-color: #f2f2f2; font-weight: bold; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          h1 { color: #3f3d56; margin-bottom: 20px; }
        </style>
      </head>
      <body>
        <h1>Employee Report</h1>
        <p>Generated on: ${new Date().toLocaleDateString()}</p>
        <p>Total Records: ${employees.length}</p>
        <table>
          <thead>
            <tr>
              ${filteredSelectedColumnConfigs.map(col => `<th>${col.label}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${employees
        .map(
            employee => `
              <tr>
                ${filteredSelectedColumnConfigs
        .map(col => `<td>${getDisplayValue(employee, col.key)}</td>`)
        .join("")}
              </tr>
            `,
        )
        .join("")}
          </tbody>
        </table>
      </body>
      </html>
    `;

        const printWindow = window.open("", "_blank");
        if (printWindow) {
            printWindow.document.write(htmlContent);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 250);
        }
    };

    const handleExport = () => {
        if (selectedColumns.length === 0) {
            alert("Please select at least one column to export.");
            return;
        }

        if (exportFormat === "csv") {
            generateCSV();
        } else {
            generatePDF();
        }

        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-xl">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                        <Download className="w-5 h-5 text-primary-600" />
                        <h2 className="text-xl font-semibold text-primary-900">Export Employees</h2>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        className="hover:bg-gray-100"
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label
                                htmlFor="fileName"
                                className="text-sm font-medium text-primary-800"
                            >
                                File Name
                            </Label>
                            <input
                                id="fileName"
                                type="text"
                                value={fileName}
                                onChange={e => setFileName(e.target.value)}
                                className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-md focus:border-primary-500 focus:ring-primary-500"
                            />
                        </div>
                        <div>
                            <Label
                                htmlFor="format"
                                className="text-sm font-medium text-primary-800"
                            >
                                Export Format
                            </Label>
                            <Select
                                value={exportFormat}
                                onValueChange={(value: "csv" | "pdf") => setExportFormat(value)}
                            >
                                <SelectTrigger className="mt-1">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="csv">
                                        <div className="flex items-center gap-2">
                                            <File className="w-4 h-4" />
                                            CSV File
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="pdf">
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-4 h-4" />
                                            PDF File
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <Label className="text-sm font-medium text-primary-800">
                                Select Columns to Export ({selectedColumns.length} selected)
                            </Label>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSelectedColumns(columns.map(col => col.key))}
                                >
                                    Select All
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSelectedColumns([])}
                                >
                                    Clear All
                                </Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto border border-gray-200 rounded-md p-4">
                            {columns.map(column => (
                                <div key={column.key} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={column.key}
                                        checked={selectedColumns.includes(column.key)}
                                        onCheckedChange={checked =>
                                            handleColumnToggle(column.key, checked as boolean)
                                        }
                                    />
                                    <label
                                        htmlFor={column.key}
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                        {column.label}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-secondary-50 p-4 rounded-lg">
                        <h4 className="font-medium text-primary-900 mb-2">Export Summary</h4>
                        <div className="text-sm text-primary-700 space-y-1">
                            <p>• Total employees: {employees.length}</p>
                            <p>• Selected columns: {selectedColumns.length}</p>
                            <p>• Format: {exportFormat.toUpperCase()}</p>
                            <p>
                                • File name: {fileName}.{exportFormat}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleExport}
                        className="bg-primary-600 hover:bg-primary-700 text-white"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Export {exportFormat.toUpperCase()}
                    </Button>
                </div>
            </div>
        </div>
    );
}
