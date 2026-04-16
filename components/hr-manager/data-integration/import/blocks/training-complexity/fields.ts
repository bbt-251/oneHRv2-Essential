import { ImportField } from "../shared/validation-engine";

/**
 * Training Complexity import field definitions
 * Contains fields for creating or updating training complexities
 */
export const TRAINING_COMPLEXITY_FIELDS: ImportField[] = [
    { key: "name", label: "Name", required: true, type: "text" },
    { key: "active", label: "Active", required: true, type: "text" },
];

/**
 * Gets field definitions for training complexity import type
 */
export function getTrainingComplexityFields(): ImportField[] {
    return TRAINING_COMPLEXITY_FIELDS;
}
