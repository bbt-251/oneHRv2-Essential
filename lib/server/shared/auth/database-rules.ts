import { Action, Role, SessionClaims } from "@/lib/server/shared/types";
import { ManualApiError } from "@/lib/server/shared/errors";

export type DatabaseRuleScope = "tenant" | "self" | "global";

export interface DatabaseRule {
    role: Role;
    resource: string;
    actions: Action[];
    scope: DatabaseRuleScope;
}

export interface DatabaseRuleCheckInput {
    session: SessionClaims;
    resource: string;
    action: Action;
    instanceKey: string;
    resourceOwnerUid?: string;
}

export const databaseRules: DatabaseRule[] = [
    {
        role: "HR Manager",
        resource: "employees",
        actions: ["create", "read", "update", "delete"],
        scope: "tenant",
    },
    { role: "Manager", resource: "employees", actions: ["read"], scope: "tenant" },
    { role: "Payroll Officer", resource: "employees", actions: ["read"], scope: "tenant" },
    { role: "Employee", resource: "employees", actions: ["read"], scope: "self" },

    { role: "HR Manager", resource: "leaveManagements", actions: ["read"], scope: "tenant" },
    { role: "Manager", resource: "leaveManagements", actions: ["read", "update"], scope: "tenant" },
    { role: "Payroll Officer", resource: "leaveManagements", actions: ["read"], scope: "tenant" },
    { role: "Employee", resource: "leaveManagements", actions: ["create", "read"], scope: "self" },

    {
        role: "HR Manager",
        resource: "attendances",
        actions: ["create", "read", "update", "delete"],
        scope: "tenant",
    },
    { role: "Manager", resource: "attendances", actions: ["read", "update"], scope: "tenant" },
    { role: "Payroll Officer", resource: "attendances", actions: ["read"], scope: "tenant" },
    { role: "Employee", resource: "attendances", actions: ["read"], scope: "self" },

    {
        role: "HR Manager",
        resource: "overtimeRequests",
        actions: ["create", "read", "update", "delete"],
        scope: "tenant",
    },
    {
        role: "Manager",
        resource: "overtimeRequests",
        actions: ["create", "read", "update"],
        scope: "tenant",
    },
    { role: "Payroll Officer", resource: "overtimeRequests", actions: ["read"], scope: "tenant" },
    {
        role: "Employee",
        resource: "overtimeRequests",
        actions: ["create", "read", "update", "delete"],
        scope: "self",
    },

    {
        role: "HR Manager",
        resource: "attendanceLogic",
        actions: ["create", "read", "update", "delete"],
        scope: "tenant",
    },
    { role: "Employee", resource: "attendanceLogic", actions: ["read"], scope: "tenant" },

    {
        role: "HR Manager",
        resource: "flexibilityParameter",
        actions: ["create", "read", "update", "delete"],
        scope: "tenant",
    },
    { role: "Employee", resource: "flexibilityParameter", actions: ["read"], scope: "tenant" },

    {
        role: "HR Manager",
        resource: "lateComers",
        actions: ["read"],
        scope: "tenant",
    },
    { role: "Employee", resource: "lateComers", actions: ["create"], scope: "self" },

    {
        role: "HR Manager",
        resource: "compensations",
        actions: ["create", "read", "update", "delete"],
        scope: "tenant",
    },
    {
        role: "Manager",
        resource: "compensations",
        actions: ["create", "read", "update", "delete"],
        scope: "tenant",
    },
    {
        role: "Payroll Officer",
        resource: "compensations",
        actions: ["create", "read", "update", "delete"],
        scope: "tenant",
    },
    { role: "Employee", resource: "compensations", actions: ["read"], scope: "self" },

    {
        role: "HR Manager",
        resource: "employeeLoans",
        actions: ["create", "read", "update", "delete"],
        scope: "tenant",
    },
    {
        role: "Payroll Officer",
        resource: "employeeLoans",
        actions: ["create", "read", "update", "delete"],
        scope: "tenant",
    },
    { role: "Employee", resource: "employeeLoans", actions: ["read"], scope: "self" },

    {
        role: "HR Manager",
        resource: "changeRequests",
        actions: ["read", "update", "delete"],
        scope: "tenant",
    },
    { role: "Employee", resource: "changeRequests", actions: ["create", "read"], scope: "self" },
    {
        role: "HR Manager",
        resource: "requestModifications",
        actions: ["read", "update", "delete"],
        scope: "tenant",
    },
    {
        role: "Employee",
        resource: "requestModifications",
        actions: ["create", "read"],
        scope: "self",
    },

    {
        role: "HR Manager",
        resource: "notifications",
        actions: ["create", "read"],
        scope: "tenant",
    },
    {
        role: "Manager",
        resource: "notifications",
        actions: ["create", "read"],
        scope: "tenant",
    },
    {
        role: "Payroll Officer",
        resource: "notifications",
        actions: ["create", "read"],
        scope: "tenant",
    },
    {
        role: "Employee",
        resource: "notifications",
        actions: ["create", "read"],
        scope: "tenant",
    },

    {
        role: "HR Manager",
        resource: "projects",
        actions: ["read", "update"],
        scope: "tenant",
    },
    { role: "Manager", resource: "projects", actions: ["read", "update"], scope: "tenant" },
    { role: "Employee", resource: "projects", actions: ["read"], scope: "tenant" },
    { role: "Employee", resource: "projects", actions: ["update"], scope: "self" },

    {
        role: "HR Manager",
        resource: "dependents",
        actions: ["create", "read", "update", "delete"],
        scope: "tenant",
    },
    { role: "Employee", resource: "dependents", actions: ["read"], scope: "self" },

    {
        role: "HR Manager",
        resource: "companyInfo",
        actions: ["create", "read", "update"],
        scope: "tenant",
    },
    { role: "Manager", resource: "companyInfo", actions: ["read"], scope: "tenant" },
    { role: "Payroll Officer", resource: "companyInfo", actions: ["read"], scope: "tenant" },
    { role: "Employee", resource: "companyInfo", actions: ["read"], scope: "tenant" },

    {
        role: "HR Manager",
        resource: "leaveSettings",
        actions: ["create", "read", "update", "delete"],
        scope: "tenant",
    },
    { role: "Manager", resource: "leaveSettings", actions: ["read"], scope: "tenant" },
    { role: "Payroll Officer", resource: "leaveSettings", actions: ["read"], scope: "tenant" },
    { role: "Employee", resource: "leaveSettings", actions: ["read"], scope: "tenant" },

    {
        role: "HR Manager",
        resource: "payrollSettings",
        actions: ["create", "read", "update", "delete"],
        scope: "tenant",
    },
    {
        role: "Payroll Officer",
        resource: "payrollSettings",
        actions: ["create", "read", "update", "delete"],
        scope: "tenant",
    },

    {
        role: "HR Manager",
        resource: "departmentSettings",
        actions: ["create", "read", "update", "delete"],
        scope: "tenant",
    },
    { role: "Manager", resource: "departmentSettings", actions: ["read"], scope: "tenant" },
    { role: "Employee", resource: "departmentSettings", actions: ["read"], scope: "tenant" },

    {
        role: "HR Manager",
        resource: "sectionSettings",
        actions: ["create", "read", "update", "delete"],
        scope: "tenant",
    },
    { role: "Manager", resource: "sectionSettings", actions: ["read"], scope: "tenant" },
    { role: "Employee", resource: "sectionSettings", actions: ["read"], scope: "tenant" },

    {
        role: "HR Manager",
        resource: "notificationTypes",
        actions: ["create", "read", "update", "delete"],
        scope: "tenant",
    },
    { role: "Manager", resource: "notificationTypes", actions: ["read"], scope: "tenant" },
    { role: "Employee", resource: "notificationTypes", actions: ["read"], scope: "tenant" },

    {
        role: "HR Manager",
        resource: "locations",
        actions: ["create", "read", "update", "delete"],
        scope: "tenant",
    },
    { role: "Manager", resource: "locations", actions: ["read"], scope: "tenant" },
    { role: "Employee", resource: "locations", actions: ["read"], scope: "tenant" },

    {
        role: "HR Manager",
        resource: "maritalStatuses",
        actions: ["create", "read", "update", "delete"],
        scope: "tenant",
    },
    { role: "Manager", resource: "maritalStatuses", actions: ["read"], scope: "tenant" },
    { role: "Employee", resource: "maritalStatuses", actions: ["read"], scope: "tenant" },

    {
        role: "HR Manager",
        resource: "contractTypes",
        actions: ["create", "read", "update", "delete"],
        scope: "tenant",
    },
    { role: "Manager", resource: "contractTypes", actions: ["read"], scope: "tenant" },
    { role: "Employee", resource: "contractTypes", actions: ["read"], scope: "tenant" },

    {
        role: "HR Manager",
        resource: "contractHours",
        actions: ["create", "read", "update", "delete"],
        scope: "tenant",
    },
    { role: "Manager", resource: "contractHours", actions: ["read"], scope: "tenant" },
    { role: "Employee", resource: "contractHours", actions: ["read"], scope: "tenant" },

    {
        role: "HR Manager",
        resource: "reasonOfLeaving",
        actions: ["create", "read", "update", "delete"],
        scope: "tenant",
    },
    { role: "Manager", resource: "reasonOfLeaving", actions: ["read"], scope: "tenant" },
    { role: "Employee", resource: "reasonOfLeaving", actions: ["read"], scope: "tenant" },

    {
        role: "HR Manager",
        resource: "probationDays",
        actions: ["create", "read", "update", "delete"],
        scope: "tenant",
    },
    { role: "Manager", resource: "probationDays", actions: ["read"], scope: "tenant" },
    { role: "Payroll Officer", resource: "probationDays", actions: ["read"], scope: "tenant" },
    { role: "Employee", resource: "probationDays", actions: ["read"], scope: "tenant" },

    {
        role: "HR Manager",
        resource: "salaryScales",
        actions: ["create", "read", "update", "delete"],
        scope: "tenant",
    },
    { role: "Manager", resource: "salaryScales", actions: ["read"], scope: "tenant" },
    { role: "Employee", resource: "salaryScales", actions: ["read"], scope: "tenant" },

    {
        role: "HR Manager",
        resource: "leaveTypes",
        actions: ["create", "read", "update", "delete"],
        scope: "tenant",
    },
    { role: "Manager", resource: "leaveTypes", actions: ["read"], scope: "tenant" },
    { role: "Employee", resource: "leaveTypes", actions: ["read"], scope: "tenant" },

    {
        role: "HR Manager",
        resource: "eligibleLeaveDays",
        actions: ["create", "read", "update", "delete"],
        scope: "tenant",
    },
    { role: "Manager", resource: "eligibleLeaveDays", actions: ["read"], scope: "tenant" },
    { role: "Employee", resource: "eligibleLeaveDays", actions: ["read"], scope: "tenant" },

    {
        role: "HR Manager",
        resource: "backdateCapabilities",
        actions: ["create", "read", "update", "delete"],
        scope: "tenant",
    },
    { role: "Manager", resource: "backdateCapabilities", actions: ["read"], scope: "tenant" },
    { role: "Employee", resource: "backdateCapabilities", actions: ["read"], scope: "tenant" },

    {
        role: "HR Manager",
        resource: "accrualConfigurations",
        actions: ["create", "read", "update", "delete"],
        scope: "tenant",
    },
    { role: "Manager", resource: "accrualConfigurations", actions: ["read"], scope: "tenant" },
    { role: "Employee", resource: "accrualConfigurations", actions: ["read"], scope: "tenant" },

    {
        role: "HR Manager",
        resource: "holidays",
        actions: ["create", "read", "update", "delete"],
        scope: "tenant",
    },
    { role: "Manager", resource: "holidays", actions: ["read"], scope: "tenant" },
    { role: "Employee", resource: "holidays", actions: ["read"], scope: "tenant" },

    {
        role: "HR Manager",
        resource: "shiftHours",
        actions: ["create", "read", "update", "delete"],
        scope: "tenant",
    },
    { role: "Employee", resource: "shiftHours", actions: ["read"], scope: "tenant" },

    {
        role: "HR Manager",
        resource: "shiftTypes",
        actions: ["create", "read", "update", "delete"],
        scope: "tenant",
    },
    { role: "Manager", resource: "shiftTypes", actions: ["read"], scope: "tenant" },
    { role: "Employee", resource: "shiftTypes", actions: ["read"], scope: "tenant" },

    {
        role: "HR Manager",
        resource: "overtimeTypes",
        actions: ["create", "read", "update", "delete"],
        scope: "tenant",
    },
    { role: "Manager", resource: "overtimeTypes", actions: ["read"], scope: "tenant" },
    { role: "Employee", resource: "overtimeTypes", actions: ["read"], scope: "tenant" },

    {
        role: "HR Manager",
        resource: "grades",
        actions: ["create", "read", "update", "delete"],
        scope: "tenant",
    },
    { role: "Manager", resource: "grades", actions: ["read"], scope: "tenant" },
    { role: "Employee", resource: "grades", actions: ["read"], scope: "tenant" },

    {
        role: "HR Manager",
        resource: "positions",
        actions: ["create", "read", "update", "delete"],
        scope: "tenant",
    },
    { role: "Manager", resource: "positions", actions: ["read"], scope: "tenant" },
    { role: "Employee", resource: "positions", actions: ["read"], scope: "tenant" },

    {
        role: "HR Manager",
        resource: "levelOfEducations",
        actions: ["create", "read", "update", "delete"],
        scope: "tenant",
    },
    { role: "Manager", resource: "levelOfEducations", actions: ["read"], scope: "tenant" },
    { role: "Employee", resource: "levelOfEducations", actions: ["read"], scope: "tenant" },

    {
        role: "HR Manager",
        resource: "yearsOfExperiences",
        actions: ["create", "read", "update", "delete"],
        scope: "tenant",
    },
    { role: "Manager", resource: "yearsOfExperiences", actions: ["read"], scope: "tenant" },
    { role: "Employee", resource: "yearsOfExperiences", actions: ["read"], scope: "tenant" },

    {
        role: "HR Manager",
        resource: "announcementTypes",
        actions: ["create", "read", "update", "delete"],
        scope: "tenant",
    },
    { role: "Manager", resource: "announcementTypes", actions: ["read"], scope: "tenant" },
    { role: "Payroll Officer", resource: "announcementTypes", actions: ["read"], scope: "tenant" },
    { role: "Employee", resource: "announcementTypes", actions: ["read"], scope: "tenant" },

    {
        role: "HR Manager",
        resource: "paymentTypes",
        actions: ["create", "read", "update", "delete"],
        scope: "tenant",
    },
    { role: "Manager", resource: "paymentTypes", actions: ["read"], scope: "tenant" },
    { role: "Employee", resource: "paymentTypes", actions: ["read"], scope: "tenant" },

    {
        role: "HR Manager",
        resource: "deductionTypes",
        actions: ["create", "read", "update", "delete"],
        scope: "tenant",
    },
    { role: "Manager", resource: "deductionTypes", actions: ["read"], scope: "tenant" },
    { role: "Employee", resource: "deductionTypes", actions: ["read"], scope: "tenant" },

    {
        role: "HR Manager",
        resource: "loanTypes",
        actions: ["create", "read", "update", "delete"],
        scope: "tenant",
    },
    { role: "Manager", resource: "loanTypes", actions: ["read"], scope: "tenant" },
    { role: "Employee", resource: "loanTypes", actions: ["read"], scope: "tenant" },

    {
        role: "HR Manager",
        resource: "taxes",
        actions: ["create", "read", "update", "delete"],
        scope: "tenant",
    },
    { role: "Manager", resource: "taxes", actions: ["read"], scope: "tenant" },
    { role: "Payroll Officer", resource: "taxes", actions: ["read"], scope: "tenant" },
    { role: "Employee", resource: "taxes", actions: ["read"], scope: "tenant" },

    {
        role: "HR Manager",
        resource: "currencies",
        actions: ["create", "read", "update", "delete"],
        scope: "tenant",
    },
    { role: "Manager", resource: "currencies", actions: ["read"], scope: "tenant" },
    { role: "Employee", resource: "currencies", actions: ["read"], scope: "tenant" },

    {
        role: "HR Manager",
        resource: "pension",
        actions: ["create", "read", "update", "delete"],
        scope: "tenant",
    },
    { role: "Manager", resource: "pension", actions: ["read"], scope: "tenant" },
    { role: "Payroll Officer", resource: "pension", actions: ["read"], scope: "tenant" },
    { role: "Employee", resource: "pension", actions: ["read"], scope: "tenant" },

    {
        role: "HR Manager",
        resource: "externalDocuments",
        actions: ["create", "read", "update", "delete"],
        scope: "tenant",
    },
    { role: "Employee", resource: "externalDocuments", actions: ["read", "update"], scope: "self" },

    {
        role: "HR Manager",
        resource: "headerDocuments",
        actions: ["create", "read", "update", "delete"],
        scope: "tenant",
    },
    { role: "Employee", resource: "headerDocuments", actions: ["read"], scope: "tenant" },
    { role: "Employee", resource: "headerDocuments", actions: ["update"], scope: "self" },

    {
        role: "HR Manager",
        resource: "footerDocuments",
        actions: ["create", "read", "update", "delete"],
        scope: "tenant",
    },
    { role: "Employee", resource: "footerDocuments", actions: ["read"], scope: "tenant" },
    { role: "Employee", resource: "footerDocuments", actions: ["update"], scope: "self" },

    {
        role: "HR Manager",
        resource: "signatureDocuments",
        actions: ["create", "read", "update", "delete"],
        scope: "tenant",
    },
    {
        role: "Employee",
        resource: "signatureDocuments",
        actions: ["read"],
        scope: "tenant",
    },
    {
        role: "Employee",
        resource: "signatureDocuments",
        actions: ["update"],
        scope: "self",
    },

    {
        role: "HR Manager",
        resource: "stampDocuments",
        actions: ["create", "read", "update", "delete"],
        scope: "tenant",
    },
    { role: "Employee", resource: "stampDocuments", actions: ["read"], scope: "tenant" },
    { role: "Employee", resource: "stampDocuments", actions: ["update"], scope: "self" },

    {
        role: "HR Manager",
        resource: "initialDocuments",
        actions: ["create", "read", "update", "delete"],
        scope: "tenant",
    },
    { role: "Employee", resource: "initialDocuments", actions: ["read"], scope: "tenant" },
    { role: "Employee", resource: "initialDocuments", actions: ["update"], scope: "self" },

    {
        role: "HR Manager",
        resource: "storage",
        actions: ["create", "read", "update", "delete"],
        scope: "tenant",
    },
    { role: "Manager", resource: "storage", actions: ["create", "read"], scope: "tenant" },
    { role: "Employee", resource: "storage", actions: ["create", "read"], scope: "self" },
];

