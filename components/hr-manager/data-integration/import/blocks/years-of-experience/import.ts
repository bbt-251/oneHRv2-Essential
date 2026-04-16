import { ImportService } from "@/lib/backend/api/hr-settings/import-service";
import { YearsOfExperienceImportService } from "@/lib/backend/api/hr-settings/years-of-experience-import-service";
import { ImportLogModel, ImportDataModel } from "@/lib/models/import-log";
import { getTimestamp } from "@/lib/util/dayjs_format";

/**
 * Years Of Experience import functionality
 * Handles Firebase update and logging for years of experience import
 */

export interface YearsOfExperienceImportResult {
    success: boolean;
    importLog: ImportLogModel;
    message: string;
}

/**
 * Imports years of experience data and creates import log
 * @param yearsOfExperienceData - Validated years of experience data to import
 * @param actorName - Name of the user performing the import
 * @param actorID - ID of the user performing the import
 * @returns YearsOfExperienceImportResult with success status and import log
 */
export async function importYearsOfExperienceData(
    yearsOfExperienceData: Record<string, any>[],
    actorName: string,
    actorID: string,
): Promise<YearsOfExperienceImportResult> {
    try {
        if (!yearsOfExperienceData.length) {
            throw new Error("No years of experience data to import");
        }

        // Import years of experience using the import service
        const importResult =
            await YearsOfExperienceImportService.batchImportYearsOfExperience(
                yearsOfExperienceData,
            );

        // Create import log
        const importedData: ImportDataModel = {
            totalRows: yearsOfExperienceData.length,
            successfulRows: importResult.successful,
            failedRows: importResult.failed,
            summary: `Imported ${importResult.successful} of ${yearsOfExperienceData.length} years of experience successfully`,
            importedRecords: [],
            failureDetails: [],
        };

        // Add imported records for successful imports
        if (importResult.successful > 0) {
            for (let i = 0; i < yearsOfExperienceData.length; i++) {
                if (i < importResult.successful) {
                    // Assuming successful records are first
                    importedData.importedRecords.push({
                        rowNumber: i + 1,
                        rowData: yearsOfExperienceData[i],
                        importedData: yearsOfExperienceData[i], // This should be the processed data, but for now using original
                    });
                }
            }
        }

        // Only include failureDetails if there are errors
        if (importResult.errors.length > 0) {
            importedData.failureDetails = importResult.errors.map((error, index) => ({
                rowNumber: index + 1,
                rowData: yearsOfExperienceData[index] || {},
                errorMessage: error,
                fieldErrors: {},
            }));
        }

        const importLog: ImportLogModel = {
            id: `import_years_of_experience_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: getTimestamp(),
            type: "years-of-experience",
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
                    ? `Successfully imported ${importResult.successful} years of experience`
                    : `Years of experience import completed with ${importResult.failed} failures out of ${yearsOfExperienceData.length} records`,
        };
    } catch (error) {
        console.error("Error in years of experience import process:", error);

        // Create failure log
        const failureLog: ImportLogModel = {
            id: `import_years_of_experience_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: getTimestamp(),
            type: "years-of-experience",
            actorName,
            actorID,
            status: "failure",
            importedData: {
                totalRows: yearsOfExperienceData.length,
                successfulRows: 0,
                failedRows: yearsOfExperienceData.length,
                summary: `Years of experience import failed: ${error instanceof Error ? error.message : "Unknown error"}`,
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
                    : "An unexpected error occurred during years of experience import",
        };
    }
}
