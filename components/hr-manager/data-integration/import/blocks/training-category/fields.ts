import { ImportField } from "../shared/validation-engine";

/**
 * Training Category import field definitions
 * Contains fields for creating or updating training categories
 */
export const TRAINING_CATEGORY_FIELDS: ImportField[] = [
    { key: "name", label: "Name", required: true, type: "text" },
    { key: "active", label: "Active", required: true, type: "text" },
];

/**
 * Gets field definitions for training category import type
 */
export function getTrainingCategoryFields(): ImportField[] {
    return TRAINING_CATEGORY_FIELDS;
}
