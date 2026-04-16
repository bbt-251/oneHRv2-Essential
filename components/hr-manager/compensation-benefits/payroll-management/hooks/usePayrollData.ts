import { useEffect, useState, useRef } from "react";
import { PayrollData } from "@/components/hr-manager/compensation-benefits/payroll-management/page";
import returnPayrollData from "@/lib/backend/functions/returnPayslipData";
import { useFirestore } from "@/context/firestore-context";
import { EmployeeLoanModel } from "@/lib/models/employeeLoan";
import { LoanTypeModel } from "@/lib/models/hr-settings";

export function usePayrollData(
    selectedMonth: string,
    selectedEmployees: string[],
    loans: EmployeeLoanModel[],
    loanTypes: LoanTypeModel[],
    payrollPDFSettings: any,
) {
    const {
        employees,
        attendanceLogic,
        attendances,
        hrSettings,
        overtimeRequests,
        leaveManagements,
        compensations,
    } = useFirestore();
    const overtimeTypes = hrSettings.overtimeTypes;
    const shiftTypes = hrSettings.shiftTypes;
    const holidays = hrSettings.holidays;
    const currencies = hrSettings.currencies;
    const deductionTypes = hrSettings.deductionTypes;
    const paymentTypes = hrSettings.paymentTypes;
    const pension = hrSettings.pension?.at(0) || null;
    const taxes = hrSettings.taxes;

    const [payslipData, setPayslipData] = useState<PayrollData[]>([]);
    const [filteredData, setFilteredData] = useState<PayrollData[]>([]);

    // Track if we should apply employee selection
    const prevSelectedEmployeesRef = useRef<string[]>([]);

    // Handle employee selection changes
    useEffect(() => {
        // Only apply if selectedEmployees changed and we have data
        if (payslipData.length > 0) {
            const prevSelected = prevSelectedEmployeesRef.current;
            const prevLength = prevSelected.length;
            const currLength = selectedEmployees.length;

            // Check if selection actually changed
            const hasChanged =
                prevLength !== currLength ||
                (currLength > 0 && !selectedEmployees.every(e => prevSelected.includes(e)));

            if (hasChanged) {
                prevSelectedEmployeesRef.current = selectedEmployees;

                if (selectedEmployees.length > 0) {
                    setFilteredData(payslipData.filter(p => selectedEmployees.includes(p.uid)));
                } else {
                    setFilteredData(payslipData);
                }
            }
        }
    }, [selectedEmployees, payslipData]);

    useEffect(() => {
        const data = returnPayrollData({
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
        setPayslipData(data);
        setFilteredData(data);
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
    ]);

    return { payslipData, setPayslipData, filteredData, setFilteredData };
}
