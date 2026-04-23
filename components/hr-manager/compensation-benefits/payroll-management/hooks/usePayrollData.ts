import { useMemo } from "react";
import { PayrollData } from "@/components/hr-manager/compensation-benefits/payroll-management/page";
import returnPayrollData from "@/lib/util/functions/returnPayslipData";
import { useData } from "@/context/app-data-context";
import { EmployeeLoanModel } from "@/lib/models/employeeLoan";
import { LoanTypeModel } from "@/lib/models/hr-settings";
import PayrollPDFSettingsModel from "@/lib/models/payrollPDFSettings";

export function usePayrollData(
    selectedMonth: string,
    selectedEmployees: string[],
    loans: EmployeeLoanModel[],
    loanTypes: LoanTypeModel[],
    payrollPDFSettings: PayrollPDFSettingsModel,
) {
    const {
        employees,
        attendanceLogic,
        attendances,
        overtimeRequests,
        leaveManagements,
        compensations,
        overtimeTypes,
        shiftTypes,
        holidays,
        currencies,
        deductionTypes,
        paymentTypes,
        pension,
        taxes,
        positions,
        departmentSettings,
        sectionSettings,
        locations,
        contractTypes,
    } = useData();

    const settingsLookup = useMemo(
        () => ({
            positions,
            departmentSettings,
            sectionSettings,
            locations,
            contractTypes,
        }),
        [contractTypes, departmentSettings, locations, positions, sectionSettings],
    );

    const payslipData = useMemo<PayrollData[]>(() => {
        return returnPayrollData({
            month: selectedMonth,
            employees,
            attendances,
            compensations,
            deductionTypes,
            loans,
            loanTypes,
            overtimeConfigs: overtimeTypes,
            overtimeRequests,
            paymentTypes,
            shifts: shiftTypes,
            taxes,
            payrollPDFSettings,
            pension: pension?.at(0) || null,
            attendanceLogic: attendanceLogic?.at(0)?.chosenLogic ?? 1,
            holidays,
            leaveDocs: leaveManagements,
            currencies,
            settingsLookup,
        });
    }, [
        selectedMonth,
        employees,
        attendances,
        compensations,
        deductionTypes,
        loans,
        loanTypes,
        overtimeTypes,
        overtimeRequests,
        paymentTypes,
        shiftTypes,
        taxes,
        payrollPDFSettings,
        pension,
        attendanceLogic,
        holidays,
        leaveManagements,
        currencies,
        settingsLookup,
    ]);

    const selectedEmployeeData = useMemo<PayrollData[]>(
        () =>
            selectedEmployees.length > 0
                ? payslipData.filter(p => selectedEmployees.includes(p.uid))
                : payslipData,
        [payslipData, selectedEmployees],
    );

    return { payslipData, selectedEmployeeData };
}
