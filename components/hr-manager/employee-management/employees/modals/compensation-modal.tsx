"use client";

import { AddEditDeductionDialog } from "@/components/hr-manager/compensation-benefits/payment-deduction/blocks/add-edit-deduction-dialog";
import { AddEditPaymentDialog } from "@/components/hr-manager/compensation-benefits/payment-deduction/blocks/add-edit-payment-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/authContext";
import { useData } from "@/context/app-data-context";
import { useToast } from "@/context/toastContext";
import { useConfirm } from "@/hooks/use-confirm-dialog";
import { LogRepository } from "@/lib/repository/logs/log.repository";
import { months } from "@/lib/util/functions/getListOfDays";
import { numberCommaSeparator } from "@/lib/util/functions/numberCommaSeparator";
import calculateIncomeTax from "@/lib/util/functions/payroll/calculateIncomeTax";
import { calculateSeverancePay } from "@/lib/util/functions/calculateSeverancePay";
import { calculateAnnualLeavePay } from "@/lib/util/functions/calculateAnnualLeavePay";
import { COMPENSATION_LOG_MESSAGES } from "@/lib/log-descriptions/compensation";
import type { EmployeeModel } from "@/lib/models/employee";
import { EmployeeCompensationModel } from "@/lib/models/employeeCompensation";
import { PayrollRepository } from "@/lib/repository/payroll";
import { getTimestamp } from "@/lib/util/dayjs_format";
import { validateMultipleSeverancePayEligibility } from "@/lib/util/functions/calculateSeverancePay";
import { validateMultipleAnnualLeavePayEligibility } from "@/lib/util/functions/calculateAnnualLeavePay";
import dayjs from "dayjs";
import { DollarSign, Edit, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

// Helper functions for month array conversion
function highestMode(arr: number[]): number | null {
    if (arr.length === 0) return null;

    const freqMap = new Map<number, number>();

    // Count occurrences
    for (const num of arr) {
        freqMap.set(num, (freqMap.get(num) || 0) + 1);
    }

    let maxFreq = 0;
    let result: number | null = null;

    // Find highest mode
    for (const [num, freq] of freqMap) {
        if (freq > maxFreq || (freq === maxFreq && (result === null || num > result))) {
            maxFreq = freq;
            result = num;
        }
    }

    return result;
}

function arrayToMonthObject<T>(arr: T[]): Record<string, T | number> {
    const months: Record<string, T | number> = {};

    for (let i = 0; i < 12; i++) {
        // Get full month name (January, February, ...)
        const monthName = dayjs().month(i).format("MMMM");
        months[monthName] = arr[i] ?? 0; // handle shorter arrays
    }

    return months;
}

function monthObjectToArray<T>(obj: Record<string, T | number>): (T | number)[] {
    const result: (T | number)[] = [];

    for (let i = 0; i < 12; i++) {
        const monthName = dayjs().month(i).format("MMMM");
        result.push(obj[monthName] ?? 0);
    }

    return result;
}

interface CompensationModalProps {
    isOpen: boolean;
    employee: EmployeeModel;
    onClose: () => void;
}

type PaymentDraft = Partial<{
    id: string;
    timestamp: string;
    employees: EmployeeModel[];
    paymentTypeName: string;
    paymentAmount: number;
    monthlyAmounts: { [month: string]: number };
    severanceMonth?: string;
    annualLeaveMonth?: string;
}>;

type DeductionDraft = Partial<{
    id: string;
    timestamp: string;
    employees: EmployeeModel[];
    deductionTypeName: string;
    deductionAmount: number;
    monthlyAmounts: { [month: string]: number };
}>;

export function CompensationModal({ isOpen, employee, onClose }: CompensationModalProps) {
    const { showToast } = useToast();
    const { userData } = useAuth();
    const { confirm, ConfirmDialog } = useConfirm();
    const {
        compensations,
        employees,
        paymentTypes: allPaymentTypes,
        deductionTypes: allDeductionTypes,
        pension: pensionDocs,
        taxes,
    } = useData();
    const paymentTypes = allPaymentTypes.filter(p => p.active);
    const deductionTypes = allDeductionTypes.filter(p => p.active);
    const pension = pensionDocs?.[0] || null;
    // Filter compensations for this employee
    const employeeAllowances = compensations.filter(
        comp => comp.type === "Payment" && comp.employees?.includes(employee.uid),
    );

    const employeeDeductions = compensations.filter(
        comp => comp.type === "Deduction" && comp.employees?.includes(employee.uid),
    );

    // Add dependency-based deductions (Income Tax and Employee Pension)
    const dependencyDeductions: EmployeeCompensationModel[] = [];

    // Add Income Tax
    if (employee.associatedTax) {
        const tax = taxes.find(t => t.id === employee.associatedTax);
        if (tax) {
            // Calculate income tax based on base salary
            const baseSalary = employee.salary;
            const taxableGrossSalary = baseSalary;
            const incomeTax = calculateIncomeTax(taxableGrossSalary, tax);
            const roundedIncomeTax = Math.round(incomeTax * 100) / 100;

            dependencyDeductions.push({
                id: "tax-" + employee.uid,
                timestamp: "-", // Show "-" for dynamically calculated values
                employees: [employee.uid],
                type: "Deduction",
                deduction: "Income Tax",
                deductionType: "Value",
                deductionAmount: Array(12).fill(roundedIncomeTax),
                paymentAmount: null,
                paymentType: null,
            });
        }
    }

    // Add Employee Pension (if pension application is enabled)
    if (employee.pensionApplication && pension) {
        const baseSalary = employee.salary;
        let employeePension = 0;

        if (pension.employeePensionType === "Percentage") {
            employeePension = baseSalary * (pension.employeePension / 100);
        } else {
            employeePension = pension.employeePension;
        }

        // Round to 2 decimal places
        const roundedPension = Math.round(employeePension * 100) / 100;

        const pensionType =
            pension.employeePensionType === "Fixed Amount" ? "Value" : pension.employeePensionType;
        dependencyDeductions.push({
            id: "pension-" + employee.uid,
            timestamp: "-", // Show "-" for dynamically calculated values
            employees: [employee.uid],
            type: "Deduction",
            deduction: "Employee Pension",
            deductionType: pensionType as "Value" | "Percentage",
            deductionAmount: Array(12).fill(roundedPension),
            paymentAmount: null,
            paymentType: null,
        });
    }

    const deductions = [...employeeDeductions, ...dependencyDeductions];

    const [activeTab, setActiveTab] = useState<string>("allowances");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isAddPaymentDialogOpen, setIsAddPaymentDialogOpen] = useState<boolean>(false);
    const [isAddDeductionDialogOpen, setIsAddDeductionDialogOpen] = useState<boolean>(false);
    const [isEditMode, setIsEditMode] = useState<boolean>(false);
    const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
    const [editingDeductionId, setEditingDeductionId] = useState<string | null>(null);
    const [newPayment, setNewPayment] = useState<PaymentDraft>({});
    const [newDeduction, setNewDeduction] = useState<DeductionDraft>({});
    const [selectedEmployeesForForm, setSelectedEmployeesForForm] = useState<EmployeeModel[]>([
        employee,
    ]);
    const [employeeSearchTerm, setEmployeeSearchTerm] = useState<string>("");
    const [isEmployeePopoverOpen, setIsEmployeePopoverOpen] = useState<boolean>(false);

    const handleEmployeeToggle = (employee: EmployeeModel) => {
        const isSelected = selectedEmployeesForForm.some(emp => emp.id === employee.id);
        if (isSelected) {
            setSelectedEmployeesForForm(
                selectedEmployeesForForm.filter(emp => emp.id !== employee.id),
            );
        } else {
            setSelectedEmployeesForForm([...selectedEmployeesForForm, employee]);
        }
    };

    const removeEmployee = (employeeId: string) => {
        setSelectedEmployeesForForm(selectedEmployeesForForm.filter(emp => emp.id !== employeeId));
    };

    // Get taxes from top-level collections

    // Check if selected payment type is Severance Pay or Annual Leave
    const selectedPaymentType = paymentTypes.find(pt => pt.id === newPayment.paymentTypeName);
    const isSeverancePay = selectedPaymentType?.paymentType === "Severance Pay";
    const isAnnualLeave = selectedPaymentType?.paymentType === "Annual Leave";

    // Calculate severance pay when conditions are met
    const calculateAndSetSeverancePay = () => {
        if (!isSeverancePay || selectedEmployeesForForm.length !== 1) return;

        const emp = selectedEmployeesForForm[0];
        const baseSalary = emp.salary || 0;

        // Calculate years of service
        if (!emp.contractStartingDate || !emp.contractTerminationDate) return;

        const startDate = dayjs(emp.contractStartingDate);
        const endDate = dayjs(emp.contractTerminationDate);
        const yearsOfService = endDate.diff(startDate, "year", true);

        if (yearsOfService < 5) return;

        // Get tax configuration
        const employeeTax = emp.associatedTax ? taxes.find(t => t.id === emp.associatedTax) : null;

        if (!employeeTax) return;

        // Calculate severance using the new function
        const severanceResult = calculateSeverancePay(baseSalary, yearsOfService, employeeTax);

        // Set the severance amount for the selected month
        const selectedMonth = newPayment.severanceMonth || months[dayjs().month()];
        const monthlyAmounts: { [month: string]: number } = {};

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
    const _handlePaymentTypeChange = (value: string) => {
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
                        ? taxes.find(t => t.id === employee.associatedTax)
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
                    ? taxes.find(t => t.id === employee.associatedTax)
                    : null;

                if (employeeTax) {
                    const annualLeaveResult = calculateAnnualLeavePay(
                        baseSalary,
                        employee.balanceLeaveDays,
                        30, // Static 30 days for general calculation
                        employeeTax,
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
    const _handleSeveranceMonthChange = (month: string) => {
        // Update the month first
        const updatedPayment = {
            ...newPayment,
            severanceMonth: month,
        };
        setNewPayment(updatedPayment);

        // Calculate immediately with the updated month
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
                ? taxes.find(t => t.id === employee.associatedTax)
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

    // Calculate annual leave pay when conditions are met
    const calculateAndSetAnnualLeavePay = () => {
        if (!isAnnualLeave || selectedEmployeesForForm.length !== 1) return;

        const emp = selectedEmployeesForForm[0];
        const baseSalary = emp.salary || 0;

        // Check if employee has balance leave days
        if (!emp.balanceLeaveDays || emp.balanceLeaveDays <= 0) return;

        // Get tax configuration
        const employeeTax = emp.associatedTax ? taxes.find(t => t.id === emp.associatedTax) : null;

        if (!employeeTax) return;

        // Calculate annual leave using the function
        const annualLeaveResult = calculateAnnualLeavePay(
            baseSalary,
            emp.balanceLeaveDays,
            30, // Static 30 days for general calculation
            employeeTax,
        );

        // Set the annual leave amount for the selected month
        const selectedMonth = newPayment.annualLeaveMonth || months[dayjs().month()];
        const monthlyAmounts: { [month: string]: number } = {};

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

    // Handle month selection for annual leave pay
    const _handleAnnualLeaveMonthChange = (month: string) => {
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
                ? taxes.find(t => t.id === employee.associatedTax)
                : null;

            if (!employeeTax) {
                return;
            }

            const annualLeaveResult = calculateAnnualLeavePay(
                baseSalary,
                employee.balanceLeaveDays,
                30, // Static 30 days for general calculation
                employeeTax,
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

    // Effect to calculate severance when conditions change
    useEffect(() => {
        if (isSeverancePay && selectedEmployeesForForm.length === 1 && newPayment.severanceMonth) {
            calculateAndSetSeverancePay();
        }
        // The calculator closes over the current draft and intentionally only reruns on the
        // severance-specific business inputs listed here.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedEmployeesForForm, newPayment.severanceMonth, isSeverancePay]);

    // Effect to calculate annual leave when conditions change
    useEffect(() => {
        if (isAnnualLeave && selectedEmployeesForForm.length === 1 && newPayment.annualLeaveMonth) {
            calculateAndSetAnnualLeavePay();
        }
        // The calculator closes over the current draft and intentionally only reruns on the
        // annual-leave-specific business inputs listed here.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedEmployeesForForm, newPayment.annualLeaveMonth, isAnnualLeave]);

    const handleAddPayment = async () => {
        setIsLoading(true);
        if (
            selectedEmployeesForForm.length > 0 &&
            newPayment.paymentTypeName &&
            newPayment.paymentAmount
        ) {
            // Check if this is a Severance Pay or Annual Leave payment type
            const selectedPaymentType = paymentTypes.find(
                pt => pt.id === newPayment.paymentTypeName,
            );
            const isSeverancePay = selectedPaymentType?.paymentType === "Severance Pay";
            const isAnnualLeave = selectedPaymentType?.paymentType === "Annual Leave";

            // If it's Severance Pay, validate employee eligibility
            if (isSeverancePay) {
                const validation =
                    validateMultipleSeverancePayEligibility(selectedEmployeesForForm);

                if (!validation.isValid) {
                    showToast(validation.errors.join("\n"), "Validation Error", "error");
                    setIsLoading(false);
                    return;
                }
            }

            // If it's Annual Leave, validate employee eligibility
            if (isAnnualLeave) {
                const validation = validateMultipleAnnualLeavePayEligibility(
                    selectedEmployeesForForm,
                    30,
                );

                if (!validation.isValid) {
                    showToast(validation.errors.join("\n"), "Validation Error", "error");
                    setIsLoading(false);
                    return;
                }
            }

            if (isEditMode && editingPaymentId) {
                const updateData: Partial<EmployeeCompensationModel> & { id: string } = {
                    id: editingPaymentId,
                    employees: selectedEmployeesForForm.map(e => e.uid),
                    type: "Payment",
                    paymentType: newPayment.paymentTypeName,
                    paymentAmount: monthObjectToArray(newPayment.monthlyAmounts ?? {}),
                    deduction: null,
                    deductionType: null,
                    deductionAmount: null,
                };

                const logInfo = COMPENSATION_LOG_MESSAGES.UPDATED(
                    `payment: ${paymentTypes.find(pt => pt.id === newPayment.paymentTypeName)?.paymentName ?? ""}`,
                );
                const result = await PayrollRepository.updateCompensation(updateData);
                await LogRepository.create(
                    logInfo,
                    userData?.uid ?? "",
                    result.success ? "Success" : "Failure",
                );

                if (result.success) {
                    showToast("Payment updated successfully", "Success", "success");
                    handleResetPayment();
                } else {
                    showToast("Error updating payment", "Error", "error");
                }
            } else {
                const newPaymentData: Omit<EmployeeCompensationModel, "id"> = {
                    timestamp: getTimestamp(),
                    employees: selectedEmployeesForForm.map(e => e.uid),
                    type: "Payment",
                    paymentType: newPayment.paymentTypeName,
                    paymentAmount: monthObjectToArray(newPayment.monthlyAmounts ?? {}),
                    deduction: null,
                    deductionType: null,
                    deductionAmount: null,
                };

                const logInfo = COMPENSATION_LOG_MESSAGES.CREATED(
                    `payment: ${paymentTypes.find(pt => pt.id === newPayment.paymentTypeName)?.paymentName ?? ""}`,
                );
                const result = await PayrollRepository.createCompensation(newPaymentData);
                await LogRepository.create(
                    logInfo,
                    userData?.uid ?? "",
                    result.success ? "Success" : "Failure",
                );

                if (result.success) {
                    showToast("Payment created successfully", "Success", "success");
                    handleResetPayment();
                } else {
                    showToast("Error creating payment", "Error", "error");
                }
            }
        }
        setIsLoading(false);
    };

    const handleResetPayment = () => {
        setNewPayment({});
        setSelectedEmployeesForForm([employee]);
        setEmployeeSearchTerm("");
        setIsEditMode(false);
        setEditingPaymentId(null);
        setIsAddPaymentDialogOpen(false);
    };

    const handleAddDeduction = async () => {
        setIsLoading(true);
        if (
            selectedEmployeesForForm.length > 0 &&
            newDeduction.deductionTypeName &&
            newDeduction.deductionAmount
        ) {
            if (isEditMode && editingDeductionId) {
                const updateData: Partial<EmployeeCompensationModel> & { id: string } = {
                    id: editingDeductionId,
                    employees: selectedEmployeesForForm.map(e => e.uid),
                    type: "Deduction",
                    deduction: newDeduction.deductionTypeName,
                    deductionType: "Value",
                    deductionAmount: monthObjectToArray(newDeduction.monthlyAmounts ?? {}),
                    paymentAmount: null,
                    paymentType: null,
                };

                const logInfo = COMPENSATION_LOG_MESSAGES.UPDATED(
                    `deduction: ${deductionTypes.find(dt => dt.id === newDeduction.deductionTypeName)?.deductionName ?? ""}`,
                );
                const result = await PayrollRepository.updateCompensation(updateData);
                await LogRepository.create(
                    logInfo,
                    userData?.uid ?? "",
                    result.success ? "Success" : "Failure",
                );

                if (result.success) {
                    showToast("Deduction updated successfully", "Success", "success");
                    handleResetDeduction();
                } else {
                    showToast("Error updating deduction", "Error", "error");
                }
            } else {
                const newDeductionData: Omit<EmployeeCompensationModel, "id"> = {
                    timestamp: getTimestamp(),
                    employees: selectedEmployeesForForm.map(e => e.uid),
                    type: "Deduction",
                    deduction: newDeduction.deductionTypeName,
                    deductionType: "Value",
                    deductionAmount: monthObjectToArray(newDeduction.monthlyAmounts ?? {}),
                    paymentAmount: null,
                    paymentType: null,
                };

                const logInfo = COMPENSATION_LOG_MESSAGES.CREATED(
                    `deduction: ${deductionTypes.find(dt => dt.id === newDeduction.deductionTypeName)?.deductionName ?? ""}`,
                );
                const result = await PayrollRepository.createCompensation(newDeductionData);
                await LogRepository.create(
                    logInfo,
                    userData?.uid ?? "",
                    result.success ? "Success" : "Failure",
                );

                if (result.success) {
                    showToast("Deduction created successfully", "Success", "success");
                    handleResetDeduction();
                } else {
                    showToast("Error creating deduction", "Error", "error");
                }
            }
        }
        setIsLoading(false);
    };

    const handleResetDeduction = () => {
        setNewDeduction({});
        setSelectedEmployeesForForm([employee]);
        setEmployeeSearchTerm("");
        setIsEditMode(false);
        setEditingDeductionId(null);
        setIsAddDeductionDialogOpen(false);
    };

    const handleEditAllowance = (allowance: EmployeeCompensationModel) => {
        setIsEditMode(true);
        setEditingPaymentId(allowance.id);
        setNewPayment({
            timestamp: allowance.timestamp,
            paymentTypeName: allowance.paymentType || "",
            paymentAmount: highestMode(allowance.paymentAmount ?? []) ?? 0,
            monthlyAmounts: arrayToMonthObject(allowance.paymentAmount ?? []),
        });
        setSelectedEmployeesForForm([employee]); // Pre-select the current employee
        setIsAddPaymentDialogOpen(true);
    };

    const handleEditDeduction = (deduction: EmployeeCompensationModel) => {
        setIsEditMode(true);
        setEditingDeductionId(deduction.id);
        setNewDeduction({
            timestamp: deduction.timestamp,
            deductionTypeName: deduction.deduction || "",
            deductionAmount: highestMode(deduction.deductionAmount ?? []) ?? 0,
            monthlyAmounts: arrayToMonthObject(deduction.deductionAmount ?? []),
        });
        setSelectedEmployeesForForm([employee]); // Pre-select the current employee
        setIsAddDeductionDialogOpen(true);
    };

    const handleDeleteAllowance = (id: string) => {
        confirm("Are you sure you want to delete this allowance?", async () => {
            setIsLoading(true);
            try {
                const logInfo = COMPENSATION_LOG_MESSAGES.DELETED(
                    paymentTypes.find(
                        pt => pt.id === employeeAllowances.find(a => a.id === id)?.paymentType,
                    )?.paymentName ?? "",
                );
                const result = await PayrollRepository.deleteCompensation(id);
                await LogRepository.create(
                    logInfo,
                    userData?.uid ?? "",
                    result.success ? "Success" : "Failure",
                );

                if (result.success) {
                    showToast("Allowance deleted successfully", "Success", "success");
                } else {
                    showToast("Error deleting allowance", "Error", "error");
                }
            } catch (error) {
                console.error(error);
                showToast("An error occurred", "Error", "error");
            } finally {
                setIsLoading(false);
            }
        });
    };

    const handleDeleteDeduction = (id: string) => {
        confirm("Are you sure you want to delete this deduction?", async () => {
            setIsLoading(true);
            try {
                const logInfo = COMPENSATION_LOG_MESSAGES.DELETED(
                    deductionTypes.find(
                        dt => dt.id === deductions.find(d => d.id === id)?.deduction,
                    )?.deductionName ?? "",
                );
                const result = await PayrollRepository.deleteCompensation(id);
                await LogRepository.create(
                    logInfo,
                    userData?.uid ?? "",
                    result.success ? "Success" : "Failure",
                );

                if (result.success) {
                    showToast("Deduction deleted successfully", "Success", "success");
                } else {
                    showToast("Error deleting deduction", "Error", "error");
                }
            } catch (error) {
                console.error(error);
                showToast("An error occurred", "Error", "error");
            } finally {
                setIsLoading(false);
            }
        });
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
                    <DialogHeader className="flex-shrink-0">
                        <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2">
                                <DollarSign className="w-5 h-5 text-primary-600" />
                                <DialogTitle className="text-xl font-semibold text-primary-900">
                                    Compensation & Benefits
                                </DialogTitle>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="p-6">
                        <div className="p-4 rounded-lg mb-6">
                            <p className="text-sm text-primary-800">
                                <strong>Employee:</strong> {employee.firstName} {employee.surname} (
                                {employee.employeeID})
                            </p>
                        </div>

                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="allowances">Allowances (Payments)</TabsTrigger>
                                <TabsTrigger value="deductions">Deductions</TabsTrigger>
                            </TabsList>

                            <TabsContent value="allowances" className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-semibold text-primary-900">
                                        Payment Allowances
                                    </h3>
                                    <AddEditPaymentDialog
                                        isAddDialogOpen={isAddPaymentDialogOpen}
                                        setIsAddDialogOpen={setIsAddPaymentDialogOpen}
                                        isEditMode={isEditMode}
                                        editingPaymentId={editingPaymentId}
                                        newPayment={newPayment}
                                        setNewPayment={setNewPayment}
                                        selectedEmployeesForForm={selectedEmployeesForForm}
                                        setSelectedEmployeesForForm={setSelectedEmployeesForForm}
                                        employeeSearchTerm={employeeSearchTerm}
                                        setEmployeeSearchTerm={setEmployeeSearchTerm}
                                        isEmployeePopoverOpen={isEmployeePopoverOpen}
                                        setIsEmployeePopoverOpen={setIsEmployeePopoverOpen}
                                        filteredEmployees={employees.filter(
                                            e =>
                                                e.firstName
                                                    .toLowerCase()
                                                    .includes(employeeSearchTerm.toLowerCase()) ||
                                                e.surname
                                                    .toLowerCase()
                                                    .includes(employeeSearchTerm.toLowerCase()) ||
                                                e.employmentPosition
                                                    .toLowerCase()
                                                    .includes(employeeSearchTerm.toLowerCase()),
                                        )}
                                        handleEmployeeToggle={handleEmployeeToggle}
                                        removeEmployee={removeEmployee}
                                        paymentTypes={paymentTypes}
                                        handleAddPayment={handleAddPayment}
                                        isAddEditLoading={isLoading}
                                        paymentsData={[]}
                                        taxes={taxes}
                                        settingsLookup={{
                                            paymentTypes: allPaymentTypes,
                                            deductionTypes: allDeductionTypes,
                                            pension: pensionDocs,
                                            taxes,
                                        }}
                                    />
                                </div>

                                <div className="border border-gray-200 rounded-lg overflow-hidden">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-secondary-100">
                                                <TableHead>Timestamp</TableHead>
                                                <TableHead>Payment Type</TableHead>
                                                <TableHead>Payment Amount</TableHead>
                                                <TableHead>Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {employeeAllowances.length === 0 ? (
                                                <TableRow>
                                                    <TableCell
                                                        colSpan={4}
                                                        className="text-center py-4 text-muted-foreground"
                                                    >
                                                        No allowances found
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                employeeAllowances.map(allowance => (
                                                    <TableRow key={allowance.id}>
                                                        <TableCell className="font-mono text-sm">
                                                            {allowance.timestamp}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge
                                                                variant="secondary"
                                                                className="bg-blue-100 text-blue-800"
                                                            >
                                                                {paymentTypes.find(
                                                                    pt =>
                                                                        pt.id ===
                                                                        allowance.paymentType,
                                                                )?.paymentName ||
                                                                    allowance.paymentType}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="font-medium">
                                                            {numberCommaSeparator(
                                                                allowance.paymentAmount?.[
                                                                    months.indexOf(
                                                                        dayjs().format("MMMM"),
                                                                    )
                                                                ] || 0,
                                                            )}{" "}
                                                            ETB
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() =>
                                                                        handleEditAllowance(
                                                                            allowance,
                                                                        )
                                                                    }
                                                                    disabled={isLoading}
                                                                >
                                                                    <Edit className="w-4 h-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() =>
                                                                        handleDeleteAllowance(
                                                                            allowance.id,
                                                                        )
                                                                    }
                                                                    className="text-red-600"
                                                                    disabled={isLoading}
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </TabsContent>

                            <TabsContent value="deductions" className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-semibold text-primary-900">
                                        Salary Deductions
                                    </h3>
                                    <AddEditDeductionDialog
                                        isAddDeductionDialogOpen={isAddDeductionDialogOpen}
                                        setIsAddDeductionDialogOpen={setIsAddDeductionDialogOpen}
                                        isDeductionEditMode={isEditMode}
                                        editingDeductionId={editingDeductionId}
                                        newDeduction={newDeduction}
                                        setNewDeduction={setNewDeduction}
                                        selectedEmployeesForDeductionForm={selectedEmployeesForForm}
                                        setSelectedEmployeesForDeductionForm={
                                            setSelectedEmployeesForForm
                                        }
                                        deductionEmployeeSearchTerm={employeeSearchTerm}
                                        setDeductionEmployeeSearchTerm={setEmployeeSearchTerm}
                                        isDeductionEmployeePopoverOpen={isEmployeePopoverOpen}
                                        setIsDeductionEmployeePopoverOpen={setIsEmployeePopoverOpen}
                                        filteredDeductionEmployees={employees.filter(
                                            e =>
                                                e.firstName
                                                    .toLowerCase()
                                                    .includes(employeeSearchTerm.toLowerCase()) ||
                                                e.surname
                                                    .toLowerCase()
                                                    .includes(employeeSearchTerm.toLowerCase()) ||
                                                e.employmentPosition
                                                    .toLowerCase()
                                                    .includes(employeeSearchTerm.toLowerCase()),
                                        )}
                                        handleDeductionEmployeeToggle={handleEmployeeToggle}
                                        removeDeductionEmployee={removeEmployee}
                                        deductionTypes={deductionTypes}
                                        handleAddDeduction={handleAddDeduction}
                                        isAddEditLoading={isLoading}
                                        deductionsData={[]}
                                    />
                                </div>

                                <div className="border border-gray-200 rounded-lg overflow-hidden">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-secondary-100">
                                                <TableHead>Timestamp</TableHead>
                                                <TableHead>Deduction Type</TableHead>
                                                <TableHead>Deduction Amount</TableHead>
                                                <TableHead>Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {deductions.length === 0 ? (
                                                <TableRow>
                                                    <TableCell
                                                        colSpan={4}
                                                        className="text-center py-4 text-muted-foreground"
                                                    >
                                                        No deductions found
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                deductions.map(deduction => (
                                                    <TableRow key={deduction.id}>
                                                        <TableCell className="font-mono text-sm">
                                                            {deduction.timestamp}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge
                                                                variant="secondary"
                                                                className="bg-red-100 text-red-800"
                                                            >
                                                                {deductionTypes.find(
                                                                    dt =>
                                                                        dt.id ===
                                                                        deduction.deduction,
                                                                )?.deductionName ||
                                                                    deduction.deduction}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="font-medium">
                                                            {numberCommaSeparator(
                                                                deduction.deductionAmount?.[
                                                                    months.indexOf(
                                                                        dayjs().format("MMMM"),
                                                                    )
                                                                ] || 0,
                                                            )}{" "}
                                                            ETB
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() =>
                                                                        handleEditDeduction(
                                                                            deduction,
                                                                        )
                                                                    }
                                                                    disabled={
                                                                        isLoading ||
                                                                        deduction.deduction ===
                                                                            "Income Tax" ||
                                                                        deduction.deduction ===
                                                                            "Employee Pension"
                                                                    }
                                                                >
                                                                    <Edit className="w-4 h-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() =>
                                                                        handleDeleteDeduction(
                                                                            deduction.id,
                                                                        )
                                                                    }
                                                                    className="text-red-600"
                                                                    disabled={
                                                                        isLoading ||
                                                                        deduction.deduction ===
                                                                            "Income Tax" ||
                                                                        deduction.deduction ===
                                                                            "Employee Pension"
                                                                    }
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </DialogContent>
            </Dialog>
            {ConfirmDialog}
        </>
    );
}
