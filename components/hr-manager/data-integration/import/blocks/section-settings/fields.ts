import { ImportField } from "../shared/validation-engine";

/**
 * Section Settings import field definitions
 * Contains fields for creating or updating section settings
 */
export const SECTION_SETTINGS_FIELDS: ImportField[] = [
    { key: "name", label: "Name", required: true, type: "text" },
    { key: "code", label: "Code", required: true, type: "text" },
    { key: "active", label: "Active", required: true, type: "text" },
    { key: "department", label: "Department", required: false, type: "text" },
    { key: "supervisor", label: "Supervisor", required: false, type: "text" },
];

/**
 * Gets field definitions for section settings import type
 */
export function getSectionSettingsFields(): ImportField[] {
    return SECTION_SETTINGS_FIELDS;
}
