import {
    ValidationContext,
    ValidationResult,
    validateMandatoryFields,
    validateOptionalFields,
    validateFieldTypes,
    generateErrorMessage,
} from "../shared/validation-engine";

/**
 * Leave Types validation logic
 * This handles validation rules specific to leave types import data
 */

/**
 * Validates CSV data for leave types import
 * @param csvData - Parsed CSV data as array of objects
 * @param context - Validation context containing employees data and field definitions
 * @returns ValidationResult with validation status and errors
 */
export async function validateLeaveTypesData(
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

        // Step 4: Leave Types-specific validation
        const leaveTypesErrors = validateLeaveTypesSpecificFields(row);
        if (Object.keys(leaveTypesErrors).length > 0) {
            Object.assign(fieldErrors, leaveTypesErrors);
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

    // Check for duplicate acronyms across all rows
    const duplicateAcronymErrors = validateDuplicateAcronyms(csvData);
    if (Object.keys(duplicateAcronymErrors).length > 0) {
        // Add duplicate acronym errors to existing error rows or create new ones
        for (const [errorKey, errorMessage] of Object.entries(duplicateAcronymErrors)) {
            const rowMatch = errorKey.match(/^row_(\d+)_acronym$/);
            if (rowMatch) {
                const rowNumber = parseInt(rowMatch[1]);
                const existingErrorIndex = errors.findIndex(err => err.rowNumber === rowNumber);
                if (existingErrorIndex >= 0) {
                    // Add to existing error
                    errors[existingErrorIndex].fieldErrors.acronym = errorMessage;
                    errors[existingErrorIndex].errorMessage = generateErrorMessage(
                        errors[existingErrorIndex].fieldErrors,
                    );
                } else {
                    // Create new error for this row
                    const rowData = csvData[rowNumber - 1] || {};
                    errors.push({
                        rowNumber,
                        rowData,
                        errorMessage,
                        fieldErrors: { acronym: errorMessage },
                    });
                }
            }
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
 * Validates leave types-specific reference fields
 */
function validateLeaveTypesSpecificFields(row: Record<string, any>): Record<string, string> {
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

    // Validate authorizedDays is a positive number
    const authorizedDays = row.authorizedDays;
    if (authorizedDays !== undefined && authorizedDays !== null) {
        const daysNum = Number(authorizedDays);
        if (isNaN(daysNum) || daysNum < 0) {
            errors.authorizedDays = "Authorized Days must be a positive number";
        }
    }

    // Validate name and acronym are non-empty strings
    const name = row.name;
    if (name !== undefined && name !== null) {
        const nameStr = String(name).trim();
        if (nameStr.length === 0) {
            errors.name = "Name cannot be empty";
        }
    }

    const acronym = row.acronym;
    if (acronym !== undefined && acronym !== null) {
        const acronymStr = String(acronym).trim();
        if (acronymStr.length === 0) {
            errors.acronym = "Acronym cannot be empty";
        }
    }

    return errors;
}

/**
 * Validates for duplicate acronyms within the CSV data
 */
function validateDuplicateAcronyms(csvData: Record<string, any>[]): Record<string, string> {
    const errors: Record<string, string> = {};
    const acronymMap = new Map<string, number[]>();

    // Collect all acronyms and their row indices
    csvData.forEach((row, index) => {
        const acronym = row.acronym;
        if (acronym && String(acronym).trim() !== "") {
            const acronymKey = String(acronym).trim().toUpperCase();
            if (!acronymMap.has(acronymKey)) {
                acronymMap.set(acronymKey, []);
            }
            acronymMap.get(acronymKey)!.push(index + 1); // 1-based row numbers
        }
    });

    // Find duplicates
    for (const [acronym, rowNumbers] of acronymMap) {
        if (rowNumbers.length > 1) {
            // Add error for each duplicate row
            rowNumbers.forEach(rowNum => {
                errors[`row_${rowNum}_acronym`] =
                    `Duplicate acronym '${acronym}' found in rows: ${rowNumbers.join(", ")}`;
            });
        }
    }

    return errors;
}
