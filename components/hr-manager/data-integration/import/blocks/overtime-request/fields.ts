import { ImportField } from "../shared/validation-engine";

/**
 * Overtime Request import field definitions
 * Contains all fields for overtime request data import
 */
export const OVERTIME_REQUEST_FIELDS: ImportField[] = [
    {
        key: "employeeID",
        label: "Employee ID",
        type: "text",
        required: true,
        // description: "Employee ID (will be converted to UID)"
    },
    {
        key: "overtimeDate",
        label: "Overtime Date",
        type: "date",
        required: true,
        // description: "Date of overtime work (YYYY-MM-DD)"
    },
    {
        key: "overtimeStartTime",
        label: "Start Time",
        type: "text",
        required: true,
        // description: "Start time (e.g., 05:00 PM)"
    },
    {
        key: "overtimeEndTime",
        label: "End Time",
        type: "text",
        required: true,
        // description: "End time (e.g., 09:00 PM)"
    },
    {
        key: "overtimeType",
        label: "Overtime Type",
        type: "text",
        required: true,
        // description: "Type of overtime (matches HR Settings overtime types)"
    },
    {
        key: "overtimeGoal",
        label: "Goal",
        type: "text",
        required: true,
        // description: "Purpose of overtime"
    },
    {
        key: "overtimeJustification",
        label: "Justification",
        type: "text",
        required: true,
        // description: "Justification for overtime"
    },
];

/**
 * Gets field definitions for overtime request import type
 */
export function getOvertimeRequestFields(): ImportField[] {
    return OVERTIME_REQUEST_FIELDS;
}
