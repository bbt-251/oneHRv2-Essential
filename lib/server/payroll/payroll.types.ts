import { EmployeeCompensationModel } from "@/lib/models/employeeCompensation";
import { EmployeeLoanModel } from "@/lib/models/employeeLoan";
import PayrollPDFSettingsModel from "@/lib/models/payrollPDFSettings";

export type PayrollResource = "compensations" | "loans" | "settings";

export type CompensationListPayload = {
    compensations: EmployeeCompensationModel[];
};

export type LoanListPayload = {
    employeeLoans: EmployeeLoanModel[];
};

export type PayrollSettingsPayload = {
    payrollSettings: PayrollPDFSettingsModel[];
};

export type CompensationRecordPayload = {
    compensation: EmployeeCompensationModel | null;
};

export type LoanRecordPayload = {
    loan: EmployeeLoanModel | null;
};

export type PayrollSettingsRecordPayload = {
    payrollSettings: PayrollPDFSettingsModel[];
};
