"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import FilterActions from "./blocks/filter";
import { useRouter } from "next/navigation";
import { usePayrollData } from "@/components/hr-manager/compensation-benefits/payroll-management/hooks/usePayrollData";
import { usePayrollFilters } from "@/components/hr-manager/compensation-benefits/payroll-management/hooks/usePayrollFilters";
import { usePayrollTabs } from "@/components/hr-manager/compensation-benefits/payroll-management/hooks/usePayrollTabs";
import { PayrollMetrics } from "./blocks/payroll-metrics";
import { PayrollTable } from "./blocks/payroll-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ColValues } from "@/lib/backend/functions/returnPayslipData";
import { AttendanceModel } from "@/lib/models/attendance";
import { EmployeeModel } from "@/lib/models/employee";
import { useData } from "@/context/app-data-context";
import PayrollPDFSettingsModel from "@/lib/models/payrollPDFSettings";
import { getPayrollPDFSettings } from "@/lib/backend/api/payroll-settings-service";
import { useAuth } from "@/context/authContext";
import { useToast } from "@/context/toastContext";
import { OvertimeRequestModel } from "@/lib/models/overtime-request";
import { updateOvertimeRequest } from "@/lib/backend/api/attendance/overtime-service";
import { batchUpdateEmployee } from "@/lib/backend/api/employee-management/employee-management-service";
import { MoreVertical, Undo2 } from "lucide-react";

export interface PayrollData {
    month: string;
    year: number;

    id: string;
    uid: string;
    employeeID: string;
    employeeName: string;
    employmentPosition: string;
    department: string;
    section: string;
    contractStartingDate: string;
    contractTerminationDate: string | null;
    bankAccount: string;
    providentFundAccount: string;
    workingLocation: string;
    employeeCost: number;

    employeePension: number;
    baseSalary: number;
    employerPension: number;
    incomeTax: number;

    // profile
    contractType: string;
    totalGrossPay: number;
    taxableGrossPay: number;
    netPay: number;

    // work time
    periodWorkingDays: number;
    hourlyWage: number;
    presentDays: number;
    halfPresentDays: number;
    absentDays: number;
    leaveDays: number;
    holidays: number;

    monthlyWorkedHours: number;
    overtimes: { name: string; amount: number; rate: number }[];
    overtimeTypeCols: ColValues[];

    // payment
    payments: { name: string; amount: number }[];
    totalGrossSalary: number;
    taxableGrossSalary: number;
    totalPayment: number;
    paymentTypeCols: ColValues[];
    bonusTax: number;
    bonusAmount: number;
    bonusNetPay: number;

    // severance pay
    severanceNetPay: number;

    // annual leave pay
    annualLeaveNetPay: number;

    // deduction
    totalDeduction: number;
    deductions: { name: string; amount: number }[];
    loans: { name: string; amount: number }[];
    attendanceData: AttendanceModel | null;
    unpaidLeave: number;
    deductionTypeCols: ColValues[];

    loanTypeCols: ColValues[];
    transportAllowance: number;
    otherAllowances: number;
    taxableTransportAllowance: number;
    taxableOtherAllowances: number;
    totalOvertimeAmount: number;
    costSharing: number;

    terminated: boolean;
    employee: EmployeeModel;
}

const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
];

