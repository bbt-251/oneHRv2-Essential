import { EmployeeModel } from "./employee";

export interface FormStep {
    id: number;
    title: string;
    completed: boolean;
}

export interface ColumnConfig {
    key: keyof EmployeeModel;
    label: string;
    visible: boolean;
}

export interface EmployeeDocument {
    id: string;
    uid: string;
    name: string;
    type: string;
    uploadDate: string;
    size: string;
    uploadedBy: string;
    fileUrl?: string;
    filePath?: string;
}

export interface EmployeeLogEntry {
    id: string;
    employeeId: string;
    action: string;
    description: string;
    timestamp: string;
    performedBy: string;
    category: "login" | "profile" | "document" | "system";
    fieldChanges?: {
        field: string;
        previousValue: string;
        newValue: string;
    }[];
}

export interface CompensationAllowance {
    id: string;
    employeeId: string;
    compensationId: string;
    paymentType: string;
    paymentTypeName: string;
    paymentAmount: string;
    currency: string;
    frequency: string;
    startDate: string;
    endDate?: string;
    status: "active" | "inactive";
    timestamp: string;
}

export interface CompensationDeduction {
    id: string;
    employeeId: string;
    compensationId: string;
    deductionName: string;
    deductionType: string;
    deductionAmount: string;
    currency: string;
    frequency: string;
    startDate: string;
    endDate?: string;
    status: "active" | "inactive";
    timestamp: string;
}

export interface DisciplinaryAction {
    id: string;
    employeeId: string;
    reportedDateTime: string;
    violationDateTime: string;
    violationLocation: string;
    occurrenceLevel: "first" | "second" | "third" | "repeated";
    stage: "investigation" | "hearing" | "decision" | "appeal" | "closed";
    status: "open" | "in-progress" | "resolved" | "dismissed";
    violationType: string;
    description: string;
    reportedBy: string;
    investigatedBy?: string;
    actionTaken?: string;
    documents?: string[];
}

export interface Dependent {
    id: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    relationship: "spouse" | "child" | "parent" | "sibling" | "other";
    birthDate: string;
    gender: string;
    phoneNumber?: string;
    address?: string;
    emergencyContact: boolean;
    healthInsurance: boolean;
    documents?: string[];
}
