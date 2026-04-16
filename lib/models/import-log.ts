import { EmployeeModel } from "./employee";

export interface ImportLogModel {
    id: string;
    timestamp: string;
    type: string; // "Employee" | "Balance Leave Days"
    actorName: string; // Name of logged in user
    actorID: string; // UID of logged in user
    status: "success" | "failure";
    importedData: ImportDataModel;
}

export interface ImportDataModel {
    totalRows: number;
    successfulRows: number;
    failedRows: number;
    failureDetails: ImportFailureDetail[]; // Only present when there are failures
    importedRecords: ImportedRecord[]; // List of successfully imported records with their details
    summary: string; // Human readable summary
}

export interface ImportedRecord {
    rowNumber: number;
    rowData: Record<string, any>;
    importedData: any; // The processed imported data (can be EmployeeModel, DepartmentSettingsModel, etc.)
}

export interface ImportFailureDetail {
    rowNumber: number;
    rowData: Record<string, any>;
    errorMessage: string;
    fieldErrors: Record<string, string>;
}
