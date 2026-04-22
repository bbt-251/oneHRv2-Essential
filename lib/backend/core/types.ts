export type Role = "HR Manager" | "Manager" | "Payroll Officer" | "Employee";

export type Action = "create" | "read" | "update" | "delete";

export interface SessionClaims {
    uid: string;
    email: string | null;
    roles: Role[];
}

export interface PolicyResourceAction {
    resource: string;
    action: Action;
}
