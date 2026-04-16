import { HrSettingsByType } from "@/context/firestore-context";
import { EmployeeModel } from "@/lib/models/employee";

export interface ImportField {
    key: string;
    label: string;
    required: boolean | "create-only"; // "create-only" means required for new employees, optional for updates
    type: string;
}

export interface ValidationResult {
    isValid: boolean;
    errors: Array<{
        rowNumber: number;
        rowData: Record<string, any>;
        errorMessage: string;
        fieldErrors: Record<string, string>;
    }>;
    validRows: Record<string, any>[];
    totalRows: number;
    validRowsData: Record<string, any>[];
}

export interface ValidationContext {
    employees: EmployeeModel[]; // We'll type this properly later
    importType: string;
    fields: ImportField[];
    hrSettings?: HrSettingsByType;
}

/**
 * Common validation utilities for all import types
 */

/**
 * Validates mandatory fields are present and not empty
 */
export function validateMandatoryFields(
    row: Record<string, any>,
    fields: ImportField[],
    isUpdate: boolean = false,
): Record<string, string> {
    const errors: Record<string, string> = {};

    for (const field of fields) {
        // Determine if field is required based on operation type
        const isFieldRequired = isUpdate
            ? field.required === true // For updates, only truly required fields
            : field.required === true || field.required === "create-only"; // For creates, both required and create-only

        if (!isFieldRequired) continue;

        const value = row[field.key];
        if (value === undefined || value === null || String(value).trim() === "") {
            errors[field.key] = `${field.label} is required${isUpdate ? " for updates" : ""}`;
        }
    }

    return errors;
}

/**
 * Validates optional fields if they are present
 */
export function validateOptionalFields(
    row: Record<string, any>,
    fields: ImportField[],
): Record<string, string> {
    const errors: Record<string, string> = {};

    const optionalFields = fields.filter(field => !field.required);

    for (const optionalField of optionalFields) {
        const value = row[optionalField.key];
        // Only validate if the field is present and not empty
        if (value !== undefined && value !== null && String(value).trim() !== "") {
            const typeError = validateSingleFieldType(value, optionalField);
            if (typeError) {
                errors[optionalField.key] = typeError;
            }
        }
    }

    return errors;
}

/**
 * Validates field types for all fields
 */
export function validateFieldTypes(
    row: Record<string, any>,
    fields: ImportField[],
): Record<string, string> {
    const errors: Record<string, string> = {};

    for (const field of fields) {
        const value = row[field.key];
        if (value !== undefined && value !== null && String(value).trim() !== "") {
            const typeError = validateSingleFieldType(value, field);
            if (typeError) {
                errors[field.key] = typeError;
            }
        }
    }

    return errors;
}

/**
 * Validates a single field's type
 */
export function validateSingleFieldType(value: any, field: ImportField): string | null {
    const stringValue = String(value).trim();

    switch (field.type) {
        case "email":
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(stringValue)) {
                return `${field.label} must be a valid email address`;
            }
            break;

        case "number":
            if (isNaN(Number(stringValue)) || stringValue === "") {
                return `${field.label} must be a valid number`;
            }
            break;

        case "date":
            const date = new Date(stringValue);
            if (isNaN(date.getTime())) {
                return `${field.label} must be a valid date (YYYY-MM-DD format)`;
            }
            break;

        case "select":
            // For select fields, we could add specific validation based on allowed values
            // This would need to be extended based on specific requirements
            break;

        case "text":
        default:
            // Text fields are generally valid if they're strings
            break;
    }

    return null;
}

/**
 * Generates a human-readable error message from field errors
 */
export function generateErrorMessage(fieldErrors: Record<string, string>): string {
    const errorCount = Object.keys(fieldErrors).length;
    if (errorCount === 1) {
        return Object.values(fieldErrors)[0];
    }
    return `${errorCount} validation errors found`;
}

/**
 * Common reference field validation against HR settings
 */
export function validateReferenceField(
    value: string,
    fieldKey: string,
    hrSettings?: HrSettingsByType,
): string | null {
    if (!hrSettings) return null;

    switch (fieldKey) {
        case "employmentPosition":
            const positions = hrSettings.positions || [];
            const position = positions.find((p: any) => p.name === value);
            if (!position) {
                return `Employment position '${value}' does not exist`;
            }
            break;

        case "gradeLevel":
            const grades = hrSettings.grades || [];
            const grade = grades.find((g: any) => g.grade === value);
            if (!grade) {
                return `Grade level '${value}' does not exist`;
            }
            break;

        case "shiftType":
            const shifts = hrSettings.shiftTypes || [];
            const shift = shifts.find((s: any) => s.name === value);
            if (!shift) {
                return `Shift type '${value}' does not exist`;
            }
            break;

        case "contractType":
            const contractTypes = hrSettings.contractTypes || [];
            const contractType = contractTypes.find((ct: any) => ct.name === value);
            if (!contractType) {
                return `Contract type '${value}' does not exist`;
            }
            break;

        case "section":
            const sections = hrSettings.sectionSettings || [];
            const section = sections.find((s: any) => s.name === value);
            if (!section) {
                return `Section '${value}' does not exist`;
            }
            break;

        case "workingLocation":
            const locations = hrSettings.locations || [];
            const location = locations.find((l: any) => l.name === value);
            if (!location) {
                return `Working location '${value}' does not exist`;
            }
            break;
    }

    return null;
}
