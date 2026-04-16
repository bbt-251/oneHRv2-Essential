import { TaxModel } from "@/lib/models/hr-settings";

export default function calculateIncomeTax(gPay: number, taxData: TaxModel): number {
    let tax = 0;
    let remainingIncome = gPay;

    // Sort tax rates by upper bound in ascending order
    const sortedTaxRates = taxData?.taxRates?.sort((a, b) => a.upperBound - b.upperBound) ?? [];

    // Calculate tax for each bracket
    for (let i = 0; i < sortedTaxRates?.length; i++) {
        const rate = sortedTaxRates[i];
        const previousUpperBound = i === 0 ? 0 : sortedTaxRates[i - 1].upperBound;
        const taxableIncome = Math.min(remainingIncome, rate.upperBound - previousUpperBound);

        tax += (taxableIncome * rate.percentage) / 100;
        remainingIncome -= taxableIncome;

        if (remainingIncome <= 0) {
            break;
        }
    }

    // Apply upper tax rate for the remaining income
    if (remainingIncome > 0) {
        tax += (remainingIncome * (taxData?.upperTaxRate ?? 0)) / 100;
    }

    // Rounding to two decimal places
    return Math.round(tax * 100) / 100;
}
