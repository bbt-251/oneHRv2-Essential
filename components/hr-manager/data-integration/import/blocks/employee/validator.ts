import { EmployeeModel } from "@/lib/models/employee";
import { HrSettingsByType } from "@/context/firestore-context";
import {
    ValidationContext,
    ValidationResult,
    validateMandatoryFields,
    validateOptionalFields,
    validateFieldTypes,
    validateReferenceField,
    generateErrorMessage,
} from "../shared/validation-engine";

/**
 * Employee-specific validation logic
 * This handles validation rules specific to employee import data
 */

/**
 * Validates CSV data for employee import
 * @param csvData - Parsed CSV data as array of objects
 * @param context - Validation context containing employees data and field definitions
 * @returns ValidationResult with validation status and errors
 */
export async function validateEmployeeData(
    csvData: Record<string, any>[],
    context: ValidationContext,
): Promise<ValidationResult> {
    const errors: ValidationResult["errors"] = [];
    const validRows: Record<string, any>[] = [];

    for (let i = 0; i < csvData.length; i++) {
        const row = csvData[i];
        const rowNumber = i + 1; // 1-based row numbering for user display
        const fieldErrors: Record<string, string> = {};
        let hasErrors = false;

        // Step 1: Determine if this is a create or update operation
        const employeeID = row.employeeID;
        const isUpdate = employeeID
            ? context.employees.some(emp => emp.employeeID === employeeID)
            : false;

        // Step 2: Check mandatory fields (requirements differ for create vs update)
        const mandatoryFieldErrors = validateMandatoryFields(row, context.fields, isUpdate);
        if (Object.keys(mandatoryFieldErrors).length > 0) {
            Object.assign(fieldErrors, mandatoryFieldErrors);
            hasErrors = true;
        }

        // Step 2: Check optional fields (if present, they must be valid)
        const optionalFieldErrors = validateOptionalFields(row, context.fields);
        if (Object.keys(optionalFieldErrors).length > 0) {
            Object.assign(fieldErrors, optionalFieldErrors);
            hasErrors = true;
        }

        // Step 3: Type validation
        const typeValidationErrors = validateFieldTypes(row, context.fields);
        if (Object.keys(typeValidationErrors).length > 0) {
            Object.assign(fieldErrors, typeValidationErrors);
            hasErrors = true;
        }

        // Step 4: Employee-specific reference field validation
        const employeeReferenceErrors = await validateEmployeeReferenceFields(row, context);
        if (Object.keys(employeeReferenceErrors).length > 0) {
            Object.assign(fieldErrors, employeeReferenceErrors);
            hasErrors = true;
        }

        if (hasErrors) {
            errors.push({
                rowNumber,
                rowData: row,
                errorMessage: generateErrorMessage(fieldErrors),
                fieldErrors,
            });
        } else {
            validRows.push(row);
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
        validRows,
        totalRows: csvData.length,
        validRowsData: validRows,
    };
}

/**
 * Validates employee-specific reference fields
 */
async function validateEmployeeReferenceFields(
    row: Record<string, any>,
    context: ValidationContext,
): Promise<Record<string, string>> {
    const errors: Record<string, string> = {};

    if (!context.hrSettings) {
        return errors;
    }

    // For updates, we don't validate uniqueness since we're updating existing records
    // For creates, we validate uniqueness of employeeID, email, and phone
    const employeeID = row.employeeID;
    const isUpdate = employeeID
        ? context.employees.some(emp => emp.employeeID === employeeID)
        : false;

    if (!isUpdate) {
        // CREATE MODE: Validate uniqueness for new employees
        if (employeeID) {
            const employeeExists = context.employees.some(emp => emp.employeeID === employeeID);
            if (employeeExists) {
                errors.employeeID = `Employee with ID '${employeeID}' already exists`;
            }
        }

        // Validate unique company email
        const companyEmail = row.companyEmail;
        if (companyEmail) {
            const emailExists = context.employees.some(emp => emp.companyEmail === companyEmail);
            if (emailExists) {
                errors.companyEmail = `Employee with company email '${companyEmail}' already exists`;
            }
        }

        // Validate unique personal phone number
        const personalPhoneNumber = row.personalPhoneNumber;
        if (personalPhoneNumber) {
            const phoneExists = context.employees.some(
                emp => emp.personalPhoneNumber === personalPhoneNumber,
            );
            if (phoneExists) {
                errors.personalPhoneNumber = `Employee with phone number '${personalPhoneNumber}' already exists`;
            }
        }
    }

    // Validate gender
    const gender = row.gender;
    if (gender && !["male", "female"].includes(gender.toLowerCase())) {
        errors.gender = `Invalid gender '${gender}'. Must be 'Male' or 'Female'.`;
    }

    // Validate contract status
    const contractStatus = row.contractStatus;
    if (
        contractStatus &&
        !["active", "inactive", "terminated"].includes(contractStatus.toLowerCase())
    ) {
        errors.contractStatus = `Invalid contract status '${contractStatus}'. Must be 'Active', 'Inactive', or 'Terminated'.`;
    }

    // Validate role (supports semicolon-separated multiple roles)
    const roleString = row.role;
    if (roleString) {
        const roles = roleString.split(";").map((r: string) => r.trim());
        const validRoles = ["manager", "hr manager", "payroll officer"];
        const invalidRoles = roles.filter((r: string) => !validRoles.includes(r.toLowerCase()));
        if (invalidRoles.length > 0) {
            errors.role = `Invalid role(s): '${invalidRoles.join("; ")}'. Each role must be 'Manager', 'HR Manager', or 'Payroll Officer'.`;
        }
    }

    // Validate reporting line manager exists
    const reportingLineManager = row.reportingLineManager;
    if (reportingLineManager) {
        const managerExists = context.employees.some(
            emp => emp.employeeID === reportingLineManager,
        );
        if (!managerExists) {
            errors.reportingLineManager = `Reporting line manager '${reportingLineManager}' does not exist`;
        }
    }

    // Validate reference field values against hrSettings
    const referenceFields = [
        "employmentPosition",
        "gradeLevel",
        "shiftType",
        "contractType",
        "section",
        "workingLocation",
        "contractHour",
        "maritalStatus",
        "homeLocation",
        "reportingLineManagerPosition",
    ];

    for (const fieldKey of referenceFields) {
        const fieldValue = row[fieldKey];
        if (fieldValue) {
            const error = validateReferenceField(fieldValue, fieldKey, context.hrSettings);
            if (error) {
                errors[fieldKey] = error;
            }
        }
    }

    // Validate contract hour against hrSettings
    const contractHour = row.contractHour;
    if (contractHour && context.hrSettings.contractHours) {
        const contractHourValue = Number(contractHour);
        if (!isNaN(contractHourValue)) {
            const contractHours = context.hrSettings.contractHours || [];
            const validHour = contractHours.find((h: any) => h.hourPerWeek === contractHourValue);
            if (!validHour) {
                errors.contractHour = `Contract hour ${contractHourValue} does not exist`;
            }
        }
    }

    return errors;
}
