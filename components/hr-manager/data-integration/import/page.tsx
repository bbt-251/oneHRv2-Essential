"use client";

import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/context/authContext";
import { useFirestore } from "@/context/firestore-context";
import { useToast } from "@/context/toastContext";
import { EmployeeModel } from "@/lib/models/employee";
import { ImportLogModel } from "@/lib/models/import-log";
import getFullName from "@/lib/util/getEmployeeFullName";
import sortByDate from "@/lib/utils";
import {
    CheckCircle,
    Clock,
    Database,
    Download,
    Eye,
    FileText,
    Upload,
    User,
    XCircle,
} from "lucide-react";
import { useRef, useState } from "react";
import { getBalanceLeaveDaysFields } from "./blocks/balance-leave-days/fields";
import { getDepartmentSettingsFields } from "./blocks/department-settings/fields";
import { getEmployeeFields } from "./blocks/employee/fields";
import { IMPORT_TYPES } from "./blocks/import-handler";
import { ImportOrchestrator } from "@/lib/backend/api/hr-settings/import-orchestrator";
import { parseCSV, createHeaderMapping } from "./blocks/shared/csv-parser";
import { getLeaveTypesFields } from "./blocks/leave-types/fields";
import { getSectionSettingsFields } from "./blocks/section-settings/fields";
import { ImportField } from "./blocks/shared/validation-engine";
import { getShiftHoursFields } from "./blocks/shift-hours/fields";
import { getShiftTypeFields } from "./blocks/shift-type/fields";
import { getTrainingCategoryFields } from "./blocks/training-category/fields";
import { getTrainingLengthFields } from "./blocks/training-length/fields";
import { getTrainingComplexityFields } from "./blocks/training-complexity/fields";
import { getHiringNeedTypeFields } from "./blocks/hiring-need-type/fields";
import { getLevelOfEducationFields } from "./blocks/level-of-education/fields";
import { getYearsOfExperienceFields } from "./blocks/years-of-experience/fields";
import { getOvertimeRequestFields } from "./blocks/overtime-request/fields";
import ValidationPreview from "./blocks/validation-preview";
import ImportDetailsModal from "./modals/import-details-modal";

