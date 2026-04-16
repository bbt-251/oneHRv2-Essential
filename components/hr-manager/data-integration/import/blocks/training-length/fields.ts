import { ImportField } from "../shared/validation-engine";

/**
 * Training Length import field definitions
 * Contains fields for creating or updating training lengths
 */
export const TRAINING_LENGTH_FIELDS: ImportField[] = [
    { key: "name", label: "Name", required: true, type: "text" },
    { key: "active", label: "Active", required: true, type: "text" },
];

/**
 * Gets field definitions for training length import type
 */
export function getTrainingLengthFields(): ImportField[] {
    return TRAINING_LENGTH_FIELDS;
}
