import {
    ValidationContext,
    ValidationResult,
    generateErrorMessage,
    validateFieldTypes,
    validateMandatoryFields,
    validateOptionalFields,
} from "../shared/validation-engine";

/**
 * Section Settings validation logic
 * This handles validation rules specific to section settings import data
 */

/**
 * Validates CSV data for section settings import
 * @param csvData - Parsed CSV data as array of objects
 * @param context - Validation context containing employees data and field definitions
 * @returns ValidationResult with validation status and errors
 */
export async function validateSectionSettingsData(
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

        // Step 4: Section-specific validation
        const sectionErrors = await validateSectionSpecificFields(row, context);
        if (Object.keys(sectionErrors).length > 0) {
            Object.assign(fieldErrors, sectionErrors);
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
 * Validates section-specific reference fields
 */
async function validateSectionSpecificFields(
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

    // Validate supervisor exists if provided
    const supervisor = row.supervisor;
    if (supervisor && String(supervisor).trim() !== "") {
        const supervisorExists = context.employees.some(emp => emp.employeeID === supervisor);
        if (!supervisorExists) {
            errors.supervisor = `Supervisor with employee ID '${supervisor}' does not exist`;
        }
    }

    // Validate department exists if provided
    const department = row.department;
    if (department && String(department).trim() !== "" && context.hrSettings?.departmentSettings) {
        const departmentExists = context.hrSettings.departmentSettings.some(
            (dep: any) => dep.name === department,
        );
        if (!departmentExists) {
            errors.department = `Department '${department}' does not exist in HR settings`;
        }
    }

    return errors;
}
