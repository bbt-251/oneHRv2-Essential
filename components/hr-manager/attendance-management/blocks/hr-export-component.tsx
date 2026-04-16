"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Calendar, Users, TrendingUp } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/context/toastContext";
import { getTimestamp } from "@/lib/util/dayjs_format";

// Type definitions for request data
interface RequestData {
    id: string;
    status: "pending" | "approved" | "rejected";
    employeeName: string;
    employeeDepartment: string;
    overtimeId?: string;
    overtimeDate?: string;
    overtimeType?: string;
    date?: string;
    workedHours?: string;
    submittedDate: string;
    reviewedDate?: string;
    reviewedBy?: string;
    hrComments?: string;
}

interface HRExportComponentProps {
    overtimeRequests: RequestData[];
    attendanceChangeRequests: RequestData[];
    selectedDateFrom: string;
    selectedDateTo: string;
}

export function HRExportComponent({
    overtimeRequests,
    attendanceChangeRequests,
    selectedDateFrom,
    selectedDateTo,
}: HRExportComponentProps) {
    const [isExporting, setIsExporting] = useState<boolean>(false);
    const { showToast } = useToast();

    // Generate report data with statistics
    const generateReportData = () => {
        const now = new Date();
        const reportDate = getTimestamp();

        const overtimeStats = {
            total: overtimeRequests.length,
            pending: overtimeRequests.filter(req => req.status === "pending").length,
            approved: overtimeRequests.filter(req => req.status === "approved").length,
            rejected: overtimeRequests.filter(req => req.status === "rejected").length,
        };

        const attendanceStats = {
            total: attendanceChangeRequests.length,
            pending: attendanceChangeRequests.filter(req => req.status === "pending").length,
            approved: attendanceChangeRequests.filter(req => req.status === "approved").length,
            rejected: attendanceChangeRequests.filter(req => req.status === "rejected").length,
        };

        return {
            reportDate,
            generatedAt: now.toISOString(),
            dateRange: {
                from: selectedDateFrom || "All Time",
                to: selectedDateTo || "All Time",
            },
            overtimeStats,
            attendanceStats,
            overtimeRequests,
            attendanceChangeRequests,
        };
    };

    // Export data to CSV format
    const exportToCSV = async (type: "overtime" | "attendance" | "summary") => {
        setIsExporting(true);
        try {
            const data = generateReportData();
            let csvContent = "";
            let filename = "";

            if (type === "summary") {
                csvContent = `HR Attendance Report - ${data.reportDate}\n\n`;
                csvContent += `Date Range,${data.dateRange.from} to ${data.dateRange.to}\n`;
                csvContent += `Generated At,${data.generatedAt}\n\n`;
                csvContent += `Overtime Requests,Total,Pending,Approved,Rejected\n`;
                csvContent += `,${data.overtimeStats.total},${data.overtimeStats.pending},${data.overtimeStats.approved},${data.overtimeStats.rejected}\n\n`;
                csvContent += `Attendance Requests,Total,Pending,Approved,Rejected\n`;
                csvContent += `,${data.attendanceStats.total},${data.attendanceStats.pending},${data.attendanceStats.approved},${data.attendanceStats.rejected}\n`;
                filename = `hr-attendance-summary-${now.toISOString().split("T")[0]}.csv`;
            } else if (type === "overtime") {
                csvContent = `Overtime Requests Report - ${data.reportDate}\n\n`;
                csvContent += `ID,Employee,Department,Date,Type,Status,Submitted Date,Reviewed Date,Reviewed By,Comments\n`;
                data.overtimeRequests.forEach(req => {
                    csvContent += `"${req.overtimeId || req.id}","${req.employeeName}","${req.employeeDepartment}","${req.overtimeDate || ""}","${req.overtimeType || ""}","${req.status}","${req.submittedDate}","${req.reviewedDate || ""}","${req.reviewedBy || ""}","${req.hrComments || ""}"\n`;
                });
                filename = `overtime-requests-${now.toISOString().split("T")[0]}.csv`;
            } else {
                csvContent = `Attendance Change Requests Report - ${data.reportDate}\n\n`;
                csvContent += `ID,Employee,Department,Date,Worked Hours,Status,Submitted Date,Reviewed Date,Reviewed By,Comments\n`;
                data.attendanceChangeRequests.forEach(req => {
                    csvContent += `"${req.id}","${req.employeeName}","${req.employeeDepartment}","${req.date || ""}","${req.workedHours || ""}","${req.status}","${req.submittedDate}","${req.reviewedDate || ""}","${req.reviewedBy || ""}","${req.hrComments || ""}"\n`;
                });
                filename = `attendance-requests-${now.toISOString().split("T")[0]}.csv`;
            }

            // Create and download file
            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", filename);
            link.style.visibility = "hidden";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            showToast(`Successfully exported ${type} report`, "Export Successful", "success", 3000);
        } catch (error) {
            showToast("Failed to export report", "Export Failed", "error", 5000);
        } finally {
            setIsExporting(false);
        }
    };

    const now = new Date();

    return (
        <Card className="border-0 shadow-sm bg-white">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle
                        className="text-lg font-semibold text-[#3f3d56]"
                        style={{ fontFamily: "Montserrat, sans-serif" }}
                    >
                        <FileText className="h-5 w-5 inline mr-2" />
                        Export Reports
                    </CardTitle>
                    <Badge className="bg-[#ffe6a7] text-[#3f3d56]">
                        <span style={{ fontFamily: "Montserrat, sans-serif" }}>
                            {now.toLocaleDateString()}
                        </span>
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Summary Report Export */}
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2 mb-3">
                            <TrendingUp className="h-4 w-4 text-blue-600" />
                            <h4
                                className="font-medium text-blue-800"
                                style={{ fontFamily: "Montserrat, sans-serif" }}
                            >
                                Summary Report
                            </h4>
                        </div>
                        <p
                            className="text-sm text-blue-700 mb-3"
                            style={{ fontFamily: "Montserrat, sans-serif" }}
                        >
                            Export high-level statistics and overview of all requests
                        </p>
                        <Button
                            size="sm"
                            onClick={() => exportToCSV("summary")}
                            disabled={isExporting}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                            style={{ fontFamily: "Montserrat, sans-serif" }}
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Export Summary
                        </Button>
                    </div>

                    {/* Overtime Report Export */}
                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                        <div className="flex items-center gap-2 mb-3">
                            <Calendar className="h-4 w-4 text-orange-600" />
                            <h4
                                className="font-medium text-orange-800"
                                style={{ fontFamily: "Montserrat, sans-serif" }}
                            >
                                Overtime Report
                            </h4>
                        </div>
                        <p
                            className="text-sm text-orange-700 mb-3"
                            style={{ fontFamily: "Montserrat, sans-serif" }}
                        >
                            Export detailed overtime request data with all fields
                        </p>
                        <Button
                            size="sm"
                            onClick={() => exportToCSV("overtime")}
                            disabled={isExporting}
                            className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                            style={{ fontFamily: "Montserrat, sans-serif" }}
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Export Overtime
                        </Button>
                    </div>

                    {/* Attendance Report Export */}
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <div className="flex items-center gap-2 mb-3">
                            <Users className="h-4 w-4 text-green-600" />
                            <h4
                                className="font-medium text-green-800"
                                style={{ fontFamily: "Montserrat, sans-serif" }}
                            >
                                Attendance Report
                            </h4>
                        </div>
                        <p
                            className="text-sm text-green-700 mb-3"
                            style={{ fontFamily: "Montserrat, sans-serif" }}
                        >
                            Export detailed attendance change request data
                        </p>
                        <Button
                            size="sm"
                            onClick={() => exportToCSV("attendance")}
                            disabled={isExporting}
                            className="w-full bg-green-600 hover:bg-green-700 text-white"
                            style={{ fontFamily: "Montserrat, sans-serif" }}
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Export Attendance
                        </Button>
                    </div>
                </div>

                {/* Export Status Indicator */}
                {isExporting && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
                            <p
                                className="text-sm text-yellow-800"
                                style={{ fontFamily: "Montserrat, sans-serif" }}
                            >
                                Generating export file...
                            </p>
                        </div>
                    </div>
                )}

                {/* Export Information */}
                <div className="bg-gray-50 p-3 rounded-lg">
                    <p
                        className="text-xs text-gray-600"
                        style={{ fontFamily: "Montserrat, sans-serif" }}
                    >
                        <strong>Note:</strong> Reports include data from{" "}
                        {selectedDateFrom || "all time"} to {selectedDateTo || "current date"}.
                        Files are downloaded in CSV format and can be opened in Excel or similar
                        applications.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
