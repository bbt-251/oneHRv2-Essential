import { ImportService } from "@/lib/backend/api/hr-settings/import-service";
import { BalanceLeaveImportService } from "@/lib/backend/api/hr-settings/balance-leave-import-service";
import { ImportLogModel } from "@/lib/models/import-log";
import { getTimestamp } from "@/lib/util/dayjs_format";

/**
 * Balance Leave Days import functionality
 * Handles Firebase update and logging for employee leave balance import
 */

export interface BalanceLeaveDaysImportResult {
    success: boolean;
    importLog: ImportLogModel;
    message: string;
}

/**
 * Imports balance leave days data and creates import log
 * @param balanceData - Validated leave balance data to import
 * @param actorName - Name of the user performing the import
 * @param actorID - ID of the user performing the import
 * @returns BalanceLeaveDaysImportResult with success status and import log
 */
export async function importBalanceLeaveDaysData(
    balanceData: Record<string, any>[],
    actorName: string,
    actorID: string,
): Promise<BalanceLeaveDaysImportResult> {
    try {
        if (!balanceData.length) {
            throw new Error("No balance leave days data to import");
        }

        // Import balance leave days using the import service
        const importResult = await BalanceLeaveImportService.batchImportBalanceLeaveDays(
            balanceData.map(data => ({
                employeeID: data.employeeID,
                balanceLeaveDays: Number(data.balanceLeaveDays),
                accrualLeaveDays:
                    data.accrualLeaveDays !== undefined ? Number(data.accrualLeaveDays) : undefined,
            })),
        );

        // Create import log
        const importedData: any = {
            totalRows: balanceData.length,
            successfulRows: importResult.successful,
            failedRows: importResult.failed,
            summary: `Updated leave balances for ${importResult.successful} of ${balanceData.length} employees`,
        };

        // Only include failureDetails if there are errors
        if (importResult.errors.length > 0) {
            importedData.failureDetails = importResult.errors.map((error, index) => ({
                rowNumber: index + 1,
                rowData: balanceData[index] || {},
                errorMessage: error,
                fieldErrors: {},
            }));
        }

        const importLog: ImportLogModel = {
            id: `import_balance_leave_days_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: getTimestamp(),
            type: "balance-leave-days",
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
                    ? `Successfully updated leave balances for ${importResult.successful} employees`
                    : `Leave balance import completed with ${importResult.failed} failures out of ${balanceData.length} records`,
        };
    } catch (error) {
        console.error("Error in balance leave days import process:", error);

        // Create failure log
        const failureLog: ImportLogModel = {
            id: `import_balance_leave_days_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: getTimestamp(),
            type: "balance-leave-days",
            actorName,
            actorID,
            status: "failure",
            importedData: {
                totalRows: balanceData.length,
                successfulRows: 0,
                failedRows: balanceData.length,
                summary: `Balance leave days import failed: ${error instanceof Error ? error.message : "Unknown error"}`,
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
                    : "An unexpected error occurred during balance leave days import",
        };
    }
}