export default function ImportPage() {
    const { theme } = useTheme();
    const { showToast } = useToast();
    const { user } = useAuth();
    const { hrSettings, employees } = useFirestore();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [selectedImportType, setSelectedImportType] = useState<string>("");
    const [selectedFields, setSelectedFields] = useState<string[]>([]);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [showValidationPreview, setShowValidationPreview] = useState<boolean>(false);

    // Get import logs from firestore
    const importLogs = hrSettings.importLogs || [];

    const getCurrentFields = (): ImportField[] => {
        switch (selectedImportType) {
            case "employee-upsert":
            case "employee":
                return getEmployeeFields();
            case "balance-leave-days":
                return getBalanceLeaveDaysFields();
            case "department-settings":
                return getDepartmentSettingsFields();
            case "section-settings":
                return getSectionSettingsFields();
            case "leave-types":
                return getLeaveTypesFields();
            case "shift-hours":
                return getShiftHoursFields();
            case "shift-type":
                return getShiftTypeFields();
            case "training-category":
                return getTrainingCategoryFields();
            case "training-length":
                return getTrainingLengthFields();
            case "training-complexity":
                return getTrainingComplexityFields();
            case "hiring-need-type":
                return getHiringNeedTypeFields();
            case "level-of-education":
                return getLevelOfEducationFields();
            case "years-of-experience":
                return getYearsOfExperienceFields();
            case "overtime-request":
                return getOvertimeRequestFields();
            default:
                return [];
        }
    };

    const handleImportTypeChange = (value: string) => {
        setSelectedImportType(value);
        setSelectedFields([]);
        setUploadedFile(null);
    };

    const handleFieldToggle = (fieldKey: string, checked: boolean) => {
        if (checked) {
            setSelectedFields(prev => [...prev, fieldKey]);
        } else {
            setSelectedFields(prev => prev.filter(key => key !== fieldKey));
        }
    };

    const generateCSVTemplate = () => {
        const fields = getCurrentFields();
        const selectedFieldsData = fields.filter(
            field => field.required || selectedFields.includes(field.key),
        );

        if (selectedFieldsData.length === 0) {
            showToast(
                "Please select at least one field to include in the template.",
                "No Fields Selected",
                "warning",
            );
            return;
        }

        const headers = selectedFieldsData.map(field => field.label);
        let csvContent = headers.join(",") + "\n";

        // Add example data rows if role field is included
        if (selectedFieldsData.some(field => field.key === "role")) {
            csvContent += "\n# Example with multiple roles:\n";
            const exampleRow = selectedFieldsData.map(field => {
                if (field.key === "role") return "Manager;HR Manager";
                if (field.key === "firstName") return "John";
                if (field.key === "surname") return "Doe";
                if (field.key === "personalEmail") return "john.doe@example.com";
                if (field.key === "employeeID") return "EMP001";
                if (field.key === "personalPhoneNumber") return "+1234567890";
                if (field.key === "gender") return "Male";
                if (field.key === "birthDate") return "1990-01-01";
                return "";
            });
            csvContent += exampleRow.join(",") + "\n\n";
            csvContent +=
                "# Note: Use semicolons (;) to separate multiple roles in the 'Role' column\n";
        }

        // Add example data rows for shift hours
        if (selectedImportType === "shift-hours") {
            csvContent += "\n# Example shift hour divisions:\n";
            const exampleRow = selectedFieldsData.map(field => {
                if (field.key === "name") return "Morning Shift";
                if (field.key === "active") return "Yes";
                if (field.key === "shiftHourDivision-1") return "09:00 AM - 12:30 PM";
                if (field.key === "shiftHourDivision-2") return "02:00 PM - 05:00 PM";
                return "";
            });
            csvContent += exampleRow.join(",") + "\n\n";
            csvContent +=
                "# Note: Shift hour divisions format: '09:00 AM - 12:30 PM' or '09:00 - 12:30'\n";
            csvContent += "# - Supports both 12-hour (AM/PM) and 24-hour formats\n";
            csvContent += "# - Add more division columns as needed (shiftHourDivision-3, etc.)\n";
            csvContent += "# - Leave division columns empty if not needed\n";
        }

        // Add example data rows for shift types
        if (selectedImportType === "shift-type") {
            csvContent += "\n# Example shift type with working days and shift hours:\n";
            const exampleRow = selectedFieldsData.map(field => {
                if (field.key === "name") return "Standard Work Week";
                if (field.key === "workingDays") return "Monday,Tuesday,Wednesday,Thursday,Friday";
                if (field.key === "startDate") return "2024-01-01";
                if (field.key === "endDate") return "2024-12-31";
                if (field.key === "active") return "Yes";
                if (field.key === "globalShiftHour") return "Standard Shift";
                return "";
            });
            csvContent += exampleRow.join(",") + "\n";

            csvContent += "\n# Example with day-specific shift hours:\n";
            const exampleRow2 = selectedFieldsData.map(field => {
                if (field.key === "name") return "Flexible Schedule";
                if (field.key === "workingDays") return "Monday,Wednesday,Friday";
                if (field.key === "startDate") return "2024-01-01";
                if (field.key === "endDate") return "2024-12-31";
                if (field.key === "active") return "Yes";
                if (field.key === "mondayShiftHour") return "Morning Shift";
                if (field.key === "wednesdayShiftHour") return "Afternoon Shift";
                if (field.key === "fridayShiftHour") return "Morning Shift";
                return "";
            });
            csvContent += exampleRow2.join(",") + "\n\n";

            csvContent +=
                "# Note: Working Days format - comma-separated days (Monday,Tuesday,Wednesday)\n";
            csvContent +=
                "# - Valid days: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday\n";
            csvContent +=
                "# - Use either globalShiftHour for all days OR individual day-specific shift hours\n";
            csvContent += "# - Date format: YYYY-MM-DD\n";
            csvContent += "# - Active must be: Yes or No\n";
        }

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${selectedImportType}-template.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        showToast("Template downloaded successfully!", "Download Complete", "success");
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
                showToast("Please upload a CSV file only.", "Invalid File Type", "error");
                return;
            }
            setUploadedFile(file);
            showToast("File uploaded successfully!", "Upload Complete", "success");
        }
    };

    const handleValidateAndImport = async () => {
        if (!uploadedFile) {
            showToast("Please upload a CSV file first.", "No File Selected", "warning");
            return;
        }

        if (!selectedImportType) {
            showToast("Please select an import type first.", "No Import Type Selected", "warning");
            return;
        }

        try {
            setIsProcessing(true);
            showToast("Starting validation and import process...", "Processing", "default");

            if (!user) {
                showToast("User authentication required.", "Authentication Error", "error");
                return;
            }

            // Parse CSV file
            const csvText = await uploadedFile.text();
            const headerMapping = createHeaderMapping(getCurrentFields());
            const parsedData = parseCSV(csvText, headerMapping);

            // Use ImportOrchestrator for the actual import (includes logging)
            const importLog = await ImportOrchestrator.batchImport(
                selectedImportType,
                parsedData,
                getFullName(employees.find(e => e.uid === user.uid) as EmployeeModel),
                user.uid,
                hrSettings,
            );

            if (importLog.status === "success") {
                showToast(importLog.importedData.summary, "Import Successful", "success");
                // Reset form
                setUploadedFile(null);
                setSelectedFields([]);
                if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                }
            } else {
                showToast(importLog.importedData.summary, "Import Failed", "error");
            }
        } catch (error) {
            console.error("Import error:", error);
            showToast(
                error instanceof Error
                    ? error.message
                    : "An unexpected error occurred during import.",
                "Import Error",
                "error",
            );
        } finally {
            setIsProcessing(false);
        }
    };

    const cardClasses = theme === "dark" ? "bg-black border-gray-700" : "bg-white border-gray-200";
    const textPrimaryClasses = theme === "dark" ? "text-white" : "text-gray-900";
    const textSecondaryClasses = theme === "dark" ? "text-gray-300" : "text-gray-600";
    const textMutedClasses = theme === "dark" ? "text-gray-400" : "text-gray-500";
    const borderClasses = theme === "dark" ? "border-gray-700" : "border-gray-200";
    const inputClasses =
        theme === "dark"
            ? "bg-black border-gray-600 focus:border-blue-500 focus:ring-blue-500 text-white"
            : "border-gray-200 focus:border-primary-600 focus:ring-primary-600";

    return (
        <div className="space-y-6">
            {/* Header */}
            <Card className={`${cardClasses} shadow-sm`}>
                <CardHeader className="text-center py-8">
                    <div className="mx-auto mb-4">
                        <div
                            className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${
                                theme === "dark"
                                    ? "bg-blue-400/10 text-blue-400"
                                    : "bg-blue-100 text-blue-600"
                            }`}
                        >
                            <Database className="w-8 h-8" />
                        </div>
                    </div>
                    <CardTitle className={`text-2xl font-semibold ${textPrimaryClasses}`}>
                        Data Import
                    </CardTitle>
                    <CardDescription className={`text-lg mt-2 ${textSecondaryClasses}`}>
                        Import employee data and balance leave days using CSV templates
                    </CardDescription>
                </CardHeader>
            </Card>

            {/* Import Type Selection */}
            <Card className={`${cardClasses} shadow-sm`}>
                <CardHeader>
                    <CardTitle className={`text-lg font-semibold ${textPrimaryClasses}`}>
                        1. Select Import Type
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <Label className={textSecondaryClasses}>
                            Choose the type of data you want to import
                        </Label>
                        <Select value={selectedImportType} onValueChange={handleImportTypeChange}>
                            <SelectTrigger className={inputClasses}>
                                <SelectValue placeholder="Select import type" />
                            </SelectTrigger>
                            <SelectContent>
                                {IMPORT_TYPES.map(type => (
                                    <SelectItem key={type.value} value={type.value}>
                                        {type.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Fields Selection */}
            {selectedImportType && (
                <Card className={`${cardClasses} shadow-sm`}>
                    <CardHeader>
                        <CardTitle className={`text-lg font-semibold ${textPrimaryClasses}`}>
                            2. Select Fields
                        </CardTitle>
                        <CardDescription className={textSecondaryClasses}>
                            Choose which fields to include in your import template. Required fields
                            are automatically included.
                        </CardDescription>

                        {(selectedImportType === "employee" ||
                            selectedImportType === "employee-upsert") && (
                            <div className={`mt-4 rounded-md border ${borderClasses} p-4`}>
                                <h4 className={`text-sm font-semibold ${textPrimaryClasses} mb-2`}>
                                    Importing Custom Fields (Advanced)
                                </h4>
                                <ul
                                    className={`list-disc pl-5 space-y-1 text-sm ${textSecondaryClasses}`}
                                >
                                    <li>
                                        Use one column per custom field and name it exactly as in HR
                                        Settings.
                                    </li>
                                    <li>
                                        Sections (required): Use a section prefix in the column
                                        header:
                                        <ul className="list-disc pl-5 mt-1 space-y-1">
                                            <li>
                                                employee_Field Label → Employee Information section
                                            </li>
                                            <li>
                                                position_Field Label → Position Information section
                                            </li>
                                            <li>
                                                contract_Field Label → Contract Information section
                                            </li>
                                            <li>
                                                emergency_Field Label → Emergency Contact section
                                            </li>
                                        </ul>
                                        Examples: employee_Bank Name, contract_Salary Grade.
                                    </li>
                                    <li>
                                        Field types:
                                        <ul className="list-disc pl-5 mt-1 space-y-1">
                                            <li>
                                                Text/Number/Date: plain values (e.g., Hello, 1200,
                                                2025-01-31).
                                            </li>
                                            <li>
                                                Select/Dropdown: value must match an allowed option
                                                exactly.
                                            </li>
                                            <li>
                                                Multi-select: separate values with a semicolon
                                                (e.g., Option A; Option B).
                                            </li>
                                            <li>Boolean/Checkbox: true/false or yes/no.</li>
                                        </ul>
                                    </li>
                                    <li>
                                        Updates vs. Creates:
                                        <ul className="list-disc pl-5 mt-1 space-y-1">
                                            <li>
                                                On update, only the columns you provide are updated.
                                            </li>
                                            <li>
                                                On create, provided custom field columns are saved;
                                                others remain empty.
                                            </li>
                                        </ul>
                                    </li>
                                    <li>
                                        Date format: YYYY-MM-DD. Multi-select values must match
                                        allowed options.
                                    </li>
                                </ul>
                                <div className={`mt-3 text-xs ${textMutedClasses}`}>
                                    Example headers: EmployeeID, FirstName, Department,
                                    employee_Blood Type, position_Skills
                                    <br />
                                    Example row: EMP-001, Sara, Engineering, O+, JavaScript; React;
                                    Node.js
                                </div>
                            </div>
                        )}
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div>
                                <h4 className={`font-medium ${textPrimaryClasses} mb-3`}>
                                    Required Fields
                                </h4>
                                {(selectedImportType === "shift-hours" ||
                                    selectedImportType === "shift-type") && (
                                    <p className={`text-sm ${textMutedClasses} mb-3`}>
                                        {selectedImportType === "shift-hours"
                                            ? "💡 Format: 09:00 AM - 12:30 PM or 09:00 - 12:30 (24-hour also supported)"
                                            : "💡 Working Days format: Monday,Tuesday,Wednesday (comma-separated)"}
                                    </p>
                                )}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {getCurrentFields()
                                        .filter(field => field.required)
                                        .map(field => (
                                            <div
                                                key={field.key}
                                                className={`flex items-center space-x-2 p-2 rounded border ${borderClasses}`}
                                            >
                                                <Checkbox checked={true} disabled />
                                                <Label
                                                    className={`${textSecondaryClasses} text-sm`}
                                                >
                                                    {field.label}
                                                </Label>
                                            </div>
                                        ))}
                                </div>
                            </div>

                            <div>
                                <h4 className={`font-medium ${textPrimaryClasses} mb-3`}>
                                    Optional Fields
                                </h4>
                                <p className={`text-sm ${textMutedClasses} mb-3`}>
                                    Click on the checkboxes to include optional fields in your
                                    template
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {getCurrentFields()
                                        .filter(field => !field.required)
                                        .map(field => (
                                            <div key={field.key}>
                                                <div
                                                    className={`flex items-center space-x-2 p-2 rounded border ${borderClasses}`}
                                                >
                                                    <Checkbox
                                                        checked={selectedFields.includes(field.key)}
                                                        onCheckedChange={checked =>
                                                            handleFieldToggle(
                                                                field.key,
                                                                checked as boolean,
                                                            )
                                                        }
                                                    />
                                                    <Label
                                                        className={`${textSecondaryClasses} text-sm cursor-pointer`}
                                                    >
                                                        {field.label}
                                                    </Label>
                                                </div>
                                                {field.key === "role" &&
                                                    selectedFields.includes(field.key) && (
                                                    <p
                                                        className={`text-xs ${textMutedClasses} mt-1 pl-2`}
                                                    >
                                                            💡 Use semicolons (;) to separate
                                                            multiple roles: Manager;HR Manager
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Download Template */}
            {selectedImportType && (
                <Card className={`${cardClasses} shadow-sm`}>
                    <CardHeader>
                        <CardTitle className={`text-lg font-semibold ${textPrimaryClasses}`}>
                            3. Download Template
                        </CardTitle>
                        <CardDescription className={textSecondaryClasses}>
                            Download the CSV template with your selected fields
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={generateCSVTemplate} className="w-full md:w-auto">
                            <Download className="w-4 h-4 mr-2" />
                            Download Template
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* File Upload */}
            {selectedImportType && (
                <Card className={`${cardClasses} shadow-sm`}>
                    <CardHeader>
                        <CardTitle className={`text-lg font-semibold ${textPrimaryClasses}`}>
                            4. Upload Populated CSV
                        </CardTitle>
                        <CardDescription className={textSecondaryClasses}>
                            Upload your populated CSV file for import
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div
                                className={`border-2 border-dashed ${borderClasses} rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50 ${theme === "dark" ? "hover:bg-gray-900" : ""}`}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Upload className={`w-12 h-12 mx-auto mb-4 ${textMutedClasses}`} />
                                <p className={`text-lg font-medium ${textPrimaryClasses} mb-2`}>
                                    {uploadedFile ? uploadedFile.name : "Click to upload CSV file"}
                                </p>
                                <p className={`text-sm ${textMutedClasses}`}>
                                    {uploadedFile
                                        ? "File ready for import"
                                        : "Drag and drop or click to browse"}
                                </p>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".csv"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                />
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3">
                                <Button
                                    onClick={() => setShowValidationPreview(true)}
                                    disabled={!uploadedFile || isProcessing}
                                    variant="outline"
                                    className="w-full sm:w-auto"
                                >
                                    <Eye className="w-4 h-4 mr-2" />
                                    Preview Validation
                                </Button>
                                <Button
                                    onClick={handleValidateAndImport}
                                    disabled={!uploadedFile || isProcessing}
                                    className="w-full sm:w-auto"
                                >
                                    <FileText className="w-4 h-4 mr-2" />
                                    {isProcessing ? "Processing..." : "Validate & Begin Import"}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Import Logs */}
            <Card className={`${cardClasses} shadow-sm`}>
                <CardHeader>
                    <CardTitle className={`text-lg font-semibold ${textPrimaryClasses}`}>
                        Import Logs
                    </CardTitle>
                    <CardDescription className={textSecondaryClasses}>
                        Recent import activities and their status
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {importLogs.length === 0 ? (
                            <p className={`text-center py-8 ${textMutedClasses}`}>
                                No import logs available
                            </p>
                        ) : (
                            (
                                sortByDate({
                                    data: importLogs,
                                    type: "Latest First",
                                }) as ImportLogModel[]
                            ).map(log => (
                                <div
                                    key={log.id}
                                    className={`flex items-center justify-between p-4 rounded-lg border ${borderClasses}`}
                                >
                                    <div className="flex items-center space-x-4">
                                        <div
                                            className={`p-2 rounded-full ${
                                                log.status === "success"
                                                    ? theme === "dark"
                                                        ? "bg-green-400/10 text-green-400"
                                                        : "bg-green-100 text-green-600"
                                                    : theme === "dark"
                                                        ? "bg-red-400/10 text-red-400"
                                                        : "bg-red-100 text-red-600"
                                            }`}
                                        >
                                            {log.status === "success" ? (
                                                <CheckCircle className="w-4 h-4" />
                                            ) : (
                                                <XCircle className="w-4 h-4" />
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-center space-x-2">
                                                <Clock className={`w-4 h-4 ${textMutedClasses}`} />
                                                <span className={`text-sm ${textMutedClasses}`}>
                                                    {log.timestamp}
                                                </span>
                                            </div>
                                            <div className="flex items-center space-x-2 mt-1">
                                                <User className={`w-4 h-4 ${textMutedClasses}`} />
                                                <span className={`text-sm ${textSecondaryClasses}`}>
                                                    {log.actorName}
                                                </span>
                                                <span className={`text-sm ${textMutedClasses}`}>
                                                    •
                                                </span>
                                                <span className={`text-sm ${textSecondaryClasses}`}>
                                                    {log.type}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <div className="text-right">
                                            <p
                                                className={`text-sm font-medium ${
                                                    log.status === "success"
                                                        ? theme === "dark"
                                                            ? "text-green-400"
                                                            : "text-green-600"
                                                        : theme === "dark"
                                                            ? "text-red-400"
                                                            : "text-red-600"
                                                }`}
                                            >
                                                {log.status === "success" ? "Success" : "Failed"}
                                            </p>
                                            <p className={`text-sm ${textMutedClasses} mt-1`}>
                                                {log.importedData.summary}
                                            </p>
                                        </div>
                                        <ImportDetailsModal log={log} />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Validation Preview Modal */}
            {showValidationPreview && uploadedFile && (
                <ValidationPreview
                    file={uploadedFile}
                    importType={selectedImportType}
                    fields={getCurrentFields()}
                    employees={employees}
                    hrSettings={hrSettings}
                    onClose={() => setShowValidationPreview(false)}
                />
            )}
        </div>
    );
}
