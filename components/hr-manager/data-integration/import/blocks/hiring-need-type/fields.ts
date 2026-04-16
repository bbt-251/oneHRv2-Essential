import { ImportField } from "../shared/validation-engine";

/**
 * Hiring Need Type import field definitions
 * Contains fields for creating or updating hiring need types
 */
export const HIRING_NEED_TYPE_FIELDS: ImportField[] = [
    { key: "name", label: "Name", required: true, type: "text" },
    { key: "active", label: "Active", required: true, type: "text" },
];

/**
 * Gets field definitions for hiring need type import type
 */
export function getHiringNeedTypeFields(): ImportField[] {
    return HIRING_NEED_TYPE_FIELDS;
}
