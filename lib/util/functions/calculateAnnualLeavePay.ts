import { TaxModel } from "@/lib/models/hr-settings";
import { EmployeeModel } from "@/lib/models/employee";
import calculateIncomeTax from "./payroll/calculateIncomeTax";

/**
 * Validates if an employee is eligible for Annual Leave Pay.
 *
 * Eligibility criteria:
 * 1. Employee must have balance leave days > 0
 * 2. Employee must have a base salary
 * 3. Employee must have an associated tax
 *
 * @param employee - The employee model to check
 * @param periodWorkingDays - Number of working days in the period (for daily wage calculation)
 * @returns Object with isEligible boolean and error message if not eligible
 */
export function validateAnnualLeavePayEligibility(
    employee: EmployeeModel,
    periodWorkingDays: number,
): {
    isEligible: boolean;
    errorMessage: string;
    balanceLeaveDays: number;
} {
    // Check if employee has balance leave days
    if (!employee.balanceLeaveDays || employee.balanceLeaveDays <= 0) {
        return {
            isEligible: false,
            errorMessage: `${employee.firstName} ${employee.surname}: No leave balance available for Annual Leave Pay`,
            balanceLeaveDays: employee.balanceLeaveDays || 0,
        };
    }

    // Check if employee has a salary
    if (!employee.salary || employee.salary <= 0) {
        return {
            isEligible: false,
            errorMessage: `${employee.firstName} ${employee.surname}: No salary defined`,
            balanceLeaveDays: employee.balanceLeaveDays,
        };
    }

    // Check if employee has an associated tax
    if (!employee.associatedTax) {
        return {
            isEligible: false,
            errorMessage: `${employee.firstName} ${employee.surname}: No tax configuration associated`,
            balanceLeaveDays: employee.balanceLeaveDays,
        };
    }

    // Check if period working days is valid
    if (!periodWorkingDays || periodWorkingDays <= 0) {
        return {
            isEligible: false,
            errorMessage: `${employee.firstName} ${employee.surname}: Invalid working days configuration`,
            balanceLeaveDays: employee.balanceLeaveDays,
        };
    }

    return {
        isEligible: true,
        errorMessage: "",
        balanceLeaveDays: employee.balanceLeaveDays,
    };
}

/**
 * Validates multiple employees for Annual Leave Pay eligibility.
 *
 * @param employees - Array of employee models to check
 * @param periodWorkingDays - Number of working days in the period
 * @returns Object with overall validity, list of eligible employees, list of errors
 */
export function validateMultipleAnnualLeavePayEligibility(
    employees: EmployeeModel[],
    periodWorkingDays: number,
): {
    isValid: boolean;
    eligibleEmployees: EmployeeModel[];
    errors: string[];
    employeeLeaveBalanceMap: Map<string, number>;
} {
    const eligibleEmployees: EmployeeModel[] = [];
    const errors: string[] = [];
    const employeeLeaveBalanceMap = new Map<string, number>();

    for (const employee of employees) {
        const validation = validateAnnualLeavePayEligibility(employee, periodWorkingDays);

        if (validation.isEligible) {
            eligibleEmployees.push(employee);
            employeeLeaveBalanceMap.set(employee.id, validation.balanceLeaveDays);
        } else {
            errors.push(validation.errorMessage);
        }
    }

    return {
        isValid: errors.length === 0,
        eligibleEmployees,
        errors,
        employeeLeaveBalanceMap,
    };
}

/**
 * The function calculates annual leave pay and tax based on base salary, balance leave days,
 * period working days, and tax model.
 *
 * Calculation logic:
 * 1. Daily Wage = Base Salary / Period Working Days
 * 2. Days To Pay = daysToPay (if provided and valid) OR balanceLeaveDays
 * 3. Gross Annual Leave Pay = Days To Pay × Daily Wage
 * 4. Tax Without Leave = calculateIncomeTax(baseSalary, tax)
 * 5. Tax With Leave = calculateIncomeTax(baseSalary + Gross Annual Leave Pay, tax)
 * 6. Tax Delta = Tax With Leave - Tax Without Leave
 * 7. Net Annual Leave Pay = Gross Annual Leave Pay - Tax Delta
 *
 * @param {number} baseSalary - The employee's base salary
 * @param {number} balanceLeaveDays - The employee's balance leave days
 * @param {number} periodWorkingDays - Number of working days in the period
 * @param {TaxModel} tax - The tax model containing tax rates
 * @param {number} daysToPay - Optional: Number of days to convert to payment (defaults to balanceLeaveDays)
 * @returns The function returns an object with:
 *   - grossAnnualLeavePay: The gross annual leave pay (before tax)
 *   - annualLeaveTax: The tax amount on the annual leave
 *   - netAnnualLeavePay: The net annual leave pay (after tax)
 *   - dailyWage: The calculated daily wage
 *   - balanceLeaveDays: The total balance leave days
 *   - daysToPay: The number of days used for calculation
 */
export function calculateAnnualLeavePay(
    baseSalary: number,
    balanceLeaveDays: number,
    periodWorkingDays: number,
    tax: TaxModel,
    daysToPay?: number,
): {
    grossAnnualLeavePay: number;
    annualLeaveTax: number;
    netAnnualLeavePay: number;
    dailyWage: number;
    balanceLeaveDays: number;
    daysToPay: number;
} {
    // Validate inputs
    if (baseSalary <= 0 || balanceLeaveDays <= 0 || periodWorkingDays <= 0) {
        return {
            grossAnnualLeavePay: 0,
            annualLeaveTax: 0,
            netAnnualLeavePay: 0,
            dailyWage: 0,
            balanceLeaveDays: 0,
            daysToPay: 0,
        };
    }

    // Use daysToPay if provided and valid, otherwise use balanceLeaveDays
    const daysToUse =
        daysToPay !== undefined && daysToPay > 0 && daysToPay <= balanceLeaveDays
            ? daysToPay
            : balanceLeaveDays;

    // Calculate daily wage = base salary / period working days
    const dailyWage = baseSalary / periodWorkingDays;

    // Calculate gross annual leave pay = days to pay × daily wage
    const grossAnnualLeavePay = daysToUse * dailyWage;

    // Calculate tax on base salary only (without annual leave)
    const taxWithoutLeave = calculateIncomeTax(baseSalary, tax);

    // Calculate tax on base salary + gross annual leave pay
    const taxWithLeave = calculateIncomeTax(baseSalary + grossAnnualLeavePay, tax);

    // Calculate the tax delta (additional tax due to annual leave)
    const annualLeaveTax = taxWithLeave - taxWithoutLeave;

    // Calculate net annual leave pay = gross - tax delta
    const netAnnualLeavePay = grossAnnualLeavePay - annualLeaveTax;

    return {
        grossAnnualLeavePay: Math.round(grossAnnualLeavePay * 100) / 100,
        annualLeaveTax: Math.round(annualLeaveTax * 100) / 100,
        netAnnualLeavePay: Math.round(netAnnualLeavePay * 100) / 100,
        dailyWage: Math.round(dailyWage * 100) / 100,
        balanceLeaveDays,
        daysToPay: daysToUse,
    };
}
