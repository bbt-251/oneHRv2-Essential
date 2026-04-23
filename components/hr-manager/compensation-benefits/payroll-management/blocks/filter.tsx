"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useData } from "@/context/app-data-context";
import { useToast } from "@/context/toastContext";
import { generatePayrollSlip } from "@/lib/util/functions/payroll/generatePayrollSlip";
import { generatePension } from "@/lib/util/functions/payroll/generatePension";
import { generateTax } from "@/lib/util/functions/payroll/generateTax";
import { EmployeeModel } from "@/lib/models/employee";
import PayrollPDFSettingsModel from "@/lib/models/payrollPDFSettings";
import { PayrollRepository } from "@/lib/repository/payroll";
import getFullName from "@/lib/util/getEmployeeFullName";
import { Calculator, FileText, PiggyBank } from "lucide-react";
import { useEffect, useState } from "react";
import { PayrollData } from "../page";

interface FilterActionsProps {
    months: string[];
    payrollData: PayrollData[];
    attendanceLogic: 1 | 2 | 3 | 4;
    employees: EmployeeModel[];
    selectedMonth: string;
    selectedEmployees: string[];
    setSelectedMonth: (month: string) => void;
    setSelectedEmployees: (ids: string[]) => void;
}

export default function FilterActions({
    months,
    employees,
    payrollData,
    attendanceLogic,
    selectedMonth,
    selectedEmployees,
    setSelectedMonth,
    setSelectedEmployees,
}: FilterActionsProps) {
    const {
        companyInfo: companyInfoDocs,
        pension,
        headerDocuments,
        footerDocuments,
        signatureDocuments,
        stampDocuments,
    } = useData();
    const companyInfo = companyInfoDocs?.at(0);

    const { showToast } = useToast();
    const [isEmployeeDropdownOpen, setIsEmployeeDropdownOpen] = useState<boolean>(false);
    const [employeeSearch, setEmployeeSearch] = useState<string>("");
    const [pdfSettings, setPdfSettings] = useState<PayrollPDFSettingsModel | null>(null);

    // Load PDF settings from the shared app data layer
    useEffect(() => {
        async function loadPdfSettings() {
            try {
                const result = await PayrollRepository.getPayrollPdfSettings();
                const settings = result.success ? result.data : null;
                if (settings) {
                    // Resolve document IDs to actual URLs from document collections
                    const headerDocs = headerDocuments || [];
                    const footerDocs = footerDocuments || [];
                    const signatureDocs = signatureDocuments || [];
                    const stampDocs = stampDocuments || [];

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
                console.error("[Filter] Error loading PDF settings:", error);
            }
        }
        if (headerDocuments?.length > 0) {
            loadPdfSettings();
        }
    }, [headerDocuments, footerDocuments, signatureDocuments, stampDocuments]);

    // Get current PDF settings or fall back to defaults
    const currentPDFSettings: PayrollPDFSettingsModel = pdfSettings || {
        id: "pdfsettings-001",
        createdAt: "",
        updatedAt: "",
        header: null,
        footer: null,
        signature: null,
        stamp: null,
    };

    const filteredEmployees = employees
        .filter(emp => getFullName(emp).toLowerCase().includes(employeeSearch.toLowerCase()))
        .sort((a, b) => getFullName(a).localeCompare(getFullName(b)));

    const handleEmployeeToggle = (uid: string) => {
        setSelectedEmployees(
            selectedEmployees.includes(uid)
                ? selectedEmployees.filter(e => e !== uid)
                : [...selectedEmployees, uid],
        );
    };

    const getSelectedEmployeeNames = () => {
        if (selectedEmployees.length === 0) return "Choose employees";
        const selected = employees.filter(e => selectedEmployees.includes(e.uid));
        return selected.map(e => getFullName(e)).join(", ");
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-xl font-semibold">Filter & Actions</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Filtering Section */}
                    <div className="flex-1">
                        <div className="flex flex-col md:flex-row gap-4">
                            {/* Month Select */}
                            <div className="flex-1">
                                <label className="text-sm font-medium text-brand-700 dark:text-foreground mb-2 block">
                                    Select Month
                                </label>
                                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Choose month" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {months.map(month => (
                                            <SelectItem key={month} value={month}>
                                                {month}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Employees Select */}
                            <div className="flex-1">
                                <label className="text-sm font-medium text-brand-700 dark:text-foreground mb-2 block">
                                    Select Employees
                                </label>
                                <Popover
                                    open={isEmployeeDropdownOpen}
                                    onOpenChange={setIsEmployeeDropdownOpen}
                                >
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={isEmployeeDropdownOpen}
                                            className="w-full justify-between h-10 px-3 py-2 text-left font-normal bg-transparent"
                                        >
                                            <span className="truncate">
                                                {getSelectedEmployeeNames()}
                                            </span>
                                            <div className="ml-2 h-4 w-4 shrink-0 opacity-50">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    width="24"
                                                    height="24"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                >
                                                    <polyline points="6,9 12,15 18,9"></polyline>
                                                </svg>
                                            </div>
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent
                                        className="w-[var(--radix-popover-trigger-width)] p-0"
                                        align="start"
                                    >
                                        <div className="p-2">
                                            <Input
                                                placeholder="Search employees..."
                                                value={employeeSearch}
                                                onChange={e => setEmployeeSearch(e.target.value)}
                                                className="h-9"
                                            />
                                        </div>
                                        <div className="max-h-60 overflow-y-auto">
                                            {filteredEmployees.length === 0 ? (
                                                <div className="p-2 text-sm text-muted-foreground">
                                                    No employees found.
                                                </div>
                                            ) : (
                                                filteredEmployees.map(employee => (
                                                    <div
                                                        key={employee.uid}
                                                        className="flex items-center space-x-2 p-2 hover:bg-accent hover:text-accent-foreground cursor-pointer"
                                                        onClick={() =>
                                                            handleEmployeeToggle(employee.uid)
                                                        }
                                                    >
                                                        <Checkbox
                                                            checked={selectedEmployees.includes(
                                                                employee.uid,
                                                            )}
                                                            onChange={() =>
                                                                handleEmployeeToggle(employee.uid)
                                                            }
                                                        />
                                                        <div className="flex-1">
                                                            <div className="font-medium">
                                                                {getFullName(employee)}
                                                            </div>
                                                            <div className="text-sm text-muted-foreground">
                                                                {/* {
                                                                        employee.department
                                                                    } */}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                        {selectedEmployees.length > 0 && (
                                            <div className="border-t p-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setSelectedEmployees([])}
                                                    className="w-full"
                                                >
                                                    Clear Selection
                                                </Button>
                                            </div>
                                        )}
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions Section */}
                    <div className="lg:w-80">
                        <label className="text-sm font-medium text-brand-700 dark:text-foreground mb-2 block">
                            Quick Actions
                        </label>
                        <div className="grid grid-cols-1 gap-2">
                            <Button
                                size="sm"
                                className="flex items-center gap-2 justify-start h-10 text-white"
                                style={{ backgroundColor: "#3f3d56ff" }}
                                disabled={selectedEmployees.length ? false : true}
                                onClick={async () => {
                                    await generatePayrollSlip(
                                        selectedEmployees,
                                        payrollData,
                                        currentPDFSettings,
                                        attendanceLogic,
                                        showToast,
                                    );
                                }}
                            >
                                <FileText className="h-4 w-4" />
                                Generate Payroll Slip
                            </Button>

                            <Button
                                size="sm"
                                className="flex items-center gap-2 justify-start h-10 text-white"
                                style={{ backgroundColor: "#3f3d56ff" }}
                                onClick={async () => {
                                    if (pension) {
                                        await generatePension(payrollData, companyInfo);
                                    } else {
                                        showToast(
                                            "There is no pension data configured",
                                            "Warning",
                                            "warning",
                                        );
                                    }
                                }}
                            >
                                <PiggyBank className="h-4 w-4" />
                                Generate Pension
                            </Button>

                            <Button
                                size="sm"
                                className="flex items-center gap-2 justify-start h-10"
                                style={{
                                    backgroundColor: "#3f3d5625",
                                    color: "#3f3d56ff",
                                }}
                                onClick={async () => {
                                    if (pension) {
                                        await generateTax(payrollData, companyInfo);
                                    } else {
                                        showToast(
                                            "There is no pension data configured",
                                            "Warning",
                                            "warning",
                                        );
                                    }
                                }}
                            >
                                <Calculator className="h-4 w-4" />
                                Generate Tax
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
