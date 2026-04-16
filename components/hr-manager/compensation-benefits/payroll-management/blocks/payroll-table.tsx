import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Maximize2, Minimize2, Download } from "lucide-react";
import { PayrollData } from "../page";
import { numberCommaSeparator } from "@/lib/backend/functions/numberCommaSeparator";
import { ColumnSettings } from "./column-settings";
import { FilterModal } from "./filter-modal";
import { TabButtons } from "./tab-buttons";

function formatOvertimeHoursForDisplay(hours: number): string {
    if (!Number.isFinite(hours)) return "0";
    const rounded = Math.round(hours * 100) / 100;
    return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
}

interface PayrollTableProps {
    filteredData: PayrollData[];
    payslipData: PayrollData[];
    visibleColumns: Record<string, boolean>;
    getCurrentColumns: () => { key: string; label: string }[];
    toggleColumnVisibility: (columnKey: string) => void;
    activeTab: string;
    handleTabChange: (tab: string) => void;
    filters: Record<string, string>;
    rangeFilters: Record<string, { from: string; to: string }>;
    dateRangeFilters: Record<string, { from: string; to: string }>;
    handleFilterChange: (columnKey: string, value: string) => void;
    handleRangeFilterChange: (columnKey: string, type: "from" | "to", value: string) => void;
    handleDateRangeFilterChange: (columnKey: string, type: "from" | "to", value: string) => void;
    clearFilters: () => void;
}

export function PayrollTable({
    filteredData,
    payslipData,
    visibleColumns,
    getCurrentColumns,
    toggleColumnVisibility,
    activeTab,
    handleTabChange,
    filters,
    rangeFilters,
    dateRangeFilters,
    handleFilterChange,
    handleRangeFilterChange,
    handleDateRangeFilterChange,
    clearFilters,
}: PayrollTableProps) {
    const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
    const [isFilterModalOpen, setIsFilterModalOpen] = useState<boolean>(false);

    const escapeCsvValue = (value: string) => {
        const sanitized = String(value ?? "").replace(/"/g, '""');
        return `"${sanitized}"`;
    };

    const renderCellValue = (employee: PayrollData, columnKey: string) => {
        const value = (employee as any)[columnKey];
        if (
            typeof value === "number" &&
            (columnKey.includes("Salary") ||
                columnKey.includes("Payment") ||
                columnKey.includes("Cost") ||
                columnKey.includes("Tax") ||
                columnKey.includes("Deduction") ||
                columnKey.includes("netPay") ||
                columnKey.includes("totalGrossPay") ||
                columnKey.includes("taxableGrossPay") ||
                columnKey.includes("totalPayment") ||
                columnKey.includes("employeePension") ||
                columnKey.includes("employerPension") ||
                columnKey.includes("severance"))
        ) {
            return numberCommaSeparator(value);
        } else if (
            activeTab === "worktime" &&
            payslipData.some(pd => pd.overtimeTypeCols.some(col => col.key === columnKey))
        ) {
            const otCol = employee.overtimeTypeCols.find(col => col.key === columnKey);
            const hrs = otCol?.hours ?? 0;
            return formatOvertimeHoursForDisplay(hrs);
        } else if (payslipData.some(pd => pd.overtimeTypeCols.some(col => col.key === columnKey))) {
            const val = employee.overtimeTypeCols.find(col => col.key === columnKey)?.value ?? 0;
            return numberCommaSeparator(val);
        } else if (payslipData.some(pd => pd.paymentTypeCols.some(col => col.key === columnKey))) {
            const val = employee.paymentTypeCols.find(col => col.key === columnKey)?.value ?? 0;
            return numberCommaSeparator(val);
        } else if (
            payslipData.some(pd => pd.deductionTypeCols.some(col => col.key === columnKey))
        ) {
            const val = employee.deductionTypeCols.find(col => col.key === columnKey)?.value ?? 0;
            return numberCommaSeparator(val);
        } else if (payslipData.some(pd => pd.loanTypeCols.some(col => col.key === columnKey))) {
            const val = employee.loanTypeCols.find(col => col.key === columnKey)?.value ?? 0;
            return numberCommaSeparator(val);
        }

        return String(value ?? "");
    };

    const handleExportCSV = () => {
        const visibleCols = getCurrentColumns().filter(col => visibleColumns[col.key]);
        const headers = visibleCols.map(col => escapeCsvValue(col.label)).join(",");
        const rows = filteredData.map(employee =>
            visibleCols.map(col => escapeCsvValue(renderCellValue(employee, col.key))).join(","),
        );
        const csvContent = [headers, ...rows].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        const stamp = new Date().toISOString().slice(0, 10);
        link.href = url;
        link.download = `payroll-${activeTab}-${stamp}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <Card
            className={
                isFullScreen ? "fixed inset-0 z-50 rounded-none" : "w-full max-w-full mx-auto"
            }
        >
            <CardHeader>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-xl font-semibold">
                            Employee Payroll Data
                        </CardTitle>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsFullScreen(!isFullScreen)}
                            className="flex items-center gap-2"
                        >
                            {isFullScreen ? (
                                <Minimize2 className="h-4 w-4" />
                            ) : (
                                <Maximize2 className="h-4 w-4" />
                            )}
                            {isFullScreen ? "Exit Full Screen" : "Full Screen"}
                        </Button>
                    </div>

                    <div className="flex items-center gap-2">
                        <ColumnSettings
                            getCurrentColumns={getCurrentColumns}
                            visibleColumns={visibleColumns}
                            toggleColumnVisibility={toggleColumnVisibility}
                        />

                        <FilterModal
                            isFilterModalOpen={isFilterModalOpen}
                            setIsFilterModalOpen={setIsFilterModalOpen}
                            getCurrentColumns={getCurrentColumns}
                            filters={filters}
                            rangeFilters={rangeFilters}
                            dateRangeFilters={dateRangeFilters}
                            handleFilterChange={handleFilterChange}
                            handleRangeFilterChange={handleRangeFilterChange}
                            handleDateRangeFilterChange={handleDateRangeFilterChange}
                            clearFilters={clearFilters}
                        />

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExportCSV}
                            className="flex items-center gap-2 bg-transparent"
                        >
                            <Download className="h-4 w-4" />
                            Export CSV
                        </Button>
                    </div>

                    <TabButtons activeTab={activeTab} handleTabChange={handleTabChange} />
                </div>
            </CardHeader>
            <CardContent className={isFullScreen ? "h-[calc(100vh-200px)] overflow-auto" : ""}>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {getCurrentColumns()
                                    .filter(col => visibleColumns[col.key])
                                    .map(col => (
                                        <TableHead key={col.key}>{col.label}</TableHead>
                                    ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredData.map(employee => (
                                <TableRow key={employee.id}>
                                    {getCurrentColumns()
                                        .filter(col => visibleColumns[col.key])
                                        .map(col => (
                                            <TableCell
                                                key={col.key}
                                                className={
                                                    col.key === "employeeName"
                                                        ? "font-medium"
                                                        : col.key.includes("net") ||
                                                            col.key.includes("total")
                                                            ? "font-semibold"
                                                            : ""
                                                }
                                            >
                                                {renderCellValue(employee, col.key)}
                                            </TableCell>
                                        ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
