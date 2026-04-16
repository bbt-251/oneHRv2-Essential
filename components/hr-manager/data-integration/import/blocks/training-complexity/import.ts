import { ImportService } from "@/lib/backend/api/hr-settings/import-service";
import { TrainingComplexityImportService } from "@/lib/backend/api/hr-settings/training-complexity-import-service";
import { ImportLogModel, ImportDataModel } from "@/lib/models/import-log";
import { getTimestamp } from "@/lib/util/dayjs_format";

/**
 * Training Complexity import functionality
 * Handles Firebase update and logging for training complexity import
 */

export interface TrainingComplexityImportResult {
    success: boolean;
    importLog: ImportLogModel;
    message: string;
}

/**
 * Imports training complexity data and creates import log
 * @param trainingComplexityData - Validated training complexity data to import
 * @param actorName - Name of the user performing the import
 * @param actorID - ID of the user performing the import
 * @returns TrainingComplexityImportResult with success status and import log
 */
export async function importTrainingComplexityData(
    trainingComplexityData: Record<string, any>[],
    actorName: string,
    actorID: string,
): Promise<TrainingComplexityImportResult> {
    try {
        if (!trainingComplexityData.length) {
            throw new Error("No training complexity data to import");
        }

        // Import training complexities using the import service
        const importResult =
            await TrainingComplexityImportService.batchImportTrainingComplexities(
                trainingComplexityData,
            );

        // Create import log
        const importedData: ImportDataModel = {
            totalRows: trainingComplexityData.length,
            successfulRows: importResult.successful,
            failedRows: importResult.failed,
            summary: `Imported ${importResult.successful} of ${trainingComplexityData.length} training complexities successfully`,
            importedRecords: [],
            failureDetails: [],
        };

        // Add imported records for successful imports
        if (importResult.successful > 0) {
            for (let i = 0; i < trainingComplexityData.length; i++) {
                if (i < importResult.successful) {
                    // Assuming successful records are first
                    importedData.importedRecords.push({
                        rowNumber: i + 1,
                        rowData: trainingComplexityData[i],
                        importedData: trainingComplexityData[i], // This should be the processed data, but for now using original
                    });
                }
            }
        }

        // Only include failureDetails if there are errors
        if (importResult.errors.length > 0) {
            importedData.failureDetails = importResult.errors.map((error, index) => ({
                rowNumber: index + 1,
                rowData: trainingComplexityData[index] || {},
                errorMessage: error,
                fieldErrors: {},
            }));
        }

        const importLog: ImportLogModel = {
            id: `import_training_complexity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: getTimestamp(),
            type: "training-complexity",
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
                    ? `Successfully imported ${importResult.successful} training complexities`
                    : `Training complexity import completed with ${importResult.failed} failures out of ${trainingComplexityData.length} records`,
        };
    } catch (error) {
        console.error("Error in training complexity import process:", error);

        // Create failure log
        const failureLog: ImportLogModel = {
            id: `import_training_complexity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: getTimestamp(),
            type: "training-complexity",
            actorName,
            actorID,
            status: "failure",
            importedData: {
                totalRows: trainingComplexityData.length,
                successfulRows: 0,
                failedRows: trainingComplexityData.length,
                summary: `Training complexity import failed: ${error instanceof Error ? error.message : "Unknown error"}`,
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
                    : "An unexpected error occurred during training complexity import",
        };
    }
}
