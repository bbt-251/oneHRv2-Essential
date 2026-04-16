import {
    ValidationContext,
    ValidationResult,
    validateMandatoryFields,
    validateOptionalFields,
    validateFieldTypes,
    generateErrorMessage,
} from "../shared/validation-engine";

/**
 * Department Settings validation logic
 * This handles validation rules specific to department settings import data
 */

/**
 * Validates CSV data for department settings import
 * @param csvData - Parsed CSV data as array of objects
 * @param context - Validation context containing employees data and field definitions
 * @returns ValidationResult with validation status and errors
 */
export async function validateDepartmentSettingsData(
    csvData: Record<string, any>[],
    context: ValidationContext,
): Promise<ValidationResult> {
    const errors: ValidationResult["errors"] = [];
    const validRows: Record<string, any>[] = [];

    for (let i = 0; i < csvData.length; i++) {
        const row = csvData[i];
        const rowNumber = i + 1;
        const fieldErrors: Record<string, string> = {};
        let hasErrors = false;

        // Step 1: Check mandatory fields
        const mandatoryFieldErrors = validateMandatoryFields(row, context.fields);
        if (Object.keys(mandatoryFieldErrors).length > 0) {
            Object.assign(fieldErrors, mandatoryFieldErrors);
            hasErrors = true;
        }

        // Step 2: Check optional fields (if present, they must be valid)
        const optionalFieldErrors = validateOptionalFields(row, context.fields);
        if (Object.keys(optionalFieldErrors).length > 0) {
            Object.assign(fieldErrors, optionalFieldErrors);
            hasErrors = true;
        }

        // Step 3: Type validation
        const typeValidationErrors = validateFieldTypes(row, context.fields);
        if (Object.keys(typeValidationErrors).length > 0) {
            Object.assign(fieldErrors, typeValidationErrors);
            hasErrors = true;
        }

        // Step 4: Department-specific validation
        const departmentErrors = await validateDepartmentSpecificFields(row, context);
        if (Object.keys(departmentErrors).length > 0) {
            Object.assign(fieldErrors, departmentErrors);
            hasErrors = true;
        }

        if (hasErrors) {
            errors.push({
                rowNumber,
                rowData: row,
                errorMessage: generateErrorMessage(fieldErrors),
                fieldErrors,
            });
        } else {
            validRows.push(row);
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
        validRows,
        totalRows: csvData.length,
        validRowsData: validRows,
    };
}

/**
 * Validates department-specific reference fields
 */
async function validateDepartmentSpecificFields(
    row: Record<string, any>,
    context: ValidationContext,
): Promise<Record<string, string>> {
    const errors: Record<string, string> = {};

    // Validate active field values
    const active = row.active;
    if (active !== undefined && active !== null) {
        const activeStr = String(active).trim().toLowerCase();
        const validValues = ["yes", "no", "true", "false", "1", "0"];
        if (!validValues.includes(activeStr)) {
            errors.active = "Active must be one of Yes/No/True/False/1/0";
        }
    }

    // Validate manager exists if provided
    const manager = row.manager;
    if (manager && String(manager).trim() !== "") {
        const managerExists = context.employees.some(emp => emp.employeeID === manager);
        if (!managerExists) {
            errors.manager = `Manager with employee ID '${manager}' does not exist`;
        }
    }

    // Validate location exists if provided
    const location = row.location;
    if (location && String(location).trim() !== "" && context.hrSettings?.locations) {
        const locationExists = context.hrSettings.locations.some(
            (loc: any) => loc.name === location,
        );
        if (!locationExists) {
            errors.location = `Location '${location}' does not exist in HR settings`;
        }
    }

    return errors;
}
