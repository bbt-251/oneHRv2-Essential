import { ImportField } from "../shared/validation-engine";

/**
 * Leave Types import field definitions
 * Contains fields for creating or updating leave types
 */
export const LEAVE_TYPES_FIELDS: ImportField[] = [
    { key: "name", label: "Name", required: true, type: "text" },
    { key: "authorizedDays", label: "Authorized Days", required: true, type: "number" },
    { key: "acronym", label: "Acronym", required: true, type: "text" },
    { key: "active", label: "Active", required: true, type: "text" },
];

/**
 * Gets field definitions for leave types import type
 */
export function getLeaveTypesFields(): ImportField[] {
    return LEAVE_TYPES_FIELDS;
}
