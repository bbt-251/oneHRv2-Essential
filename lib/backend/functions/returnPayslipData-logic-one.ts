import { PayrollData } from "@/components/hr-manager/compensation-benefits/payroll-management/page";
import type { HrSettingsState } from "@/hooks/use-hr-settings";
import { EmployeeModel } from "@/lib/models/employee";
import { EmployeeCompensationModel } from "@/lib/models/employeeCompensation";
import { EmployeeLoanModel } from "@/lib/models/employeeLoan";
import {
    CurrencyModel,
    DeductionTypeModel,
    LoanTypeModel,
    PaymentTypeModel,
    PensionModel,
    TaxModel,
} from "@/lib/models/hr-settings";
import { LeaveModel } from "@/lib/models/leave";
import { OvertimeRequestModel } from "@/lib/models/overtime-request";
import getFullName from "@/lib/util/getEmployeeFullName";
import dayjs from "dayjs";
import {
    HolidayModel,
    OvertimeConfigurationModel,
    ShiftTypeModel,
} from "../firebase/hrSettingsService";
import camelize from "./camelize";
import { months } from "./getListOfDays";
import calculateIncomeTax from "./payroll/calculateIncomeTax";
import calcTotalGrossSalary from "./payroll/calculateTotalGrossSalary";
import isTerminated from "./payroll/isTerminated";
import { calculateOvertimeCost } from "../../util/overtime-request-display";

export interface ColValues {
    key: string;
    label: string;
    value: number;
    hours?: number;
}

interface LogicOneParams {
    month: string;
    payrollYear: number;
    employee: EmployeeModel;
    taxes: TaxModel[];
    compensations: EmployeeCompensationModel[];
    overtimeRequests: OvertimeRequestModel[];
    overtimeConfigs: OvertimeConfigurationModel[];
    pension: PensionModel | null;
    paymentTypes: PaymentTypeModel[];
    deductionTypes: DeductionTypeModel[];
    loanTypes: LoanTypeModel[];
    shifts: ShiftTypeModel[];
    holidays: HolidayModel[];
    leaveDocs: LeaveModel[];
    currencies: CurrencyModel[];
    hrSettings: HrSettingsState;
    loans: EmployeeLoanModel[];
    calculatePeriodWorkingDays: (month: string, year: number, shiftType: ShiftTypeModel) => number;
    calculateWorkingDays: (
        month: string,
        year: number,
        shiftType: ShiftTypeModel,
        contractStartingDate: dayjs.Dayjs,
    ) => number;
    isOvertimeClaimedForPayroll: (
        employee: EmployeeModel,
        attendance: undefined,
        request: OvertimeRequestModel,
    ) => boolean;
    isPayrollEligibleOvertime: (request: OvertimeRequestModel) => boolean;
    isOvertimeInSelectedMonth: (
        request: OvertimeRequestModel,
        month: string,
        year: number,
    ) => boolean;
    requestMatchesOvertimeConfig: (
        request: OvertimeRequestModel,
        config: OvertimeConfigurationModel,
    ) => boolean;
    getOvertimeRateForRequest: (
        request: OvertimeRequestModel,
        overtimeConfigs: OvertimeConfigurationModel[],
    ) => number;
    getCols: (
        deductionTypes: DeductionTypeModel[],
        paymentTypes: PaymentTypeModel[],
        loanTypes: LoanTypeModel[],
        deducts: { name: string; amount: number }[],
        payments: { name: string; amount: number }[],
        loans: { name: string; amount: number }[],
    ) => {
        deductionTypeCols: ColValues[];
        paymentTypeCols: ColValues[];
        loanTypeCols: ColValues[];
    };
}

