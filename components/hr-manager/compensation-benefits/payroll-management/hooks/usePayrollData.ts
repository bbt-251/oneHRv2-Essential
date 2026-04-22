import { useMemo } from "react";
import { PayrollData } from "@/components/hr-manager/compensation-benefits/payroll-management/page";
import returnPayrollData from "@/lib/backend/functions/returnPayslipData";
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
        hrSettings,
        overtimeRequests,
        leaveManagements,
        compensations,
    } = useData();
    const overtimeTypes = hrSettings.overtimeTypes;
    const shiftTypes = hrSettings.shiftTypes;
    const holidays = hrSettings.holidays;
    const currencies = hrSettings.currencies;
    const deductionTypes = hrSettings.deductionTypes;
    const paymentTypes = hrSettings.paymentTypes;
    const pension = hrSettings.pension?.at(0) || null;
    const taxes = hrSettings.taxes;

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
            pension,
            attendanceLogic: attendanceLogic?.at(0)?.chosenLogic ?? 1,
            holidays,
            leaveDocs: leaveManagements,
            currencies,
            hrSettings,
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
        hrSettings,
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
