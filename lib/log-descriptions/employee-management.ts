export interface LogInfo {
    title: string;
    description: string;
    module: string;
}

export const EMPLOYEE_MANAGEMENT_LOG_MESSAGES = {
    EMPLOYEE_CREATED: (employeeName: string): LogInfo => ({
        title: "Employee Created",
        description: `Created employee record for "${employeeName}"`,
        module: "Employee Management",
    }),

    EMPLOYEE_UPDATED: (employeeName: string): LogInfo => ({
        title: "Employee Updated",
        description: `Updated employee record for "${employeeName}"`,
        module: "Employee Management",
    }),

    EMPLOYEE_DELETED: (employeeName: string): LogInfo => ({
        title: "Employee Deleted",
        description: `Deleted employee record for "${employeeName}"`,
        module: "Employee Management",
    }),

    LEAVE_REQUEST_CREATED: (employeeName: string, leaveType: string): LogInfo => ({
        title: "Leave Request Created",
        description: `Created leave request for "${employeeName}" (${leaveType})`,
        module: "Employee Management",
    }),

    LEAVE_REQUEST_UPDATED: (employeeName: string, leaveType: string): LogInfo => ({
        title: "Leave Request Updated",
        description: `Updated leave request for "${employeeName}" (${leaveType})`,
        module: "Employee Management",
    }),

    LEAVE_REQUEST_DELETED: (employeeName: string, leaveType: string): LogInfo => ({
        title: "Leave Request Deleted",
        description: `Deleted leave request for "${employeeName}" (${leaveType})`,
        module: "Employee Management",
    }),

    LEAVE_ROLLBACK_REQUESTED: (leaveType: string, employeeName: string): LogInfo => ({
        title: "Leave Rollback Requested",
        description: `"${employeeName}" requested rollback for ${leaveType} leave`,
        module: "Employee Management",
    }),

    DEPENDENT_CREATED: (
        dependentName: string,
        relationship: string,
        employeeName: string,
    ): LogInfo => ({
        title: "Dependent Created",
        description: `Dependent ${dependentName} (${relationship}) added for employee ${employeeName}`,
        module: "Employee Management",
    }),

    DEPENDENT_UPDATED: (
        dependentName: string,
        relationship: string,
        employeeName: string,
    ): LogInfo => ({
        title: "Dependent Updated",
        description: `Dependent ${dependentName} (${relationship}) updated for employee ${employeeName}`,
        module: "Employee Management",
    }),

    DEPENDENT_DELETED: (
        dependentName: string,
        relationship: string,
        employeeName: string,
    ): LogInfo => ({
        title: "Dependent Deleted",
        description: `Dependent ${dependentName} (${relationship}) removed for employee ${employeeName}`,
        module: "Employee Management",
    }),
};
