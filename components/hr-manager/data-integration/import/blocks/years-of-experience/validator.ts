import {
    ValidationContext,
    ValidationResult,
    validateMandatoryFields,
    validateOptionalFields,
    validateFieldTypes,
    generateErrorMessage,
} from "../shared/validation-engine";

/**
 * Years Of Experience validation logic
 * This handles validation rules specific to years of experience import data
 */

/**
 * Validates CSV data for years of experience import
 * @param csvData - Parsed CSV data as array of objects
 * @param context - Validation context containing employees data and field definitions
 * @returns ValidationResult with validation status and errors
 */
export async function validateYearsOfExperienceData(
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

        // Step 4: Years Of Experience-specific validation
        const yearsOfExperienceErrors = validateYearsOfExperienceSpecificFields(row);
        if (Object.keys(yearsOfExperienceErrors).length > 0) {
            Object.assign(fieldErrors, yearsOfExperienceErrors);
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

    // Check for duplicate names across all rows
    const duplicateNameErrors = validateDuplicateNames(csvData);
    if (Object.keys(duplicateNameErrors).length > 0) {
        // Add duplicate name errors to existing error rows or create new ones
        for (const [errorKey, errorMessage] of Object.entries(duplicateNameErrors)) {
            const rowMatch = errorKey.match(/^row_(\d+)_name$/);
            if (rowMatch) {
                const rowNumber = parseInt(rowMatch[1]);
                const existingErrorIndex = errors.findIndex(err => err.rowNumber === rowNumber);
                if (existingErrorIndex >= 0) {
                    // Add to existing error
                    errors[existingErrorIndex].fieldErrors.name = errorMessage;
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
                        fieldErrors: { name: errorMessage },
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
 * Validates years of experience-specific reference fields
 */
function validateYearsOfExperienceSpecificFields(row: Record<string, any>): Record<string, string> {
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

    // Validate name is non-empty string
    const name = row.name;
    if (name !== undefined && name !== null) {
        const nameStr = String(name).trim();
        if (nameStr.length === 0) {
            errors.name = "Name cannot be empty";
        }
    }

    return errors;
}

/**
 * Validates for duplicate names within the CSV data
 */
function validateDuplicateNames(csvData: Record<string, any>[]): Record<string, string> {
    const errors: Record<string, string> = {};
    const nameMap = new Map<string, number[]>();

    // Collect all names and their row indices
    csvData.forEach((row, index) => {
        const name = row.name;
        if (name && String(name).trim() !== "") {
            const nameKey = String(name).trim().toUpperCase();
            if (!nameMap.has(nameKey)) {
                nameMap.set(nameKey, []);
            }
            nameMap.get(nameKey)!.push(index + 1); // 1-based row numbers
        }
    });

    // Find duplicates
    for (const [name, rowNumbers] of nameMap) {
        if (rowNumbers.length > 1) {
            // Add error for each duplicate row
            rowNumbers.forEach(rowNum => {
                errors[`row_${rowNum}_name`] =
                    `Duplicate name '${name}' found in rows: ${rowNumbers.join(", ")}`;
            });
        }
    }

    return errors;
}
