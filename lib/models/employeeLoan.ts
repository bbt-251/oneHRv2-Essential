export interface EmployeeLoanModel {
    id: string;
    timestamp: string;
    employeeUid: string;
    loanType: string;
    loanAmount: number;
    loanTotalAmount: number;
    duration: number; // in months
    monthlyRepaymentAmount: number;
    loanRepaymentStartMonth: string;
    loanRepaymentEndMonth: string;
    loanStatus: "Ongoing" | "Terminated";
    months: LoanByMonth[];
}

export interface LoanByMonth {
    id: string;
    date: string;
    amount: number;
    deductFromSalary: number;
    confirmed: boolean;
    comment: string | null;
}

export interface ExtendedEmployeeLoan extends EmployeeLoanModel {
    employeeName: string;
    paidAmount: number;
    remainingAmount: number;
}
