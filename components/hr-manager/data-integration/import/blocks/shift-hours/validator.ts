import dayjs from "dayjs";
import {
    ValidationContext,
    ValidationResult,
    validateMandatoryFields,
    validateOptionalFields,
    validateFieldTypes,
    generateErrorMessage,
} from "../shared/validation-engine";

interface ShiftHourDivision {
    startTime: string;
    endTime: string;
}

/**
 * Validates CSV data for shift hours import
 */
export async function validateShiftHoursData(
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

        // Step 2: Check optional fields
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

        // Step 4: Shift hours-specific validation
        const shiftHoursErrors = await validateShiftHoursSpecificFields(row, context);
        if (Object.keys(shiftHoursErrors).length > 0) {
            Object.assign(fieldErrors, shiftHoursErrors);
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
 * Shift hours-specific validation logic
 */
async function validateShiftHoursSpecificFields(
    row: Record<string, any>,
    context: ValidationContext,
): Promise<Record<string, string>> {
    const errors: Record<string, string> = {};

    // Validate active field (case-insensitive Yes/No)
    const active = row.active;
    if (active !== undefined && active !== null) {
        const normalizedActive = String(active).trim().toLowerCase();
        if (normalizedActive !== "yes" && normalizedActive !== "no") {
            errors.active = "Active must be 'Yes' or 'No' (case insensitive)";
        }
    }

    // Parse and validate shift hour divisions
    const divisions: ShiftHourDivision[] = [];
    const divisionKeys = Object.keys(row).filter(key => key.startsWith("shiftHourDivision-"));

    for (const key of divisionKeys) {
        const value = row[key];
        if (value && String(value).trim() !== "") {
            const division = parseShiftHourDivision(String(value).trim(), key);
            if (division) {
                divisions.push(division);
            } else {
                errors[key] =
                    `Invalid time format in ${key}; expected format like '09:00 AM - 12:30 PM' or '09:00 - 12:30'`;
            }
        }
    }

    // Must have at least one division
    if (divisions.length === 0) {
        errors["shiftHourDivision-1"] = "At least one shift hour division is required";
    }

    // Validate business rules on divisions
    if (divisions.length > 0) {
        const divisionErrors = validateShiftHourDivisions(divisions);
        Object.assign(errors, divisionErrors);
    }

    // Check for duplicate names (upsert logic)
    const name = row.name;
    if (name && context.hrSettings?.shiftHours) {
        const existingShiftHour = context.hrSettings.shiftHours.find(sh => sh.name === name);
        if (existingShiftHour) {
            // This is an update - attach metadata for import logic
            row._existingId = existingShiftHour.id;
        }
    }

    return errors;
}

/**
 * Parse a single shift hour division string into ShiftHourDivision object
 */
function parseShiftHourDivision(value: string, fieldKey: string): ShiftHourDivision | null {
    // Split on dash, handle various dash characters
    const parts = value.split(/[-–—]/).map(p => p.trim());
    if (parts.length !== 2) {
        return null;
    }

    const startTimeStr = parts[0];
    const endTimeStr = parts[1];

    // Parse start time
    const startTime = parseTimeString(startTimeStr);
    if (!startTime) {
        return null;
    }

    // Parse end time
    const endTime = parseTimeString(endTimeStr);
    if (!endTime) {
        return null;
    }

    return {
        startTime,
        endTime,
    };
}

/**
 * Parse time string to "hh:mm A" format
 */
function parseTimeString(timeStr: string): string | null {
    const trimmed = timeStr.trim();

    // Try parsing as 12-hour format with AM/PM
    let parsed = dayjs(trimmed, "hh:mm A", true);
    if (parsed.isValid()) {
        return parsed.format("hh:mm A");
    }

    // Try parsing as 24-hour format
    parsed = dayjs(trimmed, "HH:mm", true);
    if (parsed.isValid()) {
        return parsed.format("hh:mm A");
    }

    // Try parsing as 12-hour without leading zero
    parsed = dayjs(trimmed, "h:mm A", true);
    if (parsed.isValid()) {
        return parsed.format("hh:mm A");
    }

    return null;
}

/**
 * Validate business rules for shift hour divisions
 */
function validateShiftHourDivisions(divisions: ShiftHourDivision[]): Record<string, string> {
    const errors: Record<string, string> = {};

    for (let i = 0; i < divisions.length; i++) {
        const division = divisions[i];
        const fieldKey = `shiftHourDivision-${i + 1}`;

        // Convert to minutes since midnight for comparison
        const startMinutes = timeToMinutes(division.startTime);
        const endMinutes = timeToMinutes(division.endTime);

        // Start time must be before end time (handle midnight-spanning shifts)
        let adjustedEndMinutes = endMinutes;
        if (endMinutes < startMinutes) {
            // End time is next day (midnight spanning)
            adjustedEndMinutes = endMinutes + 24 * 60; // Add 24 hours
        }

        if (startMinutes >= adjustedEndMinutes) {
            errors[fieldKey] = `Start time must be before end time in ${fieldKey}`;
        }

        // Check for overlaps with other divisions
        for (let j = 0; j < divisions.length; j++) {
            if (i !== j) {
                const otherDivision = divisions[j];
                const otherStart = timeToMinutes(otherDivision.startTime);
                const otherEnd = timeToMinutes(otherDivision.endTime);

                // Check if intervals overlap (handle midnight-spanning shifts)
                let adjustedEndMinutes = endMinutes;
                if (endMinutes < startMinutes) {
                    adjustedEndMinutes = endMinutes + 24 * 60;
                }

                let adjustedOtherEnd = otherEnd;
                if (otherEnd < otherStart) {
                    adjustedOtherEnd = otherEnd + 24 * 60;
                }

                if (startMinutes < adjustedOtherEnd && adjustedEndMinutes > otherStart) {
                    errors[fieldKey] =
                        `Shift hour division ${i + 1} overlaps with division ${j + 1}`;
                    break;
                }
            }
        }
    }

    return errors;
}

/**
 * Convert "hh:mm A" time string to minutes since midnight
 */
function timeToMinutes(timeStr: string): number {
    const parsed = dayjs(`2000-01-01 ${timeStr}`, "YYYY-MM-DD hh:mm A");
    return parsed.hour() * 60 + parsed.minute();
}
