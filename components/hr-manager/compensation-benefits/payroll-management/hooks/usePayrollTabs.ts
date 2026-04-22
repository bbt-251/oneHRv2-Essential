import { useState, useMemo, useCallback } from "react";
import { PayrollData } from "@/components/hr-manager/compensation-benefits/payroll-management/page";

/** Treat tiny float noise as zero for OT pay visibility. */
const OT_PAY_VISIBILITY_EPS = 1e-6;

function anyEmployeeHasOvertimePay(rows: PayrollData[], otKey: string): boolean {
    return rows.some(pd => {
        const v = pd.overtimeTypeCols.find(c => c.key === otKey)?.value;
        return typeof v === "number" && Math.abs(v) > OT_PAY_VISIBILITY_EPS;
    });
}

const tabColumns = {
    profile: [
        { key: "employeeID", label: "Employee ID" },
        { key: "employeeName", label: "Name" },
        { key: "contractStartingDate", label: "Contract Start" },
        { key: "contractTerminationDate", label: "Contract End" },
        { key: "bankAccount", label: "Bank Account" },
        { key: "providentFundAccount", label: "PF Account" },
        { key: "contractType", label: "Contract Type" },
        { key: "employmentPosition", label: "Position" },
        { key: "department", label: "Department" },
        { key: "section", label: "Section" },
        { key: "workingLocation", label: "Location" },
        { key: "baseSalary", label: "Base Salary" },
        { key: "totalPayment", label: "Total Payment" },
        { key: "totalDeduction", label: "Total Deduction" },
        { key: "totalGrossPay", label: "Gross Pay" },
        { key: "taxableGrossPay", label: "Taxable Gross" },
        { key: "netPay", label: "Net Pay" },
        { key: "employeeCost", label: "Employee Cost" },
    ],
    worktime: [
        { key: "employeeID", label: "Employee ID" },
        { key: "employeeName", label: "Name" },
        { key: "periodWorkingDays", label: "Period Working Days" },
        { key: "presentDays", label: "Present Days" },
        { key: "halfPresentDays", label: "Half Present Days" },
        { key: "absentDays", label: "Absent Days" },
        { key: "leaveDays", label: "Leave Days" },
        { key: "holidays", label: "Holidays" },
        // overtimeCols will be added dynamically
        { key: "baseSalary", label: "Base Salary" },
    ],
    payments: [
        { key: "employeeID", label: "Employee ID" },
        { key: "employeeName", label: "Name" },
        { key: "baseSalary", label: "Base Salary" },
        { key: "totalGrossSalary", label: "Total Gross Salary" },
        { key: "taxableGrossSalary", label: "Taxable Gross Salary" },
        // overtimePayCols (monetary OT) inserted before bonus; paymentCols before totalPayment
        { key: "bonusAmount", label: "Bonus" },
        { key: "bonusNetPay", label: "Bonus Net Pay" },
        { key: "totalPayment", label: "Total Payment" },
    ],
    deductions: [
        { key: "employeeID", label: "Employee ID" },
        { key: "employeeName", label: "Name" },
        { key: "baseSalary", label: "Base Salary" },
        { key: "taxableGrossPay", label: "Taxable Gross Pay" },
        { key: "incomeTax", label: "Income Tax" },
        { key: "bonusTax", label: "Bonus Tax" },
        { key: "unpaidLeave", label: "Unpaid Leave" },
        { key: "employeePension", label: "Employee Pension" },
        { key: "employerPension", label: "Employer Pension" },
        // deductionCols will be added dynamically
        { key: "totalDeduction", label: "Total Deduction" },
    ],
};

export function usePayrollTabs(
    payslipData: PayrollData[],
    filteredData: PayrollData[],
    clearFilters: () => void,
) {
    const [activeTab, setActiveTab] = useState<string>("profile");
    const [columnOverrides, setColumnOverrides] = useState<Record<string, boolean>>({});

    const overtimeCols = useMemo(
        () =>
            Array.from(
                new Map(
                    payslipData.flatMap(pd =>
                        pd.overtimeTypeCols.map(type => [
                            type.key,
                            {
                                key: type.key,
                                label: `${type.label} (hrs)`,
                            },
                        ]),
                    ),
                ).values(),
            ),
        [payslipData],
    );

    /**
     * Payments: same keys as Work Time OT types; cells use `value` (currency).
     * A column is shown only if at least one row in the current table data has non-zero OT pay for that type.
     */
    const overtimePayCols = useMemo(() => {
        const unique = Array.from(
            new Map(
                filteredData.flatMap(pd =>
                    pd.overtimeTypeCols.map(type => [
                        type.key,
                        {
                            key: type.key,
                            label: `${type.label} (OT pay)`,
                        },
                    ]),
                ),
            ).values(),
        );
        return unique.filter(col => anyEmployeeHasOvertimePay(filteredData, col.key));
    }, [filteredData]);

    const paymentCols = useMemo(
        () =>
            Array.from(
                new Map(
                    payslipData.flatMap(pd =>
                        pd.paymentTypeCols.map(type => [
                            type.key,
                            { key: type.key, label: type.label },
                        ]),
                    ),
                ).values(),
            ),
        [payslipData],
    );

    const deductionCols = useMemo(
        () =>
            Array.from(
                new Map(
                    payslipData.flatMap(pd =>
                        pd.deductionTypeCols.map(type => [
                            type.key,
                            { key: type.key, label: type.label },
                        ]),
                    ),
                ).values(),
            ),
        [payslipData],
    );
    const loanCols = useMemo(
        () =>
            Array.from(
                new Map(
                    payslipData.flatMap(pd =>
                        pd.loanTypeCols.map(type => [
                            type.key,
                            { key: type.key, label: type.label },
                        ]),
                    ),
                ).values(),
            ),
        [payslipData],
    );

    const getCurrentColumns = useCallback(
        (tab?: string) => {
            const currentTab = tab || activeTab;
            let columns = tabColumns[currentTab as keyof typeof tabColumns] || [];
            if (currentTab === "worktime") {
                columns = [...columns.slice(0, -1), ...overtimeCols, columns[columns.length - 1]];
            } else if (currentTab === "payments") {
                const base = tabColumns.payments;
                const bonusIdx = base.findIndex(c => c.key === "bonusAmount");
                columns = [
                    ...base.slice(0, bonusIdx),
                    ...overtimePayCols,
                    ...base.slice(bonusIdx, -1),
                    ...paymentCols,
                    base[base.length - 1],
                ];
            } else if (currentTab === "deductions") {
                columns = [
                    ...columns.slice(0, -1),
                    ...deductionCols,
                    ...loanCols,
                    columns[columns.length - 1],
                ];
            }
            return columns;
        },
        [activeTab, overtimeCols, overtimePayCols, paymentCols, deductionCols, loanCols],
    );

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        clearFilters();
    };

    const toggleColumnVisibility = (columnKey: string) => {
        setColumnOverrides(prev => ({
            ...prev,
            [columnKey]: !prev[columnKey],
        }));
    };

    const visibleColumns = useMemo(() => {
        const columns = getCurrentColumns(activeTab);
        const nextVisibleColumns: Record<string, boolean> = {};
        columns.forEach(column => {
            nextVisibleColumns[column.key] = columnOverrides[column.key] ?? true;
        });
        return nextVisibleColumns;
    }, [activeTab, columnOverrides, getCurrentColumns]);

    return {
        activeTab,
        visibleColumns,
        handleTabChange,
        toggleColumnVisibility,
        getCurrentColumns: () => getCurrentColumns(),
    };
}
