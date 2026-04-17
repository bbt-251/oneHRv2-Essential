import { ManualAction, ManualRole } from "@/lib/backend/manual/types";

export interface PolicyRule {
  role: ManualRole;
  resource: string;
  actions: ManualAction[];
  scope: "tenant" | "self" | "global";
}

// Phase 2.9 baseline translation from firebase.rules.txt grouped role/action intent.
export const policyMatrix: PolicyRule[] = [
    {
        role: "HR Manager",
        resource: "employee",
        actions: ["create", "read", "update", "delete"],
        scope: "tenant",
    },
    {
        role: "HR Manager",
        resource: "attendance",
        actions: ["create", "read", "update", "delete"],
        scope: "tenant",
    },
    {
        role: "HR Manager",
        resource: "leave",
        actions: ["create", "read", "update", "delete"],
        scope: "tenant",
    },
    {
        role: "HR Manager",
        resource: "storage",
        actions: ["create", "read", "update", "delete"],
        scope: "tenant",
    },
    {
        role: "Manager",
        resource: "employee",
        actions: ["read", "update"],
        scope: "tenant",
    },
    {
        role: "Manager",
        resource: "attendance",
        actions: ["read", "update"],
        scope: "tenant",
    },
    {
        role: "Manager",
        resource: "leave",
        actions: ["read", "update"],
        scope: "tenant",
    },
    {
        role: "Manager",
        resource: "storage",
        actions: ["create", "read"],
        scope: "tenant",
    },
    {
        role: "Payroll Officer",
        resource: "payroll",
        actions: ["create", "read", "update"],
        scope: "tenant",
    },
    {
        role: "Payroll Officer",
        resource: "attendance",
        actions: ["read"],
        scope: "tenant",
    },
    {
        role: "Employee",
        resource: "employee",
        actions: ["read", "update"],
        scope: "self",
    },
    {
        role: "Employee",
        resource: "attendance",
        actions: ["read"],
        scope: "self",
    },
    {
        role: "Employee",
        resource: "leave",
        actions: ["create", "read"],
        scope: "self",
    },
    {
        role: "Employee",
        resource: "storage",
        actions: ["create", "read"],
        scope: "self",
    },
];
