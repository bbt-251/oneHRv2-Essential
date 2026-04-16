import { TaxModel } from "@/lib/models/hr-settings";
import { EmployeeModel } from "@/lib/models/employee";
import calculateIncomeTax from "./payroll/calculateIncomeTax";
import dayjs from "dayjs";

/**
 * Validates if an employee is eligible for Severance Pay.
 *
 * Eligibility criteria:
 * 1. Contract starting date must be filled
 * 2. Contract termination date must be filled
 * 3. Must have at least 5 years of service
 *
 * @param employee - The employee model to check
 * @returns Object with isEligible boolean and error message if not eligible
 */
export function validateSeverancePayEligibility(employee: EmployeeModel): {
    isEligible: boolean;
    errorMessage: string;
    yearsOfService: number;
} {
    // Check if contract starting date is filled
    if (!employee.contractStartingDate || employee.contractStartingDate === "") {
        return {
            isEligible: false,
            errorMessage: `${employee.firstName} ${employee.surname}: Contract start date is required for Severance Pay`,
            yearsOfService: 0,
        };
    }

    // Check if contract termination date is filled
    if (!employee.contractTerminationDate || employee.contractTerminationDate === "") {
        return {
            isEligible: false,
            errorMessage: `${employee.firstName} ${employee.surname}: Contract termination date is required for Severance Pay`,
            yearsOfService: 0,
        };
    }

    // Calculate years of service
    const startDate = dayjs(employee.contractStartingDate);
    const endDate = dayjs(employee.contractTerminationDate);

    // Calculate the duration in years (including partial years)
    const diffInDays = endDate.diff(startDate, "day");
    const yearsOfService = diffInDays / 365;

    // Check if employee has at least 5 years of service
    if (yearsOfService < 5) {
        return {
            isEligible: false,
            errorMessage: `${employee.firstName} ${employee.surname}: Must have at least 5 years of service (current: ${yearsOfService.toFixed(2)} years)`,
            yearsOfService: Number(yearsOfService.toFixed(2)),
        };
    }

    return {
        isEligible: true,
        errorMessage: "",
        yearsOfService: Number(yearsOfService.toFixed(2)),
    };
}

/**
 * Validates multiple employees for Severance Pay eligibility.
 *
 * @param employees - Array of employee models to check
 * @returns Object with overall validity, list of eligible employees, list of errors
 */
export function validateMultipleSeverancePayEligibility(employees: EmployeeModel[]): {
    isValid: boolean;
    eligibleEmployees: EmployeeModel[];
    errors: string[];
    employeeYearsMap: Map<string, number>;
} {
    const eligibleEmployees: EmployeeModel[] = [];
    const errors: string[] = [];
    const employeeYearsMap = new Map<string, number>();

    for (const employee of employees) {
        const validation = validateSeverancePayEligibility(employee);

        if (validation.isEligible) {
            eligibleEmployees.push(employee);
            employeeYearsMap.set(employee.id, validation.yearsOfService);
        } else {
            errors.push(validation.errorMessage);
        }
    }

    return {
        isValid: errors.length === 0,
        eligibleEmployees,
        errors,
        employeeYearsMap,
    };
}

/**
 * The function calculates severance pay and tax based on base salary, years of service, and tax model.
 * @param {number} baseSalary - The `baseSalary` parameter represents the employee's base salary. It is
 * a numerical value that indicates the amount of money the employee earns before any deductions or
 * bonuses are applied. This value is used as a basis for calculating severance pay in the function
 * `calculateSeverancePay`.
 * @param {number} yearsOfService - The `yearsOfService` parameter in the `calculateSeverancePay`
 * function represents the number of years an employee has worked for the company. It is used to
 * calculate the severance pay based on the employee's base salary and years of service. If the
 * `yearsOfService` is less
 * @param {TaxModel} tax - The `tax` parameter in the `calculateSeverancePay` function is of type
 * `TaxModel`, which likely contains information about tax rates or rules used for calculating income
 * tax. This information is passed to the `calculateIncomeTax` function to determine the tax amount on
 * the severance pay based
 * @returns The function `calculateSeverancePay` returns an object with three properties:
 * `severancePay`, `severanceTax`, and `yearsOfService`. The `severancePay` property represents the
 * calculated severance pay amount, the `severanceTax` property represents the calculated tax on the
 * severance pay, and the `yearsOfService` property represents the input years
 */
export function calculateSeverancePay(
    baseSalary: number,
    yearsOfService: number,
    tax: TaxModel,
): { severancePay: number; severanceTax: number; yearsOfService: number } {
    if (baseSalary <= 0 || yearsOfService <= 0) {
        return {
            severancePay: 0,
            severanceTax: 0,
            yearsOfService: 0,
        };
    }

    yearsOfService = Number(yearsOfService.toFixed(0));

    const third = baseSalary / 3;
    const additionalYears = yearsOfService - 1;

    // TOTAL SEVERANCE
    const totalSeverance = baseSalary + additionalYears * third;

    let severanceTax = 0;

    // Group 1 → first full salary
    severanceTax += calculateIncomeTax(baseSalary, tax);

    // Group 2 → up to 3 thirds (max = one salary)
    const groupTwoThirds = Math.min(3, additionalYears);
    const groupTwoAmount = groupTwoThirds * third;

    if (groupTwoAmount > 0) {
        severanceTax += calculateIncomeTax(groupTwoAmount, tax);
    }

    // Group 3 → remaining thirds
    const remainingThirds = additionalYears - groupTwoThirds;

    if (remainingThirds > 0) {
        const groupThreeAmount = remainingThirds * third;
        severanceTax += calculateIncomeTax(groupThreeAmount, tax);
    }

    const netSeverance = totalSeverance - severanceTax;

    return {
        severancePay: Math.round(netSeverance * 100) / 100,
        severanceTax: Math.round(severanceTax * 100) / 100,
        yearsOfService,
    };
}
