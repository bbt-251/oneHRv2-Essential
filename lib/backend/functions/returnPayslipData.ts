import { PayrollData } from "@/components/hr-manager/compensation-benefits/payroll-management/page";
import { HrSettingsByType } from "@/context/firestore-context";
import { AttendanceModel } from "@/lib/models/attendance";
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
import PayrollPDFSettingsModel from "@/lib/models/payrollPDFSettings";
import getFullName from "@/lib/util/getEmployeeFullName";
import dayjs from "dayjs";
import { dateFormat } from "@/lib/util/dayjs_format";
import {
    HolidayModel,
    OvertimeConfigurationModel,
    ShiftTypeModel,
} from "../firebase/hrSettingsService";
import { days } from "./calculateDailyWorkingHour";
import camelize from "./camelize";
import { months } from "./getListOfDays";
import { groupBy } from "./groupBy";
import { calculateBaseSalaryUpdated } from "./payroll/calculateBaseSalary";
import calculateIncomeTax from "./payroll/calculateIncomeTax";
import calculateOvertimeHours from "./payroll/calculateOvertimeHours";
import calcTotalGrossSalary from "./payroll/calculateTotalGrossSalary";
import isTerminated from "./payroll/isTerminated";
import { calculateWorkedDaysIncludingLeaveDays } from "./payroll/workedDays";
import { calculateOvertimeCost } from "../../util/overtime-request-display";

export interface ColValues {
    key: string;
    label: string;
    value: number;
    /** Overtime-type columns: approved hours for the period (Work Time tab). */
    hours?: number;
}

function isPayrollEligibleOvertime(request: OvertimeRequestModel) {
    if (request.status !== "approved") return false;
    // Legacy requests may omit approvalStage; treat as fully approved when status is approved.
    return request.approvalStage === "completed" || request.approvalStage === undefined;
}

/**
 * Payroll ties an OT request to an employee if:
 * - the id is on the employee doc (HR approval sync), or
 * - the id is on the monthly attendance sheet, or
 * - the request lists this employee in `employeeUids` (covers approvals when claim sync failed).
 */
function isOvertimeClaimedForPayroll(
    employee: EmployeeModel,
    attendance: AttendanceModel | undefined,
    request: OvertimeRequestModel,
): boolean {
    const id = `${request.id}`;
    return (
        Boolean(employee?.claimedOvertimes?.includes(id)) ||
        Boolean(attendance?.claimedOvertimes?.includes(id)) ||
        Boolean(request.employeeUids?.includes(employee.uid))
    );
}

function getAttendanceForPayrollMonth(
    attendances: AttendanceModel[],
    month: string,
    uid: string,
    payrollYear: number,
): AttendanceModel | undefined {
    return attendances.find(
        doc =>
            doc.month === month &&
            doc.uid === uid &&
            (doc.year === payrollYear || doc.year === undefined),
    );
}

function normalizeOvertimeTypeKey(value: string | null | undefined): string {
    return (value ?? "").trim().toLowerCase();
}

function requestMatchesOvertimeConfig(
    request: OvertimeRequestModel,
    config: OvertimeConfigurationModel,
): boolean {
    const requestKey = normalizeOvertimeTypeKey(request.overtimeType);
    const configIdKey = normalizeOvertimeTypeKey(config.id);
    const configNameKey = normalizeOvertimeTypeKey(config.overtimeType);
    return requestKey === configIdKey || requestKey === configNameKey;
}

function getOvertimeRateForRequest(
    request: OvertimeRequestModel,
    overtimeConfigs: OvertimeConfigurationModel[],
): number {
    return (
        overtimeConfigs.find(cfg => requestMatchesOvertimeConfig(request, cfg))?.overtimeRate ?? 0
    );
}

function isOvertimeInSelectedMonth(request: OvertimeRequestModel, month: string, year: number) {
    const parsed = dayjs(request.overtimeDate, dateFormat);
    if (parsed.isValid()) {
        return parsed.month() === months.indexOf(month) && parsed.year() === year;
    }

    // Fallback if legacy string format is different
    const parsedLoose = dayjs(request.overtimeDate);
    if (parsedLoose.isValid()) {
        return parsedLoose.month() === months.indexOf(month) && parsedLoose.year() === year;
    }

    // Last-resort string checks
    return (
        request.overtimeDate.includes(year.toString()) &&
        (request.overtimeDate.includes(month) ||
            request.overtimeDate.includes(String(months.indexOf(month) + 1).padStart(2, "0")))
    );
}

function calculateWorkingDays(
    month: string,
    year: number,
    shiftType: ShiftTypeModel,
    contractStartingDate: dayjs.Dayjs,
): number {
    const workingDays = shiftType ? shiftType.workingDays.map(day => day.dayOfTheWeek) : [];

    let workingDayCount: number = 0;

    const date = dayjs(`${month}, ${year}`, "MMMM, YYYY");

    const daysInAMonth: number = date.daysInMonth();
    for (let index = contractStartingDate.date(); index <= daysInAMonth; index++) {
        const current: dayjs.Dayjs = dayjs(`${months[date.month()]} ${index}, ${date.year()}`);
        if (workingDays.includes(days[current.day()])) workingDayCount++;
    }

    return workingDayCount;
}

function calculatePeriodWorkingDays(
    month: string,
    year: number,
    shiftType: ShiftTypeModel,
): number {
    const workingDays = shiftType ? shiftType.workingDays.map(day => day.dayOfTheWeek) : [];

    let pwd: number = 0;

    const date = dayjs(`${month}, ${year}`, "MMMM, YYYY");

    const daysInAMonth: number = date.daysInMonth();
    for (let index = 1; index <= daysInAMonth; index++) {
        const current: dayjs.Dayjs = dayjs(`${months[date.month()]} ${index}, ${date.year()}`);
        if (workingDays.includes(days[current.day()])) pwd++;
    }

    return pwd;
}

function getCols(
    deductionTypes: DeductionTypeModel[],
    paymentTypes: PaymentTypeModel[],
    loanTypes: LoanTypeModel[],
    deducts: { name: string; amount: number }[],
    payments: { name: string; amount: number }[],
    loans: { name: string; amount: number }[],
) {
    // deduction type cols
    const deductionTypeCols: ColValues[] = deductionTypes.map(doc => ({
        key: camelize(doc?.deductionName ?? ""),
        label: doc?.deductionName ?? "",
        value: deducts.find(d => d.name === doc.deductionName)?.amount ?? 0,
    }));

    // payment type cols
    const paymentTypeCols: ColValues[] = paymentTypes.map(doc => ({
        key: camelize(doc?.paymentName ?? ""),
        label: doc?.paymentName ?? "",
        value: payments.find(p => p.name === doc.paymentName)?.amount ?? 0,
    }));

    // loan type cols
    const loanTypeCols: ColValues[] = loanTypes.map(doc => ({
        key: camelize(doc?.loanName ?? ""),
        label: doc?.loanName ?? "",
        value: loans
            .filter(l => l.name === doc.id)
            .reduce((sum, loan) => sum + (loan.amount ?? 0), 0),
    }));

    return { deductionTypeCols, paymentTypeCols, loanTypeCols };
}

interface Props {
    month: string;
    employees: EmployeeModel[];
    attendances: AttendanceModel[];
    attendanceLogic: 1 | 2 | 3 | 4;
    loans: EmployeeLoanModel[];
    taxes: TaxModel[];
    compensations: EmployeeCompensationModel[];
    overtimeRequests: OvertimeRequestModel[];
    overtimeConfigs: OvertimeConfigurationModel[];
    pension: PensionModel | null;
    paymentTypes: PaymentTypeModel[];
    deductionTypes: DeductionTypeModel[];
    loanTypes: LoanTypeModel[];
    shifts: ShiftTypeModel[];
    payrollPDFSettings: PayrollPDFSettingsModel;
    holidays: HolidayModel[];
    leaveDocs: LeaveModel[];
    currencies: CurrencyModel[];
    hrSettings: HrSettingsByType;
}

