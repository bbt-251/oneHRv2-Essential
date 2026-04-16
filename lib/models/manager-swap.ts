export interface ManagerSwapModel {
    id: string;
    timestamp: string;
    currentManager: string; // UID reference
    replacingManager: string; // UID reference
    effectiveDate: string;
    reason: string;
    affectedEmployees: number;
    affectedEmployeeUIDs: string[]; // Array of affected employee UIDs
}
