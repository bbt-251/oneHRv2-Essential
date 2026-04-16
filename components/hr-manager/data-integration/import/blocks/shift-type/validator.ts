import { HrSettingsByType } from "@/context/firestore-context";
import {
    ValidationContext,
    ValidationResult,
    validateMandatoryFields,
    validateOptionalFields,
    validateFieldTypes,
    generateErrorMessage,
} from "../shared/validation-engine";
import { validateWorkingDaysString, VALID_ACTIVE_VALUES } from "./fields";

/**
 * Shift Type-specific validation logic
 * This handles validation rules specific to shift type import data
 */

/**
 * Validates CSV data for shift type import
 * @param csvData - Parsed CSV data as array of objects
 * @param context - Validation context containing hrSettings and field definitions
 * @returns ValidationResult with validation status and errors
 */
export async function validateShiftTypeData(
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

        // Step 4: Shift type-specific business logic validation
        const shiftTypeSpecificErrors = await validateShiftTypeSpecificFields(row, context);
        if (Object.keys(shiftTypeSpecificErrors).length > 0) {
            Object.assign(fieldErrors, shiftTypeSpecificErrors);
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
 * Validates shift type-specific business logic fields
 */
async function validateShiftTypeSpecificFields(
    row: Record<string, any>,
    context: ValidationContext,
): Promise<Record<string, string>> {
    const errors: Record<string, string> = {};

    // Check for shift type name uniqueness
    const shiftTypeName = row.name;
    if (shiftTypeName && context.hrSettings?.shiftTypes) {
        const existingShiftType = context.hrSettings.shiftTypes.find(
            (st: any) => st.name.toLowerCase() === shiftTypeName.toLowerCase(),
        );
        if (existingShiftType) {
            errors.name = `Shift type with name '${shiftTypeName}' already exists`;
        }
    }

    // Validate working days string format
    const workingDays = row.workingDays;
    if (workingDays) {
        const workingDaysValidation = validateWorkingDaysString(workingDays);
        if (!workingDaysValidation.isValid) {
            errors.workingDays = workingDaysValidation.error || "Invalid working days format";
        } else {
            // Ensure working days match the structure expected
            // Store the parsed days for later processing
            row._parsedWorkingDays = workingDaysValidation.days;
        }
    }

    // Validate date range (only if both dates are provided)
    const startDate = row.startDate;
    const endDate = row.endDate;

    if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (start >= end) {
            errors.endDate = "End date must be after start date";
        }
    } else if (startDate && !endDate) {
        errors.endDate = "End date is required when start date is provided";
    } else if (!startDate && endDate) {
        errors.startDate = "Start date is required when end date is provided";
    }

    // Validate active field
    const active = row.active;
    if (active && !VALID_ACTIVE_VALUES.includes(active)) {
        errors.active = `Active must be one of: ${VALID_ACTIVE_VALUES.join(", ")}`;
    }

    // Validate global shift hour if provided
    const globalShiftHour = row.globalShiftHour;
    if (globalShiftHour && context.hrSettings?.shiftHours) {
        const shiftHourExists = context.hrSettings.shiftHours.some(
            (sh: any) => sh.name === globalShiftHour,
        );
        if (!shiftHourExists) {
            errors.globalShiftHour = `Shift hour '${globalShiftHour}' does not exist in HR settings`;
        }
    }

    // Validate individual day shift hours
    const dayShiftHourFields = [
        "mondayShiftHour",
        "tuesdayShiftHour",
        "wednesdayShiftHour",
        "thursdayShiftHour",
        "fridayShiftHour",
        "saturdayShiftHour",
        "sundayShiftHour",
    ];

    if (context.hrSettings?.shiftHours) {
        for (const field of dayShiftHourFields) {
            const shiftHourValue = row[field];
            if (shiftHourValue) {
                const shiftHourExists = context.hrSettings.shiftHours.some(
                    (sh: any) => sh.name === shiftHourValue,
                );
                if (!shiftHourExists) {
                    errors[field] = `Shift hour '${shiftHourValue}' does not exist in HR settings`;
                }
            }
        }
    }

    // Validate that at least one shift hour is provided (either global or per day)
    const hasGlobalShiftHour = globalShiftHour && globalShiftHour.trim() !== "";
    const hasDayShiftHours = dayShiftHourFields.some(
        field => row[field] && row[field].trim() !== "",
    );

    if (!hasGlobalShiftHour && !hasDayShiftHours) {
        errors.globalShiftHour =
            "At least one shift hour must be provided (either global or per day)";
    }

    return errors;
}