export default function returnPayrollData({
    month,
    employees,
    attendances,
    attendanceLogic,
    loans,
    taxes,
    compensations,
    overtimeRequests,
    overtimeConfigs,
    pension,
    paymentTypes,
    deductionTypes,
    loanTypes,
    shifts,
    payrollPDFSettings,
    holidays,
    leaveDocs,
    currencies,
    hrSettings,
}: Props) {
    const source: PayrollData[] = [];

    // PDF settings - use null values directly, the PayrollSlip component will handle empty strings
    const pdfSettings: { header: string | null; footer: string | null; signature: string | null } =
        {
            header: payrollPDFSettings?.header ?? null,
            footer: payrollPDFSettings?.footer ?? null,
            signature: payrollPDFSettings?.signature ?? null,
        };

    const payrollYear = dayjs().year();

    for (const employee of employees) {
        // pension
        let employeePension = 0;
        let employerPension = 0;

        // get employee currency
        const employeeCurrency = employee.currency;
        const employeeCurrencyDefinition = currencies.find(c => c.id === employeeCurrency);

        //! ATTENDANCE LOGIC 1
        // Daily attendance not used for pay; approved overtime for the month still flows to Work Time and gross pay.
        if (attendanceLogic === 1) {
            const tax = taxes.find(tax => tax.id === employee.associatedTax);
            if (tax) {
                let salary = employee.salary;
                // if currency is defined, multiply the salary by the exchange rate
                if (employeeCurrency && employeeCurrencyDefinition)
                    salary = employee.salary * employeeCurrencyDefinition.exchangeRate;

                let workedDays: number = 0;

                // check whether the employee started this month
                // if so, divide the salary by the number of days in the month that the employee worked on
                const csd = dayjs(employee.contractStartingDate);
                if (csd.year() === dayjs().year() && csd.month() === months.indexOf(month)) {
                    const periodWorkingDays = calculatePeriodWorkingDays(
                        month,
                        dayjs().year(),
                        shifts.find(doc => doc.id === employee.shiftType) as ShiftTypeModel,
                    );

                    // to calculate worked days, get the difference in days from the contract starting date to the end of the month
                    workedDays = calculateWorkingDays(
                        month,
                        dayjs().year(),
                        shifts.find(doc => doc.id === employee.shiftType) as ShiftTypeModel,
                        csd,
                    );
                    salary = Number(
                        ((employee.salary / periodWorkingDays) * workedDays).toFixed(2),
                    );
                }

                // getting employee compensations
                const empComps = compensations.filter((val: EmployeeCompensationModel) =>
                    val?.employees?.includes(employee.uid),
                );

                // deducting unpaid leave from base salary
                const unpaidLeave = empComps.find(c => c.deduction == "unp3-4val-Unpaid Leave");
                let unpaidLeaveVal = 0;
                if (unpaidLeave?.deductionType === "Percentage") {
                    unpaidLeaveVal =
                        Math.round(
                            salary *
                                (unpaidLeave?.deductionAmount?.at(months.indexOf(month)) ??
                                    0 / 100) *
                                100,
                        ) / 100;
                } else {
                    unpaidLeaveVal = unpaidLeave?.deductionAmount?.at(months.indexOf(month)) ?? 0;
                }

                salary = salary - unpaidLeaveVal;

                // Approved overtime for this month (Work Time columns + gross pay). Logic 1 still pays OT when eligible.
                const eligibleOvertimeForPayroll = overtimeRequests.filter(
                    doc =>
                        isOvertimeClaimedForPayroll(employee, undefined, doc) &&
                        isPayrollEligibleOvertime(doc) &&
                        isOvertimeInSelectedMonth(doc, month, payrollYear),
                );

                const overtimeTypeCols: ColValues[] = [];
                overtimeConfigs.forEach(cfg => {
                    const hours = eligibleOvertimeForPayroll
                        .filter(r => requestMatchesOvertimeConfig(r, cfg))
                        .reduce((sum, r) => sum + (r.duration ?? 0), 0);
                    const rate = cfg.overtimeRate ?? 0;
                    const hourlyWage = employee.hourlyWage ?? 0;
                    const overtimeCost = calculateOvertimeCost(hours, rate, hourlyWage);
                    overtimeTypeCols.push({
                        key: camelize(cfg.overtimeType),
                        label: cfg.overtimeType,
                        value: overtimeCost,
                        hours,
                    });
                });

                const totalOvertimePay =
                    Math.round(
                        overtimeTypeCols.reduce((sum, col) => sum + (col.value ?? 0), 0) * 100,
                    ) / 100;

                // calculating total gross pay
                const totalGrossSalary: number = calcTotalGrossSalary(
                    salary + totalOvertimePay,
                    empComps,
                    months.indexOf(month),
                );

                // calculating total taxable gross pay
                let taxableGrossSalary: number = salary + totalOvertimePay;

                // Calculate fringe benefits taxable amount once (10% of base salary)
                let totalFringeBenefitsTaxable = 0;

                // Count fringe benefits for this employee
                const fringeBenefitCount = empComps.filter((val: EmployeeCompensationModel) => {
                    const thisPayment = paymentTypes.find(p => p.id === val?.paymentType);
                    return val.type === "Payment" && thisPayment?.paymentType === "Fringe Benefits";
                }).length;

                if (fringeBenefitCount > 0) {
                    totalFringeBenefitsTaxable = salary * 0.1;
                    taxableGrossSalary += totalFringeBenefitsTaxable;
                }

                // transport allowance
                let transportAllowance: number = 0;

                // taxable transport allowance
                let taxableTransportAllowance: number = 0;

                // other allowances
                let otherAllowances: number = 0;

                // taxable other allowances
                let taxableOtherAllowances: number = 0;

                // cost sharing
                let costSharing: number = 0;

                // total deduction & payments
                let totalDeduction = 0;
                let totalPayment = 0;

                // bonus amount tracking
                let totalBonusAmount = 0;

                // severance pay amount tracking
                let totalSeverancePay = 0;

                // annual leave pay amount tracking
                let totalAnnualLeavePay = 0;

                // payments
                const payments: { name: string; amount: number }[] = [];
                empComps.map((val: EmployeeCompensationModel) => {
                    // Process only "Payment" type entries
                    if (val.type === "Payment") {
                        // Retrieve the payment amount for the specified month, defaulting to 0 if not available
                        const paymentAmount = val?.paymentAmount?.at(months.indexOf(month)) ?? 0;

                        // Find the corresponding payment type from the list of payment types
                        const thisPayment = paymentTypes.find(p => p.id === val?.paymentType);
                        if (thisPayment) {
                            // Handle Fringe Benefit special case (identified by payment type)
                            if (thisPayment.paymentType === "Fringe Benefits") {
                                // Fringe Benefit: already added 10% of base salary to taxable gross at the beginning
                                otherAllowances += paymentAmount;
                                taxableOtherAllowances += totalFringeBenefitsTaxable;
                            }
                            // Handle Bonus special case (identified by payment type)
                            else if (thisPayment.paymentType === "Bonus") {
                                // Bonus: full amount goes to total gross, but taxable gross doesn't include bonus
                                // The bonus tax will be calculated separately
                                otherAllowances += paymentAmount;
                                totalBonusAmount += paymentAmount;
                                // Do NOT add to taxableGrossSalary - bonus tax is calculated separately
                            }
                            // Handle Severance Pay special case (one-time payment on termination)
                            else if (thisPayment.paymentType === "Severance Pay") {
                                // Severance pay is already calculated with tax when saved
                                // Just use the payment amount as-is (net severance pay)
                                otherAllowances += paymentAmount;
                                totalSeverancePay += paymentAmount;
                            }
                            // Handle Annual Leave special case (payment for unused leave days)
                            else if (thisPayment.paymentType === "Annual Leave") {
                                // Annual leave pay is already calculated with tax when saved
                                // Just use the payment amount as-is (net annual leave pay)
                                otherAllowances += paymentAmount;
                                totalAnnualLeavePay += paymentAmount;
                            } else {
                                // Process taxable payments (normal threshold logic)
                                let threshold = 0;
                                let isTaxable = false;

                                if (thisPayment.taxabilityThresholdType === "Value") {
                                    threshold = thisPayment.taxabilityThresholdAmount;
                                    if (paymentAmount > threshold) {
                                        isTaxable = true;
                                    }
                                } else if (thisPayment.taxabilityThresholdType === "Percentage") {
                                    threshold =
                                        salary * (thisPayment.taxabilityThresholdAmount / 100);
                                    if (paymentAmount > threshold) {
                                        isTaxable = true;
                                    }
                                } else if (
                                    thisPayment.taxabilityThresholdType === "PercentageWithValue"
                                ) {
                                    const percentageThreshold =
                                        salary * (thisPayment.taxabilityThresholdAmount / 100);
                                    const valueThreshold =
                                        thisPayment.taxabilityThresholdValue ?? 0;
                                    threshold = Math.min(percentageThreshold, valueThreshold);
                                    if (paymentAmount > threshold) {
                                        isTaxable = true;
                                    }
                                }

                                if (isTaxable) {
                                    const delta = paymentAmount - threshold;
                                    taxableGrossSalary += delta; // Add the taxable excess

                                    // if payment is Transport Allowance
                                    if (thisPayment.paymentName === "Transport Allowance") {
                                        transportAllowance += paymentAmount;
                                        taxableTransportAllowance += delta;
                                    } else {
                                        otherAllowances += paymentAmount;
                                        taxableOtherAllowances += delta;
                                    }
                                }
                            }
                            // Update total payment amount
                            totalPayment += paymentAmount;

                            // if payment is Transport Allowance
                            if (thisPayment.paymentName === "Transport Allowance")
                                transportAllowance += paymentAmount;

                            // Add payment details to the payments array
                            payments.push({
                                name: thisPayment.paymentName,
                                amount: parseFloat(paymentAmount.toFixed(2)), // Round to two decimal places
                            });
                        }
                    }
                });

                totalPayment += totalOvertimePay;

                // deducts
                const deducts: { id: string; name: string; amount: number }[] = [];
                empComps.map((val: EmployeeCompensationModel) => {
                    if (val.type === "Deduction") {
                        const deductionName =
                            deductionTypes.find(d => d.id == val.deduction)?.deductionName ?? "";

                        if (val?.deductionType === "Percentage") {
                            const tmp =
                                Math.round(
                                    salary *
                                        (val?.deductionAmount?.at(months.indexOf(month)) ??
                                            0 / 100) *
                                        100,
                                ) / 100;
                            totalDeduction += tmp;

                            // if deduction is Cost Sharing
                            if (deductionName === "Cost Sharing") {
                                costSharing += tmp;
                            }

                            deducts.push({
                                id: val.id,
                                name: deductionName,
                                amount: tmp,
                            });
                        } else {
                            totalDeduction += val?.deductionAmount?.at(months.indexOf(month)) ?? 0;

                            // if deduction is Cost Sharing
                            if (deductionName === "Cost Sharing") {
                                costSharing += val?.deductionAmount?.at(months.indexOf(month)) ?? 0;
                            }

                            deducts.push({
                                id: val.id,
                                name: deductionName,
                                amount: val?.deductionAmount?.at(months.indexOf(month)) ?? 0,
                            });
                        }
                    }
                });

                // loans
                const empLoan = loans.filter(
                    (val: EmployeeLoanModel) =>
                        val?.employeeUid === employee.uid && val.loanStatus === "Ongoing",
                );
                const employeeLoans: { name: string; amount: number }[] = [];
                empLoan.map((val: EmployeeLoanModel) => {
                    if (val.loanStatus === "Ongoing") {
                        const date = `${month} ${dayjs().year()}`;
                        // from the months array, find the current month data
                        const current = val.months.find(month => month.date === date);
                        if (current && current.confirmed) {
                            totalDeduction += current?.deductFromSalary ?? 0;
                            employeeLoans.push({
                                name: val?.loanType,
                                amount: current?.deductFromSalary,
                            });
                        }
                    }
                });

                // If pension application is enabled employee pension calculated otherwise it's 0.
                if (pension && employee.pensionApplication) {
                    // Employee Pension
                    if (pension.employeePensionType === "Percentage") {
                        employeePension = salary * (pension.employeePension / 100);
                    } else {
                        employeePension = pension.employeePension;
                    }

                    // Employer Pension
                    if (pension.employerPensionType === "Percentage") {
                        employerPension = salary * (pension.employerPension / 100);
                    } else {
                        employerPension = pension.employerPension;
                    }
                }

                // calculating bonus tax (based on previous income tax and current income tax considering the bonus)
                let bonusTax = 0;
                if (totalBonusAmount > 0) {
                    const taxWithoutBonus = calculateIncomeTax(taxableGrossSalary, tax);
                    const taxWithBonus = calculateIncomeTax(
                        taxableGrossSalary + totalBonusAmount,
                        tax,
                    );
                    bonusTax = taxWithBonus - taxWithoutBonus;
                }

                // Severance tax is already deducted when the payment was saved
                // The payment amount is the net (after tax) severance pay
                let severanceTax = 0;

                // Annual leave tax is already deducted when the payment was saved
                // The payment amount is the net (after tax) annual leave pay
                let annualLeaveTax = 0;

                // calculating income tax
                const incomeTax = calculateIncomeTax(taxableGrossSalary, tax);

                // add bonus tax and severance tax to income tax
                const totalIncomeTax = incomeTax + bonusTax + severanceTax;

                // add the pension to deductions
                deducts.push({
                    name: "Employee Pension",
                    amount: employeePension,
                    id: "pension-001",
                });

                // add employee pension to total deduction
                totalDeduction += employeePension;

                // total deduction
                totalDeduction = Math.round((totalDeduction + totalIncomeTax) * 100) / 100;

                // calculating number of days worked
                const employeeShift = shifts.find(doc => doc.id === employee.shiftType);
                const workingDays =
                    employeeShift?.workingDays?.map(workingDay => workingDay.dayOfTheWeek) ?? [];
                const periodWorkingDays = calculatePWD(payrollYear, month, workingDays);

                const totalOvertimeAmount: number = eligibleOvertimeForPayroll.reduce(
                    (sum, d) => sum + (d.duration ?? 0),
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
                    deducts,
                    payments,
                    employeeLoans,
                );

                const data: PayrollData = {
                    month: month,
                    year: payrollYear,

                    id: employee.id as string,
                    uid: employee.uid,
                    employeeID: employee.employeeID,
                    employeeName: getFullName(employee),
                    employmentPosition:
                        hrSettings.positions.find(c => c.id == employee.employmentPosition)?.name ??
                        "",
                    department:
                        hrSettings.departmentSettings.find(c => c.id == employee.department)
                            ?.name ?? "",
                    section:
                        hrSettings.sectionSettings.find(c => c.id == employee.section)?.name ?? "",
                    contractStartingDate: employee.contractStartingDate,
                    contractTerminationDate: employee.contractTerminationDate,
                    bankAccount: employee.bankAccount,
                    providentFundAccount: employee.providentFundAccount,
                    workingLocation:
                        hrSettings.locations.find(c => c.id == employee.workingLocation)?.name ??
                        "",
                    employeeCost: totalGrossSalary + employerPension,

                    employeePension: employeePension,
                    employerPension: employerPension,

                    baseSalary: salary,
                    incomeTax: totalIncomeTax,
                    totalDeduction: totalDeduction,

                    totalGrossPay: totalGrossSalary,
                    taxableGrossPay: taxableGrossSalary,
                    // since unpaidLeaveVal is already deducted we need to subtract it from total deduction
                    netPay: totalGrossSalary - (totalDeduction - unpaidLeaveVal),

                    periodWorkingDays: periodWorkingDays,
                    hourlyWage: employee.hourlyWage,
                    // numberOfDaysWorked: workedDays,
                    absentDays: periodWorkingDays - workedDays,
                    leaveDays: totalLeaveDays,
                    holidays: thisMonthHolidays,
                    monthlyWorkedHours: 0,
                    overtimes: eligibleOvertimeForPayroll.map(doc => ({
                        name: doc.overtimeType,
                        amount: doc.duration,
                        rate: getOvertimeRateForRequest(doc, overtimeConfigs),
                    })),
                    overtimeTypeCols: overtimeTypeCols,

                    payments: payments,
                    paymentTypeCols: paymentTypeCols,
                    totalGrossSalary: totalGrossSalary,
                    taxableGrossSalary: taxableGrossSalary,
                    totalPayment: totalPayment,
                    bonusTax: bonusTax,
                    bonusAmount: totalBonusAmount,
                    bonusNetPay: totalBonusAmount - bonusTax,
                    severanceNetPay: totalSeverancePay,
                    annualLeaveNetPay: totalAnnualLeavePay,

                    deductions: deducts,
                    deductionTypeCols: deductionTypeCols,
                    loans: employeeLoans,
                    loanTypeCols: loanTypeCols,

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
                                  month as any,
                                  payrollYear,
                            )
                            : false,
                    employee,
                    presentDays: 0,
                    halfPresentDays: 0,
                    attendanceData: null,
                    unpaidLeave: unpaidLeaveVal,
                    contractType:
                        hrSettings.contractTypes.find(c => c.id == employee.contractType)?.name ??
                        "",
                };

                source.push(data);
            }
            // attendance not considered for daily presence; overtime still included when eligible
        }

        //! ATTENDANCE LOGIC 2 AND 3
        // logic #2 attendance feature is disabled but overtime is enabled and considered in payroll
        // logic #3 attendance feature is enabled but not considered in payroll. overtime feature is enabled and considered in payroll
        else if (attendanceLogic === 2 || attendanceLogic === 3) {
            let salary = employee.salary;

            const tax = taxes.find(tax => tax.id === employee.associatedTax);
            if (tax) {
                // current month attendance will exist only if attendance logic is 3
                const currentMonthAttendance = getAttendanceForPayrollMonth(
                    attendances,
                    month,
                    employee.uid,
                    payrollYear,
                );
                // getting overtime data
                let claimedOvertimes: OvertimeRequestModel[] = overtimeRequests.filter(
                    doc =>
                        isOvertimeClaimedForPayroll(employee, currentMonthAttendance, doc) &&
                        isPayrollEligibleOvertime(doc) &&
                        isOvertimeInSelectedMonth(doc, month, payrollYear),
                );

                const groupedByOvertimeType: any = groupBy("overtimeType", claimedOvertimes);

                // getting overtime data
                const overtimeTypeWorkedHours = calculateOvertimeHours(claimedOvertimes);

                // calculate worked days and leave days (leave days is included in worked days)
                let workedDays: number = 0;
                let leaveDays: number = 0;
                let holidays: number = 0;

                if (currentMonthAttendance) {
                    workedDays =
                        calculateWorkedDaysIncludingLeaveDays(currentMonthAttendance).workedDays;
                    leaveDays =
                        calculateWorkedDaysIncludingLeaveDays(currentMonthAttendance).leaveDays;
                    holidays =
                        calculateWorkedDaysIncludingLeaveDays(currentMonthAttendance).holidays;
                }

                // getting defined overtime types inside the attendance
                const keys: string[] = Object.keys(groupedByOvertimeType);

                // saving the data needed for base salary calculation
                let dataForBaseSalaryCalculation: any = {
                    salary: salary,
                    hourlyWage: employee.hourlyWage,
                };

                // Overtime type columns
                const overtimeTypeCols: ColValues[] = [];
                overtimeConfigs.forEach(doc => {
                    const hours = claimedOvertimes
                        .filter(r => requestMatchesOvertimeConfig(r, doc))
                        .reduce((sum, r) => sum + (r.duration ?? 0), 0);
                    const rate =
                        overtimeConfigs.find(d => d.id === doc.id)?.overtimeRate ??
                        doc.overtimeRate ??
                        0;
                    const hourlyWage = employee.hourlyWage ?? 0;

                    const overtimeCost = calculateOvertimeCost(hours, rate, hourlyWage);

                    overtimeTypeCols.push({
                        key: camelize(doc.overtimeType),
                        label: doc.overtimeType,
                        value: overtimeCost,
                        hours,
                    });
                });

                // setting 0 values for non existent overtime values
                overtimeTypeCols
                    .map(overtimeType => overtimeType.key)
                    .forEach(key => {
                        dataForBaseSalaryCalculation[key] = 0;
                    });

                interface OTD {
                    name: string;
                    hour: number;
                    amount: number;
                }

                // const overtimeDeclarations: OTD[] = [];

                // setting actual values for overtime worked hours
                keys.forEach(key => {
                    const k: string = camelize(key);
                    const val: number = overtimeTypeWorkedHours[k];

                    // Keep overtime out of base salary; OT is added using overtimeTypeCols values.
                    // This prevents double-counting and makes totals consistent with Work Time.
                    dataForBaseSalaryCalculation[k] = 0;
                    // const currentOTConfig = overtimeConfigs.find(val => val.overtimeType === key);
                    // if (currentOTConfig) {
                    //     overtimeDeclarations.push({
                    //         name: key,
                    //         hour: val,
                    //         amount: employee.hourlyWage * val * (currentOTConfig.overtimeRate / 100),
                    //     });
                    // }
                });

                // calculating period working days
                const employeeShift = shifts.find(doc => doc.id === employee.shiftType);
                const workingDays =
                    employeeShift?.workingDays?.map(workingDay => workingDay.dayOfTheWeek) ?? [];
                const periodWorkingDays = calculatePWD(payrollYear, month, workingDays);

                const attendancePwd = currentMonthAttendance?.periodWorkingDays ?? 0;
                const periodWorkingDaysForDisplay =
                    attendancePwd > 0 ? attendancePwd : periodWorkingDays;

                // daily wage
                const dailyWage = salary / periodWorkingDays;

                // calculating base salary
                let baseSalary: number = calculateBaseSalaryUpdated({
                    row: dataForBaseSalaryCalculation,
                    overtimeConfigs: overtimeConfigs,
                    attendanceLogic: attendanceLogic,
                    salary: salary,
                    dailyWage: dailyWage,
                    hourlyWage: employee.hourlyWage,
                    workedDays: workedDays + leaveDays + holidays,
                });

                // if currency is defined, multiply the salary by the exchange rate
                if (employeeCurrency && employeeCurrencyDefinition)
                    baseSalary = employee.salary * employeeCurrencyDefinition.exchangeRate;

                // getting employee compensations
                const empComps = compensations.filter((val: EmployeeCompensationModel) =>
                    val?.employees?.includes(employee.uid),
                );
                // deducting unpaid leave from base salary
                const unpaidLeave = empComps.find(c => c.deduction == "unp3-4val-Unpaid Leave");
                let unpaidLeaveVal = 0;
                if (unpaidLeave?.deductionType === "Percentage") {
                    unpaidLeaveVal =
                        Math.round(
                            salary *
                                (unpaidLeave?.deductionAmount?.at(months.indexOf(month)) ??
                                    0 / 100) *
                                100,
                        ) / 100;
                } else {
                    unpaidLeaveVal = unpaidLeave?.deductionAmount?.at(months.indexOf(month)) ?? 0;
                }

                baseSalary = baseSalary - unpaidLeaveVal;

                const totalOvertimePay = overtimeTypeCols.reduce(
                    (sum, col) => sum + (col.value ?? 0),
                    0,
                );

                // calculating total gross pay
                const totalGrossSalary: number = calcTotalGrossSalary(
                    baseSalary + totalOvertimePay,
                    empComps,
                    months.indexOf(month),
                );

                // calculating total taxable gross pay
                let taxableGrossSalary: number = baseSalary + totalOvertimePay;

                // Calculate fringe benefits taxable amount once (10% of base salary)
                let totalFringeBenefitsTaxable = 0;

                // Count fringe benefits for this employee
                const fringeBenefitCount = empComps.filter((val: EmployeeCompensationModel) => {
                    const thisPayment = paymentTypes.find(p => p.id === val?.paymentType);
                    return val.type === "Payment" && thisPayment?.paymentType === "Fringe Benefits";
                }).length;

                if (fringeBenefitCount > 0) {
                    totalFringeBenefitsTaxable = baseSalary * 0.1;
                    taxableGrossSalary += totalFringeBenefitsTaxable;
                }

                // transport allowance
                let transportAllowance: number = 0;

                // taxable transport allowance
                let taxableTransportAllowance: number = 0;

                // other allowances
                let otherAllowances: number = 0;

                // taxable other allowances
                let taxableOtherAllowances: number = 0;

                // cost sharing
                let costSharing: number = 0;

                // total deduction & payments
                let totalDeduction = 0;
                let totalPayment = 0;

                // bonus amount tracking
                let totalBonusAmount = 0;

                // severance pay amount tracking
                let totalSeverancePay = 0;

                // annual leave pay amount tracking
                let totalAnnualLeavePay = 0;

                // payments
                const payments: { name: string; amount: number }[] = [];
                empComps.map((val: EmployeeCompensationModel) => {
                    // Process only "Payment" type entries
                    if (val.type === "Payment") {
                        // Retrieve the payment amount for the specified month, defaulting to 0 if not available
                        const paymentAmount = val?.paymentAmount?.at(months.indexOf(month)) ?? 0;

                        // Find the corresponding payment type from the list of payment types
                        const thisPayment = paymentTypes.find(p => p.id === val?.paymentType);
                        if (thisPayment) {
                            // Handle Fringe Benefit special case (identified by payment type)
                            if (thisPayment.paymentType === "Fringe Benefits") {
                                // Fringe Benefit: already added 10% of base salary to taxable gross at the beginning
                                otherAllowances += paymentAmount;
                                taxableOtherAllowances += totalFringeBenefitsTaxable;
                            }
                            // Handle Bonus special case (identified by payment type)
                            else if (thisPayment.paymentType === "Bonus") {
                                // Bonus: full amount goes to total gross, but taxable gross doesn't include bonus
                                // The bonus tax will be calculated separately
                                otherAllowances += paymentAmount;
                                totalBonusAmount += paymentAmount;
                                // Do NOT add to taxableGrossSalary - bonus tax is calculated separately
                            }
                            // Handle Severance Pay special case (one-time payment on termination)
                            else if (thisPayment.paymentType === "Severance Pay") {
                                // Severance pay is already calculated with tax when saved
                                // Just use the payment amount as-is (net severance pay)
                                otherAllowances += paymentAmount;
                                totalSeverancePay += paymentAmount;
                            }
                            // Handle Annual Leave special case (payment for unused leave days)
                            else if (thisPayment.paymentType === "Annual Leave") {
                                // Annual leave pay is already calculated with tax when saved
                                // Just use the payment amount as-is (net annual leave pay)
                                otherAllowances += paymentAmount;
                                totalAnnualLeavePay += paymentAmount;
                            } else {
                                // Process taxable payments (normal threshold logic)
                                let threshold = 0;
                                let isTaxable = false;

                                if (thisPayment.taxabilityThresholdType === "Value") {
                                    threshold = thisPayment.taxabilityThresholdAmount;
                                    if (paymentAmount > threshold) {
                                        isTaxable = true;
                                    }
                                } else if (thisPayment.taxabilityThresholdType === "Percentage") {
                                    threshold =
                                        salary * (thisPayment.taxabilityThresholdAmount / 100);
                                    if (paymentAmount > threshold) {
                                        isTaxable = true;
                                    }
                                } else if (
                                    thisPayment.taxabilityThresholdType === "PercentageWithValue"
                                ) {
                                    const percentageThreshold =
                                        salary * (thisPayment.taxabilityThresholdAmount / 100);
                                    const valueThreshold =
                                        thisPayment.taxabilityThresholdValue ?? 0;
                                    threshold = Math.min(percentageThreshold, valueThreshold);
                                    if (paymentAmount > threshold) {
                                        isTaxable = true;
                                    }
                                }

                                if (isTaxable) {
                                    const delta = paymentAmount - threshold;
                                    taxableGrossSalary += delta; // Add the taxable excess

                                    // if payment is Transport Allowance
                                    if (thisPayment.paymentName === "Transport Allowance") {
                                        transportAllowance += paymentAmount;
                                        taxableTransportAllowance += delta;
                                    } else {
                                        otherAllowances += paymentAmount;
                                        taxableOtherAllowances += delta;
                                    }
                                }
                            }
                            // Update total payment amount
                            totalPayment += paymentAmount;

                            // if payment is Transport Allowance
                            if (thisPayment.paymentName === "Transport Allowance")
                                transportAllowance += paymentAmount;

                            // Add payment details to the payments array
                            payments.push({
                                name: thisPayment.paymentName,
                                amount: parseFloat(paymentAmount.toFixed(2)), // Round to two decimal places
                            });
                        }
                    }
                });

                totalPayment += totalOvertimePay;

                // deducts
                const deducts: { name: string; amount: number }[] = [];
                empComps.map((val: EmployeeCompensationModel) => {
                    if (val.type === "Deduction") {
                        const deductionName =
                            deductionTypes.find(d => d.id == val.deduction)?.deductionName ?? "";
                        if (val?.deductionType === "Percentage") {
                            const tmp =
                                Math.round(
                                    salary *
                                        (val?.deductionAmount?.at(months.indexOf(month)) ??
                                            0 / 100) *
                                        100,
                                ) / 100;
                            totalDeduction += tmp;

                            // if deduction is Cost Sharing
                            if (deductionName === "Cost Sharing") {
                                costSharing += tmp;
                            }

                            deducts.push({
                                name: deductionName,
                                amount: tmp,
                            });
                        } else {
                            totalDeduction += val?.deductionAmount?.at(months.indexOf(month)) ?? 0;

                            // if deduction is Cost Sharing
                            if (deductionName === "Cost Sharing") {
                                costSharing += val?.deductionAmount?.at(months.indexOf(month)) ?? 0;
                            }

                            deducts.push({
                                name: deductionName,
                                amount: val?.deductionAmount?.at(months.indexOf(month)) ?? 0,
                            });
                        }
                    }
                });

                // loans
                const empLoan = loans.filter(
                    (val: EmployeeLoanModel) =>
                        val?.employeeUid === employee.uid && val.loanStatus === "Ongoing",
                );
                const employeeLoans: { name: string; amount: number }[] = [];
                empLoan.map((val: EmployeeLoanModel) => {
                    if (val.loanStatus === "Ongoing") {
                        const date = `${month} ${dayjs().year()}`;
                        // from the months array, find the current month data
                        const current = val.months.find(month => month.date === date);
                        if (current && current.confirmed) {
                            totalDeduction += current?.deductFromSalary ?? 0;
                            employeeLoans.push({
                                name: val?.loanType,
                                amount: current?.deductFromSalary,
                            });
                        }
                    }
                });

                // If pension application is enabled employee pension calculated otherwise it's 0.
                if (pension && employee.pensionApplication) {
                    // Employee Pension
                    if (pension.employeePensionType === "Percentage") {
                        employeePension = baseSalary * (pension.employeePension / 100);
                    } else {
                        employeePension = pension.employeePension;
                    }

                    // Employer Pension
                    if (pension.employerPensionType === "Percentage") {
                        employerPension = baseSalary * (pension.employerPension / 100);
                    } else {
                        employerPension = pension.employerPension;
                    }
                }

                // calculating bonus tax (based on previous income tax and current income tax considering the bonus)
                let bonusTax = 0;
                if (totalBonusAmount > 0) {
                    const taxWithoutBonus = calculateIncomeTax(taxableGrossSalary, tax);
                    const taxWithBonus = calculateIncomeTax(
                        taxableGrossSalary + totalBonusAmount,
                        tax,
                    );
                    bonusTax = taxWithBonus - taxWithoutBonus;
                }

                // Severance tax is already deducted when the payment was saved
                // The payment amount is the net (after tax) severance pay
                let severanceTax = 0;

                // Annual leave tax is already deducted when the payment was saved
                // The payment amount is the net (after tax) annual leave pay
                let annualLeaveTax = 0;

                // calculating income tax
                const incomeTax = calculateIncomeTax(taxableGrossSalary, tax);

                // add bonus tax and severance tax to income tax
                const totalIncomeTax = incomeTax + bonusTax + severanceTax;

                // add the pension to deductions
                deducts.push({
                    name: "Employee Pension",
                    amount: employeePension,
                });

                // add employee pension to total deduction
                totalDeduction += employeePension;

                // total deduction
                totalDeduction = Math.round((totalDeduction + totalIncomeTax) * 100) / 100;

                // total overtime amount
                const totalOvertimeAmount: number = claimedOvertimes
                    .map(doc => ({
                        name: doc.overtimeType,
                        amount: doc.duration,
                        rate: getOvertimeRateForRequest(doc, overtimeConfigs),
                    }))
                    .reduce((sum, overtime) => sum + overtime.amount, 0);
                // const totalOvertimeAmount: number = 0;

                const { deductionTypeCols, paymentTypeCols, loanTypeCols } = getCols(
                    deductionTypes,
                    paymentTypes,
                    loanTypes,
                    deducts,
                    payments,
                    employeeLoans,
                );

                // presentDays: number,
                // halfPresentDays: number,
                // weekendOvertime: 0,
                // weekendOvertimeDuration: "",
                // publicHolidayOvertime: 0,
                // publicHolidayOvertimeDuration: "",
                // normalOvertime: 10,
                // normalOvertimeDuration: "20 hours",

                const data: PayrollData = {
                    month: month,
                    year: dayjs().year(),

                    id: employee.id as string,
                    uid: employee.uid,
                    employeeID: employee.employeeID,
                    employeeName: getFullName(employee),
                    employmentPosition:
                        hrSettings.positions.find(c => c.id == employee.employmentPosition)?.name ??
                        "",
                    department:
                        hrSettings.departmentSettings.find(c => c.id == employee.department)
                            ?.name ?? "",
                    section:
                        hrSettings.sectionSettings.find(c => c.id == employee.section)?.name ?? "",
                    contractStartingDate: employee.contractStartingDate,
                    contractTerminationDate: employee.contractTerminationDate,
                    bankAccount: employee.bankAccount,
                    providentFundAccount: employee.providentFundAccount,
                    workingLocation:
                        hrSettings.locations.find(c => c.id == employee.workingLocation)?.name ??
                        "",
                    employeeCost: totalGrossSalary + employerPension,

                    employeePension: employeePension,
                    employerPension: employerPension,

                    baseSalary: baseSalary,
                    incomeTax: totalIncomeTax,
                    totalDeduction: totalDeduction,

                    totalGrossPay: totalGrossSalary,
                    taxableGrossPay: taxableGrossSalary,
                    netPay: totalGrossSalary - (totalDeduction - unpaidLeaveVal),

                    periodWorkingDays: periodWorkingDaysForDisplay,
                    hourlyWage: employee.hourlyWage,
                    // numberOfDaysWorked: workedDays,
                    absentDays: periodWorkingDays - workedDays,
                    leaveDays: leaveDays,
                    holidays: holidays,
                    monthlyWorkedHours: currentMonthAttendance?.monthlyWorkedHours ?? 0,
                    overtimes: claimedOvertimes.map(doc => ({
                        name: doc.overtimeType,
                        amount: doc.duration,
                        rate: getOvertimeRateForRequest(doc, overtimeConfigs),
                    })),
                    overtimeTypeCols: overtimeTypeCols,

                    payments: payments,
                    paymentTypeCols: paymentTypeCols,
                    totalGrossSalary: totalGrossSalary,
                    taxableGrossSalary: taxableGrossSalary,
                    totalPayment: totalPayment,
                    bonusTax: bonusTax,
                    bonusAmount: totalBonusAmount,
                    bonusNetPay: totalBonusAmount - bonusTax,
                    severanceNetPay: totalSeverancePay,
                    annualLeaveNetPay: totalAnnualLeavePay,

                    deductions: deducts,
                    deductionTypeCols: deductionTypeCols,
                    loans: employeeLoans,
                    loanTypeCols: loanTypeCols,
                    attendanceData: currentMonthAttendance ?? null,

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
                                  month as any,
                                  dayjs().year(),
                            )
                            : false,
                    employee,
                    presentDays:
                        currentMonthAttendance?.values?.filter(val => val.value == "P").length ?? 0,
                    halfPresentDays:
                        currentMonthAttendance?.values?.filter(val => val.value == "H").length ?? 0,
                    unpaidLeave: unpaidLeaveVal,
                    contractType:
                        hrSettings.contractTypes.find(c => c.id == employee.contractType)?.name ??
                        "",
                };

                source.push(data);
            }
        }

        //! ATTENDANCE LOGIC 4
        // attendance and overtime is enabled and considered in payroll
        else {
            const tax = taxes.find(tax => tax.id === employee.associatedTax);
            if (tax) {
                // current month attendance
                const currentMonthAttendance = getAttendanceForPayrollMonth(
                    attendances,
                    month,
                    employee.uid,
                    payrollYear,
                );

                if (currentMonthAttendance) {
                    // getting overtime data — HR approval syncs ids to employee.claimedOvertimes;
                    // attendance sheet may also list claimedOvertimes; include both.
                    const overtime: OvertimeRequestModel[] = overtimeRequests.filter(doc =>
                        isOvertimeClaimedForPayroll(employee, currentMonthAttendance, doc),
                    );
                    const eligibleOvertime = overtime.filter(
                        doc =>
                            isPayrollEligibleOvertime(doc) &&
                            isOvertimeInSelectedMonth(doc, month, payrollYear),
                    );
                    const groupedByOvertimeType: any = groupBy("overtimeType", eligibleOvertime);

                    // getting overtime data
                    const overtimeTypeWorkedHours = calculateOvertimeHours(eligibleOvertime);

                    // calculate worked days and leave days (workedDays includes leaveDays)
                    const workedDays =
                        calculateWorkedDaysIncludingLeaveDays(currentMonthAttendance).workedDays;
                    const leaveDays =
                        calculateWorkedDaysIncludingLeaveDays(currentMonthAttendance).leaveDays;
                    const holidays =
                        calculateWorkedDaysIncludingLeaveDays(currentMonthAttendance).holidays;

                    // getting defined overtime types inside the attendance
                    const keys: string[] = Object.keys(groupedByOvertimeType);

                    // saving the data needed for base salary calculation
                    let dataForBaseSalaryCalculation: any = {
                        // base salary calculation
                        hourlyWage: employee.hourlyWage,
                        numberOfDaysWorked: workedDays,
                        monthlyWorkedHours: currentMonthAttendance?.monthlyWorkedHours,
                    };

                    const overtimeTypeCols: ColValues[] = [];
                    overtimeConfigs.forEach(doc => {
                        const claimedOTs = overtimeRequests.filter(
                            r =>
                                isOvertimeClaimedForPayroll(employee, currentMonthAttendance, r) &&
                                isPayrollEligibleOvertime(r) &&
                                isOvertimeInSelectedMonth(r, month, payrollYear),
                        );
                        const hours = claimedOTs
                            .filter(r => requestMatchesOvertimeConfig(r, doc))
                            .reduce((sum, r) => sum + (r.duration ?? 0), 0);
                        const rate =
                            overtimeConfigs.find(d => d.id === doc.id)?.overtimeRate ??
                            doc.overtimeRate ??
                            0;
                        const hourlyWage = employee.hourlyWage ?? 0;

                        const overtimeCost = calculateOvertimeCost(hours, rate, hourlyWage);

                        overtimeTypeCols.push({
                            key: camelize(doc.overtimeType),
                            label: doc.overtimeType,
                            value: overtimeCost,
                            hours,
                        });
                    });

                    // setting 0 values for non existent overtime values
                    overtimeTypeCols
                        .map(overtimeType => overtimeType.key)
                        .forEach(key => {
                            dataForBaseSalaryCalculation[key] = 0;
                        });

                    interface OTD {
                        name: string;
                        hour: number;
                        amount: number;
                    }

                    const overtimeDeclarations: OTD[] = [];

                    // setting actual values for overtime worked hours
                    keys.forEach(key => {
                        const k: string = camelize(key);
                        const val: number = overtimeTypeWorkedHours[k];

                        // Keep overtime out of base salary; OT is added using overtimeTypeCols values.
                        // This prevents double-counting and makes totals consistent with Work Time.
                        dataForBaseSalaryCalculation[k] = 0;

                        const currentOTConfig = overtimeConfigs.find(
                            val => val.overtimeType === key,
                        );
                        if (currentOTConfig) {
                            overtimeDeclarations.push({
                                name: key,
                                hour: val,
                                amount: calculateOvertimeCost(
                                    val,
                                    currentOTConfig.overtimeRate,
                                    employee.hourlyWage,
                                ),
                            });
                        }
                    });

                    // calculating period working days
                    const employeeShift = shifts.find(doc => doc.id === employee.shiftType);
                    const workingDays =
                        employeeShift?.workingDays?.map(workingDay => workingDay.dayOfTheWeek) ??
                        [];
                    const periodWorkingDays = calculatePWD(payrollYear, month, workingDays);

                    // calculating base salary
                    let baseSalary: number = calculateBaseSalaryUpdated({
                        row: dataForBaseSalaryCalculation,
                        overtimeConfigs: overtimeConfigs,
                        attendanceLogic: attendanceLogic,
                        salary: employee.salary,
                        dailyWage: 0,
                        hourlyWage: employee.hourlyWage,
                        workedDays: workedDays + leaveDays + holidays,
                    });

                    // if currency is defined, multiply the salary by the exchange rate
                    if (employeeCurrency && employeeCurrencyDefinition)
                        baseSalary = employee.salary * employeeCurrencyDefinition.exchangeRate;

                    // getting employee compensations
                    const empComps = compensations.filter((val: EmployeeCompensationModel) =>
                        val?.employees?.includes(employee.uid),
                    );

                    // deducting unpaid leave from base salary
                    const unpaidLeave = empComps.find(c => c.deduction == "unp3-4val-Unpaid Leave");
                    let unpaidLeaveVal = 0;
                    if (unpaidLeave?.deductionType === "Percentage") {
                        unpaidLeaveVal =
                            Math.round(
                                baseSalary *
                                    (unpaidLeave?.deductionAmount?.at(months.indexOf(month)) ??
                                        0 / 100) *
                                    100,
                            ) / 100;
                    } else {
                        unpaidLeaveVal =
                            unpaidLeave?.deductionAmount?.at(months.indexOf(month)) ?? 0;
                    }

                    baseSalary = baseSalary - unpaidLeaveVal;

                    const totalOvertimePay = overtimeTypeCols.reduce(
                        (sum, col) => sum + (col.value ?? 0),
                        0,
                    );

                    // calculating total gross pay
                    const totalGrossSalary: number = calcTotalGrossSalary(
                        baseSalary + totalOvertimePay,
                        empComps,
                        months.indexOf(month),
                    );

                    // calculating total taxable gross pay
                    let taxableGrossSalary: number = baseSalary + totalOvertimePay;

                    // Calculate fringe benefits taxable amount once (10% of base salary)
                    let totalFringeBenefitsTaxable = 0;

                    // Count fringe benefits for this employee
                    const fringeBenefitCount = empComps.filter((val: EmployeeCompensationModel) => {
                        const thisPayment = paymentTypes.find(p => p.id === val?.paymentType);
                        return (
                            val.type === "Payment" && thisPayment?.paymentType === "Fringe Benefits"
                        );
                    }).length;

                    if (fringeBenefitCount > 0) {
                        totalFringeBenefitsTaxable = baseSalary * 0.1;
                        taxableGrossSalary += totalFringeBenefitsTaxable;
                    }

                    // transport allowance
                    let transportAllowance: number = 0;

                    // taxable transport allowance
                    let taxableTransportAllowance: number = 0;

                    // other allowances
                    let otherAllowances: number = 0;

                    // taxable other allowances
                    let taxableOtherAllowances: number = 0;

                    // cost sharing
                    let costSharing: number = 0;

                    // total deduction & payments
                    let totalDeduction = 0;
                    let totalPayment = 0;

                    // bonus amount tracking
                    let totalBonusAmount = 0;

                    // severance pay amount tracking
                    let totalSeverancePay = 0;

                    // annual leave pay amount tracking
                    let totalAnnualLeavePay = 0;

                    // payments
                    const payments: { name: string; amount: number }[] = [];
                    empComps.map((val: EmployeeCompensationModel) => {
                        // Process only "Payment" type entries
                        if (val.type === "Payment") {
                            // Retrieve the payment amount for the specified month, defaulting to 0 if not available
                            const paymentAmount =
                                val?.paymentAmount?.at(months.indexOf(month)) ?? 0;

                            // Find the corresponding payment type from the list of payment types
                            const thisPayment = paymentTypes.find(p => p.id === val?.paymentType);
                            if (thisPayment) {
                                // Handle Fringe Benefit special case (identified by payment type)
                                if (thisPayment.paymentType === "Fringe Benefits") {
                                    // Fringe Benefit: already added 10% of base salary to taxable gross at the beginning
                                    otherAllowances += paymentAmount;
                                    taxableOtherAllowances += totalFringeBenefitsTaxable;
                                }
                                // Handle Bonus special case (identified by payment type)
                                else if (thisPayment.paymentType === "Bonus") {
                                    // Bonus: full amount goes to total gross, but taxable gross doesn't include bonus
                                    // The bonus tax will be calculated separately
                                    otherAllowances += paymentAmount;
                                    totalBonusAmount += paymentAmount;
                                    // Don't add to taxableGrossSalary - bonus tax is calculated separately
                                }
                                // Handle Severance Pay special case (one-time payment on termination)
                                else if (thisPayment.paymentType === "Severance Pay") {
                                    // Severance pay is already calculated with tax when saved
                                    // Just use the payment amount as-is (net severance pay)
                                    otherAllowances += paymentAmount;
                                    totalSeverancePay += paymentAmount;
                                }
                                // Handle Annual Leave special case (payment for unused leave days)
                                else if (thisPayment.paymentType === "Annual Leave") {
                                    // Annual leave pay is already calculated with tax when saved
                                    // Just use the payment amount as-is (net annual leave pay)
                                    otherAllowances += paymentAmount;
                                    totalAnnualLeavePay += paymentAmount;
                                } else {
                                    // Process taxable payments (normal threshold logic)
                                    let threshold = 0;
                                    let isTaxable = false;

                                    if (thisPayment.taxabilityThresholdType === "Value") {
                                        threshold = thisPayment.taxabilityThresholdAmount;
                                        if (paymentAmount > threshold) {
                                            isTaxable = true;
                                        }
                                    } else if (
                                        thisPayment.taxabilityThresholdType === "Percentage"
                                    ) {
                                        threshold =
                                            employee.salary *
                                            (thisPayment.taxabilityThresholdAmount / 100);
                                        if (paymentAmount > threshold) {
                                            isTaxable = true;
                                        }
                                    } else if (
                                        thisPayment.taxabilityThresholdType ===
                                        "PercentageWithValue"
                                    ) {
                                        const percentageThreshold =
                                            employee.salary *
                                            (thisPayment.taxabilityThresholdAmount / 100);
                                        const valueThreshold =
                                            thisPayment.taxabilityThresholdValue ?? 0;
                                        threshold = Math.min(percentageThreshold, valueThreshold);
                                        if (paymentAmount > threshold) {
                                            isTaxable = true;
                                        }
                                    }

                                    if (isTaxable) {
                                        const delta = paymentAmount - threshold;
                                        taxableGrossSalary += delta; // Add the taxable excess

                                        // if payment is Transport Allowance
                                        if (thisPayment.paymentName === "Transport Allowance") {
                                            transportAllowance += paymentAmount;
                                            taxableTransportAllowance += delta;
                                        } else {
                                            otherAllowances += paymentAmount;
                                            taxableOtherAllowances += delta;
                                        }
                                    }
                                }
                                // Update total payment amount
                                totalPayment += paymentAmount;

                                // if payment is Transport Allowance
                                if (thisPayment.paymentName === "Transport Allowance")
                                    transportAllowance += paymentAmount;

                                // Add payment details to the payments array
                                payments.push({
                                    name: thisPayment.paymentName,
                                    amount: parseFloat(paymentAmount.toFixed(2)), // Round to two decimal places
                                });
                            }
                        }
                    });

                    totalPayment += totalOvertimePay;

                    // deducts
                    const deducts: { name: string; amount: number }[] = [];
                    empComps.map((val: EmployeeCompensationModel) => {
                        if (val.type === "Deduction") {
                            const deductionName =
                                deductionTypes.find(d => d.id == val.deduction)?.deductionName ??
                                "";

                            if (val?.deductionType === "Percentage") {
                                const tmp =
                                    Math.round(
                                        employee.salary *
                                            (val?.deductionAmount?.at(months.indexOf(month)) ??
                                                0 / 100) *
                                            100,
                                    ) / 100;
                                totalDeduction += tmp;

                                // if deduction is Cost Sharing
                                if (deductionName === "Cost Sharing") {
                                    costSharing += tmp;
                                }

                                deducts.push({
                                    name: deductionName,
                                    amount: tmp,
                                });
                            } else {
                                totalDeduction +=
                                    val?.deductionAmount?.at(months.indexOf(month)) ?? 0;

                                // if deduction is Cost Sharing
                                if (deductionName === "Cost Sharing") {
                                    costSharing +=
                                        val?.deductionAmount?.at(months.indexOf(month)) ?? 0;
                                }

                                deducts.push({
                                    name: deductionName,
                                    amount: val?.deductionAmount?.at(months.indexOf(month)) ?? 0,
                                });
                            }
                        }
                    });

                    // loans
                    const empLoan = loans.filter(
                        (val: EmployeeLoanModel) =>
                            val?.employeeUid === employee.uid && val.loanStatus === "Ongoing",
                    );
                    const employeeLoans: { name: string; amount: number }[] = [];
                    empLoan.map((val: EmployeeLoanModel) => {
                        if (val.loanStatus === "Ongoing") {
                            const date = `${month} ${dayjs().year()}`;
                            // from the months array, find the current month data
                            const current = val.months.find(month => month.date === date);
                            if (current && current.confirmed) {
                                totalDeduction += current?.deductFromSalary ?? 0;
                                employeeLoans.push({
                                    name: val?.loanType,
                                    amount: current?.deductFromSalary,
                                });
                            }
                        }
                    });

                    // If pension application is enabled employee pension calculated otherwise it's 0.
                    if (pension && employee.pensionApplication) {
                        // Employee Pension
                        if (pension.employeePensionType === "Percentage") {
                            employeePension = baseSalary * (pension.employeePension / 100);
                        } else {
                            employeePension = pension.employeePension;
                        }

                        // Employer Pension
                        if (pension.employerPensionType === "Percentage") {
                            employerPension = baseSalary * (pension.employerPension / 100);
                        } else {
                            employerPension = pension.employerPension;
                        }
                    }

                    // calculating bonus tax (based on previous income tax and current income tax considering the bonus)
                    let bonusTax = 0;
                    if (totalBonusAmount > 0) {
                        const taxWithoutBonus = calculateIncomeTax(taxableGrossSalary, tax);
                        const taxWithBonus = calculateIncomeTax(
                            taxableGrossSalary + totalBonusAmount,
                            tax,
                        );
                        bonusTax = taxWithBonus - taxWithoutBonus;
                    }

                    // Severance tax is already deducted when the payment was saved
                    // The payment amount is the net (after tax) severance pay
                    let severanceTax = 0;

                    // Annual leave tax is already deducted when the payment was saved
                    // The payment amount is the net (after tax) annual leave pay
                    let annualLeaveTax = 0;

                    // calculating income tax
                    const incomeTax = calculateIncomeTax(taxableGrossSalary, tax);

                    // add bonus tax and severance tax to income tax
                    const totalIncomeTax = incomeTax + bonusTax + severanceTax;

                    // add the pension to deductions
                    deducts.push({
                        name: "Employee Pension",
                        amount: employeePension,
                    });

                    // add employee pension to total deduction
                    totalDeduction += employeePension;

                    // total deduction
                    totalDeduction = Math.round((totalDeduction + totalIncomeTax) * 100) / 100;

                    // total overtime amount
                    const totalOvertimeAmount: number = eligibleOvertime
                        .map(doc => ({
                            name: doc.overtimeType,
                            amount: doc.duration,
                            rate: getOvertimeRateForRequest(doc, overtimeConfigs),
                        }))
                        .reduce((sum, ot) => sum + ot.amount, 0);

                    const { deductionTypeCols, paymentTypeCols, loanTypeCols } = getCols(
                        deductionTypes,
                        paymentTypes,
                        loanTypes,
                        deducts,
                        payments,
                        employeeLoans,
                    );

                    const data: PayrollData = {
                        month: month,
                        year: payrollYear,

                        id: employee.id as string,
                        uid: employee.uid,
                        employeeID: employee.employeeID,
                        employeeName: getFullName(employee),
                        employmentPosition:
                            hrSettings.positions.find(c => c.id == employee.employmentPosition)
                                ?.name ?? "",
                        department:
                            hrSettings.departmentSettings.find(c => c.id == employee.department)
                                ?.name ?? "",
                        section:
                            hrSettings.sectionSettings.find(c => c.id == employee.section)?.name ??
                            "",
                        contractStartingDate: employee.contractStartingDate,
                        contractTerminationDate: employee.contractTerminationDate,
                        bankAccount: employee.bankAccount,
                        providentFundAccount: employee.providentFundAccount,
                        workingLocation:
                            hrSettings.locations.find(c => c.id == employee.workingLocation)
                                ?.name ?? "",
                        employeeCost: totalGrossSalary + employerPension,

                        employeePension: employeePension,
                        employerPension: employerPension,

                        baseSalary: baseSalary,
                        incomeTax: totalIncomeTax,
                        totalDeduction: totalDeduction,

                        totalGrossPay: totalGrossSalary,
                        taxableGrossPay: taxableGrossSalary,
                        netPay: totalGrossSalary - (totalDeduction - unpaidLeaveVal),

                        periodWorkingDays: periodWorkingDays,
                        hourlyWage: employee.hourlyWage,
                        // numberOfDaysWorked: workedDays,
                        absentDays: periodWorkingDays - workedDays,
                        holidays: holidays,
                        leaveDays: leaveDays,
                        monthlyWorkedHours: currentMonthAttendance?.monthlyWorkedHours ?? 1,
                        overtimes: eligibleOvertime.map(doc => ({
                            name: doc.overtimeType,
                            amount: doc.duration,
                            rate: getOvertimeRateForRequest(doc, overtimeConfigs),
                        })),
                        overtimeTypeCols: overtimeTypeCols,

                        payments: payments,
                        paymentTypeCols: paymentTypeCols,
                        totalGrossSalary: totalGrossSalary,
                        taxableGrossSalary: taxableGrossSalary,
                        totalPayment: totalPayment,
                        bonusTax: bonusTax,
                        bonusAmount: totalBonusAmount,
                        bonusNetPay: totalBonusAmount - bonusTax,
                        severanceNetPay: totalSeverancePay,
                        annualLeaveNetPay: totalAnnualLeavePay,
                        deductions: deducts,
                        deductionTypeCols: deductionTypeCols,
                        loans: employeeLoans,
                        loanTypeCols: loanTypeCols,
                        attendanceData: currentMonthAttendance,

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
                                      month as any,
                                      dayjs().year(),
                                )
                                : false,
                        employee,
                        presentDays:
                            currentMonthAttendance?.values?.filter(val => val.value == "P")
                                .length ?? 0,
                        halfPresentDays:
                            currentMonthAttendance?.values?.filter(val => val.value == "H")
                                .length ?? 0,
                        unpaidLeave: unpaidLeaveVal,
                        contractType:
                            hrSettings.contractTypes.find(c => c.id == employee.contractType)
                                ?.name ?? "",
                    };

                    source.push(data);
                }
            }
        }
    }

    /* Sorting the data by name. */
    source.sort((a, b) => {
        return a?.employeeName?.charCodeAt(0) - b?.employeeName?.charCodeAt(0);
    });

    return source;
}

