export const APP_DATA_RESOURCES = [
    "employees",
    "leaveManagements",
    "attendances",
    "requestModifications",
    "overtimeRequests",
    "attendanceLogic",
    "flexibilityParameter",
    "compensations",
    "employeeLoans",
    "dependents",
    "notifications",
    "projects",
    "companyInfo",
    "leaveSettings",
    "payrollSettings",
    "departmentSettings",
    "sectionSettings",
    "notificationTypes",
    "locations",
    "maritalStatuses",
    "contractTypes",
    "contractHours",
    "reasonOfLeaving",
    "probationDays",
    "salaryScales",
    "leaveTypes",
    "eligibleLeaveDays",
    "backdateCapabilities",
    "accrualConfigurations",
    "holidays",
    "shiftHours",
    "shiftTypes",
    "overtimeTypes",
    "grades",
    "positions",
    "levelOfEducations",
    "yearsOfExperiences",
    "announcementTypes",
    "paymentTypes",
    "deductionTypes",
    "loanTypes",
    "taxes",
    "currencies",
    "pension",
    "headerDocuments",
    "footerDocuments",
    "signatureDocuments",
    "stampDocuments",
    "initialDocuments",
] as const;

export type AppDataResource = (typeof APP_DATA_RESOURCES)[number];

const shellResources: readonly AppDataResource[] = [
    "employees",
    "attendanceLogic",
    "notifications",
    "companyInfo",
    "departmentSettings",
    "positions",
];

const employeeAttendanceResources: readonly AppDataResource[] = [
    ...shellResources,
    "attendances",
    "leaveManagements",
    "requestModifications",
    "overtimeRequests",
    "projects",
    "flexibilityParameter",
    "shiftTypes",
    "shiftHours",
    "holidays",
];

const employeeLeaveResources: readonly AppDataResource[] = [
    ...shellResources,
    "leaveManagements",
    "leaveSettings",
    "leaveTypes",
    "eligibleLeaveDays",
    "backdateCapabilities",
    "accrualConfigurations",
    "holidays",
];

const dashboardResources: readonly AppDataResource[] = [
    ...shellResources,
    "attendances",
    "leaveManagements",
    "holidays",
    "accrualConfigurations",
];

const managerDirectoryResources: readonly AppDataResource[] = [
    ...shellResources,
    "leaveManagements",
];

const overtimeApprovalResources: readonly AppDataResource[] = [
    ...shellResources,
    "overtimeRequests",
    "overtimeTypes",
];

const hrAttendanceResources: readonly AppDataResource[] = [
    ...shellResources,
    "attendances",
    "requestModifications",
    "overtimeRequests",
    "overtimeTypes",
    "leaveManagements",
];

const hrLeaveResources: readonly AppDataResource[] = [
    ...shellResources,
    "leaveManagements",
    "leaveSettings",
    "leaveTypes",
    "eligibleLeaveDays",
    "backdateCapabilities",
    "accrualConfigurations",
    "holidays",
];

const hrEmployeeResources: readonly AppDataResource[] = [
    ...shellResources,
    "dependents",
    "compensations",
    "employeeLoans",
    "locations",
    "maritalStatuses",
    "contractTypes",
    "contractHours",
    "reasonOfLeaving",
    "probationDays",
    "salaryScales",
    "grades",
    "levelOfEducations",
    "yearsOfExperiences",
    "paymentTypes",
    "deductionTypes",
    "loanTypes",
    "taxes",
    "currencies",
    "pension",
];

const hrCompensationResources: readonly AppDataResource[] = [
    ...shellResources,
    "compensations",
    "employeeLoans",
    "overtimeRequests",
    "leaveManagements",
    "paymentTypes",
    "deductionTypes",
    "loanTypes",
    "taxes",
    "currencies",
    "pension",
    "overtimeTypes",
    "shiftTypes",
    "holidays",
    "headerDocuments",
    "footerDocuments",
    "signatureDocuments",
    "stampDocuments",
];

const hrCoreSettingsResources: readonly AppDataResource[] = [
    ...shellResources,
    "sectionSettings",
    "locations",
    "maritalStatuses",
    "contractTypes",
    "contractHours",
    "reasonOfLeaving",
    "probationDays",
    "salaryScales",
    "grades",
    "positions",
    "levelOfEducations",
    "yearsOfExperiences",
];

const hrModuleAttendanceResources: readonly AppDataResource[] = [
    ...shellResources,
    "attendanceLogic",
    "flexibilityParameter",
    "shiftHours",
    "shiftTypes",
    "overtimeTypes",
    "holidays",
];

const hrModuleLeaveResources: readonly AppDataResource[] = [
    ...shellResources,
    "leaveSettings",
    "leaveTypes",
    "eligibleLeaveDays",
    "backdateCapabilities",
    "accrualConfigurations",
    "holidays",
    "announcementTypes",
];

const hrModulePayrollResources: readonly AppDataResource[] = [
    ...shellResources,
    "payrollSettings",
    "paymentTypes",
    "deductionTypes",
    "loanTypes",
    "taxes",
    "currencies",
    "pension",
    "headerDocuments",
    "footerDocuments",
    "signatureDocuments",
    "stampDocuments",
    "initialDocuments",
];

const routeResourceRules: ReadonlyArray<{
    prefix: string;
    resources: readonly AppDataResource[];
}> = [
    { prefix: "/dashboard", resources: dashboardResources },
    { prefix: "/attendance-management", resources: employeeAttendanceResources },
    { prefix: "/leave-management", resources: employeeLeaveResources },
    { prefix: "/manager/reportees/directory", resources: managerDirectoryResources },
    { prefix: "/overtime_requests", resources: overtimeApprovalResources },
    { prefix: "/hr/attendance-management", resources: hrAttendanceResources },
    { prefix: "/hr/leave-management", resources: hrLeaveResources },
    { prefix: "/hr/employees", resources: hrEmployeeResources },
    { prefix: "/hr/compensation-benefits", resources: hrCompensationResources },
    { prefix: "/hr/payroll", resources: hrCompensationResources },
    { prefix: "/hr/payment-deduction", resources: hrCompensationResources },
    { prefix: "/hr/employee-loan", resources: hrCompensationResources },
    { prefix: "/hr/core-settings", resources: hrCoreSettingsResources },
    { prefix: "/hr/module-settings/attendance-management", resources: hrModuleAttendanceResources },
    { prefix: "/hr/module-settings/leave-management", resources: hrModuleLeaveResources },
    { prefix: "/hr/module-settings/payroll-configuration", resources: hrModulePayrollResources },
];

export function getResourcesForPath(pathname: string): AppDataResource[] {
    const matchedRule = routeResourceRules.find(rule => pathname.startsWith(rule.prefix));
    const resources = matchedRule?.resources ?? shellResources;

    return Array.from(new Set(resources));
}
