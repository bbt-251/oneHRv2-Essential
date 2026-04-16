import { ImportService } from "@/lib/backend/api/hr-settings/import-service";
import { TrainingLengthImportService } from "@/lib/backend/api/hr-settings/training-length-import-service";
import { ImportLogModel, ImportDataModel } from "@/lib/models/import-log";
import { getTimestamp } from "@/lib/util/dayjs_format";

/**
 * Training Length import functionality
 * Handles Firebase update and logging for training length import
 */

export interface TrainingLengthImportResult {
    success: boolean;
    importLog: ImportLogModel;
    message: string;
}

/**
 * Imports training length data and creates import log
 * @param trainingLengthData - Validated training length data to import
 * @param actorName - Name of the user performing the import
 * @param actorID - ID of the user performing the import
 * @returns TrainingLengthImportResult with success status and import log
 */
export async function importTrainingLengthData(
    trainingLengthData: Record<string, any>[],
    actorName: string,
    actorID: string,
): Promise<TrainingLengthImportResult> {
    try {
        if (!trainingLengthData.length) {
            throw new Error("No training length data to import");
        }

        // Import training lengths using the import service
        const importResult =
            await TrainingLengthImportService.batchImportTrainingLengths(trainingLengthData);

        // Create import log
        const importedData: ImportDataModel = {
            totalRows: trainingLengthData.length,
            successfulRows: importResult.successful,
            failedRows: importResult.failed,
            summary: `Imported ${importResult.successful} of ${trainingLengthData.length} training lengths successfully`,
            importedRecords: [],
            failureDetails: [],
        };

        // Add imported records for successful imports
        if (importResult.successful > 0) {
            for (let i = 0; i < trainingLengthData.length; i++) {
                if (i < importResult.successful) {
                    // Assuming successful records are first
                    importedData.importedRecords.push({
                        rowNumber: i + 1,
                        rowData: trainingLengthData[i],
                        importedData: trainingLengthData[i], // This should be the processed data, but for now using original
                    });
                }
            }
        }

        // Only include failureDetails if there are errors
        if (importResult.errors.length > 0) {
            importedData.failureDetails = importResult.errors.map((error, index) => ({
                rowNumber: index + 1,
                rowData: trainingLengthData[index] || {},
                errorMessage: error,
                fieldErrors: {},
            }));
        }

        const importLog: ImportLogModel = {
            id: `import_training_length_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: getTimestamp(),
            type: "training-length",
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
                    ? `Successfully imported ${importResult.successful} training lengths`
                    : `Training length import completed with ${importResult.failed} failures out of ${trainingLengthData.length} records`,
        };
    } catch (error) {
        console.error("Error in training length import process:", error);

        // Create failure log
        const failureLog: ImportLogModel = {
            id: `import_training_length_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: getTimestamp(),
            type: "training-length",
            actorName,
            actorID,
            status: "failure",
            importedData: {
                totalRows: trainingLengthData.length,
                successfulRows: 0,
                failedRows: trainingLengthData.length,
                summary: `Training length import failed: ${error instanceof Error ? error.message : "Unknown error"}`,
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
                    : "An unexpected error occurred during training length import",
        };
    }
}
