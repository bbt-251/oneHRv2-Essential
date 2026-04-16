import { ImportService } from "@/lib/backend/api/hr-settings/import-service";
import { TrainingCategoryImportService } from "@/lib/backend/api/hr-settings/training-category-import-service";
import { ImportLogModel, ImportDataModel } from "@/lib/models/import-log";
import { getTimestamp } from "@/lib/util/dayjs_format";

/**
 * Training Category import functionality
 * Handles Firebase update and logging for training category import
 */

export interface TrainingCategoryImportResult {
    success: boolean;
    importLog: ImportLogModel;
    message: string;
}

/**
 * Imports training category data and creates import log
 * @param trainingCategoryData - Validated training category data to import
 * @param actorName - Name of the user performing the import
 * @param actorID - ID of the user performing the import
 * @returns TrainingCategoryImportResult with success status and import log
 */
export async function importTrainingCategoryData(
    trainingCategoryData: Record<string, any>[],
    actorName: string,
    actorID: string,
): Promise<TrainingCategoryImportResult> {
    try {
        if (!trainingCategoryData.length) {
            throw new Error("No training category data to import");
        }

        // Import training categories using the import service
        const importResult =
            await TrainingCategoryImportService.batchImportTrainingCategories(trainingCategoryData);

        // Create import log
        const importedData: ImportDataModel = {
            totalRows: trainingCategoryData.length,
            successfulRows: importResult.successful,
            failedRows: importResult.failed,
            summary: `Imported ${importResult.successful} of ${trainingCategoryData.length} training categories successfully`,
            importedRecords: [],
            failureDetails: [],
        };

        // Add imported records for successful imports
        if (importResult.successful > 0) {
            for (let i = 0; i < trainingCategoryData.length; i++) {
                if (i < importResult.successful) {
                    // Assuming successful records are first
                    importedData.importedRecords.push({
                        rowNumber: i + 1,
                        rowData: trainingCategoryData[i],
                        importedData: trainingCategoryData[i], // This should be the processed data, but for now using original
                    });
                }
            }
        }

        // Only include failureDetails if there are errors
        if (importResult.errors.length > 0) {
            importedData.failureDetails = importResult.errors.map((error, index) => ({
                rowNumber: index + 1,
                rowData: trainingCategoryData[index] || {},
                errorMessage: error,
                fieldErrors: {},
            }));
        }

        const importLog: ImportLogModel = {
            id: `import_training_category_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: getTimestamp(),
            type: "training-category",
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
                    ? `Successfully imported ${importResult.successful} training categories`
                    : `Training category import completed with ${importResult.failed} failures out of ${trainingCategoryData.length} records`,
        };
    } catch (error) {
        console.error("Error in training category import process:", error);

        // Create failure log
        const failureLog: ImportLogModel = {
            id: `import_training_category_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: getTimestamp(),
            type: "training-category",
            actorName,
            actorID,
            status: "failure",
            importedData: {
                totalRows: trainingCategoryData.length,
                successfulRows: 0,
                failedRows: trainingCategoryData.length,
                summary: `Training category import failed: ${error instanceof Error ? error.message : "Unknown error"}`,
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
                    : "An unexpected error occurred during training category import",
        };
    }
}
