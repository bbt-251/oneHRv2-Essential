import { HrSettingsByType } from "@/context/firestore-context";
import { employeeCollection } from "@/lib/backend/firebase/collections";
import calculateHourlyWage from "@/lib/backend/functions/payroll/calculateHourlyWage";
import {
    CustomField,
    CustomFieldSection,
    CustomFieldType,
    EmployeeModel,
} from "@/lib/models/employee";
import { getTimestamp } from "@/lib/util/dayjs_format";
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { ImportUtils } from "./import-utils";

function normalizeBoolean(val: unknown): boolean | undefined {
    const s = String(val ?? "")
        .trim()
        .toLowerCase();
    if (!s) return undefined;
    if (["true", "yes", "y", "1"].includes(s)) return true;
    if (["false", "no", "n", "0"].includes(s)) return false;
    return undefined;
}

function parseMultiSelect(val: unknown): string[] {
    if (val === undefined || val === null) return [];
    return String(val)
        .split(";")
        .map(v => v.trim())
        .filter(v => v.length > 0);
}

/**
 * Extract custom fields from row data where headers are section-prefixed:
 * employee_Field Label, position_Field Label, contract_Field Label, emergency_Field Label
 */
function extractCustomFieldsFromRow(
    row: Partial<EmployeeModel>,
): { label: string; value: any; section: CustomFieldSection }[] {
    const customFields: { label: string; value: any; section: CustomFieldSection }[] = [];
    const sectionPrefixes: Record<CustomFieldSection, string> = {
        employee: "employee_",
        position: "position_",
        contract: "contract_",
        emergency: "emergency_",
    };

    Object.entries(row as Record<string, any>).forEach(([key, rawValue]) => {
        const entry = Object.entries(sectionPrefixes).find(([, prefix]) => key.startsWith(prefix));
        if (!entry) return;
        const [section, prefix] = entry as [CustomFieldSection, string];
        const label = key.substring(prefix.length).trim();
        if (!label) return;

        // Attempt basic normalization
        const bool = normalizeBoolean(rawValue);
        const value = Array.isArray(rawValue)
            ? rawValue
            : bool !== undefined
                ? bool
                : String(rawValue).includes(";")
                    ? parseMultiSelect(rawValue)
                    : rawValue;

        customFields.push({ label, value, section });
    });

    return customFields;
}

/**
 * Merge custom fields into existing array by section+label, overwriting existing value when provided.
 */
function mergeCustomFields(
    existing: CustomField[] | undefined,
    incoming: { label: string; value: any; section: CustomFieldSection }[],
): CustomField[] {
    const result: CustomField[] = [...(existing || [])];
    for (const cf of incoming) {
        const idx = result.findIndex(r => r.section === cf.section && r.label === cf.label);

        // Determine the field type
        const jsType = typeof cf.value;
        let fieldType: CustomFieldType = "text";

        if (jsType === "number") {
            fieldType = "number";
        } else if (jsType === "object" && Array.isArray(cf.value)) {
            fieldType = "text";
        } else {
            const dateValue = cf.value instanceof Date ? cf.value : new Date(cf.value);
            if (!isNaN(dateValue.getTime()) && String(cf.value).match(/\d{4}-\d{2}-\d{2}/)) {
                fieldType = "date";
            } else {
                fieldType = "text";
            }
        }

        // Convert value to string
        const stringValue = Array.isArray(cf.value)
            ? JSON.stringify(cf.value)
            : String(cf.value ?? "");

        if (idx >= 0) {
            // Update existing field - preserve id and type if already set, otherwise set new ones
            result[idx] = {
                ...result[idx],
                value: stringValue,
                type: result[idx].type || fieldType,
            };
        } else {
            // Create new field with id and type
            result.push({
                id: Math.random().toString(36).substring(2, 15),
                section: cf.section,
                label: cf.label,
                value: stringValue,
                type: fieldType,
            });
        }
    }
    return result;
}

/**
 * Employee Import Service - Handles employee-specific import operations
 * Supports both creating new employees and updating existing ones
 */