export const getDatabaseRules = (): DatabaseRule[] => databaseRules;

const findMatchingRules = ({
    session,
    resource,
    action,
}: Pick<DatabaseRuleCheckInput, "session" | "resource" | "action">): DatabaseRule[] =>
    databaseRules.filter(
        rule =>
            session.roles.includes(rule.role) &&
            rule.resource === resource &&
            rule.actions.includes(action),
    );

export const canAccessResource = ({
    session,
    resource,
    action,
    resourceOwnerUid,
    instanceKey: _instanceKey,
}: DatabaseRuleCheckInput): boolean => {
    const matchedRules = findMatchingRules({ session, resource, action });

    if (matchedRules.length === 0) {
        return false;
    }

    return matchedRules.some(rule => {
        if (rule.scope === "global" || rule.scope === "tenant") {
            return true;
        }

        return resourceOwnerUid === session.uid;
    });
};

export const assertCanAccess = (input: DatabaseRuleCheckInput): void => {
    if (!canAccessResource(input)) {
        throw new ManualApiError(
            403,
            "AUTHORIZATION_DENIED",
            "Insufficient permissions for requested resource/action.",
        );
    }
};

export const filterReadableDocuments = <T>(
    documents: T[],
    input: Omit<DatabaseRuleCheckInput, "action" | "resourceOwnerUid"> & {
        resource: string;
        getResourceOwnerUid?: (document: T) => string | undefined;
    },
): T[] =>
        documents.filter(document =>
            canAccessResource({
                session: input.session,
                instanceKey: input.instanceKey,
                resource: input.resource,
                action: "read",
                resourceOwnerUid: input.getResourceOwnerUid?.(document),
            }),
        );
