import { ImportService } from "@/lib/backend/api/hr-settings/import-service";
import { LevelOfEducationImportService } from "@/lib/backend/api/hr-settings/level-of-education-import-service";
import { ImportLogModel, ImportDataModel } from "@/lib/models/import-log";
import { getTimestamp } from "@/lib/util/dayjs_format";

/**
 * Level Of Education import functionality
 * Handles Firebase update and logging for level of education import
 */

export interface LevelOfEducationImportResult {
    success: boolean;
    importLog: ImportLogModel;
    message: string;
}

/**
 * Imports level of education data and creates import log
 * @param levelOfEducationData - Validated level of education data to import
 * @param actorName - Name of the user performing the import
 * @param actorID - ID of the user performing the import
 * @returns LevelOfEducationImportResult with success status and import log
 */
export async function importLevelOfEducationData(
    levelOfEducationData: Record<string, any>[],
    actorName: string,
    actorID: string,
): Promise<LevelOfEducationImportResult> {
    try {
        if (!levelOfEducationData.length) {
            throw new Error("No level of education data to import");
        }

        // Import level of education using the import service
        const importResult =
            await LevelOfEducationImportService.batchImportLevelOfEducation(levelOfEducationData);

        // Create import log
        const importedData: ImportDataModel = {
            totalRows: levelOfEducationData.length,
            successfulRows: importResult.successful,
            failedRows: importResult.failed,
            summary: `Imported ${importResult.successful} of ${levelOfEducationData.length} level of education successfully`,
            importedRecords: [],
            failureDetails: [],
        };

        // Add imported records for successful imports
        if (importResult.successful > 0) {
            for (let i = 0; i < levelOfEducationData.length; i++) {
                if (i < importResult.successful) {
                    // Assuming successful records are first
                    importedData.importedRecords.push({
                        rowNumber: i + 1,
                        rowData: levelOfEducationData[i],
                        importedData: levelOfEducationData[i], // This should be the processed data, but for now using original
                    });
                }
            }
        }

        // Only include failureDetails if there are errors
        if (importResult.errors.length > 0) {
            importedData.failureDetails = importResult.errors.map((error, index) => ({
                rowNumber: index + 1,
                rowData: levelOfEducationData[index] || {},
                errorMessage: error,
                fieldErrors: {},
            }));
        }

        const importLog: ImportLogModel = {
            id: `import_level_of_education_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: getTimestamp(),
            type: "level-of-education",
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
                    ? `Successfully imported ${importResult.successful} level of education`
                    : `Level of education import completed with ${importResult.failed} failures out of ${levelOfEducationData.length} records`,
        };
    } catch (error) {
        console.error("Error in level of education import process:", error);

        // Create failure log
        const failureLog: ImportLogModel = {
            id: `import_level_of_education_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: getTimestamp(),
            type: "level-of-education",
            actorName,
            actorID,
            status: "failure",
            importedData: {
                totalRows: levelOfEducationData.length,
                successfulRows: 0,
                failedRows: levelOfEducationData.length,
                summary: `Level of education import failed: ${error instanceof Error ? error.message : "Unknown error"}`,
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
                    : "An unexpected error occurred during level of education import",
        };
    }
}
