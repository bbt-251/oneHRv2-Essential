import {
    ValidationContext,
    ValidationResult,
    validateMandatoryFields,
    validateFieldTypes,
    generateErrorMessage,
} from "../shared/validation-engine";

/**
 * Overtime Request-specific validation logic
 */

/**
 * Validates CSV data for overtime request import
 * @param csvData - Parsed CSV data as array of objects
 * @param context - Validation context containing employees data and field definitions
 * @returns ValidationResult with validation status and errors
 */
export async function validateOvertimeRequestData(
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

        // Step 2: Type validation
        const typeValidationErrors = validateFieldTypes(row, context.fields);
        if (Object.keys(typeValidationErrors).length > 0) {
            Object.assign(fieldErrors, typeValidationErrors);
            hasErrors = true;
        }

        // Step 3: Overtime Request-specific validation
        const overtimeRequestErrors = await validateOvertimeRequestFields(row, context);
        if (Object.keys(overtimeRequestErrors).length > 0) {
            Object.assign(fieldErrors, overtimeRequestErrors);
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
 * Validates overtime request-specific fields
 */
async function validateOvertimeRequestFields(
    row: Record<string, any>,
    context: ValidationContext,
): Promise<Record<string, string>> {
    const errors: Record<string, string> = {};

    // Validate employee ID exists
    const employeeID = row.employeeID;
    if (employeeID) {
        const employeeExists = context.employees.some(emp => emp.employeeID === employeeID);
        if (!employeeExists) {
            errors.employeeID = `Employee with ID '${employeeID}' does not exist`;
        }
    }

    // Validate overtime type exists in hrSettings
    const overtimeType = row.overtimeType;
    if (overtimeType && context.hrSettings?.overtimeTypes) {
        const overtimeTypeExists = context.hrSettings.overtimeTypes.some(
            (ot: any) => ot.overtimeType === overtimeType,
        );
        if (!overtimeTypeExists) {
            errors.overtimeType = `Overtime type '${overtimeType}' does not exist in HR settings`;
        }
    }

    // Validate time formats (should be in 12-hour format like "05:00 PM")
    const startTime = row.overtimeStartTime;
    if (startTime) {
        if (!isValidTimeFormat(startTime)) {
            errors.overtimeStartTime = `Start time must be in 12-hour format (e.g., "05:00 PM")`;
        }
    }

    const endTime = row.overtimeEndTime;
    if (endTime) {
        if (!isValidTimeFormat(endTime)) {
            errors.overtimeEndTime = `End time must be in 12-hour format (e.g., "09:00 PM")`;
        }
    }

    // Validate that end time is after start time (basic check)
    if (startTime && endTime && isValidTimeFormat(startTime) && isValidTimeFormat(endTime)) {
        if (!isEndTimeAfterStartTime(startTime, endTime)) {
            errors.overtimeEndTime = `End time must be after start time`;
        }
    }

    return errors;
}

/**
 * Validates if a time string is in valid 12-hour format (HH:MM AM/PM)
 */
function isValidTimeFormat(timeString: string): boolean {
    const timeRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9]\s+(AM|PM|am|pm)$/;
    return timeRegex.test(timeString.trim());
}

/**
 * Checks if end time is after start time
 */
function isEndTimeAfterStartTime(startTime: string, endTime: string): boolean {
    try {
        const start = new Date(`2000-01-01 ${startTime}`);
        const end = new Date(`2000-01-01 ${endTime}`);

        // Handle overnight shifts (end time is next day)
        if (end <= start) {
            end.setDate(end.getDate() + 1);
        }

        return end > start;
    } catch (error) {
        // If parsing fails, allow it (will be caught by time format validation)
        return true;
    }
}
