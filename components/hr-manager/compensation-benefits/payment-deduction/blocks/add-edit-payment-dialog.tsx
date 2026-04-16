import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, ChevronDown, Search, X, Loader2, Info } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

import { EmployeeModel } from "@/lib/models/employee";
import { months } from "@/lib/backend/functions/getListOfDays";
import { calculateSeverancePay } from "@/lib/backend/functions/calculateSeverancePay";
import { calculateAnnualLeavePay } from "@/lib/backend/functions/calculateAnnualLeavePay";
import { numberCommaSeparator } from "@/lib/backend/functions/numberCommaSeparator";
import dayjs from "dayjs";

interface PaymentEntry {
    id: string;
    timestamp: string;
    employees: EmployeeModel[];
    paymentTypeName: string;
    paymentAmount: number;
    monthlyAmounts: { [month: string]: number };
    severanceMonth?: string;
    annualLeaveMonth?: string;
    annualLeaveDays?: number;
}

interface AddEditPaymentDialogProps {
    isAddDialogOpen: boolean;
    setIsAddDialogOpen: (open: boolean) => void;
    isEditMode: boolean;
    editingPaymentId: string | null;
    newPayment: Partial<PaymentEntry>;
    setNewPayment: (payment: Partial<PaymentEntry>) => void;
    selectedEmployeesForForm: EmployeeModel[];
    setSelectedEmployeesForForm: (employees: EmployeeModel[]) => void;
    employeeSearchTerm: string;
    setEmployeeSearchTerm: (term: string) => void;
    isEmployeePopoverOpen: boolean;
    setIsEmployeePopoverOpen: (open: boolean) => void;
    filteredEmployees: EmployeeModel[];
    handleEmployeeToggle: (employee: EmployeeModel) => void;
    removeEmployee: (id: string) => void;
    paymentTypes: any[];
    handleAddPayment: () => void;
    isAddEditLoading: boolean;
    paymentsData: PaymentEntry[];
    taxes?: any[];
    hrSettings?: any;
}

