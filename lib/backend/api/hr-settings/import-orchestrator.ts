import { ImportLogModel } from "@/lib/models/import-log";
import { HrSettingsByType } from "@/context/firestore-context";
import { getTimestamp } from "@/lib/util/dayjs_format";
import { ImportLogService } from "./import-log-service";
import { EmployeeImportService } from "./employee-import-service";
import { BalanceLeaveImportService } from "./balance-leave-import-service";
import { OvertimeRequestImportService } from "./overtime-request-import-service";

/**
 * Import Orchestrator - Coordinates main batch import operations
 * Acts as the main entry point for all import operations and manages the workflow
 */
export class ImportOrchestrator {
    /**
     * Generic batch import function that routes to appropriate service
     */
    static async batchImport(
        importType: string,
        data: Record<string, any>[],
        actorName: string,
        actorID: string,
        hrSettings?: HrSettingsByType,
    ): Promise<ImportLogModel> {
        let result: {
            successful: number;
            failed: number;
            errors: string[];
            created?: number;
            updated?: number;
            importedRecords?: any[];
        };

        try {
            switch (importType) {
                case "employee":
                case "employee-upsert":
                    result = await EmployeeImportService.batchImportEmployees(
                        data as any[],
                        hrSettings,
                    );
                    break;
                case "balance-leave-days":
                    result = await BalanceLeaveImportService.batchImportBalanceLeaveDays(
                        data as any[],
                    );
                    break;
                case "overtime-request":
                    result = await OvertimeRequestImportService.batchImportOvertimeRequests(
                        data as any[],
                        actorID,
                        hrSettings,
                    );
                    break;
                default:
                    throw new Error(`Unsupported import type: ${importType}`);
            }

            // Create import log
            const importedData: any = {
                totalRows: data.length,
                successfulRows: result.successful,
                failedRows: result.failed,
                summary: `Imported ${result.successful} of ${data.length} records successfully`,
            };

            // Include create/update breakdown for employee imports
            if (
                importType === "employee" &&
                result.created !== undefined &&
                result.updated !== undefined
            ) {
                importedData.created = result.created;
                importedData.updated = result.updated;
                importedData.summary = `Created ${result.created} and updated ${result.updated} of ${data.length} employee records successfully`;
            }

            // Only include failureDetails if there are errors
            if (result.errors.length > 0) {
                importedData.failureDetails = result.errors.map((error, index) => ({
                    rowNumber: index + 1,
                    rowData: {},
                    errorMessage: error,
                    fieldErrors: {},
                }));
            }

            // Include importedRecords if available from the batch import result (currently only for employee imports)
            if (
                importType === "employee" &&
                (result as any).importedRecords &&
                (result as any).importedRecords.length > 0
            ) {
                importedData.importedRecords = (result as any).importedRecords.map(
                    (record: any) => ({
                        rowNumber: record.rowNumber,
                        rowData: record.rowData,
                        employeeData: record.employeeData,
                        operation: record.operation, // Include operation type (created/updated)
                    }),
                );
            }

            const importLog: ImportLogModel = {
                id: `temp-${importType}-${Date.now()}`, // Temporary ID, will be replaced by Firebase-generated ID
                timestamp: getTimestamp(),
                type: importType,
                actorName,
                actorID,
                status: result.failed === 0 ? "success" : "failure",
                importedData,
            };

            // Save the import log (createImportLog will handle Firebase ID generation)
            const logId = await ImportLogService.createImportLog(importLog);
            importLog.id = logId;

            return importLog;
        } catch (error) {
            console.error("Error in batch import:", error);

            // Create failure log
            const failureLog: ImportLogModel = {
                id: `temp-${importType}-${Date.now()}`, // Temporary ID, will be replaced by Firebase-generated ID
                timestamp: getTimestamp(),
                type: importType,
                actorName,
                actorID,
                status: "failure",
                importedData: {
                    totalRows: data.length,
                    successfulRows: 0,
                    failedRows: data.length,
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
                    summary: `Import failed: ${error instanceof Error ? error.message : "Unknown error"}`,
                },
            };

            const logId = await ImportLogService.createImportLog(failureLog);
            failureLog.id = logId;

            return failureLog;
        }
    }
}