export class EmployeeImportService {
    /**
     * Validates and returns a valid contract status
     */
    private static validateContractStatus(status: unknown): "active" | "inactive" | undefined {
        const normalizedStatus = String(status || "")
            .toLowerCase()
            .trim();
        if (normalizedStatus === "active" || normalizedStatus === "inactive") {
            return normalizedStatus;
        }
        return undefined; // or default to 'active' if needed: return 'active';
    }

    /**
     * Batch import employees (create or update)
     */
    static async batchImportEmployees(
        employees: Partial<EmployeeModel>[],
        hrSettings?: HrSettingsByType,
    ): Promise<{
        successful: number;
        failed: number;
        errors: string[];
        importedRecords: any[];
        created: number;
        updated: number;
    }> {
        const errors: string[] = [];
        const successfulRecords: any[] = [];
        let successful = 0;
        let failed = 0;
        let created = 0;
        let updated = 0;

        try {
            // Process employees one by one (not in batch) because each needs Firebase Auth creation
            for (let i = 0; i < employees.length; i++) {
                const employee = employees[i];

                try {
                    // Check if this is an update or create operation
                    const existingEmployee = await ImportUtils.findEmployeeByEmployeeID(
                        employee.employeeID || "",
                    );
                    const isUpdate = !!existingEmployee;

                    if (isUpdate) {
                        // UPDATE existing employee
                        await this.updateExistingEmployee(
                            existingEmployee.id,
                            employee,
                            hrSettings,
                        );
                        updated++;
                        console.log(`Updated employee: ${employee.employeeID}`);

                        // Track successful updates
                        successfulRecords.push({
                            rowData: employee,
                            employeeData: { id: existingEmployee.id, ...employee },
                            rowNumber: i + 2,
                            operation: "updated",
                        });
                        successful++;
                    } else {
                        // CREATE new employee
                        await this.createNewEmployee(employee, hrSettings, successfulRecords, i);
                        successful++;
                        created++;
                    }
                } catch (error) {
                    failed++;
                    errors.push(`Employee ${employee.employeeID}: ${error}`);
                }
            }

            return {
                successful,
                failed,
                errors,
                importedRecords: successfulRecords,
                created,
                updated,
            };
        } catch (error) {
            console.error("Error in batch import employees:", error);
            throw new Error("Failed to batch import employees");
        }
    }

    /**
     * Creates a new employee with Firebase Auth and Firestore records
     */
    private static async createNewEmployee(
        employee: Partial<EmployeeModel>,
        hrSettings: HrSettingsByType | undefined,
        successfulRecords: any[],
        index: number,
    ): Promise<void> {
        // 1. Register user in Firebase Auth (similar to handleSaveEmployee)
        const registerResponse = await fetch("/api/register-user", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(employee),
        });

        const registerResult = await registerResponse.json();

        if (!registerResult.success) {
            throw new Error(registerResult.message);
        }

        const uid = registerResult.uid;

        const convertedData = await ImportUtils.convertReferenceFieldsToIds(employee, hrSettings);

        const salary = employee.salary ? parseFloat(String(employee.salary)) || 0 : 0;
        const monthlyWorkingHours = hrSettings?.payrollSettings?.at(0)?.monthlyWorkingHours ?? 173;
        const hourlyWage = await calculateHourlyWage(salary, monthlyWorkingHours);

        // Prepare employee data with all required fields
        // Type conversions for numeric fields
        const eligibleLeaveDays = employee.eligibleLeaveDays
            ? parseInt(String(employee.eligibleLeaveDays)) || 0
            : 0;
        const contractHourValue = employee.contractHour
            ? String(employee.contractHour) === "Custom"
                ? "Custom"
                : parseFloat(String(employee.contractHour)) || "Custom"
            : "Custom";
        const yearsOfExperience = employee.yearsOfExperience
            ? String(employee.yearsOfExperience)
            : "";

        const incomingCustomFields = extractCustomFieldsFromRow(employee as Partial<EmployeeModel>);

