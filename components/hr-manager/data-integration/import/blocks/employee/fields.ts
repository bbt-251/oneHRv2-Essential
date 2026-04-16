import { ImportField } from "../shared/validation-engine";

/**
 * Employee import field definitions
 * Contains all mandatory and optional fields for employee data import
 */
export const EMPLOYEE_FIELDS: ImportField[] = [
    // Personal Information - Required for creates, optional for updates
    { key: "firstName", label: "First Name", required: "create-only", type: "text" },
    { key: "surname", label: "Surname", required: "create-only", type: "text" },
    { key: "employeeID", label: "Employee ID", required: true, type: "text" }, // Required for both creates (uniqueness) and updates (identification)
    {
        key: "personalPhoneNumber",
        label: "Personal Phone Number",
        required: "create-only",
        type: "text",
    },
    { key: "companyEmail", label: "Company Email", required: "create-only", type: "email" },
    { key: "gender", label: "Gender", required: "create-only", type: "select" },
    { key: "birthDate", label: "Birth Date", required: "create-only", type: "date" },

    // Contract Information - Required for creates, optional for updates
    {
        key: "employmentPosition",
        label: "Employment Position",
        required: "create-only",
        type: "text",
    },
    { key: "gradeLevel", label: "Grade Level", required: "create-only", type: "text" },
    { key: "shiftType", label: "Shift Type", required: "create-only", type: "text" },
    { key: "contractHour", label: "Contract Hour", required: "create-only", type: "number" },
    { key: "contractStatus", label: "Contract Status", required: "create-only", type: "text" },
    {
        key: "contractStartingDate",
        label: "Contract Starting Date",
        required: "create-only",
        type: "date",
    },
    { key: "salary", label: "Salary", required: "create-only", type: "number" },
    { key: "currency", label: "Currency", required: "create-only", type: "text" },
    {
        key: "eligibleLeaveDays",
        label: "Eligible Leave Days",
        required: "create-only",
        type: "number",
    },

    // Emergency Contact - Required for creates, optional for updates
    {
        key: "emergencyContactName",
        label: "Emergency Contact Name",
        required: "create-only",
        type: "text",
    },
    {
        key: "relationshipToEmployee",
        label: "Relationship to Employee",
        required: "create-only",
        type: "text",
    },
    { key: "phoneNumber1", label: "Emergency Phone Number", required: "create-only", type: "text" },
    {
        key: "emailAddress1",
        label: "Emergency Email Address",
        required: "create-only",
        type: "email",
    },
    {
        key: "physicalAddress1",
        label: "Emergency Physical Address",
        required: "create-only",
        type: "text",
    },

    // Personal Information - Optional
    { key: "middleName", label: "Middle Name", required: false, type: "text" },
    { key: "birthPlace", label: "Birth Place", required: false, type: "text" },
    { key: "levelOfEducation", label: "Level of Education", required: false, type: "select" },
    { key: "yearsOfExperience", label: "Years of Experience", required: false, type: "number" },
    { key: "maritalStatus", label: "Marital Status", required: false, type: "select" },
    { key: "homeLocation", label: "Home Location", required: false, type: "text" },
    { key: "reportingLineManager", label: "Reporting Line Manager", required: false, type: "text" },
    {
        key: "reportingLineManagerPosition",
        label: "Reporting Line Manager Position",
        required: false,
        type: "text",
    },
    { key: "role", label: "Role", required: false, type: "text" },

    // Financial Information - Optional
    { key: "bankAccount", label: "Bank Account", required: false, type: "text" },
    { key: "providentFundAccount", label: "Provident Fund Account", required: false, type: "text" },
    { key: "tinNumber", label: "TIN Number", required: false, type: "text" },

    // Documents - Optional
    { key: "passportNumber", label: "Passport Number", required: false, type: "text" },
    { key: "nationalIDNumber", label: "National ID Number", required: false, type: "text" },

    // Company Information - Optional
    { key: "company", label: "Company", required: false, type: "text" },
    { key: "contractType", label: "Contract Type", required: false, type: "text" },
    { key: "section", label: "Section", required: false, type: "text" },
    { key: "workingLocation", label: "Working Location", required: false, type: "text" },

    // Emergency Contact - Additional - Optional
    { key: "phoneNumber2", label: "Emergency Phone Number 2", required: false, type: "text" },
    { key: "emailAddress2", label: "Emergency Email Address 2", required: false, type: "email" },
    {
        key: "physicalAddress2",
        label: "Emergency Physical Address 2",
        required: false,
        type: "text",
    },
];

/**
 * Gets field definitions for employee import type
 */
export function getEmployeeFields(): ImportField[] {
    return EMPLOYEE_FIELDS;
}
