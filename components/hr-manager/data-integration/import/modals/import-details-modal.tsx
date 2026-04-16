"use client";

import { useTheme } from "@/components/theme-provider";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, AlertTriangle, CheckCircle } from "lucide-react";
import { ImportLogModel } from "@/lib/models/import-log";

interface ImportDetailsModalProps {
    log: ImportLogModel;
}

export default function ImportDetailsModal({ log }: ImportDetailsModalProps) {
    const { theme } = useTheme();

    const cardClasses = theme === "dark" ? "bg-black border-gray-700" : "bg-white border-gray-200";
    const textPrimaryClasses = theme === "dark" ? "text-white" : "text-gray-900";
    const textSecondaryClasses = theme === "dark" ? "text-gray-300" : "text-gray-600";
    const textMutedClasses = theme === "dark" ? "text-gray-400" : "text-gray-500";
    const borderClasses = theme === "dark" ? "border-gray-700" : "border-gray-200";

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="ml-2">
                    <Eye className="w-4 h-4 mr-1" />
                    Details
                </Button>
            </DialogTrigger>
            <DialogContent className={`max-w-6xl max-h-[80vh] overflow-y-auto ${cardClasses}`}>
                <DialogHeader>
                    <DialogTitle className={textPrimaryClasses}>
                        Import Details - {log.type}
                    </DialogTitle>
                    <DialogDescription className={textSecondaryClasses}>
                        Detailed information about the import operation
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Summary Section */}
                    <div>
                        <h4 className={`font-semibold ${textPrimaryClasses} mb-3`}>Summary</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className={`p-3 rounded-lg border ${borderClasses}`}>
                                <p className={`text-sm ${textMutedClasses}`}>Total Rows</p>
                                <p className={`text-lg font-semibold ${textPrimaryClasses}`}>
                                    {log.importedData.totalRows}
                                </p>
                            </div>
                            <div className={`p-3 rounded-lg border ${borderClasses}`}>
                                <p className={`text-sm ${textMutedClasses}`}>Successful</p>
                                <p
                                    className={`text-lg font-semibold ${theme === "dark" ? "text-green-400" : "text-green-600"}`}
                                >
                                    {log.importedData.successfulRows}
                                </p>
                            </div>
                            <div className={`p-3 rounded-lg border ${borderClasses}`}>
                                <p className={`text-sm ${textMutedClasses}`}>Failed</p>
                                <p
                                    className={`text-lg font-semibold ${theme === "dark" ? "text-red-400" : "text-red-600"}`}
                                >
                                    {log.importedData.failedRows}
                                </p>
                            </div>
                            <div className={`p-3 rounded-lg border ${borderClasses}`}>
                                <p className={`text-sm ${textMutedClasses}`}>Status</p>
                                <Badge
                                    variant={log.status === "success" ? "default" : "destructive"}
                                >
                                    {log.status === "success" ? "Success" : "Failed"}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    {/* Actor Information */}
                    <div>
                        <h4 className={`font-semibold ${textPrimaryClasses} mb-3`}>
                            Import Information
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className={`text-sm ${textMutedClasses}`}>Performed by</p>
                                <p className={`font-medium ${textPrimaryClasses}`}>
                                    {log.actorName}
                                </p>
                            </div>
                            <div>
                                <p className={`text-sm ${textMutedClasses}`}>Timestamp</p>
                                <p className={`font-medium ${textPrimaryClasses}`}>
                                    {log.timestamp}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Success Details - Show imported data even on success */}
                    {log.status === "success" && (
                        <div>
                            <h4
                                className={`font-semibold ${textPrimaryClasses} mb-3 flex items-center`}
                            >
                                <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                                Success Details
                            </h4>
                            <div
                                className={`p-4 rounded-lg border ${borderClasses} ${theme === "dark" ? "bg-green-900/10" : "bg-green-50"}`}
                            >
                                <p
                                    className={`${theme === "dark" ? "text-green-400" : "text-green-600"} mb-3`}
                                >
                                    {log.importedData.summary}
                                </p>

                                {/* Show successful import details */}
                                <div className="mt-4">
                                    <p className={`text-sm font-medium ${textPrimaryClasses} mb-2`}>
                                        Import Summary:
                                    </p>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <div className={`p-2 rounded border ${borderClasses}`}>
                                            <p className={`text-xs ${textMutedClasses}`}>
                                                Records Processed
                                            </p>
                                            <p className={`font-semibold ${textPrimaryClasses}`}>
                                                {log.importedData.totalRows}
                                            </p>
                                        </div>
                                        <div className={`p-2 rounded border ${borderClasses}`}>
                                            <p className={`text-xs ${textMutedClasses}`}>
                                                Successfully Imported
                                            </p>
                                            <p
                                                className={`font-semibold ${theme === "dark" ? "text-green-400" : "text-green-600"}`}
                                            >
                                                {log.importedData.successfulRows}
                                            </p>
                                        </div>
                                        <div className={`p-2 rounded border ${borderClasses}`}>
                                            <p className={`text-xs ${textMutedClasses}`}>
                                                Success Rate
                                            </p>
                                            <p
                                                className={`font-semibold ${theme === "dark" ? "text-green-400" : "text-green-600"}`}
                                            >
                                                {Math.round(
                                                    (log.importedData.successfulRows /
                                                        log.importedData.totalRows) *
                                                        100,
                                                )}
                                                %
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Show imported data records in table format */}
                                {log.importedData.importedRecords &&
                                    log.importedData.importedRecords.length > 0 && (
                                    <div className="mt-6">
                                        <h5
                                            className={`text-sm font-semibold ${textPrimaryClasses} mb-3`}
                                        >
                                                Imported Records (
                                            {log.importedData.importedRecords.length} records):
                                        </h5>
                                        <div
                                            className={`border ${borderClasses} rounded overflow-x-auto max-h-96 overflow-y-auto`}
                                        >
                                            <table
                                                className={`w-full text-xs ${theme === "dark" ? "bg-gray-800" : "bg-gray-50"}`}
                                            >
                                                <thead
                                                    className={`sticky top-0 ${theme === "dark" ? "bg-gray-700" : "bg-gray-200"}`}
                                                >
                                                    <tr>
                                                        <th
                                                            className={`px-3 py-2 text-left ${textPrimaryClasses} font-medium`}
                                                        >
                                                                Row
                                                        </th>
                                                        {(() => {
                                                            // Get all unique keys from the imported records to create dynamic columns
                                                            const allKeys = new Set<string>();
                                                            log.importedData.importedRecords?.forEach(
                                                                record => {
                                                                    // Add keys from importedData (processed data)
                                                                    if (
                                                                        record.importedData &&
                                                                            typeof record.importedData ===
                                                                                "object"
                                                                    ) {
                                                                        Object.keys(
                                                                            record.importedData,
                                                                        ).forEach(key =>
                                                                            allKeys.add(key),
                                                                        );
                                                                    }
                                                                    // Add keys from rowData (original CSV data)
                                                                    if (
                                                                        record.rowData &&
                                                                            typeof record.rowData ===
                                                                                "object"
                                                                    ) {
                                                                        Object.keys(
                                                                            record.rowData,
                                                                        ).forEach(key =>
                                                                            allKeys.add(key),
                                                                        );
                                                                    }
                                                                },
                                                            );

                                                            // Convert to array and sort for consistent column order
                                                            const sortedKeys =
                                                                    Array.from(allKeys).sort();

                                                            return sortedKeys.map(key => (
                                                                <th
                                                                    key={key}
                                                                    className={`px-3 py-2 text-left ${textPrimaryClasses} font-medium`}
                                                                >
                                                                    {key
                                                                        .charAt(0)
                                                                        .toUpperCase() +
                                                                            key
                                                                                .slice(1)
                                                                                .replace(
                                                                                    /([A-Z])/g,
                                                                                    " $1",
                                                                                )}
                                                                </th>
                                                            ));
                                                        })()}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {log.importedData.importedRecords.map(
                                                        (record, index) => (
                                                            <tr
                                                                key={index}
                                                                className={`${theme === "dark" ? "hover:bg-gray-700 border-gray-600" : "hover:bg-gray-100"} border-b`}
                                                            >
                                                                <td
                                                                    className={`px-3 py-2 ${textSecondaryClasses}`}
                                                                >
                                                                    {record.rowNumber}
                                                                </td>
                                                                {(() => {
                                                                    // Get all unique keys from the imported records
                                                                    const allKeys =
                                                                            new Set<string>();
                                                                    log.importedData.importedRecords?.forEach(
                                                                        record => {
                                                                            if (
                                                                                record.importedData &&
                                                                                    typeof record.importedData ===
                                                                                        "object"
                                                                            ) {
                                                                                Object.keys(
                                                                                    record.importedData,
                                                                                ).forEach(key =>
                                                                                    allKeys.add(
                                                                                        key,
                                                                                    ),
                                                                                );
                                                                            }
                                                                            if (
                                                                                record.rowData &&
                                                                                    typeof record.rowData ===
                                                                                        "object"
                                                                            ) {
                                                                                Object.keys(
                                                                                    record.rowData,
                                                                                ).forEach(key =>
                                                                                    allKeys.add(
                                                                                        key,
                                                                                    ),
                                                                                );
                                                                            }
                                                                        },
                                                                    );

                                                                    const sortedKeys =
                                                                            Array.from(
                                                                                allKeys,
                                                                            ).sort();

                                                                    return sortedKeys.map(
                                                                        key => {
                                                                            // Prefer importedData value, fallback to rowData
                                                                            let value =
                                                                                    (
                                                                                        record.importedData as any
                                                                                    )?.[key] ??
                                                                                    (
                                                                                        record.rowData as any
                                                                                    )?.[key] ??
                                                                                    "N/A";

                                                                            // Format boolean values
                                                                            if (
                                                                                typeof value ===
                                                                                    "boolean"
                                                                            ) {
                                                                                value = value
                                                                                    ? "Yes"
                                                                                    : "No";
                                                                            }

                                                                            // Format null/undefined
                                                                            if (
                                                                                value ===
                                                                                        null ||
                                                                                    value ===
                                                                                        undefined
                                                                            ) {
                                                                                value = "N/A";
                                                                            }

                                                                            return (
                                                                                <td
                                                                                    key={key}
                                                                                    className={`px-3 py-2 ${textSecondaryClasses}`}
                                                                                >
                                                                                    {String(
                                                                                        value,
                                                                                    )}
                                                                                </td>
                                                                            );
                                                                        },
                                                                    );
                                                                })()}
                                                            </tr>
                                                        ),
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Failure Details */}
                    {log.status === "failure" && log.importedData.failureDetails && (
                        <div>
                            <h4
                                className={`font-semibold ${textPrimaryClasses} mb-3 flex items-center`}
                            >
                                <AlertTriangle className="w-4 h-4 mr-2 text-red-500" />
                                Failure Details
                            </h4>
                            <div className="space-y-4">
                                {log.importedData.failureDetails.map((failure, index) => (
                                    <div
                                        key={index}
                                        className={`p-4 rounded-lg border ${borderClasses} ${theme === "dark" ? "bg-red-900/10" : "bg-red-50"}`}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <Badge
                                                variant="outline"
                                                className="text-red-600 border-red-600"
                                            >
                                                Row {failure.rowNumber}
                                            </Badge>
                                        </div>
                                        <p
                                            className={`text-sm font-medium ${theme === "dark" ? "text-red-400" : "text-red-600"} mb-2`}
                                        >
                                            {failure.errorMessage}
                                        </p>

                                        {/* Row Data */}
                                        <div className="mb-3">
                                            <p className={`text-xs ${textMutedClasses} mb-1`}>
                                                Row Data:
                                            </p>
                                            <div
                                                className={`p-2 rounded text-xs font-mono ${theme === "dark" ? "bg-gray-800" : "bg-gray-100"}`}
                                            >
                                                {JSON.stringify(failure.rowData, null, 2)}
                                            </div>
                                        </div>

                                        {/* Field Errors */}
                                        {Object.keys(failure.fieldErrors).length > 0 && (
                                            <div>
                                                <p className={`text-xs ${textMutedClasses} mb-1`}>
                                                    Field Errors:
                                                </p>
                                                <div className="space-y-1">
                                                    {Object.entries(failure.fieldErrors).map(
                                                        ([field, error]) => (
                                                            <div
                                                                key={field}
                                                                className="flex items-start space-x-2"
                                                            >
                                                                <Badge
                                                                    variant="outline"
                                                                    className="text-xs"
                                                                >
                                                                    {field}
                                                                </Badge>
                                                                <span
                                                                    className={`text-xs ${textSecondaryClasses}`}
                                                                >
                                                                    {error}
                                                                </span>
                                                            </div>
                                                        ),
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