        let employeeData: Partial<EmployeeModel> = {
            id: uid, // Use Firebase Auth UID as document ID - will match Firestore document ID
            timestamp: getTimestamp(),
            uid,
            employeeID: String(employee.employeeID || ""),

            // Personal Information
            firstName: String(employee.firstName || ""),
            middleName: employee.middleName ? String(employee.middleName) : null,
            surname: String(employee.surname || ""),
            birthDate: String(employee.birthDate || ""), // Will be formatted by formatEmployeeDates
            birthPlace: String(employee.birthPlace || ""),
            levelOfEducation: String(employee.levelOfEducation || ""),
            educationDetail: [], // Initialize as empty array
            yearsOfExperience,
            experienceDetail: [], // Initialize as empty array
            trainingDetail: [],
            languageSkills: [],
            gender: String(employee.gender || ""),

            // Contract Information
            company: String(employee.company || ""),
            contractType: String(employee.contractType || ""),
            contractHour: contractHourValue,
            hoursPerWeek: 0, // Default value
            contractStatus: this.validateContractStatus(employee.contractStatus),
            contractStartingDate: String(employee.contractStartingDate || ""), // Will be formatted by formatEmployeeDates
            contractTerminationDate: String(employee.contractTerminationDate || ""), // Will be formatted by formatEmployeeDates
            hireDate: ImportUtils.formatDateForStorage(new Date().toISOString().split("T")[0]), // Current date formatted
            contractDocument: "",
            probationPeriodEndDate: String(employee.probationPeriodEndDate || ""), // Will be formatted by formatEmployeeDates
            lastDateOfProbation: String(employee.lastDateOfProbation || ""), // Will be formatted by formatEmployeeDates
            reasonOfLeaving: "",
            salary,
            currency: String(employee.currency || ""),
            eligibleLeaveDays,

            // Position Information
            employmentPosition: String(employee.employmentPosition || ""),
            section: String(employee.section || ""),
            workingLocation: String(employee.workingLocation || ""),
            gradeLevel: String(employee.gradeLevel || ""),
            shiftType: String(employee.shiftType || ""),
            department: String(employee.department || ""),

            // Contact Information
            personalPhoneNumber: String(employee.personalPhoneNumber || ""),
            personalEmail: String(employee.personalEmail || ""),
            companyEmail: String(employee.companyEmail || ""),

            // Emergency Contact
            emergencyContactName: String(employee.emergencyContactName || ""),
            relationshipToEmployee: String(employee.relationshipToEmployee || ""),
            phoneNumber1: String(employee.phoneNumber1 || ""),
            emailAddress1: String(employee.emailAddress1 || ""),
            physicalAddress1: String(employee.physicalAddress1 || ""),

            // Financial Information
            bankAccount: String(employee.bankAccount || ""),
            providentFundAccount: String(employee.providentFundAccount || ""),
            tinNumber: String(employee.tinNumber || ""),

            // Documents
            passportNumber: String(employee.passportNumber || ""),
            nationalIDNumber: String(employee.nationalIDNumber || ""),

            // Additional Emergency Contact
            phoneNumber2: String(employee.phoneNumber2 || ""),
            emailAddress2: String(employee.emailAddress2 || ""),
            physicalAddress2: String(employee.physicalAddress2 || ""),

            // Marital status and other optional fields
            maritalStatus: String(employee.maritalStatus || ""),

            // System Fields
            role: ["Employee"], // Default role
            password: "1q2w3e4r%T", // Default password
            lastChanged: getTimestamp(),
            hourlyWage,

            // Leave Balance
            balanceLeaveDays: 0,
            accrualLeaveDays: 0,
            lastELDUpdate: getTimestamp(),

            // Initialize arrays and other required fields
            starredTrainingMaterials: [],
            trainingMaterialsProgress: [],
            trainingMaterialStatus: [],
            certificationsAcquired: [],
            announcements: [],
            notifications: [],
            checklistItems: [],
            checklistItemRemark: [],
            performance: [],
            claimedOvertimes: [],
            promotionInterviews: [],
            promotionInterviewResults: [],
            successorInformation: [],
            documentRequests: {},
            associatedRestrictedDocuments: [],

            // Custom fields - single array with section-based filtering
            //selector code
            customFields: incomingCustomFields.map((cf): CustomField => {
                // Map JavaScript typeof to CustomFieldType
                const jsType = typeof cf.value;
                let fieldType: CustomFieldType = "text";

                if (jsType === "number") {
                    fieldType = "number";
                } else if (jsType === "object" && Array.isArray(cf.value)) {
                    // Arrays are stored as JSON strings
                    fieldType = "text";
                } else {
                    // Try to detect if it's a date string
                    const dateValue = cf.value instanceof Date ? cf.value : new Date(cf.value);
                    if (
                        !isNaN(dateValue.getTime()) &&
                        String(cf.value).match(/\d{4}-\d{2}-\d{2}/)
                    ) {
                        fieldType = "date";
                    } else {
                        fieldType = "text";
                    }
                }

                return {
                    id: Math.random().toString(36).substring(2, 15),
                    section: cf.section,
                    label: cf.label,
                    // Convert value to string, arrays to JSON string
                    value: Array.isArray(cf.value)
                        ? JSON.stringify(cf.value)
                        : String(cf.value ?? ""),
                    type: fieldType,
                };
            }),

            // Reference field conversions
            ...convertedData,
        };

