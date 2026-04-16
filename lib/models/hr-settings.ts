export interface TMCategory {
    id: string;
    timestamp: string;
    name: string;
    active: "Yes" | "No";
    subcategory: TMCategory[]; // Add this line
}

export interface TMLengthModel {
    id: string;
    timestamp: string;
    name: string;
    active: "Yes" | "No";
}

export interface TMComplexityModel {
    id: string;
    timestamp: string;
    name: string;
    active: "Yes" | "No";
}

export interface PaymentTypeModel {
    id: string;
    paymentName: string;
    paymentType: string;
    taxabilityThresholdType: "N/A" | "Percentage" | "Value" | "PercentageWithValue";
    taxabilityThresholdAmount: number;
    taxabilityThresholdValue?: number;
    active: boolean;
}

export interface DeductionTypeModel {
    id: string;
    deductionName: string;
    active: boolean;
}

export interface LoanTypeModel {
    id: string;
    timestamp: string;
    loanName: string;
    loanInterestRate: number;
    marketInterestRate: number;
    active: boolean;
}

export interface TaxPercentageModel {
    upperBound: number;
    percentage: number;
}

export interface TaxModel {
    id: string;
    timestamp: string;
    taxName: string;
    taxRates: TaxPercentageModel[];
    upperTaxRate: number;
    active: boolean;
}

export interface CurrencyModel {
    id: string;
    timestamp: string;
    name: string;
    exchangeRate: number;
    active: boolean;
}

export interface PensionModel {
    id: string;
    employerPensionType: "Percentage" | "Fixed Amount";
    employerPension: number;
    employeePensionType: "Percentage" | "Fixed Amount";
    employeePension: number;
}
