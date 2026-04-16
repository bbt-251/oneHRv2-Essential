import { ImportService } from "@/lib/backend/api/hr-settings/import-service";
import { HiringNeedTypeImportService } from "@/lib/backend/api/hr-settings/hiring-need-type-import-service";
import { ImportLogModel, ImportDataModel } from "@/lib/models/import-log";
import { getTimestamp } from "@/lib/util/dayjs_format";

/**
 * Hiring Need Type import functionality
 * Handles Firebase update and logging for hiring need type import
 */

export interface HiringNeedTypeImportResult {
    success: boolean;
    importLog: ImportLogModel;
    message: string;
}

/**
 * Imports hiring need type data and creates import log
 * @param hiringNeedTypeData - Validated hiring need type data to import
 * @param actorName - Name of the user performing the import
 * @param actorID - ID of the user performing the import
 * @returns HiringNeedTypeImportResult with success status and import log
 */
export async function importHiringNeedTypeData(
    hiringNeedTypeData: Record<string, any>[],
    actorName: string,
    actorID: string,
): Promise<HiringNeedTypeImportResult> {
    try {
        if (!hiringNeedTypeData.length) {
            throw new Error("No hiring need type data to import");
        }

        // Import hiring need types using the import service
        const importResult =
            await HiringNeedTypeImportService.batchImportHiringNeedTypes(hiringNeedTypeData);

        // Create import log
        const importedData: ImportDataModel = {
            totalRows: hiringNeedTypeData.length,
            successfulRows: importResult.successful,
            failedRows: importResult.failed,
            summary: `Imported ${importResult.successful} of ${hiringNeedTypeData.length} hiring need types successfully`,
            importedRecords: [],
            failureDetails: [],
        };

        // Add imported records for successful imports
        if (importResult.successful > 0) {
            for (let i = 0; i < hiringNeedTypeData.length; i++) {
                if (i < importResult.successful) {
                    // Assuming successful records are first
                    importedData.importedRecords.push({
                        rowNumber: i + 1,
                        rowData: hiringNeedTypeData[i],
                        importedData: hiringNeedTypeData[i], // This should be the processed data, but for now using original
                    });
                }
            }
        }

        // Only include failureDetails if there are errors
        if (importResult.errors.length > 0) {
            importedData.failureDetails = importResult.errors.map((error, index) => ({
                rowNumber: index + 1,
                rowData: hiringNeedTypeData[index] || {},
                errorMessage: error,
                fieldErrors: {},
            }));
        }

        const importLog: ImportLogModel = {
            id: `import_hiring_need_type_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: getTimestamp(),
            type: "hiring-need-type",
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
                    ? `Successfully imported ${importResult.successful} hiring need types`
                    : `Hiring need type import completed with ${importResult.failed} failures out of ${hiringNeedTypeData.length} records`,
        };
    } catch (error) {
        console.error("Error in hiring need type import process:", error);

        // Create failure log
        const failureLog: ImportLogModel = {
            id: `import_hiring_need_type_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: getTimestamp(),
            type: "hiring-need-type",
            actorName,
            actorID,
            status: "failure",
            importedData: {
                totalRows: hiringNeedTypeData.length,
                successfulRows: 0,
                failedRows: hiringNeedTypeData.length,
                summary: `Hiring need type import failed: ${error instanceof Error ? error.message : "Unknown error"}`,
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
                    : "An unexpected error occurred during hiring need type import",
        };
    }
}
