import { ImportField } from "../shared/validation-engine";

/**
 * Shift Type import field definitions
 * Contains all mandatory and optional fields for shift type data import
 *
 * CSV Format Requirements:
 * - Working Days: Use semicolon (;) to separate days (e.g., "Monday;Tuesday;Wednesday")
 * - Dates: Optional fields. Leave empty for indefinite validity periods
 * - Global Shift Hour: Default shift hour for all working days (can be overridden by day-specific hours)
 * - Day-specific Shift Hours: Override global shift hour for specific days
 *
 * Example CSV:
 * Name,Working Days,Start Date,End Date,Active,Global Shift Hour,Monday Shift Hour
 * "Standard Week","Monday;Tuesday;Wednesday;Thursday;Friday",,"Yes","Morning Shift","Afternoon Shift"
 */
export const SHIFT_TYPE_FIELDS: ImportField[] = [
    // Basic Information - Required
    { key: "name", label: "Name", required: true, type: "text" },
    { key: "workingDays", label: "Working Days", required: true, type: "text" },
    { key: "startDate", label: "Start Date", required: false, type: "date" },
    { key: "endDate", label: "End Date", required: false, type: "date" },
    { key: "active", label: "Active", required: true, type: "select" },

    // Global Shift Hour (applies to all working days if specified)
    { key: "globalShiftHour", label: "Global Shift Hour", required: false, type: "text" },

    // Individual Day Shift Hours (optional - for day-specific assignments)
    { key: "mondayShiftHour", label: "Monday Shift Hour", required: false, type: "text" },
    { key: "tuesdayShiftHour", label: "Tuesday Shift Hour", required: false, type: "text" },
    { key: "wednesdayShiftHour", label: "Wednesday Shift Hour", required: false, type: "text" },
    { key: "thursdayShiftHour", label: "Thursday Shift Hour", required: false, type: "text" },
    { key: "fridayShiftHour", label: "Friday Shift Hour", required: false, type: "text" },
    { key: "saturdayShiftHour", label: "Saturday Shift Hour", required: false, type: "text" },
    { key: "sundayShiftHour", label: "Sunday Shift Hour", required: false, type: "text" },
];

/**
 * Valid days of the week
 */
export const VALID_DAYS_OF_WEEK = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
];

/**
 * Valid active values
 */
export const VALID_ACTIVE_VALUES = ["Yes", "No"];

/**
 * Gets field definitions for shift type import type
 */
export function getShiftTypeFields(): ImportField[] {
    return SHIFT_TYPE_FIELDS;
}

/**
 * Validates working days string
 */
export function validateWorkingDaysString(workingDays: string): {
    isValid: boolean;
    days: string[];
    error?: string;
} {
    if (!workingDays || !workingDays.trim()) {
        return {
            isValid: false,
            days: [],
            error: "Working days cannot be empty",
        };
    }

    const days = workingDays
        .split(";")
        .map(day => day.trim())
        .filter(day => day.length > 0);

    if (days.length === 0) {
        return {
            isValid: false,
            days: [],
            error: "At least one working day must be specified",
        };
    }

    // Check if all days are valid
    const invalidDays = days.filter(day => !VALID_DAYS_OF_WEEK.includes(day));
    if (invalidDays.length > 0) {
        return {
            isValid: false,
            days: [],
            error: `Invalid day(s): ${invalidDays.join(", ")}. Valid days are: ${VALID_DAYS_OF_WEEK.join(", ")}`,
        };
    }

    return {
        isValid: true,
        days,
    };
}