export function calculatePWD(year: number, month: string, workingDays: string[]): number {
    // Map for month names to numbers
    const monthMap: Record<string, number> = {
        January: 1,
        February: 2,
        March: 3,
        April: 4,
        May: 5,
        June: 6,
        July: 7,
        August: 8,
        September: 9,
        October: 10,
        November: 11,
        December: 12,
    };

    // Map for day names to numbers
    const dayMap: Record<string, number> = {
        Sunday: 0,
        Monday: 1,
        Tuesday: 2,
        Wednesday: 3,
        Thursday: 4,
        Friday: 5,
        Saturday: 6,
    };

    // Validate month input
    if (!monthMap[month]) {
        throw new Error("Invalid month. Please provide a valid month name (e.g., 'January').");
    }

    // Convert month name to number
    const monthNumber = monthMap[month];

    // Convert day names to numbers
    const workingDaysNumbers = workingDays.map(day => {
        const dayNumber = dayMap[day];
        if (dayNumber === undefined) {
            throw new Error(
                `Invalid day name: '${day}'. Please provide valid day names (e.g., 'Monday').`,
            );
        }
        return dayNumber;
    });

    // Days in the month
    const daysInMonth = new Date(year, monthNumber, 0).getDate();

    // Calculate the number of working days
    let totalWorkingDays = 0;

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, monthNumber - 1, day);
        const dayOfWeek = date.getDay();
        if (workingDaysNumbers.includes(dayOfWeek)) {
            totalWorkingDays++;
        }
    }

    return totalWorkingDays;
}
