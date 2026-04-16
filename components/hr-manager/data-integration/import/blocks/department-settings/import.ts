import { ImportService } from "@/lib/backend/api/hr-settings/import-service";
import { DepartmentSettingsImportService } from "@/lib/backend/api/hr-settings/department-settings-import-service";
import { ImportLogModel, ImportDataModel } from "@/lib/models/import-log";
import { getTimestamp } from "@/lib/util/dayjs_format";
import { HrSettingsByType } from "@/context/firestore-context";
import { EmployeeModel } from "@/lib/models/employee";

/**
 * Department Settings import functionality
 * Handles Firebase update and logging for department settings import
 */

export interface DepartmentSettingsImportResult {
    success: boolean;
    importLog: ImportLogModel;
    message: string;
}

/**
 * Imports department settings data and creates import log
 * @param departmentData - Validated department data to import
 * @param actorName - Name of the user performing the import
 * @param actorID - ID of the user performing the import
 * @param hrSettings - HR settings for reference field conversion
 * @param employees - Employee data for manager reference resolution
 * @returns DepartmentSettingsImportResult with success status and import log
 */
export async function importDepartmentSettingsData(
    departmentData: Record<string, any>[],
    actorName: string,
    actorID: string,
    hrSettings?: HrSettingsByType,
    employees?: EmployeeModel[],
): Promise<DepartmentSettingsImportResult> {
    try {
        if (!departmentData.length) {
            throw new Error("No department settings data to import");
        }

        // Import department settings using the import service
        const importResult = await DepartmentSettingsImportService.batchImportDepartmentSettings(
            departmentData,
            { hrSettings, employees },
        );

        // Create import log
        const importedData: ImportDataModel = {
            totalRows: departmentData.length,
            successfulRows: importResult.successful,
            failedRows: importResult.failed,
            summary: `Imported ${importResult.successful} of ${departmentData.length} department settings successfully`,
            importedRecords: [],
            failureDetails: [],
        };

        // Add imported records for successful imports
        if (importResult.successful > 0) {
            for (let i = 0; i < departmentData.length; i++) {
                if (i < importResult.successful) {
                    // Assuming successful records are first
                    importedData.importedRecords.push({
                        rowNumber: i + 1,
                        rowData: departmentData[i],
                        importedData: departmentData[i], // This should be the processed data, but for now using original
                    });
                }
            }
        }

        // Only include failureDetails if there are errors
        if (importResult.errors.length > 0) {
            importedData.failureDetails = importResult.errors.map((error, index) => ({
                rowNumber: index + 1,
                rowData: departmentData[index] || {},
                errorMessage: error,
                fieldErrors: {},
            }));
        }

        const importLog: ImportLogModel = {
            id: `import_department_settings_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: getTimestamp(),
            type: "department-settings",
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
                    ? `Successfully imported ${importResult.successful} department settings`
                    : `Department settings import completed with ${importResult.failed} failures out of ${departmentData.length} records`,
        };
    } catch (error) {
        console.error("Error in department settings import process:", error);

        // Create failure log
        const failureLog: ImportLogModel = {
            id: `import_department_settings_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: getTimestamp(),
            type: "department-settings",
            actorName,
            actorID,
            status: "failure",
            importedData: {
                totalRows: departmentData.length,
                successfulRows: 0,
                failedRows: departmentData.length,
                summary: `Department settings import failed: ${error instanceof Error ? error.message : "Unknown error"}`,
                importedRecords: [],
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
                    : "An unexpected error occurred during department settings import",
        };
    }
}
