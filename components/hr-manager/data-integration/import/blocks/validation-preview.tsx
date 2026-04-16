"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/components/theme-provider";
import { AlertCircle, CheckCircle, Eye, XCircle } from "lucide-react";
import { useState } from "react";
import { EmployeeModel } from "@/lib/models/employee";
import { ImportFailureDetail } from "@/lib/models/import-log";
import { validateOnly } from "./import-handler";
import { ImportField } from "./shared/validation-engine";

interface ValidationPreviewProps {
    file: File;
    importType: string;
    fields: ImportField[];
    employees: EmployeeModel[];
    hrSettings: any;
    onClose: () => void;
}

interface ValidationResult {
    isValid: boolean;
    errors: ImportFailureDetail[];
    totalRows: number;
    validRows: number;
    validRowsData: Record<string, any>[];
}

export default function ValidationPreview({
    file,
    importType,
    fields,
    employees,
    hrSettings,
    onClose,
}: ValidationPreviewProps) {
    const { theme } = useTheme();
    const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
    const [isValidating, setIsValidating] = useState<boolean>(false);
    const [showDetails, setShowDetails] = useState<boolean>(false);

    const handleValidate = async () => {
        setIsValidating(true);
        try {
            const result = await validateOnly(file, importType, fields, employees, hrSettings);
            setValidationResult({
                ...result,
                validRowsData: (result as any).validRowsData || [],
            });
        } catch (error) {
            console.error("Validation error:", error);
            setValidationResult({
                isValid: false,
                errors: [
                    {
                        rowNumber: 1,
                        rowData: {},
                        errorMessage: error instanceof Error ? error.message : "Validation failed",
                        fieldErrors: {},
                    },
                ],
                totalRows: 0,
                validRows: 0,
                validRowsData: [],
            });
        } finally {
            setIsValidating(false);
        }
    };

    const cardClasses = theme === "dark" ? "bg-black border-gray-700" : "bg-white border-gray-200";
    const textPrimaryClasses = theme === "dark" ? "text-white" : "text-gray-900";
    const textSecondaryClasses = theme === "dark" ? "text-gray-300" : "text-gray-600";
    const textMutedClasses = theme === "dark" ? "text-gray-400" : "text-gray-500";
    const borderClasses = theme === "dark" ? "border-gray-700" : "border-gray-200";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className={`${cardClasses} w-full max-w-6xl max-h-[90vh] overflow-hidden`}>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className={`text-xl font-semibold ${textPrimaryClasses}`}>
                                Validation Preview
                            </CardTitle>
                            <CardDescription className={textSecondaryClasses}>
                                Preview validation results before importing
                            </CardDescription>
                        </div>
                        <Button variant="outline" onClick={onClose}>
                            Close
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="space-y-6 overflow-y-auto">
                    {/* File Info */}
                    <div className={`p-4 rounded-lg border ${borderClasses}`}>
                        <h3 className={`font-medium ${textPrimaryClasses} mb-2`}>
                            File Information
                        </h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className={textMutedClasses}>File Name:</span>
                                <span className={`ml-2 ${textSecondaryClasses}`}>{file.name}</span>
                            </div>
                            <div>
                                <span className={textMutedClasses}>Import Type:</span>
                                <span className={`ml-2 ${textSecondaryClasses}`}>{importType}</span>
                            </div>
                            <div>
                                <span className={textMutedClasses}>File Size:</span>
                                <span className={`ml-2 ${textSecondaryClasses}`}>
                                    {(file.size / 1024).toFixed(2)} KB
                                </span>
                            </div>
                            <div>
                                <span className={textMutedClasses}>Fields:</span>
                                <span className={`ml-2 ${textSecondaryClasses}`}>
                                    {fields.length} fields
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Validation Action */}
                    {!validationResult && (
                        <div className="text-center py-8">
                            <Button
                                onClick={handleValidate}
                                disabled={isValidating}
                                className="w-full md:w-auto"
                            >
                                <Eye className="w-4 h-4 mr-2" />
                                {isValidating ? "Validating..." : "Run Validation"}
                            </Button>
                        </div>
                    )}

                    {/* Validation Results */}
                    {validationResult && (
                        <div className="space-y-4">
                            {/* Summary */}
                            <div className={`p-4 rounded-lg border ${borderClasses}`}>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className={`font-medium ${textPrimaryClasses}`}>
                                        Validation Summary
                                    </h3>
                                    <div className="flex items-center space-x-2">
                                        {validationResult.isValid ? (
                                            <CheckCircle className="w-5 h-5 text-green-500" />
                                        ) : (
                                            <XCircle className="w-5 h-5 text-red-500" />
                                        )}
                                        <Badge
                                            variant={
                                                validationResult.isValid ? "default" : "destructive"
                                            }
                                        >
                                            {validationResult.isValid ? "Valid" : "Has Errors"}
                                        </Badge>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4 text-center">
                                    <div>
                                        <div className={`text-2xl font-bold ${textPrimaryClasses}`}>
                                            {validationResult.totalRows}
                                        </div>
                                        <div className={`text-sm ${textMutedClasses}`}>
                                            Total Rows
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-green-500">
                                            {validationResult.validRows}
                                        </div>
                                        <div className={`text-sm ${textMutedClasses}`}>
                                            Valid Rows
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-bold text-red-500">
                                            {validationResult.errors.length}
                                        </div>
                                        <div className={`text-sm ${textMutedClasses}`}>
                                            Error Rows
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Error Details */}
                            {validationResult.errors.length > 0 && (
                                <div className={`p-4 rounded-lg border ${borderClasses}`}>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3
                                            className={`font-medium ${textPrimaryClasses} flex items-center`}
                                        >
                                            <AlertCircle className="w-4 h-4 mr-2 text-red-500" />
                                            Validation Errors
                                        </h3>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setShowDetails(!showDetails)}
                                        >
                                            {showDetails ? "Hide Details" : "Show Details"}
                                        </Button>
                                    </div>

                                    {showDetails && (
                                        <div className="space-y-3 max-h-60 overflow-y-auto">
                                            {validationResult.errors
                                                .slice(0, 10)
                                                .map((error, index) => (
                                                    <div
                                                        key={index}
                                                        className={`p-3 rounded border-l-4 border-red-500 ${
                                                            theme === "dark"
                                                                ? "bg-red-900/20"
                                                                : "bg-red-50"
                                                        }`}
                                                    >
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span
                                                                className={`font-medium ${textPrimaryClasses}`}
                                                            >
                                                                Row {error.rowNumber}
                                                            </span>
                                                            <Badge
                                                                variant="destructive"
                                                                className="text-xs"
                                                            >
                                                                Error
                                                            </Badge>
                                                        </div>
                                                        <p
                                                            className={`text-sm ${textSecondaryClasses} mb-2`}
                                                        >
                                                            {error.errorMessage}
                                                        </p>
                                                        {error.fieldErrors &&
                                                            Object.keys(error.fieldErrors).length >
                                                                0 && (
                                                            <div className="text-xs space-y-1">
                                                                {Object.entries(
                                                                    error.fieldErrors,
                                                                ).map(([field, message]) => (
                                                                    <div
                                                                        key={field}
                                                                        className={
                                                                            textMutedClasses
                                                                        }
                                                                    >
                                                                        <strong>
                                                                            {field}:
                                                                        </strong>{" "}
                                                                        {message}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            {validationResult.errors.length > 10 && (
                                                <div
                                                    className={`text-center py-2 ${textMutedClasses}`}
                                                >
                                                    ... and {validationResult.errors.length - 10}{" "}
                                                    more errors
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Valid Data Preview */}
                            {validationResult.isValid && validationResult.validRows > 0 && (
                                <div className={`p-4 rounded-lg border ${borderClasses}`}>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3
                                            className={`font-medium ${textPrimaryClasses} flex items-center`}
                                        >
                                            <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                                            Valid Data Preview ({validationResult.validRows} rows)
                                        </h3>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setShowDetails(!showDetails)}
                                        >
                                            {showDetails ? "Hide Data" : "Show Data"}
                                        </Button>
                                    </div>

                                    {showDetails && (
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
                                                        {fields.map(field => (
                                                            <th
                                                                key={field.key}
                                                                className={`px-3 py-2 text-left ${textPrimaryClasses} font-medium`}
                                                            >
                                                                {field.label}
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {validationResult.validRowsData &&
                                                    validationResult.validRowsData.length > 0 ? (
                                                            validationResult.validRowsData.map(
                                                                (row, index) => (
                                                                    <tr
                                                                        key={index}
                                                                        className={`${theme === "dark" ? "hover:bg-gray-700 border-gray-600" : "hover:bg-gray-100"} border-b`}
                                                                    >
                                                                        <td
                                                                            className={`px-3 py-2 ${textSecondaryClasses}`}
                                                                        >
                                                                            {index + 1}
                                                                        </td>
                                                                        {fields.map(field => (
                                                                            <td
                                                                                key={field.key}
                                                                                className={`px-3 py-2 ${textSecondaryClasses}`}
                                                                            >
                                                                                {row[field.key] !==
                                                                                undefined &&
                                                                            row[field.key] !==
                                                                                null &&
                                                                            String(
                                                                                row[field.key],
                                                                            ).trim() !== ""
                                                                                    ? String(
                                                                                        row[
                                                                                            field.key
                                                                                        ],
                                                                                    )
                                                                                    : ""}
                                                                            </td>
                                                                        ))}
                                                                    </tr>
                                                                ),
                                                            )
                                                        ) : (
                                                            <tr>
                                                                <td
                                                                    colSpan={fields.length + 1}
                                                                    className={`px-3 py-8 text-center ${textMutedClasses}`}
                                                                >
                                                                No valid data to preview. Please run
                                                                validation first.
                                                                </td>
                                                            </tr>
                                                        )}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex justify-end space-x-3">
                                <Button variant="outline" onClick={onClose}>
                                    Close
                                </Button>
                                <Button
                                    onClick={handleValidate}
                                    disabled={isValidating}
                                    variant="outline"
                                >
                                    Re-validate
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