export function PayrollManagement() {
    const router = useRouter();
    const { userData } = useAuth();
    const { showToast } = useToast();
    const { employees, attendanceLogic, hrSettings, employeeLoans, overtimeRequests } = useData();
    const loanTypes = hrSettings.loanTypes;
    const [selectedMonth, setSelectedMonth] = useState<string>("January");
    const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
    const [rollbackLoadingId, setRollbackLoadingId] = useState<string | null>(null);
    const [rollbackCandidate, setRollbackCandidate] = useState<OvertimeRequestModel | null>(null);

    // PDF settings loaded from the shared app data layer
    const [pdfSettings, setPdfSettings] = useState<PayrollPDFSettingsModel | null>(null);

    // Load PDF settings on mount
    useEffect(() => {
        async function loadPdfSettings() {
            try {
                const settings = await getPayrollPDFSettings();
                if (settings) {
                    // Resolve document IDs to actual URLs from hrSettings
                    const headerDocs = hrSettings.headerDocuments || [];
                    const footerDocs = hrSettings.footerDocuments || [];
                    const signatureDocs = hrSettings.signatureDocuments || [];
                    const stampDocs = hrSettings.stampDocuments || [];

                    const resolvedSettings: PayrollPDFSettingsModel = {
                        ...settings,
                        header: settings.header
                            ? headerDocs.find(d => d.id === settings.header)?.fileUrl || null
                            : null,
                        footer: settings.footer
                            ? footerDocs.find(d => d.id === settings.footer)?.fileUrl || null
                            : null,
                        signature: settings.signature
                            ? signatureDocs.find(d => d.id === settings.signature)?.fileUrl || null
                            : null,
                        stamp: settings.stamp
                            ? stampDocs.find(d => d.id === settings.stamp)?.fileUrl || null
                            : null,
                    };
                    setPdfSettings(resolvedSettings);
                }
            } catch (error) {
                console.error("Error loading PDF settings:", error);
            }
        }
        if (hrSettings.headerDocuments.length > 0) {
            loadPdfSettings();
        }
    }, [
        hrSettings.headerDocuments,
        hrSettings.footerDocuments,
        hrSettings.signatureDocuments,
        hrSettings.stampDocuments,
    ]);

    // Use loaded settings or fall back to defaults
    const defaultPDFSettings = useMemo<PayrollPDFSettingsModel>(() => {
        if (pdfSettings) {
            return pdfSettings;
        }
        return {
            id: "pdf-settings-001",
            createdAt: "",
            updatedAt: "",
            header: null,
            footer: null,
            signature: null,
            stamp: null,
        };
    }, [pdfSettings]);

    const { payslipData } = usePayrollData(
        selectedMonth,
        selectedEmployees,
        employeeLoans,
        loanTypes,
        defaultPDFSettings,
    );
    const {
        filteredData,
        filters,
        rangeFilters,
        dateRangeFilters,
        handleFilterChange,
        handleRangeFilterChange,
        handleDateRangeFilterChange,
        clearFilters,
    } = usePayrollFilters(payslipData, selectedEmployees);
    const {
        activeTab,
        visibleColumns,
        handleTabChange,
        toggleColumnVisibility,
        getCurrentColumns,
    } = usePayrollTabs(payslipData, filteredData, clearFilters);

    const isPayrollOfficer = userData?.role?.includes("Payroll Officer");
    const financeReviewRequests = useMemo(
        () => overtimeRequests.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1)).slice(0, 10),
        [overtimeRequests],
    );

    const canFinanceRollback = (request: OvertimeRequestModel) =>
        request.status === "approved" && request.approvalStage === "completed";

    const removeClaimedOvertimeFromEmployees = async (request: OvertimeRequestModel) => {
        const targetEmployees = employees.filter(employee =>
            request.employeeUids.includes(employee.uid),
        );

        const updates = targetEmployees
            .filter(employee => Boolean(employee.id))
            .map(employee => ({
                id: employee.id as string,
                claimedOvertimes: (employee.claimedOvertimes ?? []).filter(
                    otId => otId !== request.id,
                ),
            }));

        if (updates.length === 0) return true;
        return batchUpdateEmployee(updates);
    };

    const handleFinanceRollback = async (request: OvertimeRequestModel) => {
        if (!userData?.uid) {
            showToast(
                "User is not authenticated, refresh and please try again",
                "User Authentication",
                "warning",
            );
            return;
        }

        setRollbackLoadingId(request.id);
        const res = await updateOvertimeRequest(
            {
                id: request.id,
                status: "pending",
                approvalStage: "hr",
                reviewedBy: null,
                reviewedDate: null,
                hrComments: null,
            },
            userData.uid,
        );

        if (res) {
            const syncResult = await removeClaimedOvertimeFromEmployees(request);
            if (!syncResult) {
                showToast(
                    "Request rolled back, but OT claim sync failed. Please retry.",
                    "Sync Warning",
                    "warning",
                );
            } else {
                showToast(
                    "Overtime request rolled back to HR pending review.",
                    "Success",
                    "success",
                );
            }
        } else {
            showToast("Failed to rollback overtime request. Please try again.", "Error", "error");
        }
        setRollbackLoadingId(null);
    };

    const confirmFinanceRollback = async () => {
        if (!rollbackCandidate) return;
        const request = rollbackCandidate;
        setRollbackCandidate(null);
        await handleFinanceRollback(request);
    };

    return (
        <div className="space-y-6 p-6">
            {/* Header with Back Button */}
            <div className="flex items-center gap-4 mb-8">
                <Button
                    variant="outline"
                    onClick={() => router.push(`/hr/compensation-benefits`)}
                    className="flex items-center gap-2 bg-transparent"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                </Button>
                <div>
                    <h1 className="text-3xl font-bold text-brand-800 dark:text-foreground">
                        Payroll Management
                    </h1>
                    <p className="text-brand-600 dark:text-muted-foreground mt-1">
                        Manage employee payroll, generate reports, and process payments
                    </p>
                </div>
            </div>

            <FilterActions
                months={months}
                employees={employees}
                selectedMonth={selectedMonth}
                selectedEmployees={selectedEmployees}
                attendanceLogic={attendanceLogic?.at(0)?.chosenLogic ?? 1}
                payrollData={filteredData}
                setSelectedMonth={setSelectedMonth}
                setSelectedEmployees={setSelectedEmployees}
            />

            <PayrollMetrics filteredData={filteredData} />

            {isPayrollOfficer && (
                <Card>
                    <CardHeader>
                        <CardTitle>Overtime Rollback Queue</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {financeReviewRequests.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                                No overtime requests available.
                            </p>
                        ) : (
                            financeReviewRequests.map(request => (
                                <div
                                    key={request.id}
                                    className="flex flex-col gap-2 rounded-md border p-3 md:flex-row md:items-center md:justify-between"
                                >
                                    <div>
                                        <p className="font-medium">{request.overtimeId}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {request.overtimeDate} · {request.employeeUids.length}{" "}
                                            employee(s)
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {request.status} · {request.approvalStage ?? "legacy"}
                                        </p>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8 w-8 p-0"
                                            >
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem
                                                disabled={
                                                    !canFinanceRollback(request) ||
                                                    rollbackLoadingId === request.id
                                                }
                                                onClick={() => setRollbackCandidate(request)}
                                                className="cursor-pointer hover:bg-gray-100 focus:bg-gray-100 dark:hover:bg-gray-800 dark:focus:bg-gray-800 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50"
                                            >
                                                <Undo2 className="mr-2 h-4 w-4" />
                                                Rollback
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>
            )}

            <AlertDialog
                open={!!rollbackCandidate}
                onOpenChange={open => {
                    if (!open) setRollbackCandidate(null);
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Rollback Overtime Request</AlertDialogTitle>
                        <AlertDialogDescription>
                            Rollback this overtime request to HR pending review?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel
                            disabled={
                                !!rollbackCandidate && rollbackLoadingId === rollbackCandidate.id
                            }
                        >
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmFinanceRollback}
                            disabled={
                                !!rollbackCandidate && rollbackLoadingId === rollbackCandidate.id
                            }
                        >
                            Rollback
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <PayrollTable
                filteredData={filteredData}
                payslipData={payslipData}
                visibleColumns={visibleColumns}
                getCurrentColumns={getCurrentColumns}
                toggleColumnVisibility={toggleColumnVisibility}
                activeTab={activeTab}
                handleTabChange={handleTabChange}
                filters={filters}
                rangeFilters={rangeFilters}
                dateRangeFilters={dateRangeFilters}
                handleFilterChange={handleFilterChange}
                handleRangeFilterChange={handleRangeFilterChange}
                handleDateRangeFilterChange={handleDateRangeFilterChange}
                clearFilters={clearFilters}
            />
        </div>
    );
}
