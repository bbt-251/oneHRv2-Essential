import { ImportField } from "../shared/validation-engine";

/**
 * Level Of Education import field definitions
 * Contains fields for creating or updating levels of education
 */
export const LEVEL_OF_EDUCATION_FIELDS: ImportField[] = [
    { key: "name", label: "Name", required: true, type: "text" },
    { key: "active", label: "Active", required: true, type: "text" },
];

/**
 * Gets field definitions for level of education import type
 */
export function getLevelOfEducationFields(): ImportField[] {
    return LEVEL_OF_EDUCATION_FIELDS;
}