export function AddEditPaymentDialog({
    isAddDialogOpen,
    setIsAddDialogOpen,
    isEditMode,
    editingPaymentId,
    newPayment,
    setNewPayment,
    selectedEmployeesForForm,
    setSelectedEmployeesForForm,
    employeeSearchTerm,
    setEmployeeSearchTerm,
    isEmployeePopoverOpen,
    setIsEmployeePopoverOpen,
    filteredEmployees,
    handleEmployeeToggle,
    removeEmployee,
    paymentTypes,
    handleAddPayment,
    isAddEditLoading,
    paymentsData,
    taxes,
    hrSettings,
}: AddEditPaymentDialogProps) {
    // Check if selected payment type is Severance Pay or Annual Leave
    const selectedPaymentType = paymentTypes.find(pt => pt.id === newPayment.paymentTypeName);
    const isSeverancePay = selectedPaymentType?.paymentType === "Severance Pay";
    const isAnnualLeave = selectedPaymentType?.paymentType === "Annual Leave";

    useEffect(() => {
        if (selectedEmployeesForForm.length === 0) {
            setNewPayment({
                ...newPayment,
                paymentAmount: 0,
                monthlyAmounts: {},
                severanceMonth: undefined,
                annualLeaveMonth: undefined,
            });
        }
    }, [selectedEmployeesForForm]);

    // Calculate severance pay when conditions are met
    const calculateAndSetSeverancePay = () => {
        if (!isSeverancePay || selectedEmployeesForForm.length !== 1) return;

        const employee = selectedEmployeesForForm[0];
        const baseSalary = employee.salary || 0;

        console.log(
            `calculating severance pay for employee ${employee.firstName} ${employee.surname} with base salary: ${baseSalary}`,
        );

        // Calculate years of service
        if (!employee.contractStartingDate || !employee.contractTerminationDate) {
            console.log(
                `employee ${employee.firstName} ${employee.surname} does not have contract dates`,
            );
            return;
        }

        const startDate = dayjs(employee.contractStartingDate);
        const endDate = dayjs(employee.contractTerminationDate);
        const yearsOfService = endDate.diff(startDate, "year", true);

        if (yearsOfService < 5) {
            console.log(
                `employee ${employee.firstName} ${employee.surname} is not eligible for Severance Pay (years of service: ${yearsOfService})`,
            );
            return;
        }

        // Get tax configuration
        const employeeTax = employee.associatedTax
            ? taxes?.find(t => t.id === employee.associatedTax)
            : null;

        if (!employeeTax) {
            console.log(
                `employee ${employee.firstName} ${employee.surname} does not have associated tax`,
            );
            return;
        }

        // Calculate severance using the function
        const severanceResult = calculateSeverancePay(baseSalary, yearsOfService, employeeTax);
        console.log(
            `severance pay for ${employee.firstName} ${employee.surname} is: `,
            severanceResult,
        );

        // Set the severance amount for the selected month - ONLY that month gets the amount
        const selectedMonth = newPayment.severanceMonth || months[dayjs().month()];
        const monthlyAmounts: { [month: string]: number } = {};

        // Only set amount for the selected month, all others should be 0
        months.forEach(month => {
            monthlyAmounts[month] = month === selectedMonth ? severanceResult.severancePay : 0;
        });

        setNewPayment({
            ...newPayment,
            paymentAmount: severanceResult.severancePay,
            monthlyAmounts: monthlyAmounts,
        });
    };

    // Handle payment type change
    const handlePaymentTypeChange = (value: string) => {
        const newPaymentType = paymentTypes.find(pt => pt.id === value);
        const isSwitchingToSeverancePay = newPaymentType?.paymentType === "Severance Pay";
        const isSwitchingToAnnualLeave = newPaymentType?.paymentType === "Annual Leave";

        // Determine which employee to use for calculation
        let targetEmployee = selectedEmployeesForForm[0];
        if (isSwitchingToSeverancePay || isSwitchingToAnnualLeave) {
            if (selectedEmployeesForForm.length > 1) {
                targetEmployee = selectedEmployeesForForm[0];
                // Keep only the first employee
                setSelectedEmployeesForForm([targetEmployee]);
            } else if (selectedEmployeesForForm.length === 0) {
                // Clear if no employee selected
                setSelectedEmployeesForForm([]);
            }
        }

        // Reset payment fields
        setNewPayment({
            ...newPayment,
            paymentTypeName: value,
            severanceMonth: isSwitchingToSeverancePay ? undefined : newPayment.severanceMonth,
            annualLeaveMonth: isSwitchingToAnnualLeave ? undefined : newPayment.annualLeaveMonth,
            paymentAmount:
                isSwitchingToSeverancePay || isSwitchingToAnnualLeave
                    ? 0
                    : newPayment.paymentAmount,
            monthlyAmounts:
                isSwitchingToSeverancePay || isSwitchingToAnnualLeave
                    ? {}
                    : newPayment.monthlyAmounts,
        });

        // If switching to Severance Pay and there's 1 employee, trigger calculation with default month
        if (isSwitchingToSeverancePay && selectedEmployeesForForm.length === 1) {
            const employee = targetEmployee;
            const baseSalary = employee.salary || 0;

            if (employee.contractStartingDate && employee.contractTerminationDate) {
                const startDate = dayjs(employee.contractStartingDate);
                const endDate = dayjs(employee.contractTerminationDate);
                const yearsOfService = endDate.diff(startDate, "year", true);

                if (yearsOfService >= 5) {
                    const employeeTax = employee.associatedTax
                        ? taxes?.find(t => t.id === employee.associatedTax)
                        : null;

                    if (employeeTax) {
                        const severanceResult = calculateSeverancePay(
                            baseSalary,
                            yearsOfService,
                            employeeTax,
                        );
                        const defaultMonth = months[dayjs().month()];

                        const monthlyAmounts: { [month: string]: number } = {};
                        months.forEach(m => {
                            monthlyAmounts[m] =
                                m === defaultMonth ? severanceResult.severancePay : 0;
                        });

                        setNewPayment({
                            paymentTypeName: value,
                            severanceMonth: defaultMonth,
                            paymentAmount: severanceResult.severancePay,
                            monthlyAmounts: monthlyAmounts,
                        });
                    }
                }
            }
        }

        // If switching to Annual Leave and there's 1 employee, trigger calculation with default month
        if (isSwitchingToAnnualLeave && selectedEmployeesForForm.length === 1) {
            const employee = targetEmployee;
            const baseSalary = employee.salary || 0;

            // Check if employee has balance leave days
            if (employee.balanceLeaveDays && employee.balanceLeaveDays > 0) {
                const employeeTax = employee.associatedTax
                    ? taxes?.find(t => t.id === employee.associatedTax)
                    : null;

                if (employeeTax) {
                    // Use the user-specified days or fall back to full balance
                    const daysToPay =
                        newPayment.annualLeaveDays &&
                        newPayment.annualLeaveDays > 0 &&
                        newPayment.annualLeaveDays <= employee.balanceLeaveDays
                            ? newPayment.annualLeaveDays
                            : employee.balanceLeaveDays;

                    const annualLeaveResult = calculateAnnualLeavePay(
                        baseSalary,
                        employee.balanceLeaveDays,
                        30, // Static 30 days for general calculation
                        employeeTax,
                        daysToPay,
                    );
                    const defaultMonth = months[dayjs().month()];

                    const monthlyAmounts: { [month: string]: number } = {};
                    months.forEach(m => {
                        monthlyAmounts[m] =
                            m === defaultMonth ? annualLeaveResult.netAnnualLeavePay : 0;
                    });

                    setNewPayment({
                        paymentTypeName: value,
                        annualLeaveMonth: defaultMonth,
                        paymentAmount: annualLeaveResult.netAnnualLeavePay,
                        monthlyAmounts: monthlyAmounts,
                    });
                }
            }
        }
    };

    // Handle month selection for severance pay
    const handleSeveranceMonthChange = (month: string) => {
        // Update the month first
        const updatedPayment = {
            ...newPayment,
            severanceMonth: month,
        };
        setNewPayment(updatedPayment);

        // Calculate immediately with the updated month
        // Need to manually calculate since useEffect might not trigger properly
        if (selectedEmployeesForForm.length === 1) {
            const employee = selectedEmployeesForForm[0];
            const baseSalary = employee.salary || 0;

            if (!employee.contractStartingDate || !employee.contractTerminationDate) {
                return;
            }

            const startDate = dayjs(employee.contractStartingDate);
            const endDate = dayjs(employee.contractTerminationDate);
            const yearsOfService = endDate.diff(startDate, "year", true);

            if (yearsOfService < 5) {
                return;
            }

            const employeeTax = employee.associatedTax
                ? taxes?.find(t => t.id === employee.associatedTax)
                : null;

            if (!employeeTax) {
                return;
            }

            const severanceResult = calculateSeverancePay(baseSalary, yearsOfService, employeeTax);

            const monthlyAmounts: { [month: string]: number } = {};
            months.forEach(m => {
                monthlyAmounts[m] = m === month ? severanceResult.severancePay : 0;
            });

            setNewPayment({
                ...updatedPayment,
                paymentAmount: severanceResult.severancePay,
                monthlyAmounts: monthlyAmounts,
            });
        }
    };

    // Handle month selection for annual leave pay
    const handleAnnualLeaveMonthChange = (month: string) => {
        // Update the month first
        const updatedPayment = {
            ...newPayment,
            annualLeaveMonth: month,
        };
        setNewPayment(updatedPayment);

        // Calculate immediately with the updated month
        if (selectedEmployeesForForm.length === 1) {
            const employee = selectedEmployeesForForm[0];
            const baseSalary = employee.salary || 0;

            // Check if employee has balance leave days
            if (!employee.balanceLeaveDays || employee.balanceLeaveDays <= 0) {
                return;
            }

            const employeeTax = employee.associatedTax
                ? taxes?.find(t => t.id === employee.associatedTax)
                : null;

            if (!employeeTax) {
                return;
            }

            // Use the user-specified days or fall back to full balance
            const daysToPay =
                newPayment.annualLeaveDays &&
                newPayment.annualLeaveDays > 0 &&
                newPayment.annualLeaveDays <= employee.balanceLeaveDays
                    ? newPayment.annualLeaveDays
                    : employee.balanceLeaveDays;

            const annualLeaveResult = calculateAnnualLeavePay(
                baseSalary,
                employee.balanceLeaveDays,
                30, // Static 30 days for general calculation
                employeeTax,
                daysToPay,
            );

            const monthlyAmounts: { [month: string]: number } = {};
            months.forEach(m => {
                monthlyAmounts[m] = m === month ? annualLeaveResult.netAnnualLeavePay : 0;
            });

            setNewPayment({
                ...updatedPayment,
                paymentAmount: annualLeaveResult.netAnnualLeavePay,
                monthlyAmounts: monthlyAmounts,
            });
        }
    };

    // Handle employee selection - prevent multiple for severance pay or annual leave
    const handleEmployeeSelection = (employee: EmployeeModel) => {
        if (isSeverancePay || isAnnualLeave) {
            // Only allow single employee for Severance Pay or Annual Leave
            setSelectedEmployeesForForm([employee]);
        } else {
            handleEmployeeToggle(employee);
        }
    };

    // Calculate annual leave pay when conditions are met
    const calculateAndSetAnnualLeavePay = () => {
        if (!isAnnualLeave || selectedEmployeesForForm.length !== 1) return;

        const employee = selectedEmployeesForForm[0];
        const baseSalary = employee.salary || 0;

        // Check if employee has balance leave days
        if (!employee.balanceLeaveDays || employee.balanceLeaveDays <= 0) {
            console.log(
                `employee ${employee.firstName} ${employee.surname} does not have leave balance`,
            );
            return;
        }

        // Get tax configuration
        const employeeTax = employee.associatedTax
            ? taxes?.find(t => t.id === employee.associatedTax)
            : null;

        if (!employeeTax) {
            console.log(
                `employee ${employee.firstName} ${employee.surname} does not have associated tax`,
            );
            return;
        }

        // Use the user-specified days or fall back to full balance
        const daysToPay =
            newPayment.annualLeaveDays &&
            newPayment.annualLeaveDays > 0 &&
            newPayment.annualLeaveDays <= employee.balanceLeaveDays
                ? newPayment.annualLeaveDays
                : employee.balanceLeaveDays;

        // Calculate annual leave using the function
        const annualLeaveResult = calculateAnnualLeavePay(
            baseSalary,
            employee.balanceLeaveDays,
            30, // Static 30 days for general calculation
            employeeTax,
            daysToPay,
        );

        // Set the annual leave amount for the selected month - ONLY that month gets the amount
        const selectedMonth = newPayment.annualLeaveMonth || months[dayjs().month()];
        const monthlyAmounts: { [month: string]: number } = {};

        // Only set amount for the selected month, all others should be 0
        months.forEach(month => {
            monthlyAmounts[month] =
                month === selectedMonth ? annualLeaveResult.netAnnualLeavePay : 0;
        });

        setNewPayment({
            ...newPayment,
            paymentAmount: annualLeaveResult.netAnnualLeavePay,
            monthlyAmounts: monthlyAmounts,
        });
    };

    // Effect to calculate severance when conditions change
    useEffect(() => {
        if (isSeverancePay && selectedEmployeesForForm.length === 1 && newPayment.severanceMonth) {
            calculateAndSetSeverancePay();
        }
    }, [selectedEmployeesForForm, newPayment.severanceMonth, isSeverancePay]);

    // Effect to calculate annual leave when conditions change
    useEffect(() => {
        if (isAnnualLeave && selectedEmployeesForForm.length === 1 && newPayment.annualLeaveMonth) {
            calculateAndSetAnnualLeavePay();
        }
    }, [
        selectedEmployeesForForm,
        newPayment.annualLeaveMonth,
        newPayment.annualLeaveDays,
        isAnnualLeave,
    ]);

    // Determine if employee checkbox should be disabled (for severance pay or annual leave with already 1 selected)
    const isEmployeeDisabled =
        (isSeverancePay || isAnnualLeave) && selectedEmployeesForForm.length >= 1;

    return (
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
                <Button className="flex items-center gap-2 border border-gray-300 dark:border-gray-600">
                    <Plus className="h-4 w-4" />
                    Add Payment
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-full max-h-[90vh] overflow-y-auto bg-white dark:bg-black border border-gray-200 dark:border-gray-700 shadow-2xl mx-4">
                <DialogHeader className="border-b pb-4">
                    <DialogTitle className="text-2xl font-semibold text-gray-900 dark:text-foreground">
                        {isEditMode ? "Edit Payment" : "Add"}
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-8 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label
                                htmlFor="employees"
                                className="text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                                * Employees :
                            </Label>
                            <Popover
                                open={isEmployeePopoverOpen}
                                onOpenChange={setIsEmployeePopoverOpen}
                            >
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={isEmployeePopoverOpen}
                                        className="h-12 w-full justify-between rounded-lg border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:border-gray-300 transition-colors"
                                    >
                                        <div className="flex flex-wrap gap-1 flex-1">
                                            {selectedEmployeesForForm.length === 0 ? (
                                                <span className="text-gray-500">
                                                    Select employees...
                                                </span>
                                            ) : (
                                                selectedEmployeesForForm.map(employee => (
                                                    <div
                                                        key={employee.id}
                                                        className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-md text-sm"
                                                    >
                                                        {employee.firstName} {employee.surname}
                                                        <span
                                                            role="button"
                                                            tabIndex={0}
                                                            onClick={e => {
                                                                e.stopPropagation();
                                                                removeEmployee(employee.id);
                                                            }}
                                                            onKeyDown={e => {
                                                                if (
                                                                    e.key === "Enter" ||
                                                                    e.key === " "
                                                                ) {
                                                                    e.preventDefault();
                                                                    removeEmployee(employee.id);
                                                                }
                                                            }}
                                                            className="ml-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5 cursor-pointer"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </span>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                        <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                    className="w-[var(--radix-popover-trigger-width)] p-0"
                                    align="start"
                                >
                                    <div className="p-2">
                                        <div className="relative">
                                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                                            <Input
                                                placeholder="Search employees..."
                                                value={employeeSearchTerm}
                                                onChange={e =>
                                                    setEmployeeSearchTerm(e.target.value)
                                                }
                                                className="pl-8"
                                            />
                                        </div>
                                    </div>
                                    <div className="max-h-60 overflow-y-auto">
                                        {filteredEmployees.length === 0 ? (
                                            <div className="p-4 text-center text-gray-500">
                                                No employees found
                                            </div>
                                        ) : (
                                            filteredEmployees.map(employee => (
                                                <div
                                                    key={employee.id}
                                                    className={`flex items-center space-x-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer ${isEmployeeDisabled ? "opacity-50" : ""}`}
                                                    onClick={() =>
                                                        !isEmployeeDisabled &&
                                                        handleEmployeeSelection(employee)
                                                    }
                                                >
                                                    <Checkbox
                                                        checked={selectedEmployeesForForm.some(
                                                            emp => emp.id === employee.id,
                                                        )}
                                                        onChange={() =>
                                                            !isEmployeeDisabled &&
                                                            handleEmployeeSelection(employee)
                                                        }
                                                        disabled={isEmployeeDisabled}
                                                    />
                                                    <div className="flex-1">
                                                        <div className="font-medium">
                                                            {employee.firstName} {employee.surname}
                                                        </div>
                                                        {/* <div className="text-sm text-gray-500">{employee.employmentPosition}</div> */}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                    {selectedEmployeesForForm.length > 0 && (
                                        <div className="border-t p-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedEmployeesForForm([]);
                                                    setEmployeeSearchTerm("");
                                                }}
                                                className="w-full"
                                            >
                                                Clear All ({selectedEmployeesForForm.length})
                                            </Button>
                                        </div>
                                    )}
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="space-y-2">
                            <Label
                                htmlFor="paymentType"
                                className="text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                                Payment Type Name :
                            </Label>
                            <Select
                                value={newPayment.paymentTypeName || ""}
                                onValueChange={handlePaymentTypeChange}
                            >
                                <SelectTrigger className="h-12 rounded-lg border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:border-gray-300 transition-colors">
                                    <SelectValue placeholder="Select payment type" />
                                </SelectTrigger>
                                <SelectContent className="rounded-lg shadow-lg">
                                    {paymentTypes.map(pt => (
                                        <SelectItem
                                            key={pt.id}
                                            value={pt.id}
                                            className="hover:bg-gray-50 dark:hover:bg-gray-800"
                                        >
                                            {pt.paymentName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Month selection for Severance Pay */}
                    {isSeverancePay && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label
                                    htmlFor="severanceMonth"
                                    className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2"
                                >
                                    <Info className="h-4 w-4" />
                                    Select Month for Severance Pay :
                                </Label>
                                <Select
                                    value={newPayment.severanceMonth || ""}
                                    onValueChange={handleSeveranceMonthChange}
                                >
                                    <SelectTrigger className="h-12 rounded-lg border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:border-gray-300 transition-colors">
                                        <SelectValue placeholder="Select month" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-lg shadow-lg">
                                        {months.map(month => (
                                            <SelectItem
                                                key={month}
                                                value={month}
                                                className="hover:bg-gray-50 dark:hover:bg-gray-800"
                                            >
                                                {month}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}

                    {/* Month selection for Annual Leave */}
                    {isAnnualLeave && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label
                                    htmlFor="annualLeaveMonth"
                                    className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2"
                                >
                                    <Info className="h-4 w-4" />
                                    Select Month for Annual Leave Pay :
                                </Label>
                                <Select
                                    value={newPayment.annualLeaveMonth || ""}
                                    onValueChange={handleAnnualLeaveMonthChange}
                                >
                                    <SelectTrigger className="h-12 rounded-lg border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:border-gray-300 transition-colors">
                                        <SelectValue placeholder="Select month" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-lg shadow-lg">
                                        {months.map(month => (
                                            <SelectItem
                                                key={month}
                                                value={month}
                                                className="hover:bg-gray-50 dark:hover:bg-gray-800"
                                            >
                                                {month}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label
                                    htmlFor="annualLeaveDays"
                                    className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2"
                                >
                                    <Info className="h-4 w-4" />
                                    Number of Days to Convert to Payment :
                                </Label>
                                <Input
                                    id="annualLeaveDays"
                                    type="number"
                                    min={1}
                                    max={selectedEmployeesForForm[0]?.balanceLeaveDays || 0}
                                    placeholder={`Max: ${selectedEmployeesForForm[0]?.balanceLeaveDays || 0}`}
                                    value={newPayment.annualLeaveDays || ""}
                                    onChange={e => {
                                        const days = Number.parseInt(e.target.value) || 0;
                                        const maxDays =
                                            selectedEmployeesForForm[0]?.balanceLeaveDays || 0;
                                        if (days > 0 && days <= maxDays) {
                                            setNewPayment({
                                                ...newPayment,
                                                annualLeaveDays: days,
                                            });
                                        } else if (days <= 0) {
                                            setNewPayment({
                                                ...newPayment,
                                                annualLeaveDays: undefined,
                                            });
                                        }
                                    }}
                                    className="h-12 rounded-lg border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:border-gray-300 transition-colors"
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    Available balance:{" "}
                                    {selectedEmployeesForForm[0]?.balanceLeaveDays || 0} days
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label
                                htmlFor="amount"
                                className="text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                                {isSeverancePay
                                    ? "Calculated Severance Pay Amount (Auto)"
                                    : isAnnualLeave
                                        ? "Calculated Annual Leave Pay Amount (Auto)"
                                        : "Base Payment Amount"}{" "}
                                :
                            </Label>
                            <Input
                                id="amount"
                                type="number"
                                placeholder={
                                    isSeverancePay || isAnnualLeave
                                        ? "Auto-calculated"
                                        : "Enter base amount"
                                }
                                value={newPayment.paymentAmount || ""}
                                onChange={e => {
                                    // For non-severance and non-annual leave payments, allow manual input
                                    if (!isSeverancePay && !isAnnualLeave) {
                                        const baseAmount = Number.parseFloat(e.target.value) || 0;
                                        const monthlyAmounts: { [month: string]: number } = {};
                                        months.forEach(month => {
                                            monthlyAmounts[month] = baseAmount;
                                        });
                                        setNewPayment({
                                            ...newPayment,
                                            paymentAmount: baseAmount,
                                            monthlyAmounts: monthlyAmounts,
                                        });
                                    }
                                }}
                                readOnly={isSeverancePay || isAnnualLeave}
                                disabled={isSeverancePay || isAnnualLeave}
                                className={`h-12 rounded-lg border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm hover:border-gray-300 transition-colors ${isSeverancePay || isAnnualLeave ? "bg-gray-100 dark:bg-gray-900 cursor-not-allowed" : ""}`}
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="text-center">
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                Enter amount for each month by double clicking on the cell.
                            </p>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-foreground">
                                Set Value for each month:
                            </h3>
                        </div>

                        <div className="overflow-x-auto rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                            <Table>
                                <TableHeader>
                                    <TableRow
                                        style={{ backgroundColor: "#3f3d56ff" }}
                                        className="hover:bg-[#3f3d56ff]"
                                    >
                                        <TableHead className="text-white text-center w-1/12 py-4 font-medium">
                                            January
                                        </TableHead>
                                        <TableHead className="text-white text-center w-1/12 py-4 font-medium">
                                            February
                                        </TableHead>
                                        <TableHead className="text-white text-center w-1/12 py-4 font-medium">
                                            March
                                        </TableHead>
                                        <TableHead className="text-white text-center w-1/12 py-4 font-medium">
                                            April
                                        </TableHead>
                                        <TableHead className="text-white text-center w-1/12 py-4 font-medium">
                                            May
                                        </TableHead>
                                        <TableHead className="text-white text-center w-1/12 py-4 font-medium">
                                            June
                                        </TableHead>
                                        <TableHead className="text-white text-center w-1/12 py-4 font-medium">
                                            July
                                        </TableHead>
                                        <TableHead className="text-white text-center w-1/12 py-4 font-medium">
                                            August
                                        </TableHead>
                                        <TableHead className="text-white text-center w-1/12 py-4 font-medium">
                                            September
                                        </TableHead>
                                        <TableHead className="text-white text-center w-1/12 py-4 font-medium">
                                            October
                                        </TableHead>
                                        <TableHead className="text-white text-center w-1/12 py-4 font-medium">
                                            November
                                        </TableHead>
                                        <TableHead className="text-white text-center w-1/12 py-4 font-medium">
                                            December
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <TableRow className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                        {[
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
                                        ].map(month => (
                                            <TableCell key={month} className="text-center p-2">
                                                <Input
                                                    type="number"
                                                    placeholder="0"
                                                    value={newPayment.monthlyAmounts?.[month] || ""}
                                                    onChange={e => {
                                                        const monthlyAmounts = {
                                                            ...newPayment.monthlyAmounts,
                                                        };
                                                        monthlyAmounts[month] =
                                                            Number.parseFloat(e.target.value) || 0;
                                                        setNewPayment({
                                                            ...newPayment,
                                                            monthlyAmounts,
                                                        });
                                                    }}
                                                    className="w-full text-center border-0 bg-transparent focus:bg-white dark:focus:bg-gray-800 rounded-md h-10 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                                />
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    <div className="flex justify-center pt-6">
                        <Button
                            onClick={handleAddPayment}
                            className="px-12 py-3 bg-[#3f3d56ff] hover:bg-[#2f2d46ff] text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                            size="lg"
                            disabled={isAddEditLoading}
                        >
                            {isAddEditLoading ? (
                                <div className="flex items-center justify-center gap-2">
                                    <Loader2 className="animate-spin h-4 w-4" />
                                    {isEditMode ? "Updating..." : "Submitting..."}
                                </div>
                            ) : (
                                `${isEditMode ? "Update Payment" : "Submit"}`
                            )}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
