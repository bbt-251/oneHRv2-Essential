"use client";

import { useEffect, useState } from "react";
import { EmployeeLoanModel, LoanByMonth } from "@/lib/models/employeeLoan";
import { useData } from "@/context/app-data-context";
import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import { getTimestamp } from "@/lib/util/dayjs_format";
import { useRouter } from "next/navigation";
import getFullName from "@/lib/util/getEmployeeFullName";
import { EmployeeModel } from "@/lib/models/employee";
import { useToast } from "@/context/toastContext";
import {
    createLoan,
    deleteLoan as _deleteLoan,
    updateLoan,
} from "@/lib/backend/api/compensation-benefit/loan-services";
import { COMPENSATION_LOG_MESSAGES } from "@/lib/log-descriptions/compensation";
import { useAuth } from "@/context/authContext";
dayjs.extend(isSameOrBefore);

export interface ExtendedEmployeeLoan extends EmployeeLoanModel {
    employeeName: string;
    paidAmount: number;
    remainingAmount: number;
}

const calculateLoanProgress = (months: LoanByMonth[], loanTotalAmount: number) => {
    const paidAmount = months
        .filter(month => month.confirmed === true)
        .reduce((sum, month) => sum + Number(month.amount), 0);

    return {
        paidAmount,
        remainingAmount: Math.max(Number(loanTotalAmount.toFixed(2)) - paidAmount, 0),
    };
};

