"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLoanManagement } from "./hooks/useLoanManagement";
import { LoanMetrics } from "./blocks/loan-metrics";
import { LoanTable } from "./blocks/loan-table";
import { InstallmentsModal } from "./blocks/installments-modal";
import { useConfirm } from "@/hooks/use-confirm-dialog";

export function EmployeeLoanManagement() {
    const router = useRouter();
    const { confirm, ConfirmDialog } = useConfirm();
    const {
        isAddDialogOpen,
        setIsAddDialogOpen,
        isEditMode,
        editingLoan,
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
        isEditingMode,
        setIsEditingMode,
        isSaving,
        editValues,
        setEditValues,
        setInstallPage,
        visibleColumns,
        setVisibleColumns,
        filters,
        setFilters,
        newLoan,
        setNewLoan,
        filteredEmployees,
        filteredLoans,
        setLoans,
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
        installStartIndex,
        installEndIndex,
        pagedInstallments,
        clampedInstallPage,
        loanTypes,
    } = useLoanManagement(confirm);

    return (
        <div className="space-y-6 p-6">
            {/* Header with Back Button */}
            <div className="flex items-center gap-4 mb-8">
                <Button
                    variant="outline"
                    onClick={() => router.push("/hr/compensation-benefits")}
                    className="flex items-center gap-2 bg-transparent"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Compensation & Benefits
                </Button>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-foreground">
                        Employee Loan Management
                    </h1>
                    <p className="text-gray-600 dark:text-muted-foreground">
                        Track and manage employee loans, applications, and repayments
                    </p>
                </div>
            </div>

            {/* Metrics Cards */}
            <LoanMetrics
                totalLoansAmount={totalLoansAmount}
                totalOutstanding={totalOutstanding}
                activeLoans={activeLoans}
                avgTerm={avgTerm}
            />

            {/* Loans Table */}
            <LoanTable
                filteredLoans={filteredLoans}
                visibleColumns={visibleColumns}
                setVisibleColumns={setVisibleColumns}
                filters={filters}
                setFilters={setFilters}
                isFilterModalOpen={isFilterModalOpen}
                setIsFilterModalOpen={setIsFilterModalOpen}
                columnDefinitions={columnDefinitions}
                loanTypes={loanTypes}
                getStatusBadge={getStatusBadge}
                openViewDialog={openViewDialog}
                openInstallmentsModal={openInstallmentsModal}
                openEditDialog={openEditDialog}
                deleteLoan={deleteLoan}
                isAddDialogOpen={isAddDialogOpen}
                setIsAddDialogOpen={setIsAddDialogOpen}
                isEditMode={isEditMode}
                editingLoan={editingLoan}
                newLoan={newLoan}
                setNewLoan={setNewLoan}
                filteredEmployees={filteredEmployees}
                isEmployeeDropdownOpen={isEmployeeDropdownOpen}
                setIsEmployeeDropdownOpen={setIsEmployeeDropdownOpen}
                employeeSearchTerm={employeeSearchTerm}
                setEmployeeSearchTerm={setEmployeeSearchTerm}
                months={months}
                handleAddLoan={handleAddLoan}
                isAddEditLoading={isAddEditLoading}
                handleReset={handleReset}
            />

            {/* Installments Modal */}
            <InstallmentsModal
                isInstallmentsModalOpen={isInstallmentsModalOpen}
                setIsInstallmentsModalOpen={setIsInstallmentsModalOpen}
                selectedLoanForInstallments={selectedLoanForInstallments}
                setSelectedLoanForInstallments={setSelectedLoanForInstallments}
                isEditingMode={isEditingMode}
                setIsEditingMode={setIsEditingMode}
                editValues={editValues}
                setEditValues={setEditValues}
                handleSaveEdit={handleSaveEdit}
                isSaving={isSaving}
                pagedInstallments={pagedInstallments}
                totalInstallments={totalInstallments}
                installStartIndex={installStartIndex}
                installEndIndex={installEndIndex}
                clampedInstallPage={clampedInstallPage}
                setInstallPage={setInstallPage}
                setLoans={setLoans}
            />
            {ConfirmDialog}
        </div>
    );
}
