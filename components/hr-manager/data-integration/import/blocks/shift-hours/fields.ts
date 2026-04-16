import { ImportField } from "../shared/validation-engine";

/**
 * Shift Hours import field definitions
 */
export const SHIFT_HOURS_FIELDS: ImportField[] = [
    // Required fields for creation
    {
        key: "name",
        label: "Name",
        required: true,
        type: "text",
    },
    {
        key: "active",
        label: "Active",
        required: true,
        type: "text",
    },
    // Shift hour divisions - at least one required, up to 10 supported
    {
        key: "shiftHourDivision-1",
        label: "Shift Hour Division 1",
        required: true,
        type: "text",
    },
    {
        key: "shiftHourDivision-2",
        label: "Shift Hour Division 2",
        required: false,
        type: "text",
    },
    {
        key: "shiftHourDivision-3",
        label: "Shift Hour Division 3",
        required: false,
        type: "text",
    },
    {
        key: "shiftHourDivision-4",
        label: "Shift Hour Division 4",
        required: false,
        type: "text",
    },
    {
        key: "shiftHourDivision-5",
        label: "Shift Hour Division 5",
        required: false,
        type: "text",
    },
    {
        key: "shiftHourDivision-6",
        label: "Shift Hour Division 6",
        required: false,
        type: "text",
    },
    {
        key: "shiftHourDivision-7",
        label: "Shift Hour Division 7",
        required: false,
        type: "text",
    },
    {
        key: "shiftHourDivision-8",
        label: "Shift Hour Division 8",
        required: false,
        type: "text",
    },
    {
        key: "shiftHourDivision-9",
        label: "Shift Hour Division 9",
        required: false,
        type: "text",
    },
    {
        key: "shiftHourDivision-10",
        label: "Shift Hour Division 10",
        required: false,
        type: "text",
    },
];

/**
 * Gets field definitions for shift hours import
 */
export function getShiftHoursFields(): ImportField[] {
    return SHIFT_HOURS_FIELDS;
}
