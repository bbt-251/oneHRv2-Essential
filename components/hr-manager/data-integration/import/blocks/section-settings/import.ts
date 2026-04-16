import { HrSettingsByType } from "@/context/firestore-context";
import { ImportService } from "@/lib/backend/api/hr-settings/import-service";
import { SectionSettingsImportService } from "@/lib/backend/api/hr-settings/section-settings-import-service";
import { EmployeeModel } from "@/lib/models/employee";
import { ImportDataModel, ImportLogModel } from "@/lib/models/import-log";
import { getTimestamp } from "@/lib/util/dayjs_format";

/**
 * Section Settings import functionality
 * Handles Firebase update and logging for section settings import
 */

export interface SectionSettingsImportResult {
    success: boolean;
    importLog: ImportLogModel;
    message: string;
}

/**
 * Imports section settings data and creates import log
 * @param sectionData - Validated section data to import
 * @param actorName - Name of the user performing the import
 * @param actorID - ID of the user performing the import
 * @param hrSettings - HR settings for reference field conversion
 * @param employees - Employee data for supervisor reference resolution
 * @returns SectionSettingsImportResult with success status and import log
 */
export async function importSectionSettingsData(
    sectionData: Record<string, any>[],
    actorName: string,
    actorID: string,
    hrSettings?: HrSettingsByType,
    employees?: EmployeeModel[],
): Promise<SectionSettingsImportResult> {
    try {
        if (!sectionData.length) {
            throw new Error("No section settings data to import");
        }

        // Import section settings using the import service
        const importResult = await SectionSettingsImportService.batchImportSectionSettings(
            sectionData,
            { hrSettings, employees },
        );

        // Create import log
        const importedData: ImportDataModel = {
            totalRows: sectionData.length,
            successfulRows: importResult.successful,
            failedRows: importResult.failed,
            summary: `Imported ${importResult.successful} of ${sectionData.length} section settings successfully`,
            importedRecords: [],
            failureDetails: [],
        };

        // Add imported records for successful imports
        if (importResult.successful > 0) {
            for (let i = 0; i < sectionData.length; i++) {
                if (i < importResult.successful) {
                    // Assuming successful records are first
                    importedData.importedRecords.push({
                        rowNumber: i + 1,
                        rowData: sectionData[i],
                        importedData: sectionData[i], // This should be the processed data, but for now using original
                    });
                }
            }
        }

        // Only include failureDetails if there are errors
        if (importResult.errors.length > 0) {
            importedData.failureDetails = importResult.errors.map((error, index) => ({
                rowNumber: index + 1,
                rowData: sectionData[index] || {},
                errorMessage: error,
                fieldErrors: {},
            }));
        }

        const importLog: ImportLogModel = {
            id: `import_section_settings_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: getTimestamp(),
            type: "section-settings",
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
                    ? `Successfully imported ${importResult.successful} section settings`
                    : `Section settings import completed with ${importResult.failed} failures out of ${sectionData.length} records`,
        };
    } catch (error) {
        console.error("Error in section settings import process:", error);

        // Create failure log
        const failureLog: ImportLogModel = {
            id: `import_section_settings_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: getTimestamp(),
            type: "section-settings",
            actorName,
            actorID,
            status: "failure",
            importedData: {
                totalRows: sectionData.length,
                successfulRows: 0,
                failedRows: sectionData.length,
                summary: `Section settings import failed: ${error instanceof Error ? error.message : "Unknown error"}`,
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
                    : "An unexpected error occurred during section settings import",
        };
    }
}
