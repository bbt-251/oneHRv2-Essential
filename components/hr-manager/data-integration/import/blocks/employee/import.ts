import { ImportService } from "@/lib/backend/api/hr-settings/import-service";
import { ImportUtils } from "@/lib/backend/api/hr-settings/import-utils";
import { EmployeeImportService } from "@/lib/backend/api/hr-settings/employee-import-service";
import { ImportLogModel } from "@/lib/models/import-log";
import { EmployeeModel } from "@/lib/models/employee";
import { getTimestamp } from "@/lib/util/dayjs_format";
import { HrSettingsByType } from "@/context/firestore-context";

/**
 * Employee import functionality
 * Handles Firebase upload and logging for employee data import
 */

export interface EmployeeImportResult {
    success: boolean;
    importLog: ImportLogModel;
    message: string;
}

/**
 * Imports employee data to Firebase and creates import log
 * @param employeeData - Validated employee data to import
 * @param actorName - Name of the user performing the import
 * @param actorID - ID of the user performing the import
 * @param hrSettings - HR settings for reference field conversion
 * @returns EmployeeImportResult with success status and import log
 */
export async function importEmployeeData(
    employeeData: Record<string, any>[],
    actorName: string,
    actorID: string,
    hrSettings?: HrSettingsByType,
    existingEmployees?: EmployeeModel[],
): Promise<EmployeeImportResult> {
    try {
        if (!employeeData.length) {
            throw new Error("No employee data to import");
        }

        // Prepare employee data for Firebase
        const convertedData = await Promise.all(
            employeeData.map(employee => {
                return convertEmployeeDataForFirebase(employee, hrSettings, existingEmployees);
            }),
        );

        // Import employees using the import service
        const importResult = await EmployeeImportService.batchImportEmployees(
            convertedData,
            hrSettings,
        );

        // Create import log
        const importedData: any = {
            totalRows: employeeData.length,
            successfulRows: importResult.successful,
            failedRows: importResult.failed,
            summary: `Imported ${importResult.successful} of ${employeeData.length} employee records successfully`,
        };

        // Only include failureDetails if there are errors
        if (importResult.errors.length > 0) {
            importedData.failureDetails = importResult.errors.map((error, index) => ({
                rowNumber: index + 1,
                rowData: employeeData[index] || {},
                errorMessage: error,
                fieldErrors: {},
            }));
        }

        const importLog: ImportLogModel = {
            id: `import_employee_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: getTimestamp(),
            type: "employee",
            actorName,
            actorID,
            status: importResult.failed === 0 ? "success" : "failure",
            importedData,
        };

        // Save the import log
        const logId = await ImportService.createImportLog(importLog);
        importLog.id = logId;

        return {
            success: importResult.failed === 0,
            importLog,
            message:
                importResult.failed === 0
                    ? `Successfully imported ${importResult.successful} employee records`
                    : `Import completed with ${importResult.failed} failures out of ${employeeData.length} records`,
        };
    } catch (error) {
        console.error("Error in employee import process:", error);

        // Create failure log
        const failureLog: ImportLogModel = {
            id: `import_employee_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: getTimestamp(),
            type: "employee",
            actorName,
            actorID,
            status: "failure",
            importedData: {
                totalRows: employeeData.length,
                successfulRows: 0,
                failedRows: employeeData.length,
                importedRecords: [],
                summary: `Employee import failed: ${error instanceof Error ? error.message : "Unknown error"}`,
                failureDetails: [
                    {
                        rowNumber: 1,
                        rowData: {},
                        errorMessage:
                            error instanceof Error ? error.message : "Unknown error occurred",
                        fieldErrors: {},
                    },
                ],
            },
        };

        const logId = await ImportService.createImportLog(failureLog);
        failureLog.id = logId;

        return {
            success: false,
            importLog: failureLog,
            message:
                error instanceof Error
                    ? error.message
                    : "An unexpected error occurred during employee import",
        };
    }
}

/**
 * Converts employee data from CSV format to Firebase format
 * Handles field transformations and reference field conversions
 */
async function convertEmployeeDataForFirebase(
    employee: Record<string, any>,
    hrSettings?: HrSettingsByType,
    existingEmployees?: EmployeeModel[],
): Promise<Partial<EmployeeModel>> {
    // Auto-fill reporting line manager position if reporting line manager is provided
    if (employee.reportingLineManager && existingEmployees) {
        const manager = existingEmployees.find(
            emp => emp.employeeID === employee.reportingLineManager,
        );
        if (manager) {
            employee.reportingLineManagerPosition = manager.employmentPosition;
        }
    }

    // Convert semicolon-separated role string to array
    if (employee.role) {
        employee.role = employee.role.split(";").map((r: string) => r.trim());
    }

    // Normalize contract status to lowercase to match DB values
    if (employee.contractStatus) {
        employee.contractStatus = employee.contractStatus.toLowerCase();
    }

    // Normalize gender to lowercase to match DB values
    if (employee.gender) {
        employee.gender = employee.gender.toLowerCase();
    }

    // Convert reference fields and merge with original data
    const convertedReferenceFields = await ImportUtils.convertReferenceFieldsToIds(
        employee,
        hrSettings,
    );
    return { ...employee, ...convertedReferenceFields };
}
