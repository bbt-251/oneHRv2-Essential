export type ManualRole =
  | "HR Manager"
  | "Manager"
  | "Payroll Officer"
  | "Employee";

export type ManualAction = "create" | "read" | "update" | "delete";

export interface ManualSessionClaims {
  uid: string;
  email: string | null;
  roles: ManualRole[];
  tenantId: string;
}

export interface PolicyResourceAction {
  resource: string;
  action: ManualAction;
}
