import { useEffect, useState } from "react";
import { useFirestore } from "@/context/firestore-context";
import dayjs from "dayjs";

interface PaymentEntry {
    id: string;
    timestamp: string;
    employees: any[]; // EmployeeModel[]
    paymentTypeName: string;
    paymentAmount: number;
    monthlyAmounts: { [month: string]: number };
}

interface DeductionEntry {
    timestamp: string;
    id: string;
    employees: any[]; // Employee[]
    deductionTypeName: string;
    deductionAmount: number;
    monthlyAmounts: { [month: string]: number };
}

export function usePaymentDeductionData() {
    const { compensations, employees } = useFirestore();
    const [paymentsData, setPaymentsData] = useState<PaymentEntry[]>([]);
    const [deductionsData, setDeductionsData] = useState<DeductionEntry[]>([]);

    useEffect(() => {
        const payments: PaymentEntry[] = [];
        const deductions: DeductionEntry[] = [];

        compensations.map(c => {
            if (c.type == "Payment") {
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

        setPaymentsData(payments);
        setDeductionsData(deductions);
    }, [compensations, employees]);

    return { paymentsData, setPaymentsData, deductionsData, setDeductionsData };
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

function monthObjectToArray<T>(obj: Record<string, T | number>): (T | number)[] {
    const result: (T | number)[] = [];

    for (let i = 0; i < 12; i++) {
        const monthName = dayjs().month(i).format("MMMM");
        result.push(obj[monthName] ?? 0);
    }

    return result;
}
