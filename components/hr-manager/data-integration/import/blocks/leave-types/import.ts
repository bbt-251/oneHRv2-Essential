import { ImportService } from "@/lib/backend/api/hr-settings/import-service";
import { LeaveTypesImportService } from "@/lib/backend/api/hr-settings/leave-types-import-service";
import { ImportLogModel, ImportDataModel } from "@/lib/models/import-log";
import { getTimestamp } from "@/lib/util/dayjs_format";

/**
 * Leave Types import functionality
 * Handles Firebase update and logging for leave types import
 */

export interface LeaveTypesImportResult {
    success: boolean;
    importLog: ImportLogModel;
    message: string;
}

/**
 * Imports leave types data and creates import log
 * @param leaveTypesData - Validated leave types data to import
 * @param actorName - Name of the user performing the import
 * @param actorID - ID of the user performing the import
 * @returns LeaveTypesImportResult with success status and import log
 */
export async function importLeaveTypesData(
    leaveTypesData: Record<string, any>[],
    actorName: string,
    actorID: string,
): Promise<LeaveTypesImportResult> {
    try {
        if (!leaveTypesData.length) {
            throw new Error("No leave types data to import");
        }

        // Import leave types using the import service
        const importResult = await LeaveTypesImportService.batchImportLeaveTypes(leaveTypesData);

        // Create import log
        const importedData: ImportDataModel = {
            totalRows: leaveTypesData.length,
            successfulRows: importResult.successful,
            failedRows: importResult.failed,
            summary: `Imported ${importResult.successful} of ${leaveTypesData.length} leave types successfully`,
            importedRecords: [],
            failureDetails: [],
        };

        // Add imported records for successful imports
        if (importResult.successful > 0) {
            for (let i = 0; i < leaveTypesData.length; i++) {
                if (i < importResult.successful) {
                    // Assuming successful records are first
                    importedData.importedRecords.push({
                        rowNumber: i + 1,
                        rowData: leaveTypesData[i],
                        importedData: leaveTypesData[i], // This should be the processed data, but for now using original
                    });
                }
            }
        }

        // Only include failureDetails if there are errors
        if (importResult.errors.length > 0) {
            importedData.failureDetails = importResult.errors.map((error, index) => ({
                rowNumber: index + 1,
                rowData: leaveTypesData[index] || {},
                errorMessage: error,
                fieldErrors: {},
            }));
        }

        const importLog: ImportLogModel = {
            id: `import_leave_types_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: getTimestamp(),
            type: "leave-types",
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
                    ? `Successfully imported ${importResult.successful} leave types`
                    : `Leave types import completed with ${importResult.failed} failures out of ${leaveTypesData.length} records`,
        };
    } catch (error) {
        console.error("Error in leave types import process:", error);

        // Create failure log
        const failureLog: ImportLogModel = {
            id: `import_leave_types_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: getTimestamp(),
            type: "leave-types",
            actorName,
            actorID,
            status: "failure",
            importedData: {
                totalRows: leaveTypesData.length,
                successfulRows: 0,
                failedRows: leaveTypesData.length,
                summary: `Leave types import failed: ${error instanceof Error ? error.message : "Unknown error"}`,
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
                    : "An unexpected error occurred during leave types import",
        };
    }
}
