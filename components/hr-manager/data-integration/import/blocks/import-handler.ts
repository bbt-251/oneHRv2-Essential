import { HrSettingsByType } from "@/context/firestore-context";
import { ImportService } from "@/lib/backend/api/hr-settings/import-service";
import { EmployeeModel } from "@/lib/models/employee";
import { ImportFailureDetail, ImportLogModel } from "@/lib/models/import-log";
import { getBalanceLeaveDaysFields } from "./balance-leave-days/fields";
import { importBalanceLeaveDaysData } from "./balance-leave-days/import";
import { getDepartmentSettingsFields } from "./department-settings/fields";
import { importDepartmentSettingsData } from "./department-settings/import";
import { getEmployeeFields } from "./employee/fields";
import { importEmployeeData } from "./employee/import";
import { getSectionSettingsFields } from "./section-settings/fields";
import { getLeaveTypesFields } from "./leave-types/fields";
import { importSectionSettingsData } from "./section-settings/import";
import { importLeaveTypesData } from "./leave-types/import";
import { getShiftHoursFields } from "./shift-hours/fields";
import { importShiftHoursData } from "./shift-hours/import";
import { getShiftTypeFields } from "./shift-type/fields";
import { importShiftTypeData } from "./shift-type/import";
import { getTrainingCategoryFields } from "./training-category/fields";
import { importTrainingCategoryData } from "./training-category/import";
import { getTrainingLengthFields } from "./training-length/fields";
import { importTrainingLengthData } from "./training-length/import";
import { getTrainingComplexityFields } from "./training-complexity/fields";
import { importTrainingComplexityData } from "./training-complexity/import";
import { getHiringNeedTypeFields } from "./hiring-need-type/fields";
import { importHiringNeedTypeData } from "./hiring-need-type/import";
import { getLevelOfEducationFields } from "./level-of-education/fields";
import { importLevelOfEducationData } from "./level-of-education/import";
import { getYearsOfExperienceFields } from "./years-of-experience/fields";
import { importYearsOfExperienceData } from "./years-of-experience/import";
import { getOvertimeRequestFields } from "./overtime-request/fields";
import { importOvertimeRequestData } from "./overtime-request/import";
import { createHeaderMapping, parseCSV, readFileContent } from "./shared/csv-parser";
import { ImportField, ValidationContext } from "./shared/validation-engine";
import { createImportLog, validateImportData } from "./validate";
import { validateShiftTypeData } from "./shift-type/validator";

export interface ImportHandlerResult {
    success: boolean;
    importLog: ImportLogModel;
    message: string;
}

/**
 * Creates header mapping from fields array for CSV parsing
 */
export const IMPORT_TYPES = [
    { value: "employee-upsert", label: "Employee" },
    { value: "balance-leave-days", label: "Balance Leave Days" },
    { value: "department-settings", label: "Department Settings" },
    { value: "section-settings", label: "Section Settings" },
    { value: "leave-types", label: "Leave Types" },
    { value: "shift-hours", label: "Shift Hours" },
    { value: "shift-type", label: "Shift Type" },
    { value: "training-category", label: "Training Category" },
    { value: "training-length", label: "Training Length" },
    { value: "training-complexity", label: "Training Complexity" },
    { value: "hiring-need-type", label: "Hiring Need Type" },
    { value: "level-of-education", label: "Level Of Education" },
    { value: "years-of-experience", label: "Years Of Experience" },
    { value: "overtime-request", label: "Overtime Requests" },
];

/**
 * Processes the complete import workflow: validation and import
 */
