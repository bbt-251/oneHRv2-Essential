import { ImportField } from "../shared/validation-engine";

/**
 * Balance Leave Days import field definitions
 * Contains fields for adjusting employee leave balances
 */
export const BALANCE_LEAVE_DAYS_FIELDS: ImportField[] = [
    { key: "employeeID", label: "Employee ID", required: true, type: "text" },
    { key: "balanceLeaveDays", label: "Balance Leave Days", required: true, type: "number" },
    { key: "accrualLeaveDays", label: "Accrual Leave Days", required: false, type: "number" },
];

/**
 * Gets field definitions for balance leave days import type
 */
export function getBalanceLeaveDaysFields(): ImportField[] {
    return BALANCE_LEAVE_DAYS_FIELDS;
}