        // Format dates according to dayjs_format.ts standards
        employeeData = ImportUtils.formatEmployeeDates(employeeData);

        // 4. Save to Firestore using the uid as document ID
        const docRef = doc(employeeCollection, uid);
        await setDoc(docRef, {
            ...employeeData,
            uid, // Keep uid for auth reference
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            id: docRef.id,
        });

        // Generate attendance records for the new employee
        try {
            // Skip attendance generation if no shiftType is provided
            if (!employeeData.shiftType) {
                console.warn(
                    `Skipping attendance generation for employee ${employeeData.employeeID} - no shiftType configured`,
                );
            } else {
                // Call the generate-attendance API
                const attendanceResponse = await fetch(`/api/generate-attendance`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        uid: uid,
                        shiftType: employeeData.shiftType,
                    }),
                });

                const attendanceResult = await attendanceResponse.json();

                if (!attendanceResult.success) {
                    console.error(
                        `Failed to generate attendance for employee ${employeeData.employeeID}: ${attendanceResult.message}`,
                    );
                    // Don't fail the import for attendance generation issues
                } else {
                    console.log(
                        `Successfully generated attendance records for employee ${employeeData.employeeID}`,
                    );
                }
            }
        } catch (attendanceError) {
            console.error(
                `Error generating attendance for employee ${employeeData.employeeID}:`,
                attendanceError,
            );
            // Continue with import - attendance can be generated later manually
        }

        // Track successful imports with details
        successfulRecords.push({
            rowData: employee,
            employeeData,
            rowNumber: index + 2, // +2 because 1 for header, 1 for 1-based indexing
        });
    }

    /**
     * Updates an existing employee with new data
     */
    static async updateExistingEmployee(
        employeeId: string,
        employeeData: Partial<EmployeeModel>,
        hrSettings?: HrSettingsByType,
    ): Promise<void> {
        try {
            // Get existing employee data to check for email changes
            const employeeDoc = await getDoc(doc(employeeCollection, employeeId));
            if (!employeeDoc.exists()) {
                throw new Error(`Employee with ID ${employeeId} not found`);
            }
            const existingEmployee = { id: employeeDoc.id, ...employeeDoc.data() } as EmployeeModel;

            // Check if companyEmail is being updated and update Firebase Auth if needed
            if (
                employeeData.companyEmail &&
                employeeData.companyEmail !== existingEmployee.companyEmail
            ) {
                const updateAuthResponse = await fetch("/api/register-user", {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        uid: existingEmployee.uid,
                        role: existingEmployee.role,
                        companyEmail: employeeData.companyEmail,
                    }),
                });

                const updateAuthResult = await updateAuthResponse.json();

                if (!updateAuthResult.success) {
                    throw new Error(
                        `Failed to update Firebase Auth email: ${updateAuthResult.message}`,
                    );
                }
            }

            // Convert reference fields to IDs for the update data
            const convertedData = await ImportUtils.convertReferenceFieldsToIds(
                employeeData,
                hrSettings,
            );

            // Type conversions for numeric fields
            const salary = employeeData.salary ? parseFloat(String(employeeData.salary)) || 0 : 0;
            const eligibleLeaveDays = employeeData.eligibleLeaveDays
                ? parseInt(String(employeeData.eligibleLeaveDays)) || 0
                : 0;
            const contractHourValue = employeeData.contractHour
                ? String(employeeData.contractHour) === "Custom"
                    ? "Custom"
                    : parseFloat(String(employeeData.contractHour)) || "Custom"
                : "Custom";
            const yearsOfExperience = employeeData.yearsOfExperience
                ? String(employeeData.yearsOfExperience)
                : "";

            // Prepare update data - only include fields that are provided (not empty)
            const updateData: Partial<EmployeeModel> = {};

            if (employeeData.firstName !== undefined && employeeData.firstName !== "")
                updateData.firstName = String(employeeData.firstName);
            if (employeeData.middleName !== undefined)
                updateData.middleName = employeeData.middleName
                    ? String(employeeData.middleName)
                    : null;
            if (employeeData.surname !== undefined && employeeData.surname !== "")
                updateData.surname = String(employeeData.surname);
            if (employeeData.birthDate !== undefined && employeeData.birthDate !== "")
                updateData.birthDate = String(employeeData.birthDate);
            if (employeeData.birthPlace !== undefined && employeeData.birthPlace !== "")
                updateData.birthPlace = String(employeeData.birthPlace);
            if (employeeData.levelOfEducation !== undefined && employeeData.levelOfEducation !== "")
                updateData.levelOfEducation = String(employeeData.levelOfEducation);
            if (employeeData.yearsOfExperience !== undefined)
                updateData.yearsOfExperience = yearsOfExperience;
            if (employeeData.gender !== undefined && employeeData.gender !== "")
                updateData.gender = String(employeeData.gender);
            if (employeeData.company !== undefined && employeeData.company !== "")
                updateData.company = String(employeeData.company);
            if (employeeData.contractType !== undefined && employeeData.contractType !== "")
                updateData.contractType = String(employeeData.contractType);
            if (employeeData.contractHour !== undefined)
                updateData.contractHour = contractHourValue;
            if (employeeData.contractStatus !== undefined)
                updateData.contractStatus = this.validateContractStatus(
                    employeeData.contractStatus,
                );
            if (
                employeeData.contractStartingDate !== undefined &&
                employeeData.contractStartingDate !== ""
            )
                updateData.contractStartingDate = String(employeeData.contractStartingDate);
            if (
                employeeData.contractTerminationDate !== undefined &&
                employeeData.contractTerminationDate !== ""
            )
                updateData.contractTerminationDate = String(employeeData.contractTerminationDate);
            if (
                employeeData.probationPeriodEndDate !== undefined &&
                employeeData.probationPeriodEndDate !== ""
            )
                updateData.probationPeriodEndDate = String(employeeData.probationPeriodEndDate);
            if (
                employeeData.lastDateOfProbation !== undefined &&
                employeeData.lastDateOfProbation !== ""
            )
                updateData.lastDateOfProbation = String(employeeData.lastDateOfProbation);
            if (employeeData.salary !== undefined) {
                updateData.salary = salary;
                const monthlyWorkingHours =
                    hrSettings?.payrollSettings?.at(0)?.monthlyWorkingHours ?? 173;
                updateData.hourlyWage = await calculateHourlyWage(salary, monthlyWorkingHours);
            }
            if (employeeData.currency !== undefined && employeeData.currency !== "")
                updateData.currency = String(employeeData.currency);
            if (employeeData.eligibleLeaveDays !== undefined)
                updateData.eligibleLeaveDays = eligibleLeaveDays;
            if (
                employeeData.employmentPosition !== undefined &&
                employeeData.employmentPosition !== ""
            )
                updateData.employmentPosition = String(employeeData.employmentPosition);
            if (employeeData.section !== undefined && employeeData.section !== "")
                updateData.section = String(employeeData.section);
            if (employeeData.workingLocation !== undefined && employeeData.workingLocation !== "")
                updateData.workingLocation = String(employeeData.workingLocation);
            if (employeeData.gradeLevel !== undefined && employeeData.gradeLevel !== "")
                updateData.gradeLevel = String(employeeData.gradeLevel);
            if (employeeData.shiftType !== undefined && employeeData.shiftType !== "")
                updateData.shiftType = String(employeeData.shiftType);
            if (employeeData.department !== undefined && employeeData.department !== "")
                updateData.department = String(employeeData.department);
            if (
                employeeData.personalPhoneNumber !== undefined &&
                employeeData.personalPhoneNumber !== ""
            )
                updateData.personalPhoneNumber = String(employeeData.personalPhoneNumber);
            if (employeeData.personalEmail !== undefined && employeeData.personalEmail !== "")
                updateData.personalEmail = String(employeeData.personalEmail);
            if (employeeData.companyEmail !== undefined && employeeData.companyEmail !== "")
                updateData.companyEmail = String(employeeData.companyEmail);
            if (
                employeeData.emergencyContactName !== undefined &&
                employeeData.emergencyContactName !== ""
            )
                updateData.emergencyContactName = String(employeeData.emergencyContactName);
            if (
                employeeData.relationshipToEmployee !== undefined &&
                employeeData.relationshipToEmployee !== ""
            )
                updateData.relationshipToEmployee = String(employeeData.relationshipToEmployee);
            if (employeeData.phoneNumber1 !== undefined && employeeData.phoneNumber1 !== "")
                updateData.phoneNumber1 = String(employeeData.phoneNumber1);
            if (employeeData.emailAddress1 !== undefined && employeeData.emailAddress1 !== "")
                updateData.emailAddress1 = String(employeeData.emailAddress1);
            if (employeeData.physicalAddress1 !== undefined && employeeData.physicalAddress1 !== "")
                updateData.physicalAddress1 = String(employeeData.physicalAddress1);
            if (employeeData.bankAccount !== undefined && employeeData.bankAccount !== "")
                updateData.bankAccount = String(employeeData.bankAccount);
            if (
                employeeData.providentFundAccount !== undefined &&
                employeeData.providentFundAccount !== ""
            )
                updateData.providentFundAccount = String(employeeData.providentFundAccount);
            if (employeeData.tinNumber !== undefined && employeeData.tinNumber !== "")
                updateData.tinNumber = String(employeeData.tinNumber);
            if (employeeData.passportNumber !== undefined && employeeData.passportNumber !== "")
                updateData.passportNumber = String(employeeData.passportNumber);
            if (employeeData.nationalIDNumber !== undefined && employeeData.nationalIDNumber !== "")
                updateData.nationalIDNumber = String(employeeData.nationalIDNumber);
            if (employeeData.phoneNumber2 !== undefined && employeeData.phoneNumber2 !== "")
                updateData.phoneNumber2 = String(employeeData.phoneNumber2);
            if (employeeData.emailAddress2 !== undefined && employeeData.emailAddress2 !== "")
                updateData.emailAddress2 = String(employeeData.emailAddress2);
            if (employeeData.physicalAddress2 !== undefined && employeeData.physicalAddress2 !== "")
                updateData.physicalAddress2 = String(employeeData.physicalAddress2);
            if (employeeData.maritalStatus !== undefined && employeeData.maritalStatus !== "")
                updateData.maritalStatus = String(employeeData.maritalStatus);

            // Add reference field conversions
            Object.assign(updateData, convertedData);

            // Format dates if provided
            if (
                updateData.birthDate ||
                updateData.contractStartingDate ||
                updateData.contractTerminationDate ||
                updateData.probationPeriodEndDate ||
                updateData.lastDateOfProbation
            ) {
                const formattedData = ImportUtils.formatEmployeeDates(
                    updateData as Partial<EmployeeModel>,
                );
                Object.assign(updateData, formattedData);
            }

            // Update timestamp
            updateData.lastChanged = getTimestamp();

            // Merge custom fields from CSV into existing
            const incomingCustom = extractCustomFieldsFromRow(employeeData);
            if (incomingCustom.length > 0) {
                updateData.customFields = mergeCustomFields(
                    existingEmployee.customFields,
                    incomingCustom,
                );
            }

            // Update in Firestore
            const docRef = doc(employeeCollection, employeeId);
            await updateDoc(docRef, {
                ...updateData,
                updatedAt: serverTimestamp(),
            });
        } catch (error) {
            console.error("Error updating employee:", error);
            throw new Error(
                `Failed to update employee: ${error instanceof Error ? error.message : "Unknown error"}`,
            );
        }
    }
}
