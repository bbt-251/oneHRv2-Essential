import { useMemo } from "react";
import { useData } from "@/context/app-data-context";
import dayjs from "dayjs";
import { EmployeeModel } from "@/lib/models/employee";

interface PaymentEntry {
    id: string;
    timestamp: string;
    employees: EmployeeModel[];
    paymentTypeName: string;
    paymentAmount: number;
    monthlyAmounts: Record<string, number>;
}

interface DeductionEntry {
    timestamp: string;
    id: string;
    employees: EmployeeModel[];
    deductionTypeName: string;
    deductionAmount: number;
    monthlyAmounts: Record<string, number>;
}

export function usePaymentDeductionData() {
    const { compensations, employees } = useData();

    const { paymentsData, deductionsData } = useMemo(() => {
        const payments: PaymentEntry[] = [];
        const deductions: DeductionEntry[] = [];

        compensations.forEach(c => {
            if (c.type === "Payment") {
                payments.push({
                    id: c.id,
                    timestamp: c.timestamp,
                    employees: employees.filter(e => c.employees.includes(e.uid)),
                    paymentTypeName: c.paymentType ?? "",
                    paymentAmount: highestMode(c.paymentAmount ?? []) ?? 0,
                    monthlyAmounts: arrayToMonthObject(c.paymentAmount ?? []),
                });
            } else if (c.type == "Deduction") {
                deductions.push({
                    timestamp: c.timestamp,
                    id: c.id,
                    employees: employees.filter(e => c.employees.includes(e.uid)),
                    deductionTypeName: c.deduction ?? "",
                    deductionAmount: highestMode(c.deductionAmount ?? []) ?? 0,
                    monthlyAmounts: arrayToMonthObject(c.deductionAmount ?? []),
                });
            }
        });

        return { paymentsData: payments, deductionsData: deductions };
    }, [compensations, employees]);

    return { paymentsData, deductionsData };
}

function highestMode(arr: number[]): number | null {
    if (arr.length === 0) return null;

    const freqMap = new Map<number, number>();

    // Count occurrences
    for (const num of arr) {
        freqMap.set(num, (freqMap.get(num) || 0) + 1);
    }

    let maxFreq = 0;
    let result: number | null = null;

    // Find highest mode
    for (const [num, freq] of freqMap) {
        if (freq > maxFreq || (freq === maxFreq && (result === null || num > result))) {
            maxFreq = freq;
            result = num;
        }
    }

    return result;
}

function arrayToMonthObject<T>(arr: T[]): Record<string, T | number> {
    const months: Record<string, T | number> = {};

    for (let i = 0; i < 12; i++) {
        // Get full month name (January, February, ...)
        const monthName = dayjs().month(i).format("MMMM");
        months[monthName] = arr[i] ?? 0; // handle shorter arrays
    }

    return months;
}
