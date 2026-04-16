import { ImportField } from "../shared/validation-engine";

/**
 * Years Of Experience import field definitions
 * Contains fields for creating or updating years of experience
 */
export const YEARS_OF_EXPERIENCE_FIELDS: ImportField[] = [
    { key: "name", label: "Name", required: true, type: "text" },
    { key: "active", label: "Active", required: true, type: "text" },
];

/**
 * Gets field definitions for years of experience import type
 */
export function getYearsOfExperienceFields(): ImportField[] {
    return YEARS_OF_EXPERIENCE_FIELDS;
}
