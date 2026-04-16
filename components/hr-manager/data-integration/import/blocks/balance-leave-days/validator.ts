import {
    ValidationContext,
    ValidationResult,
    validateMandatoryFields,
    validateOptionalFields,
    validateFieldTypes,
    generateErrorMessage,
} from "../shared/validation-engine";

/**
 * Balance Leave Days validation logic
 * This handles validation rules specific to leave balance import data
 */

/**
 * Validates CSV data for balance leave days import
 * @param csvData - Parsed CSV data as array of objects
 * @param context - Validation context containing employees data and field definitions
 * @returns ValidationResult with validation status and errors
 */
export async function validateBalanceLeaveDaysData(
    csvData: Record<string, any>[],
    context: ValidationContext,
): Promise<ValidationResult> {
    const errors: ValidationResult["errors"] = [];
    const validRows: Record<string, any>[] = [];

    for (let i = 0; i < csvData.length; i++) {
        const row = csvData[i];
        const rowNumber = i + 1; // 1-based row numbering for user display
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

        // Step 4: Leave balance specific validation
        const balanceReferenceErrors = await validateLeaveBalanceReferenceFields(row, context);
        if (Object.keys(balanceReferenceErrors).length > 0) {
            Object.assign(fieldErrors, balanceReferenceErrors);
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
 * Validates leave balance specific reference fields
 */
async function validateLeaveBalanceReferenceFields(
    row: Record<string, any>,
    context: ValidationContext,
): Promise<Record<string, string>> {
    const errors: Record<string, string> = {};

    // Validate employeeID must reference an existing employee
    const employeeID = row.employeeID;
    if (employeeID) {
        const employeeExists = context.employees.some(emp => emp.employeeID === employeeID);
        if (!employeeExists) {
            errors.employeeID = `Employee with ID '${employeeID}' does not exist`;
        }
    }

    // Validate balanceLeaveDays is a non-negative number
    const balanceLeaveDays = row.balanceLeaveDays;
    if (balanceLeaveDays !== undefined && balanceLeaveDays !== null) {
        const balanceValue = Number(balanceLeaveDays);
        if (isNaN(balanceValue)) {
            errors.balanceLeaveDays = "Balance leave days must be a valid number";
        } else if (balanceValue < 0) {
            errors.balanceLeaveDays = "Balance leave days cannot be negative";
        }
    }

    // Validate accrualLeaveDays is a non-negative number (if provided)
    const accrualLeaveDays = row.accrualLeaveDays;
    if (
        accrualLeaveDays !== undefined &&
        accrualLeaveDays !== null &&
        String(accrualLeaveDays).trim() !== ""
    ) {
        const accrualValue = Number(accrualLeaveDays);
        if (isNaN(accrualValue)) {
            errors.accrualLeaveDays = "Accrual leave days must be a valid number";
        } else if (accrualValue < 0) {
            errors.accrualLeaveDays = "Accrual leave days cannot be negative";
        }
    }

    return errors;
}