export async function processImport(
    file: File,
    importType: string,
    fields: ImportField[],
    employees: EmployeeModel[],
    actorName: string,
    actorID: string,
    hrSettings?: HrSettingsByType,
): Promise<ImportHandlerResult> {
    try {
        // Step 1: Read and parse CSV file
        const csvContent = await readFileContent(file);
        const headerMapping = createHeaderMapping(fields);
        const csvData = parseCSV(csvContent, headerMapping);

        if (csvData.length === 0) {
            throw new Error("CSV file is empty or contains no valid data rows");
        }

        // Step 2: Validate the data
        const validationContext: ValidationContext = {
            employees,
            importType,
            fields,
            hrSettings,
        };

        const validationResult = await validateImportData(csvData, validationContext);

        // Step 3: If validation fails, create failure log and return
        if (!validationResult.isValid) {
            const failureLog = createImportLog(
                importType,
                actorName,
                actorID,
                validationResult,
                false,
            );

            // Save the failure log
            const logId = await ImportService.createImportLog(failureLog);
            failureLog.id = logId;

            return {
                success: false,
                importLog: failureLog,
                message: `Validation failed: ${validationResult.errors.length} rows have errors`,
            };
        }

        // Step 4: If validation passes, proceed with import using modular approach
        let importResult;

        switch (importType) {
            case "employee-upsert":
            case "employee":
                importResult = await importEmployeeData(
                    validationResult.validRows,
                    actorName,
                    actorID,
                    hrSettings,
                    employees,
                );
                break;

            case "balance-leave-days":
                importResult = await importBalanceLeaveDaysData(
                    validationResult.validRows,
                    actorName,
                    actorID,
                );
                break;

            case "department-settings":
                importResult = await importDepartmentSettingsData(
                    validationResult.validRows,
                    actorName,
                    actorID,
                    hrSettings,
                    employees,
                );
                break;

            case "section-settings":
                importResult = await importSectionSettingsData(
                    validationResult.validRows,
                    actorName,
                    actorID,
                    hrSettings,
                    employees,
                );
                break;

            case "leave-types":
                importResult = await importLeaveTypesData(
                    validationResult.validRows,
                    actorName,
                    actorID,
                );
                break;

            case "shift-hours":
                importResult = await importShiftHoursData(
                    validationResult.validRows,
                    actorName,
                    actorID,
                );
                break;

            case "shift-type":
                importResult = await importShiftTypeData(
                    validationResult.validRows,
                    actorName,
                    actorID,
                    hrSettings,
                );
                break;

            case "training-category":
                importResult = await importTrainingCategoryData(
                    validationResult.validRows,
                    actorName,
                    actorID,
                );
                break;

            case "training-length":
                importResult = await importTrainingLengthData(
                    validationResult.validRows,
                    actorName,
                    actorID,
                );
                break;

            case "training-complexity":
                importResult = await importTrainingComplexityData(
                    validationResult.validRows,
                    actorName,
                    actorID,
                );
                break;

            case "hiring-need-type":
                importResult = await importHiringNeedTypeData(
                    validationResult.validRows,
                    actorName,
                    actorID,
                );
                break;

            case "level-of-education":
                importResult = await importLevelOfEducationData(
                    validationResult.validRows,
                    actorName,
                    actorID,
                );
                break;

            case "years-of-experience":
                importResult = await importYearsOfExperienceData(
                    validationResult.validRows,
                    actorName,
                    actorID,
                );
                break;

            case "overtime-request":
                importResult = await importOvertimeRequestData(
                    validationResult.validRows,
                    actorName,
                    actorID,
                );
                break;

            default:
                throw new Error(`Unsupported import type: ${importType}`);
        }

        return importResult;
    } catch (error) {
        console.error("Error in import process:", error);

        // Create error log
        const errorLog = createImportLog(
            importType,
            actorName,
            actorID,
            {
                isValid: false,
                errors: [
                    {
                        rowNumber: 1,
                        rowData: {},
                        errorMessage:
                            error instanceof Error ? error.message : "Unknown error occurred",
                        fieldErrors: {},
                    },
                ],
                validRows: [],
                totalRows: 0,
                validRowsData: [],
            },
            false,
        );

        // Save the error log
        const logId = await ImportService.createImportLog(errorLog);
        errorLog.id = logId;

        return {
            success: false,
            importLog: errorLog,
            message: error instanceof Error ? error.message : "An unexpected error occurred",
        };
    }
}

/**
 * Validates CSV data without importing
 */
export async function validateOnly(
    file: File,
    importType: string,
    fields: ImportField[],
    employees: EmployeeModel[],
    hrSettings?: HrSettingsByType,
): Promise<{
    isValid: boolean;
    errors: ImportFailureDetail[];
    totalRows: number;
    validRows: number;
    validRowsData: Record<string, any>[];
}> {
    try {
        const csvContent = await readFileContent(file);
        const headerMapping = createHeaderMapping(fields);
        const csvData = parseCSV(csvContent, headerMapping);

        const validationContext: ValidationContext = {
            employees,
            importType,
            fields,
            hrSettings,
        };

        const validationResult = await validateImportData(csvData, validationContext);

        return {
            isValid: validationResult.isValid,
            errors: validationResult.errors,
            totalRows: validationResult.totalRows,
            validRows: validationResult.validRows.length,
            validRowsData: validationResult.validRowsData,
        };
    } catch (error) {
        console.error("Error in validation:", error);
        throw error;
    }
}

/**
 * Gets field definitions for import type
 */
export function getFieldsForImportType(importType: string): ImportField[] {
    switch (importType) {
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
}