export function buildPayrollDataForLogicOne({
    month,
    payrollYear,
    employee,
    taxes,
    compensations,
    overtimeRequests,
    overtimeConfigs,
    pension,
    paymentTypes,
    deductionTypes,
    loanTypes,
    shifts,
    holidays,
    leaveDocs,
    currencies,
    hrSettings,
    loans,
    calculatePeriodWorkingDays,
    calculateWorkingDays,
    isOvertimeClaimedForPayroll,
    isPayrollEligibleOvertime,
    isOvertimeInSelectedMonth,
    requestMatchesOvertimeConfig,
    getOvertimeRateForRequest,
    getCols,
}: LogicOneParams): PayrollData | null {
    const tax = taxes.find(currentTax => currentTax.id === employee.associatedTax);
    if (!tax) return null;

    let employeePension = 0;
    let employerPension = 0;
    let salary = employee.salary;
    let workedDays = 0;

    const employeeCurrencyDefinition = currencies.find(c => c.id === employee.currency);
    if (employee.currency && employeeCurrencyDefinition) {
        salary = employee.salary * employeeCurrencyDefinition.exchangeRate;
    }

    const csd = dayjs(employee.contractStartingDate);
    if (csd.year() === payrollYear && csd.month() === months.indexOf(month)) {
        const shiftType = shifts.find(doc => doc.id === employee.shiftType) as ShiftTypeModel;
        const periodWorkingDays = calculatePeriodWorkingDays(month, payrollYear, shiftType);
        workedDays = calculateWorkingDays(month, payrollYear, shiftType, csd);
        salary = Number(((employee.salary / periodWorkingDays) * workedDays).toFixed(2));
    }

    const empComps = compensations.filter((value: EmployeeCompensationModel) =>
        value.employees?.includes(employee.uid),
    );

    const unpaidLeave = empComps.find(c => c.deduction == "unp3-4val-Unpaid Leave");
    let unpaidLeaveVal = 0;
    if (unpaidLeave?.deductionType === "Percentage") {
        unpaidLeaveVal =
            Math.round(
                salary *
                    ((unpaidLeave.deductionAmount?.at(months.indexOf(month)) ?? 0) / 100) *
                    100,
            ) / 100;
    } else {
        unpaidLeaveVal = unpaidLeave?.deductionAmount?.at(months.indexOf(month)) ?? 0;
    }
    salary -= unpaidLeaveVal;

    const eligibleOvertimeForPayroll = overtimeRequests.filter(
        doc =>
            isOvertimeClaimedForPayroll(employee, undefined, doc) &&
            isPayrollEligibleOvertime(doc) &&
            isOvertimeInSelectedMonth(doc, month, payrollYear),
    );

    const overtimeTypeCols: ColValues[] = [];
    overtimeConfigs.forEach(cfg => {
        const hours = eligibleOvertimeForPayroll
            .filter(request => requestMatchesOvertimeConfig(request, cfg))
            .reduce((sum, request) => sum + (request.duration ?? 0), 0);
        overtimeTypeCols.push({
            key: camelize(cfg.overtimeType),
            label: cfg.overtimeType,
            value: calculateOvertimeCost(hours, cfg.overtimeRate ?? 0, employee.hourlyWage ?? 0),
            hours,
        });
    });
    const totalOvertimePay =
        Math.round(overtimeTypeCols.reduce((sum, col) => sum + (col.value ?? 0), 0) * 100) / 100;

    const totalGrossSalary = calcTotalGrossSalary(
        salary + totalOvertimePay,
        empComps,
        months.indexOf(month),
    );
    let taxableGrossSalary = salary + totalOvertimePay;
    let totalFringeBenefitsTaxable = 0;
    const fringeBenefitCount = empComps.filter((value: EmployeeCompensationModel) => {
        const payment = paymentTypes.find(p => p.id === value.paymentType);
        return value.type === "Payment" && payment?.paymentType === "Fringe Benefits";
    }).length;
    if (fringeBenefitCount > 0) {
        totalFringeBenefitsTaxable = salary * 0.1;
        taxableGrossSalary += totalFringeBenefitsTaxable;
    }

    let transportAllowance = 0;
    let taxableTransportAllowance = 0;
    let otherAllowances = 0;
    let taxableOtherAllowances = 0;
    let costSharing = 0;
    let totalDeduction = 0;
    let totalPayment = 0;
    let totalBonusAmount = 0;
    let totalSeverancePay = 0;
    let totalAnnualLeavePay = 0;

    const payments: { name: string; amount: number }[] = [];
    empComps.forEach((value: EmployeeCompensationModel) => {
        if (value.type !== "Payment") return;
        const paymentAmount = value.paymentAmount?.at(months.indexOf(month)) ?? 0;
        const thisPayment = paymentTypes.find(p => p.id === value.paymentType);
        if (!thisPayment) return;

        if (thisPayment.paymentType === "Fringe Benefits") {
            otherAllowances += paymentAmount;
            taxableOtherAllowances += totalFringeBenefitsTaxable;
        } else if (thisPayment.paymentType === "Bonus") {
            otherAllowances += paymentAmount;
            totalBonusAmount += paymentAmount;
        } else if (thisPayment.paymentType === "Severance Pay") {
            otherAllowances += paymentAmount;
            totalSeverancePay += paymentAmount;
        } else if (thisPayment.paymentType === "Annual Leave") {
            otherAllowances += paymentAmount;
            totalAnnualLeavePay += paymentAmount;
        } else {
            let threshold = 0;
            let isTaxable = false;
            if (thisPayment.taxabilityThresholdType === "Value") {
                threshold = thisPayment.taxabilityThresholdAmount;
                isTaxable = paymentAmount > threshold;
            } else if (thisPayment.taxabilityThresholdType === "Percentage") {
                threshold = salary * (thisPayment.taxabilityThresholdAmount / 100);
                isTaxable = paymentAmount > threshold;
            } else if (thisPayment.taxabilityThresholdType === "PercentageWithValue") {
                const percentageThreshold = salary * (thisPayment.taxabilityThresholdAmount / 100);
                const valueThreshold = thisPayment.taxabilityThresholdValue ?? 0;
                threshold = Math.min(percentageThreshold, valueThreshold);
                isTaxable = paymentAmount > threshold;
            }

            if (isTaxable) {
                const delta = paymentAmount - threshold;
                taxableGrossSalary += delta;
                if (thisPayment.paymentName === "Transport Allowance") {
                    transportAllowance += paymentAmount;
                    taxableTransportAllowance += delta;
                } else {
                    otherAllowances += paymentAmount;
                    taxableOtherAllowances += delta;
                }
            }
        }

        totalPayment += paymentAmount;
        if (thisPayment.paymentName === "Transport Allowance") {
            transportAllowance += paymentAmount;
        }
        payments.push({
            name: thisPayment.paymentName,
            amount: parseFloat(paymentAmount.toFixed(2)),
        });
    });
    totalPayment += totalOvertimePay;

    const deducts: { id?: string; name: string; amount: number }[] = [];
    empComps.forEach((value: EmployeeCompensationModel) => {
        if (value.type !== "Deduction") return;
        const deductionName =
            deductionTypes.find(d => d.id == value.deduction)?.deductionName ?? "";
        if (value.deductionType === "Percentage") {
            const amount =
                Math.round(
                    salary * ((value.deductionAmount?.at(months.indexOf(month)) ?? 0) / 100) * 100,
                ) / 100;
            totalDeduction += amount;
            if (deductionName === "Cost Sharing") costSharing += amount;
            deducts.push({ id: value.id, name: deductionName, amount });
            return;
        }
        const amount = value.deductionAmount?.at(months.indexOf(month)) ?? 0;
        totalDeduction += amount;
        if (deductionName === "Cost Sharing") costSharing += amount;
        deducts.push({ id: value.id, name: deductionName, amount });
    });

    const empLoan = loans.filter(
        (value: EmployeeLoanModel) =>
            value.employeeUid === employee.uid && value.loanStatus === "Ongoing",
    );
    const employeeLoans: { name: string; amount: number }[] = [];
    empLoan.forEach((value: EmployeeLoanModel) => {
        const current = value.months.find(
            monthData => monthData.date === `${month} ${payrollYear}`,
        );
        if (!current || !current.confirmed) return;
        totalDeduction += current.deductFromSalary ?? 0;
        employeeLoans.push({
            name: value.loanType,
            amount: current.deductFromSalary,
        });
    });

    if (pension && employee.pensionApplication) {
        employeePension =
            pension.employeePensionType === "Percentage"
                ? salary * (pension.employeePension / 100)
                : pension.employeePension;
        employerPension =
            pension.employerPensionType === "Percentage"
                ? salary * (pension.employerPension / 100)
                : pension.employerPension;
    }

    let bonusTax = 0;
    if (totalBonusAmount > 0) {
        const taxWithoutBonus = calculateIncomeTax(taxableGrossSalary, tax);
        const taxWithBonus = calculateIncomeTax(taxableGrossSalary + totalBonusAmount, tax);
        bonusTax = taxWithBonus - taxWithoutBonus;
    }
    const severanceTax = 0;
    const totalIncomeTax = calculateIncomeTax(taxableGrossSalary, tax) + bonusTax + severanceTax;

    deducts.push({ id: "pension-001", name: "Employee Pension", amount: employeePension });
    totalDeduction += employeePension;
    totalDeduction = Math.round((totalDeduction + totalIncomeTax) * 100) / 100;

    const employeeShift = shifts.find(doc => doc.id === employee.shiftType);
    const periodWorkingDays = calculatePeriodWorkingDays(
        month,
        payrollYear,
        employeeShift as ShiftTypeModel,
    );
    const totalOvertimeAmount = eligibleOvertimeForPayroll.reduce(
        (sum, doc) => sum + (doc.duration ?? 0),
        0,
    );
    const thisMonthHolidays = holidays.filter(
        doc => doc.date.includes(month) && doc.date.includes(String(payrollYear)),
    ).length;
    const totalLeaveDays = leaveDocs
        .filter(
            leave =>
                leave.employeeID === employee.employeeID &&
                leave.leaveStage === "Approved" &&
                leave.firstDayOfLeave.includes(month) &&
                leave.lastDayOfLeave.includes(month),
        )
        .reduce((sum, leave) => sum + (leave.numberOfLeaveDaysRequested || 0), 0);

    const { deductionTypeCols, paymentTypeCols, loanTypeCols } = getCols(
        deductionTypes,
        paymentTypes,
        loanTypes,
        deducts as { name: string; amount: number }[],
        payments,
        employeeLoans,
    );

    return {
        month,
        year: payrollYear,
        id: employee.id as string,
        uid: employee.uid,
        employeeID: employee.employeeID,
        employeeName: getFullName(employee),
        employmentPosition:
            hrSettings.positions.find(c => c.id == employee.employmentPosition)?.name ?? "",
        department:
            hrSettings.departmentSettings.find(c => c.id == employee.department)?.name ?? "",
        section: hrSettings.sectionSettings.find(c => c.id == employee.section)?.name ?? "",
        contractStartingDate: employee.contractStartingDate,
        contractTerminationDate: employee.contractTerminationDate,
        bankAccount: employee.bankAccount,
        providentFundAccount: employee.providentFundAccount,
        workingLocation:
            hrSettings.locations.find(c => c.id == employee.workingLocation)?.name ?? "",
        employeeCost: totalGrossSalary + employerPension,
        employeePension,
        employerPension,
        baseSalary: salary,
        incomeTax: totalIncomeTax,
        totalDeduction,
        totalGrossPay: totalGrossSalary,
        taxableGrossPay: taxableGrossSalary,
        netPay: totalGrossSalary - (totalDeduction - unpaidLeaveVal),
        periodWorkingDays,
        hourlyWage: employee.hourlyWage,
        absentDays: periodWorkingDays - workedDays,
        leaveDays: totalLeaveDays,
        holidays: thisMonthHolidays,
        monthlyWorkedHours: 0,
        overtimes: eligibleOvertimeForPayroll.map(doc => ({
            name: doc.overtimeType,
            amount: doc.duration,
            rate: getOvertimeRateForRequest(doc, overtimeConfigs),
        })),
        overtimeTypeCols,
        payments,
        paymentTypeCols,
        totalGrossSalary,
        taxableGrossSalary,
        totalPayment,
        bonusTax,
        bonusAmount: totalBonusAmount,
        bonusNetPay: totalBonusAmount - bonusTax,
        severanceNetPay: totalSeverancePay,
        annualLeaveNetPay: totalAnnualLeavePay,
        deductions: deducts,
        deductionTypeCols,
        loans: employeeLoans,
        loanTypeCols,
        transportAllowance,
        taxableTransportAllowance,
        costSharing,
        totalOvertimeAmount,
        otherAllowances,
        taxableOtherAllowances,
        terminated:
            employee.contractTerminationDate !== null
                ? isTerminated(
                    employee.contractTerminationDate,
                      month as Parameters<typeof isTerminated>[1],
                      payrollYear,
                )
                : false,
        employee,
        presentDays: 0,
        halfPresentDays: 0,
        attendanceData: null,
        unpaidLeave: unpaidLeaveVal,
        contractType: hrSettings.contractTypes.find(c => c.id == employee.contractType)?.name ?? "",
    };
}
