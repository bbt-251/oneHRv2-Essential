import { ImportDataModel, ImportLogModel } from "@/lib/models/import-log";
import { getTimestamp } from "@/lib/util/dayjs_format";
import { validateBalanceLeaveDaysData } from "./balance-leave-days/validator";
import { validateDepartmentSettingsData } from "./department-settings/validator";
import { validateEmployeeData } from "./employee/validator";
import { validateSectionSettingsData } from "./section-settings/validator";
import { validateLeaveTypesData } from "./leave-types/validator";
import { ValidationContext, ValidationResult } from "./shared/validation-engine";
import { validateShiftHoursData } from "./shift-hours/validator";
import { validateShiftTypeData } from "./shift-type/validator";
import { validateTrainingCategoryData } from "./training-category/validator";
import { validateTrainingLengthData } from "./training-length/validator";
import { validateTrainingComplexityData } from "./training-complexity/validator";
import { validateHiringNeedTypeData } from "./hiring-need-type/validator";
import { validateLevelOfEducationData } from "./level-of-education/validator";
import { validateYearsOfExperienceData } from "./years-of-experience/validator";
import { validateOvertimeRequestData } from "./overtime-request/validator";

/**
 * Validates CSV data for import
 * @param csvData - Parsed CSV data as array of objects
 * @param context - Validation context containing employees data and field definitions
 * @returns ValidationResult with validation status and errors
 */
export const validateImportData = async (
    csvData: Record<string, any>[],
    context: ValidationContext,
): Promise<ValidationResult> => {
    // Delegate to specific validators based on import type
    switch (context.importType) {
        case "employee-upsert":
        case "employee":
            return await validateEmployeeData(csvData, context);

        case "balance-leave-days":
            return await validateBalanceLeaveDaysData(csvData, context);

        case "department-settings":
            return await validateDepartmentSettingsData(csvData, context);

        case "section-settings":
            return await validateSectionSettingsData(csvData, context);

        case "leave-types":
            return await validateLeaveTypesData(csvData, context);

        case "shift-hours":
            return await validateShiftHoursData(csvData, context);

        case "shift-type":
            return await validateShiftTypeData(csvData, context);

        case "training-category":
            return await validateTrainingCategoryData(csvData, context);

        case "training-length":
            return await validateTrainingLengthData(csvData, context);

        case "training-complexity":
            return await validateTrainingComplexityData(csvData, context);

        case "hiring-need-type":
            return await validateHiringNeedTypeData(csvData, context);

        case "level-of-education":
            return await validateLevelOfEducationData(csvData, context);

        case "years-of-experience":
            return await validateYearsOfExperienceData(csvData, context);

        case "overtime-request":
            return await validateOvertimeRequestData(csvData, context);

        default:
            throw new Error(`Unsupported import type: ${context.importType}`);
    }
};

/**
 * Creates an import log entry
 */
export const createImportLog = (
    importType: string,
    actorName: string,
    actorID: string,
    validationResult: ValidationResult,
    isSuccess: boolean,
): ImportLogModel => {
    const importData: ImportDataModel = {
        totalRows: validationResult.totalRows,
        successfulRows: isSuccess ? validationResult.validRows.length : 0,
        failedRows: validationResult.errors.length,
        summary: generateImportSummary(validationResult, isSuccess),
        importedRecords: [],
        failureDetails: [],
    };

    // Only include failureDetails if there are errors
    if (validationResult.errors.length > 0) {
        importData.failureDetails = validationResult.errors;
    }

    return {
        id: `import_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: getTimestamp(),
        type: importType,
        actorName,
        actorID,
        status: isSuccess ? "success" : "failure",
        importedData: importData,
    };
};

/**
 * Generates a human-readable summary of the import operation
 */
const generateImportSummary = (validationResult: ValidationResult, isSuccess: boolean): string => {
    const { totalRows, validRows, errors } = validationResult;

    if (isSuccess && errors.length === 0) {
        return `Successfully imported ${validRows.length} of ${totalRows} records`;
    } else if (errors.length > 0) {
        return `Failed to import ${errors.length} of ${totalRows} records due to validation errors`;
    } else {
        return `Import failed for ${totalRows} records`;
    }
};
