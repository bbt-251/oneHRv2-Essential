export interface LogInfo {
    title: string;
    description: string;
    module: string;
}

export const LEAVE_MANAGEMENT_LOG_MESSAGES = {
    // Leave Types
    LEAVE_TYPE_CREATED: (data: {
        name: string;
        authorizedDays: number;
        acronym: string;
        active: "Yes" | "No";
    }): LogInfo => ({
        title: "Leave Type Created",
        description: `Created new leave type with name: '${data.name}', authorized days: ${data.authorizedDays}, acronym: '${data.acronym}', active: '${data.active}'`,
        module: "Leave Management",
    }),

    LEAVE_TYPE_UPDATED: (data: {
        id: string;
        name?: string;
        authorizedDays?: number;
        acronym?: string;
        active?: "Yes" | "No";
    }): LogInfo => ({
        title: "Leave Type Updated",
        description: `Updated leave type for ID: ${data.id}${data.name ? `, name: '${data.name}'` : ""}${data.authorizedDays !== undefined ? `, authorized days: ${data.authorizedDays}` : ""}${data.acronym ? `, acronym: '${data.acronym}'` : ""}${data.active ? `, active: '${data.active}'` : ""}`,
        module: "Leave Management",
    }),

    LEAVE_TYPE_DELETED: (id: string): LogInfo => ({
        title: "Leave Type Deleted",
        description: `Deleted leave type with ID: ${id}`,
        module: "Leave Management",
    }),

    // Backdate Capabilities
    BACKDATE_CAPABILITIES_UPDATED: (data: { allowBackdatedRequests: boolean }): LogInfo => ({
        title: "Backdate Capabilities Updated",
        description: `Updated backdate capabilities configuration to allow backdated requests: ${data.allowBackdatedRequests}`,
        module: "Leave Management",
    }),

    // Eligible Leave Days Configuration
    ELIGIBLE_LEAVE_DAYS_UPDATED: (data: {
        numberOfYears: number;
        numberOfDays: number;
    }): LogInfo => ({
        title: "Eligible Leave Days Configuration Updated",
        description: `Updated eligible leave days configuration to ${data.numberOfDays} days for ${data.numberOfYears} years of service`,
        module: "Leave Management",
    }),

    // Accrual Configuration
    ACCRUAL_CONFIGURATION_UPDATED: (data: {
        limitUnusedDays: number;
        limitMonths: number;
    }): LogInfo => ({
        title: "Accrual Configuration Updated",
        description: `Updated accrual configuration with limit unused days: ${data.limitUnusedDays}, limit months: ${data.limitMonths}`,
        module: "Leave Management",
    }),
};
