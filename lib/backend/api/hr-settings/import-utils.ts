import { EmployeeModel, CustomField, CustomFieldSection } from "@/lib/models/employee";
import { HrSettingsByType } from "@/context/firestore-context";
import { getTimestamp, dateFormat } from "@/lib/util/dayjs_format";
import { employeeCollection } from "@/lib/backend/firebase/collections";
import { query, where, getDocs } from "firebase/firestore";
import dayjs from "dayjs";

/**
 * Import Utilities - Helper functions for import operations
 * Contains utility functions for CSV parsing, date formatting, and data conversion
 */
export class ImportUtils {
    /**
     * Validates if an employee exists by employeeID
     */
    static async employeeExists(employeeID: string): Promise<boolean> {
        try {
            const q = query(employeeCollection, where("employeeID", "==", employeeID));
            const querySnapshot = await getDocs(q);
            return !querySnapshot.empty;
        } catch (error) {
            console.error("Error checking employee existence:", error);
            return false;
        }
    }

    /**
     * Finds an employee by employeeID and returns the employee document
     */
    static async findEmployeeByEmployeeID(employeeID: string): Promise<EmployeeModel | null> {
        try {
            const q = query(employeeCollection, where("employeeID", "==", employeeID));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                const doc = querySnapshot.docs[0];
                return {
                    id: doc.id,
                    ...doc.data(),
                } as EmployeeModel;
            }
            return null;
        } catch (error) {
            console.error("Error finding employee by employeeID:", error);
            return null;
        }
    }

    /**
     * Finds an employee by employeeID and returns just the UID
     */
    static async findEmployeeUidByEmployeeID(employeeID: string): Promise<string | null> {
        const employee = await this.findEmployeeByEmployeeID(employeeID);
        return employee ? employee.uid : null;
    }

    /**
     * Gets all employees for validation purposes
     */
    static async getAllEmployees(): Promise<EmployeeModel[]> {
        try {
            const querySnapshot = await getDocs(employeeCollection);
            return querySnapshot.docs.map(
                doc =>
                    ({
                        id: doc.id,
                        ...doc.data(),
                    }) as EmployeeModel,
            );
        } catch (error) {
            console.error("Error fetching employees:", error);
            throw new Error("Failed to fetch employees");
        }
    }

    /**
     * Converts reference field names to IDs for proper database storage
     */
    static convertReferenceFieldsToIds(
        employee: Partial<EmployeeModel>,
        hrSettings?: HrSettingsByType,
    ): Promise<Partial<EmployeeModel>> {
        const result: Partial<EmployeeModel> = {};

        if (!hrSettings) return Promise.resolve(result);

        // Employment position conversion
        if (employee.employmentPosition) {
            const positions = hrSettings.positions || [];
            const position = positions.find((p: any) => p.name === employee.employmentPosition);
            if (position) {
                result.employmentPosition = position.id;
            }
        }

        // Grade level conversion
        if (employee.gradeLevel) {
            const grades = hrSettings.grades || [];
            const grade = grades.find((g: any) => g.name === employee.gradeLevel);
            if (grade) {
                result.gradeLevel = grade.id;
            }
        }

        // Shift type conversion
        if (employee.shiftType) {
            const shifts = hrSettings.shiftTypes || [];
            const shift = shifts.find((s: any) => s.name === employee.shiftType);
            if (shift) {
                result.shiftType = shift.id;
            }
        }

        // Contract type conversion
        if (employee.contractType) {
            const contractTypes = hrSettings.contractTypes || [];
            const contractType = contractTypes.find((ct: any) => ct.name === employee.contractType);
            if (contractType) {
                result.contractType = contractType.id;
            }
        }

        // Section conversion (and auto-set department)
        if (employee.section) {
            const sections = hrSettings?.sectionSettings || [];
            const section = sections.find((s: any) => s.name === employee.section);
            if (section) {
                result.section = section.id;
                // Auto-set department from section
                if (section.department) {
                    // If section has department as object reference
                    result.department = section.department;
                }
            }
        }

        // Working location conversion
        if (employee.workingLocation) {
            const locations = hrSettings.locations || [];
            const location = locations.find((l: any) => l.name === employee.workingLocation);
            if (location) {
                result.workingLocation = location.id;
            }
        }

        return Promise.resolve(result);
    }

    /**
     * Formats date string to the system's expected dayjs format
     * @param dateString - Date string in YYYY-MM-DD or other valid format
     * @returns Formatted date string in "MMMM DD, YYYY" format or empty string if invalid
     */
    static formatDateForStorage(dateString: string): string {
        if (!dateString || dateString.trim() === "") {
            return "";
        }

        try {
            const date = dayjs(dateString);
            if (!date.isValid()) {
                return "";
            }
            return date.format(dateFormat);
        } catch (error) {
            console.warn("Invalid date format:", dateString, error);
            return "";
        }
    }

    /**
     * Formats all date fields in an employee record for proper storage
     * @param employee - Raw employee data from CSV
     * @returns Employee data with properly formatted dates
     */
    static formatEmployeeDates(employee: Partial<EmployeeModel>): Partial<EmployeeModel> {
        const formattedEmployee = { ...employee };

        // Format main employee date fields
        if (formattedEmployee.birthDate) {
            formattedEmployee.birthDate = this.formatDateForStorage(formattedEmployee.birthDate);
        }

        if (formattedEmployee.contractStartingDate) {
            formattedEmployee.contractStartingDate = this.formatDateForStorage(
                formattedEmployee.contractStartingDate,
            );
        }

        if (formattedEmployee.contractTerminationDate) {
            formattedEmployee.contractTerminationDate = this.formatDateForStorage(
                formattedEmployee.contractTerminationDate,
            );
        }

        if (formattedEmployee.hireDate) {
            formattedEmployee.hireDate = this.formatDateForStorage(formattedEmployee.hireDate);
        }

        if (formattedEmployee.probationPeriodEndDate) {
            formattedEmployee.probationPeriodEndDate = this.formatDateForStorage(
                formattedEmployee.probationPeriodEndDate,
            );
        }

        if (formattedEmployee.lastDateOfProbation) {
            formattedEmployee.lastDateOfProbation = this.formatDateForStorage(
                formattedEmployee.lastDateOfProbation,
            );
        }

        if (formattedEmployee.lastELDUpdate) {
            formattedEmployee.lastELDUpdate = this.formatDateForStorage(
                formattedEmployee.lastELDUpdate,
            );
        }

        // Set current timestamp for lastChanged (as this is when the record was saved)
        formattedEmployee.lastChanged = this.formatDateForStorage(
            new Date().toISOString().split("T")[0],
        );

        return formattedEmployee;
    }

    /**
     * Parses CSV content to array of objects
     * @param csvContent - The CSV file content as string
     * @param headerMapping - Optional mapping from CSV header to desired key name
     */
    static parseCSV(
        csvContent: string,
        headerMapping?: Record<string, string>,
    ): Record<string, any>[] {
        const lines = csvContent.split("\n").filter(line => line.trim() !== "");
        if (lines.length < 2) {
            throw new Error("CSV must contain at least a header row and one data row");
        }

        const headers = lines[0].split(",").map(header => header.trim().replace(/"/g, ""));
        const data: Record<string, any>[] = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(",").map(value => value.trim().replace(/"/g, ""));
            const row: Record<string, any> = {};

            headers.forEach((header, index) => {
                // Use header mapping if provided, otherwise use the header as-is
                const key = headerMapping?.[header] || header;
                row[key] = values[index] || "";
            });

            data.push(row);
        }

        return data;
    }

    /**
     * Known employee fields for import validation
     * These fields are recognized and won't be treated as custom fields
     */
    static KNOWN_EMPLOYEE_FIELDS = [
        "employeeID",
        "firstName",
        "middleName",
        "surname",
        "birthDate",
        "birthPlace",
        "levelOfEducation",
        "yearsOfExperience",
        "gender",
        "maritalStatus",
        "personalPhoneNumber",
        "personalEmail",
        "companyEmail",
        "telegramChatID",
        "bankAccount",
        "providentFundAccount",
        "hourlyWage",
        "tinNumber",
        "passportNumber",
        "nationalIDNumber",
        "password",
        "signature",
        "profilePicture",
        "company",
        "contractType",
        "contractHour",
        "hoursPerWeek",
        "contractStatus",
        "contractStartingDate",
        "contractTerminationDate",
        "contractDuration",
        "hireDate",
        "contractDocument",
        "probationPeriodEndDate",
        "lastDateOfProbation",
        "reasonOfLeaving",
        "salary",
        "currency",
        "eligibleLeaveDays",
        "companyPhoneNumber",
        "associatedTax",
        "pensionApplication",
        "employmentPosition",
        "positionLevel",
        "section",
        "department",
        "workingLocation",
        "workingArea",
        "homeLocation",
        "managerPosition",
        "reportees",
        "reportingLineManagerPosition",
        "reportingLineManager",
        "gradeLevel",
        "step",
        "shiftType",
        "role",
        "performanceScore",
        "unit",
        "emergencyContactName",
        "relationshipToEmployee",
        "phoneNumber1",
        "phoneNumber2",
        "emailAddress1",
        "emailAddress2",
        "physicalAddress1",
        "physicalAddress2",
        "starredTrainingMaterials",
        "trainingMaterialsProgress",
        "trainingMaterialStatus",
        "certificationsAcquired",
        "announcements",
        "notifications",
        "checklistItems",
        "checklistItemRemark",
        "performance",
        "claimedOvertimes",
        "timezone",
        "promotionInterviews",
        "promotionInterviewResults",
        "balanceLeaveDays",
        "accrualLeaveDays",
        "lastELDUpdate",
        "documentRequests",
        "associatedRestrictedDocuments",
        "signedDocuments",
        // Legacy custom fields (for backward compatibility)
        "customFields-1",
        "customFields-2",
        "customFields-3",
        "customFields-4",
    ];

    /**
     * Section mapping prefixes for custom fields
     * Columns starting with these prefixes will be mapped to the corresponding section
     */
    static SECTION_PREFIXES: Record<CustomFieldSection, string[]> = {
        employee: ["employee_", "emp_", "personal_"],
        position: ["position_", "pos_", "job_"],
        contract: ["contract_", "con_", "employment_"],
        emergency: ["emergency_", "emer_", "contact_"],
    };

    /**
     * Detects unknown columns from import data that are not in the known fields list
     * @param headers - Array of column headers from the CSV
     * @returns Array of unknown column names
     */
    static detectUnknownColumns(headers: string[]): string[] {
        return headers.filter(
            header =>
                !this.KNOWN_EMPLOYEE_FIELDS.includes(header.toLowerCase()) &&
                !this.KNOWN_EMPLOYEE_FIELDS.includes(header),
        );
    }

    /**
     * Determines which section a custom field belongs to based on its name
     * @param fieldName - The name of the field
     * @returns The section the field belongs to, or null if not determinable
     */
    static getCustomFieldSection(fieldName: string): CustomFieldSection | null {
        const lowerFieldName = fieldName.toLowerCase();

        for (const [section, prefixes] of Object.entries(this.SECTION_PREFIXES)) {
            for (const prefix of prefixes) {
                if (lowerFieldName.startsWith(prefix)) {
                    return section as CustomFieldSection;
                }
            }
        }

        // If no prefix matches, return null - user needs to specify
        return null;
    }

    /**
     * Extracts custom fields from import data
     * Maps unknown columns to custom fields based on section prefixes or default section
     * @param employeeData - The employee data from import
     * @param unknownColumns - List of columns identified as unknown/custom
     * @param defaultSection - Section to use for fields without clear prefix
     * @returns Array of custom fields extracted from the data
     */
    static extractCustomFields(
        employeeData: Record<string, any>,
        unknownColumns: string[],
        defaultSection: CustomFieldSection = "employee",
    ): CustomField[] {
        const customFields: CustomField[] = [];

        for (const column of unknownColumns) {
            const value = employeeData[column];

            // Skip empty values
            if (value === undefined || value === null || value === "") {
                continue;
            }

            // Determine the section
            let section = this.getCustomFieldSection(column);
            if (!section) {
                section = defaultSection;
            }

            // Create a clean field name by removing the prefix
            let fieldLabel = column;
            for (const prefix of Object.values(this.SECTION_PREFIXES).flat()) {
                if (column.toLowerCase().startsWith(prefix.toLowerCase())) {
                    fieldLabel = column.substring(prefix.length);
                    break;
                }
            }

            // Convert field label to title case for display
            fieldLabel = fieldLabel.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());

            customFields.push({
                id: this.generateCustomFieldId(),
                section,
                label: fieldLabel,
                value: String(value),
                type: "text", // Default type for imported fields
            });
        }

        return customFields;
    }

    /**
     * Generates a unique ID for a custom field
     */
    private static generateCustomFieldId(): string {
        return `cf_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }

    /**
     * Converts legacy custom fields (customFields-1, customFields-2, etc.) to the new format
     * @param legacyFields - Object containing legacy custom field arrays
     * @returns Unified customFields array
     */
    static convertLegacyCustomFields(legacyFields: {
        "customFields-1"?: { id: string; field: string; value: string }[];
        "customFields-2"?: { id: string; field: string; value: string }[];
        "customFields-3"?: { id: string; field: string; value: string }[];
        "customFields-4"?: { id: string; field: string; value: string }[];
    }): CustomField[] {
        const sectionMapping: Record<keyof typeof legacyFields, CustomFieldSection> = {
            "customFields-1": "employee",
            "customFields-2": "position",
            "customFields-3": "contract",
            "customFields-4": "emergency",
        };

        const customFields: CustomField[] = [];

        for (const [key, fields] of Object.entries(legacyFields)) {
            if (fields && Array.isArray(fields)) {
                const section = sectionMapping[key as keyof typeof sectionMapping];
                for (const field of fields) {
                    customFields.push({
                        id: field.id || this.generateCustomFieldId(),
                        section,
                        label: field.field,
                        value: field.value,
                        type: "text", // Default type for legacy fields
                    });
                }
            }
        }

        return customFields;
    }
}
