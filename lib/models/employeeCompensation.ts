export interface EmployeeCompensationModel {
    id: string;
    timestamp: string;
    employees: string[];
    type: "Payment" | "Deduction";

    //payments
    paymentType: string | null;
    paymentAmount: number[] | null; // amount per month

    //deductions
    deduction: string | null;
    deductionType: "Percentage" | "Value" | null;
    deductionAmount: number[] | null; // amount per month
}
