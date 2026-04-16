export interface LogInfo {
    title: string;
    description: string;
    module: string;
}

export const PAYROLL_CONFIGURATION_LOG_MESSAGES = {
    // Payment Types
    PAYMENT_TYPE_CREATED: (data: { name: string; active: boolean }): LogInfo => ({
        title: "Payment Type Created",
        description: `Created new payment type with name: '${data.name}', active: '${data.active}'`,
        module: "Payroll Configuration",
    }),

    PAYMENT_TYPE_UPDATED: (data: { id: string; name?: string; active?: boolean }): LogInfo => ({
        title: "Payment Type Updated",
        description: `Updated payment type for ID: ${data.id}${data.name ? `, name: '${data.name}'` : ""}${data.active !== undefined ? `, active: '${data.active}'` : ""}`,
        module: "Payroll Configuration",
    }),

    PAYMENT_TYPE_DELETED: (id: string): LogInfo => ({
        title: "Payment Type Deleted",
        description: `Deleted payment type with ID: ${id}`,
        module: "Payroll Configuration",
    }),

    // Deduction Types
    DEDUCTION_TYPE_CREATED: (data: { name: string; active: boolean }): LogInfo => ({
        title: "Deduction Type Created",
        description: `Created new deduction type with name: '${data.name}', active: '${data.active}'`,
        module: "Payroll Configuration",
    }),

    DEDUCTION_TYPE_UPDATED: (data: { id: string; name?: string; active?: boolean }): LogInfo => ({
        title: "Deduction Type Updated",
        description: `Updated deduction type for ID: ${data.id}${data.name ? `, name: '${data.name}'` : ""}${data.active !== undefined ? `, active: '${data.active}'` : ""}`,
        module: "Payroll Configuration",
    }),

    DEDUCTION_TYPE_DELETED: (id: string): LogInfo => ({
        title: "Deduction Type Deleted",
        description: `Deleted deduction type with ID: ${id}`,
        module: "Payroll Configuration",
    }),

    // Loan Types
    LOAN_TYPE_CREATED: (data: { name: string; active: boolean }): LogInfo => ({
        title: "Loan Type Created",
        description: `Created new loan type with name: '${data.name}', active: '${data.active}'`,
        module: "Payroll Configuration",
    }),

    LOAN_TYPE_UPDATED: (data: { id: string; name?: string; active?: boolean }): LogInfo => ({
        title: "Loan Type Updated",
        description: `Updated loan type for ID: ${data.id}${data.name ? `, name: '${data.name}'` : ""}${data.active !== undefined ? `, active: '${data.active}'` : ""}`,
        module: "Payroll Configuration",
    }),

    LOAN_TYPE_DELETED: (id: string): LogInfo => ({
        title: "Loan Type Deleted",
        description: `Deleted loan type with ID: ${id}`,
        module: "Payroll Configuration",
    }),

    // Tax Configuration
    TAX_CONFIGURATION_UPDATED: (data: {
        name: string;
        rate: number;
        active: boolean;
    }): LogInfo => ({
        title: "Tax Configuration Updated",
        description: `Updated tax configuration with name: '${data.name}', rate: ${data.rate}%, active: '${data.active}'`,
        module: "Payroll Configuration",
    }),

    // Pension
    PENSION_UPDATED: (data: { name: string; rate: number; active: boolean }): LogInfo => ({
        title: "Pension Configuration Updated",
        description: `Updated pension configuration with name: '${data.name}', rate: ${data.rate}%, active: '${data.active}'`,
        module: "Payroll Configuration",
    }),

    // Currency
    CURRENCY_UPDATED: (data: {
        name: string;
        code: string;
        symbol: string;
        active: boolean;
    }): LogInfo => ({
        title: "Currency Configuration Updated",
        description: `Updated currency configuration with name: '${data.name}', code: '${data.code}', symbol: '${data.symbol}', active: '${data.active}'`,
        module: "Payroll Configuration",
    }),
};
