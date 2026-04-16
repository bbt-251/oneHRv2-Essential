import { ImportService } from "@/lib/backend/api/hr-settings/import-service";
import { ShiftTypeImportService } from "@/lib/backend/api/hr-settings/shift-type-import-service";
import { ImportLogModel, ImportDataModel } from "@/lib/models/import-log";
import { getTimestamp, formatDate } from "@/lib/util/dayjs_format";
import { HrSettingsByType } from "@/context/firestore-context";
import { VALID_DAYS_OF_WEEK } from "./fields";

/**
 * Shift Type import functionality
 * Handles Firebase upload and logging for shift type data import
 */

export interface ShiftTypeImportResult {
    success: boolean;
    importLog: ImportLogModel;
    message: string;
}

/**
 * Imports shift type data to Firebase and creates import log
 * @param shiftTypeData - Validated shift type data to import
 * @param actorName - Name of the user performing the import
 * @param actorID - ID of the user performing the import
 * @param hrSettings - HR settings for reference field validation
 * @returns ShiftTypeImportResult with success status and import log
 */
export async function importShiftTypeData(
    shiftTypeData: Record<string, any>[],
    actorName: string,
    actorID: string,
    hrSettings?: HrSettingsByType,
): Promise<ShiftTypeImportResult> {
    try {
        if (!shiftTypeData.length) {
            throw new Error("No shift type data to import");
        }

        // Convert CSV data to shift type objects
        const convertedData = shiftTypeData.map(shiftType => {
            return convertShiftTypeData(shiftType, hrSettings);
        });

        // Import shift types using the import service
        const importResult = await ShiftTypeImportService.batchImportShiftTypes(convertedData);

        // Create import log
        const importedData: ImportDataModel = {
            totalRows: shiftTypeData.length,
            successfulRows: importResult.successful,
            failedRows: importResult.failed,
            summary: `Imported ${importResult.successful} of ${shiftTypeData.length} shift type records successfully`,
            importedRecords: [],
            failureDetails: [],
        };

        // Add failure details if there are errors
        if (importResult.errors.length > 0) {
            importedData.failureDetails = importResult.errors.map(
                (error: string, index: number) => ({
                    rowNumber: index + 1,
                    rowData: shiftTypeData[index] || {},
                    errorMessage: error,
                    fieldErrors: {},
                }),
            );
        }

        const importLog: ImportLogModel = {
            id: `import_shift_type_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: getTimestamp(),
            type: "shift-type",
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
                    ? `Successfully imported ${importResult.successful} shift type records`
                    : `Import completed with ${importResult.failed} failures out of ${shiftTypeData.length} records`,
        };
    } catch (error) {
        console.error("Error in shift type import process:", error);

        // Create failure log
        const failureLog: ImportLogModel = {
            id: `import_shift_type_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: getTimestamp(),
            type: "shift-type",
            actorName,
            actorID,
            status: "failure",
            importedData: {
                totalRows: shiftTypeData.length,
                successfulRows: 0,
                failedRows: shiftTypeData.length,
                summary: `Shift type import failed: ${error instanceof Error ? error.message : "Unknown error"}`,
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
            } as ImportDataModel,
        };

        const logId = await ImportService.createImportLog(failureLog);
        failureLog.id = logId;

        return {
            success: false,
            importLog: failureLog,
            message:
                error instanceof Error
                    ? error.message
                    : "An unexpected error occurred during shift type import",
        };
    }
}

/**
 * Converts shift type data from CSV format to Firebase format
 * Handles field transformations and working days structure creation
 */
function convertShiftTypeData(shiftType: Record<string, any>, hrSettings?: HrSettingsByType): any {
    // Get the parsed working days from validation step (stored in _parsedWorkingDays)
    const parsedDays = shiftType._parsedWorkingDays || [];

    // Create workingDays structure
    const workingDays = parsedDays.map((day: string) => {
        const dayLower = day.toLowerCase();
        const dayFieldName = `${dayLower}ShiftHour`;

        // Check if there's a specific shift hour for this day
        const daySpecificShiftHour = shiftType[dayFieldName];

        // If there's a day-specific shift hour, use it; otherwise use global if provided
        const shiftHourName = daySpecificShiftHour || shiftType.globalShiftHour;

        // Find the shift hour ID by name
        let associatedShiftHour = "";
        if (shiftHourName && hrSettings?.shiftHours) {
            const shiftHour = hrSettings.shiftHours.find((sh: any) => sh.name === shiftHourName);
            associatedShiftHour = shiftHour ? shiftHour.id : "";
        }

        return {
            dayOfTheWeek: day,
            associatedShiftHour: associatedShiftHour,
        };
    });

    // Create the shift type object for Firebase
    const firebaseShiftType = {
        timestamp: getTimestamp(),
        name: shiftType.name,
        workingDays: workingDays,
        startDate: shiftType.startDate ? formatDate(shiftType.startDate) : null,
        endDate: shiftType.endDate ? formatDate(shiftType.endDate) : null,
        active: shiftType.active || "Yes",
    };

    return firebaseShiftType;
}