export function useLoanManagement(
    confirm: (
        message: string,
        onConfirm: () => void | Promise<void>,
        showLoading?: boolean | undefined,
    ) => void,
) {
    const router = useRouter();
    const { showToast } = useToast();
    const { employees, employeeLoans, ...hrSettings } = useData();
    const { userData } = useAuth();
    const loanTypes = hrSettings.loanTypes.filter(l => l.active === true);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState<boolean>(false);
    const [isEditMode, setIsEditMode] = useState<boolean>(false);
    const [editingLoan, setEditingLoan] = useState<ExtendedEmployeeLoan | null>(null);
    const [isInstallmentsModalOpen, setIsInstallmentsModalOpen] = useState<boolean>(false);
    const [selectedLoanForInstallments, setSelectedLoanForInstallments] =
        useState<ExtendedEmployeeLoan | null>(null);
    const [isEmployeeDropdownOpen, setIsEmployeeDropdownOpen] = useState<boolean>(false);
    const [employeeSearchTerm, setEmployeeSearchTerm] = useState<string>("");
    const [isFilterModalOpen, setIsFilterModalOpen] = useState<boolean>(false);
    const [isAddEditLoading, setIsAddEditLoading] = useState<boolean>(false);
    const [isEditingMode, setIsEditingMode] = useState<boolean>(false);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [editValues, setEditValues] = useState<{
        [key: string]: { amount: string; deductFromSalary: string; comment: string };
    }>({});
    const [installPage, setInstallPage] = useState<number>(0);
    const [installPageSize, setInstallPageSize] = useState<number>(12);

    const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
        timestamp: true,
        employee: true,
        loanType: true,
        loanAmount: true,
        loanTotalAmount: true,
        duration: true,
        monthlyRepaymentAmount: true,
        loanRepaymentStartMonth: true,
        loanRepaymentEndMonth: true,
        loanStatus: true,
        paidAmount: true,
        remainingAmount: true,
    });

    const [filters, setFilters] = useState<Record<string, string>>({
        timestamp: "",
        employee: "",
        loanType: "",
        loanAmount: "",
        loanTotalAmount: "",
        duration: "",
        monthlyRepaymentAmount: "",
        loanRepaymentStartMonth: "",
        loanRepaymentEndMonth: "",
        loanStatus: "",
        paidAmount: "",
        remainingAmount: "",
    });

    const [newLoan, setNewLoan] = useState<Partial<ExtendedEmployeeLoan>>({
        employeeUid: "",
        employeeName: "",
        loanType: "",
        loanAmount: 0,
        duration: 12,
        loanStatus: "Ongoing",
        loanTotalAmount: 0,
        loanRepaymentStartMonth: "",
        loanRepaymentEndMonth: "",
        monthlyRepaymentAmount: 0,
    });

    const filteredEmployees = employees
        .filter(
            employee =>
                getFullName(employee).toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
                (employee.employeeID || "")
                    .toLowerCase()
                    .includes(employeeSearchTerm.toLowerCase()) ||
                (employee.department || "")
                    .toLowerCase()
                    .includes(employeeSearchTerm.toLowerCase()),
        )
        .filter((employee, index, self) => self.findIndex(e => e.uid === employee.uid) === index);

    const [loans, setLoans] = useState<ExtendedEmployeeLoan[]>([]);

    const filteredLoans = loans.filter(loan => {
        return Object.entries(filters).every(([key, value]) => {
            if (!value) return true;
            const loanValue =
                loan[key as keyof ExtendedEmployeeLoan]?.toString().toLowerCase() || "";
            return loanValue.includes(value.toLowerCase());
        });
    });

    const totalLoansAmount = loans.reduce((sum, loan) => sum + loan.loanTotalAmount, 0);
    const totalOutstanding = loans.reduce((sum, loan) => sum + loan.remainingAmount, 0);
    const activeLoans = loans.filter(loan => loan.loanStatus === "Ongoing").length;

    const avgTerm = Math.round(
        loans.reduce((sum, loan) => sum + loan.duration, 0) / loans.length || 0,
    );

    useEffect(() => {
        const _loans: ExtendedEmployeeLoan[] = [];
        employeeLoans.forEach(loan => {
            const loanProgress = calculateLoanProgress(loan.months, loan.loanTotalAmount);

            _loans.push({
                ...loan,
                employeeName: getFullName(
                    employees.find(e => e.uid == loan.employeeUid) ?? ({} as EmployeeModel),
                ),
                paidAmount: loanProgress.paidAmount,
                remainingAmount: loanProgress.remainingAmount,
            });
        });

        setLoans(_loans);
    }, [employeeLoans, employees]);

    // Reset and clamp installments pagination when modal/selection changes
    useEffect(() => {
        if (!isInstallmentsModalOpen) {
            setInstallPage(0);
            return;
        }
        const total = selectedLoanForInstallments?.months?.length ?? 0;
        const maxPage = Math.max(Math.ceil(total / installPageSize) - 1, 0);
        if (installPage > maxPage) {
            setInstallPage(0);
        }
    }, [isInstallmentsModalOpen, selectedLoanForInstallments, installPageSize, installPage]);

    const handleAddLoan = async () => {
        setIsAddEditLoading(true);

        // Check if user is authenticated
        if (!userData) {
            showToast(
                "User not authenticated. Please log in again.",
                "Authentication Error",
                "error",
            );
            setIsAddEditLoading(false);
            return;
        }

        // Validation checks
        const missingFields: string[] = [];
        if (!newLoan.employeeUid) missingFields.push("Employee");
        if (!newLoan.loanType) missingFields.push("Loan Type");
        if (!newLoan.loanAmount || newLoan.loanAmount <= 0) missingFields.push("Loan Amount");
        if (!newLoan.loanTotalAmount || newLoan.loanTotalAmount <= 0)
            missingFields.push("Loan Total Amount (please select a loan type with interest rate)");
        if (!newLoan.duration || newLoan.duration <= 0) missingFields.push("Duration");
        if (!newLoan.monthlyRepaymentAmount || newLoan.monthlyRepaymentAmount <= 0)
            missingFields.push("Monthly Repayment Amount");
        if (!newLoan.loanRepaymentStartMonth) missingFields.push("Start Month");
        if (!newLoan.loanRepaymentEndMonth) missingFields.push("End Month");

        if (missingFields.length > 0) {
            showToast(
                `Please fill in all required fields: ${missingFields.join(", ")}`,
                "Validation Error",
                "error",
            );
            setIsAddEditLoading(false);
            return;
        }

        // At this point, all required fields are present and valid (non-zero, non-empty)
        // Use non-null assertions since we validated them
        const employeeUid = newLoan.employeeUid!;
        const loanType = newLoan.loanType!;
        const loanAmount = newLoan.loanAmount!;
        const loanTotalAmount = newLoan.loanTotalAmount!;
        const duration = newLoan.duration!;
        const monthlyRepaymentAmount = newLoan.monthlyRepaymentAmount!;
        const loanRepaymentStartMonth = newLoan.loanRepaymentStartMonth!;
        const loanRepaymentEndMonth = newLoan.loanRepaymentEndMonth!;
        const loanStatus = newLoan.loanStatus!;

        const months: LoanByMonth[] = [];
        const startDate = dayjs(loanRepaymentStartMonth, "MMMM YYYY");
        const endDate = dayjs(loanRepaymentEndMonth, "MMMM YYYY");

        if (!startDate.isValid()) {
            showToast("Invalid start month", "Error", "error");
            setIsAddEditLoading(false);
            return;
        }

        if (!endDate.isValid()) {
            showToast("Invalid end month", "Error", "error");
            setIsAddEditLoading(false);
            return;
        }

        let currentDate = startDate;
        while (currentDate.isSameOrBefore(endDate)) {
            months.push({
                id: crypto.randomUUID(),
                date: currentDate.format("MMMM YYYY"),
                amount: monthlyRepaymentAmount,
                deductFromSalary: monthlyRepaymentAmount,
                // Installments must start unpaid and be confirmed when payment is actually made.
                confirmed: false,
                comment: null,
            });
            currentDate = currentDate.add(1, "month");
        }

        const loan: Omit<EmployeeLoanModel, "id"> = {
            timestamp: getTimestamp(),
            employeeUid,
            loanType,
            loanAmount,
            loanTotalAmount,
            duration,
            monthlyRepaymentAmount,
            loanRepaymentStartMonth,
            loanRepaymentEndMonth,
            loanStatus: loanStatus as "Ongoing" | "Terminated",
            months,
        };

        try {
            let res: boolean;
            if (isEditMode && editingLoan) {
                const { timestamp: _timestamp, ...data } = loan;
                res = await updateLoan(
                    { id: editingLoan.id, ...data },
                    userData?.uid ?? "",
                    COMPENSATION_LOG_MESSAGES.UPDATED(
                        `loan: ${loanTypes.find(lt => lt.id == loan.loanType)?.loanName ?? ""}`,
                    ),
                );
                if (res) {
                    showToast("Loan updated successfully", "Success", "success");
                    setIsEditMode(false);
                    setEditingLoan(null);
                    handleReset();
                } else {
                    showToast("Error updating loan", "Error", "error");
                }
            } else {
                res = await createLoan(
                    loan,
                    userData?.uid ?? "",
                    COMPENSATION_LOG_MESSAGES.CREATED(
                        `loan: ${loanTypes.find(lt => lt.id == loan.loanType)?.loanName ?? ""}`,
                    ),
                );
                if (res) {
                    showToast("Loan created successfully", "Success", "success");
                    setIsEditMode(false);
                    setEditingLoan(null);
                    handleReset();
                } else {
                    showToast("Error creating loan", "Error", "error");
                }
            }
        } catch (error) {
            console.error("Error saving loan:", error);
            showToast(
                isEditMode ? "Failed to update loan" : "Failed to create loan",
                "Error",
                "error",
            );
        } finally {
            setIsAddEditLoading(false);
        }
    };

    const handleReset = () => {
        setNewLoan({
            employeeUid: "",
            employeeName: "",
            loanType: "",
            loanAmount: 0,
            duration: 12,
            loanStatus: "Ongoing",
            loanTotalAmount: 0,
            loanRepaymentStartMonth: "",
            loanRepaymentEndMonth: "",
            monthlyRepaymentAmount: 0,
        });
        // Ensure Add dialog always opens in a clean add state.
        setIsEditMode(false);
        setEditingLoan(null);
        setIsAddDialogOpen(false);
    };

    const handleSaveEdit = async () => {
        if (!selectedLoanForInstallments) return;
        setIsSaving(true);

        // Calculate sum of amounts
        const totalAmount = Object.values(editValues).reduce(
            (sum, values) => sum + Number(values.amount),
            0,
        );
        const loanTotalAmount = selectedLoanForInstallments.loanTotalAmount;

        if (Math.abs(totalAmount - loanTotalAmount) > 0.01) {
            showToast(
                `Total amount (${totalAmount.toFixed(2)}) must equal loan total amount (${loanTotalAmount.toFixed(2)})`,
                "Warning",
                "error",
            );
            setIsSaving(false);
            return;
        }

        let update = { ...selectedLoanForInstallments };
        update.months = update.months.map(month => {
            const editVal = editValues[month.id];
            if (editVal) {
                return {
                    ...month,
                    amount: Number(editVal.amount),
                    deductFromSalary: Number(editVal.amount), // Same as amount
                    comment: editVal.comment || null,
                };
            }
            return month;
        });

        setSelectedLoanForInstallments(update);
        const loanIndex = loans.findIndex(l => l.id === selectedLoanForInstallments.id);
        if (loanIndex !== -1) {
            setLoans(prev => {
                const newLoans = [...prev];
                const loanProgress = calculateLoanProgress(update.months, update.loanTotalAmount);
                newLoans[loanIndex] = {
                    ...update,
                    ...loanProgress,
                };
                return newLoans;
            });
        }

        await updateLoan(
            update,
            userData?.uid ?? "",
            COMPENSATION_LOG_MESSAGES.UPDATED(
                `loan: ${loanTypes.find(lt => lt.id == update.loanType)?.loanName ?? ""}`,
            ),
        )
            .then(() => {
                showToast("Installments updated successfully", "Success", "success");
                setIsEditingMode(false);
                setEditValues({});
            })
            .catch(err => {
                showToast("Error updating installments", "Error", "error");
                console.error(err);
            });

        setIsSaving(false);
    };

    const openViewDialog = (loan: ExtendedEmployeeLoan) => {
        setEditingLoan(loan);
        setNewLoan({
            employeeUid: loan.employeeUid,
            employeeName: loan.employeeName,
            loanType: loan.loanType,
            loanAmount: loan.loanAmount,
            duration: loan.duration,
            loanStatus: loan.loanStatus,
            loanTotalAmount: loan.loanTotalAmount,
            loanRepaymentStartMonth: loan.loanRepaymentStartMonth,
            loanRepaymentEndMonth: loan.loanRepaymentEndMonth,
            monthlyRepaymentAmount: loan.monthlyRepaymentAmount,
        });
        setIsEditMode(false); // View mode, not edit mode
        setIsAddDialogOpen(true);
    };

    const openInstallmentsModal = (loan: ExtendedEmployeeLoan) => {
        setSelectedLoanForInstallments(loan);
        setIsInstallmentsModalOpen(true);
    };

    const openEditDialog = (loan: ExtendedEmployeeLoan) => {
        setEditingLoan(loan);
        setNewLoan({
            employeeUid: loan.employeeUid,
            employeeName: loan.employeeName,
            loanType: loan.loanType,
            loanAmount: loan.loanAmount,
            duration: loan.duration,
            loanStatus: loan.loanStatus,
            loanTotalAmount: loan.loanTotalAmount,
            loanRepaymentStartMonth: loan.loanRepaymentStartMonth,
            loanRepaymentEndMonth: loan.loanRepaymentEndMonth,
            monthlyRepaymentAmount: loan.monthlyRepaymentAmount,
        });
        setIsEditMode(true);
        setIsAddDialogOpen(true);
    };

    const deleteLoan = (id: string) => {
        confirm("Are you sure ?", async () => {
            const res = await _deleteLoan(
                id,
                userData?.uid ?? "",
                COMPENSATION_LOG_MESSAGES.DELETED(
                    `loan: ${loanTypes.find(lt => loans.find(l => l.id == id)?.loanType == lt.id)?.loanName ?? ""}`,
                ),
            );
            if (res) {
                showToast("Loan deleted successfully", "Success", "success");
            } else {
                showToast("Error deleting loan", "Error", "error");
            }
        });
    };

    const getStatusBadge = (status: string) => {
        const statusConfig = {
            Ongoing: {
                color: "bg-blue-100 text-blue-800",
                label: "Ongoing",
            },
            Terminated: {
                color: "bg-gray-100 text-gray-800",
                label: "Terminated",
            },
        };
        return statusConfig[status as keyof typeof statusConfig];
    };

    const columnDefinitions = [
        { key: "timestamp", label: "Timestamp", width: "w-1/13" },
        { key: "employee", label: "Employee", width: "w-1/13" },
        { key: "loanType", label: "Loan Type", width: "w-1/13" },
        { key: "loanAmount", label: "Loan Amount", width: "w-1/13" },
        { key: "loanTotalAmount", label: "Loan Total Amount", width: "w-1/13" },
        { key: "duration", label: "Duration", width: "w-1/13" },
        {
            key: "monthlyRepaymentAmount",
            label: "Monthly Repayment",
            width: "w-1/13",
        },
        {
            key: "loanRepaymentStartMonth",
            label: "Start Month",
            width: "w-1/13",
        },
        { key: "loanRepaymentEndMonth", label: "End Month", width: "w-1/13" },
        { key: "loanStatus", label: "Status", width: "w-1/13" },
        { key: "paidAmount", label: "Paid Amount", width: "w-1/13" },
        { key: "remainingAmount", label: "Remaining Amount", width: "w-1/13" },
    ];

    const months = Array.from({ length: 12 }, (_, i) => dayjs().month(i).format("MMMM YYYY"));

    // Pagination calculations for installments table
    const totalInstallments = selectedLoanForInstallments?.months?.length ?? 0;
    const maxInstallPage = Math.max(Math.ceil(totalInstallments / installPageSize) - 1, 0);
    const clampedInstallPage = Math.min(installPage, maxInstallPage);
    const installStartIndex = clampedInstallPage * installPageSize;
    const installEndIndex = Math.min(installStartIndex + installPageSize, totalInstallments);
    const pagedInstallments =
        selectedLoanForInstallments?.months?.slice(installStartIndex, installEndIndex) ?? [];

    return {
        router,
        showToast,
        hrSettings,
        employees,
        employeeLoans,
        loanTypes,
        isAddDialogOpen,
        setIsAddDialogOpen,
        isEditMode,
        setIsEditMode,
        editingLoan,
        setEditingLoan,
        isInstallmentsModalOpen,
        setIsInstallmentsModalOpen,
        selectedLoanForInstallments,
        setSelectedLoanForInstallments,
        isEmployeeDropdownOpen,
        setIsEmployeeDropdownOpen,
        employeeSearchTerm,
        setEmployeeSearchTerm,
        isFilterModalOpen,
        setIsFilterModalOpen,
        isAddEditLoading,
        setIsAddEditLoading,
        isEditingMode,
        setIsEditingMode,
        isSaving,
        setIsSaving,
        editValues,
        setEditValues,
        installPage,
        setInstallPage,
        installPageSize,
        setInstallPageSize,
        visibleColumns,
        setVisibleColumns: (columns: { [key: string]: boolean }) =>
            setVisibleColumns(prev => ({ ...prev, ...columns })),
        filters,
        setFilters: (filters: { [key: string]: string }) =>
            setFilters(prev => ({ ...prev, ...filters })),
        newLoan,
        setNewLoan: (loan: Partial<ExtendedEmployeeLoan>) => setNewLoan(loan),
        filteredEmployees,
        loans,
        setLoans,
        filteredLoans,
        totalLoansAmount,
        totalOutstanding,
        activeLoans,
        avgTerm,
        handleAddLoan,
        handleReset,
        handleSaveEdit,
        openViewDialog,
        openInstallmentsModal,
        openEditDialog,
        deleteLoan,
        getStatusBadge,
        columnDefinitions,
        months,
        totalInstallments,
        maxInstallPage,
        clampedInstallPage,
        installStartIndex,
        installEndIndex,
        pagedInstallments,
    };
}
