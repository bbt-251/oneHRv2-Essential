import { ImportField } from "../shared/validation-engine";

/**
 * Department Settings import field definitions
 * Contains fields for creating or updating department settings
 */
export const DEPARTMENT_SETTINGS_FIELDS: ImportField[] = [
    { key: "name", label: "Name", required: true, type: "text" },
    { key: "code", label: "Code", required: true, type: "text" },
    { key: "active", label: "Active", required: true, type: "text" },
    { key: "location", label: "Location", required: false, type: "text" },
    { key: "manager", label: "Manager", required: false, type: "text" },
];

/**
 * Gets field definitions for department settings import type
 */
export function getDepartmentSettingsFields(): ImportField[] {
    return DEPARTMENT_SETTINGS_FIELDS;
}
