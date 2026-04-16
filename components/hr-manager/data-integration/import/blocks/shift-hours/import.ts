import dayjs from "dayjs";
import { ImportService } from "@/lib/backend/api/hr-settings/import-service";
import { ImportLogModel, ImportDataModel } from "@/lib/models/import-log";
import { getTimestamp } from "@/lib/util/dayjs_format";
import { ShiftHoursImportService } from "@/lib/backend/api/hr-settings/shift-hours-import-service";

/**
 * Shift hours import functionality
 */
export interface ShiftHoursImportResult {
    success: boolean;
    importLog: ImportLogModel;
    message: string;
}

/**
 * Imports shift hours data and creates import log
 */
export async function importShiftHoursData(
    shiftHoursData: Record<string, any>[],
    actorName: string,
    actorID: string,
): Promise<ShiftHoursImportResult> {
    try {
        if (!shiftHoursData.length) {
            throw new Error("No shift hours data to import");
        }

        // Convert CSV data to shift hours objects
        const shiftHours = shiftHoursData.map(data => convertShiftHoursData(data));

        // Import shift hours using batch service
        const importResult = await ShiftHoursImportService.batchImportShiftHours(shiftHours);

        // Create import log
        const importedData: ImportDataModel = {
            totalRows: shiftHoursData.length,
            successfulRows: importResult.successful,
            failedRows: importResult.failed,
            summary: `Imported ${importResult.successful} of ${shiftHoursData.length} shift hours successfully`,
            failureDetails: [],
            importedRecords: [],
        };

        if (importResult.errors.length > 0) {
            importedData.failureDetails = importResult.errors.map((error, index) => ({
                rowNumber: index + 1,
                rowData: shiftHoursData[index] || {},
                errorMessage: error,
                fieldErrors: {},
            }));
        }

        const importLog: ImportLogModel = {
            id: `import_shift_hours_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: getTimestamp(),
            type: "shift-hours",
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
                    ? `Successfully imported ${importResult.successful} shift hours`
                    : `Shift hours import completed with ${importResult.failed} failures out of ${shiftHoursData.length} records`,
        };
    } catch (error) {
        console.error("Error in shift hours import process:", error);

        const failureLog: ImportLogModel = {
            id: `import_shift_hours_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: getTimestamp(),
            type: "shift-hours",
            actorName,
            actorID,
            status: "failure",
            importedData: {
                totalRows: shiftHoursData.length,
                successfulRows: 0,
                failedRows: shiftHoursData.length,
                summary: `Shift hours import failed: ${error instanceof Error ? error.message : "Unknown error"}`,
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
                    : "An unexpected error occurred during shift hours import",
        };
    }
}

/**
 * Convert CSV row data to shift hours object
 */
function convertShiftHoursData(data: Record<string, any>): any {
    const shiftHours: { startTime: string; endTime: string }[] = [];

    // Extract all shift hour divisions from the row
    const divisionKeys = Object.keys(data).filter(key => key.startsWith("shiftHourDivision-"));
    divisionKeys.sort(); // Ensure consistent ordering

    for (const key of divisionKeys) {
        const value = data[key];
        if (value && String(value).trim() !== "") {
            const division = parseShiftHourDivisionForImport(String(value).trim());
            if (division) {
                shiftHours.push(division);
            }
        }
    }

    return {
        name: data.name,
        shiftHours,
        active: normalizeActive(data.active),
        timestamp: getTimestamp(),
    };
}

/**
 * Parse shift hour division string for import (similar to validator but simpler)
 */
function parseShiftHourDivisionForImport(
    value: string,
): { startTime: string; endTime: string } | null {
    const parts = value.split(/[-–—]/).map(p => p.trim());
    if (parts.length !== 2) {
        return null;
    }

    const startTime = parseTimeStringForImport(parts[0]);
    const endTime = parseTimeStringForImport(parts[1]);

    if (!startTime || !endTime) {
        return null;
    }

    return { startTime, endTime };
}

/**
 * Parse time string for import (returns "hh:mm A" format)
 */
function parseTimeStringForImport(timeStr: string): string | null {
    const trimmed = timeStr.trim();

    // Try parsing as 12-hour format with AM/PM
    let parsed = dayjs(trimmed, "hh:mm A", true);
    if (parsed.isValid()) {
        return parsed.format("hh:mm A");
    }

    // Try parsing as 24-hour format
    parsed = dayjs(trimmed, "HH:mm", true);
    if (parsed.isValid()) {
        return parsed.format("hh:mm A");
    }

    // Try parsing as 12-hour without leading zero
    parsed = dayjs(trimmed, "h:mm A", true);
    if (parsed.isValid()) {
        return parsed.format("hh:mm A");
    }

    return null;
}

/**
 * Normalize active field to "Yes" | "No"
 */
function normalizeActive(active: any): "Yes" | "No" {
    if (typeof active === "string") {
        const normalized = active.trim().toLowerCase();
        return normalized === "yes" ? "Yes" : "No";
    }
    return "No";
}
