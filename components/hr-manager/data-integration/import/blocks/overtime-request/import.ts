import { ImportLogModel } from "@/lib/models/import-log";
import { OvertimeRequestImportService } from "@/lib/backend/api/hr-settings/overtime-request-import-service";
import { getTimestamp } from "@/lib/util/dayjs_format";

/**
 * Overtime Request import functionality
 * Handles Firebase upload and logging for overtime request data import
 */

export interface OvertimeRequestImportResult {
    success: boolean;
    importLog: ImportLogModel;
    message: string;
}

/**
 * Imports overtime request data to Firebase and creates import log
 * @param overtimeRequestData - Validated overtime request data to import
 * @param actorName - Name of the user performing the import
 * @param actorID - ID of the user performing the import
 * @returns OvertimeRequestImportResult with success status and import log
 */
export async function importOvertimeRequestData(
    overtimeRequestData: Record<string, any>[],
    actorName: string,
    actorID: string,
): Promise<OvertimeRequestImportResult> {
    try {
        if (!overtimeRequestData.length) {
            throw new Error("No overtime request data to import");
        }

        // Import overtime requests using the import service
        const importResult = await OvertimeRequestImportService.batchImportOvertimeRequests(
            overtimeRequestData,
            actorID,
        );

        // Create import log
        const importedData: any = {
            totalRows: overtimeRequestData.length,
            successfulRows: importResult.successful,
            failedRows: importResult.failed,
            summary: `Imported ${importResult.successful} of ${overtimeRequestData.length} overtime requests successfully`,
        };

        // Only include failureDetails if there are errors
        if (importResult.errors.length > 0) {
            importedData.failureDetails = importResult.errors.map(
                (error: string, index: number) => ({
                    rowNumber: index + 1,
                    rowData: overtimeRequestData[index] || {},
                    errorMessage: error,
                    fieldErrors: {},
                }),
            );
        }

        const importLog: ImportLogModel = {
            id: `import_overtime_request_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: getTimestamp(),
            type: "overtime-request",
            actorName,
            actorID,
            status: importResult.failed === 0 ? "success" : "failure",
            importedData,
        };

        // Note: Import logs are created in the ImportOrchestrator, not here
        // This function just returns the result for the orchestrator to handle

        return {
            success: importResult.failed === 0,
            importLog,
            message:
                importResult.failed === 0
                    ? `Successfully imported ${importResult.successful} overtime requests`
                    : `Import completed with ${importResult.failed} failures out of ${overtimeRequestData.length} records`,
        };
    } catch (error) {
        console.error("Error in overtime request import process:", error);

        // Create failure log
        const failureLog: ImportLogModel = {
            id: `import_overtime_request_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: getTimestamp(),
            type: "overtime-request",
            actorName,
            actorID,
            status: "failure",
            importedData: {
                totalRows: overtimeRequestData.length,
                successfulRows: 0,
                failedRows: overtimeRequestData.length,
                importedRecords: [],
                summary: `Overtime request import failed: ${error instanceof Error ? error.message : "Unknown error"}`,
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

        return {
            success: false,
            importLog: failureLog,
            message:
                error instanceof Error
                    ? error.message
                    : "An unexpected error occurred during overtime request import",
        };
    }
}
