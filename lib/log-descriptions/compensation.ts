export interface LogInfo {
    title: string;
    description: string;
    module: string;
}

export const COMPENSATION_LOG_MESSAGES = {
    CREATED: (type: string): LogInfo => ({
        title: "Compensation Record Created",
        description: `Created new ${type.toLowerCase()} record`,
        module: "Compensation & Benefits",
    }),

    UPDATED: (type: string): LogInfo => ({
        title: "Compensation Record Updated",
        description: `Updated ${type.toLowerCase()} record`,
        module: "Compensation & Benefits",
    }),

    PAYMENT_CONFIRMED: (type: string, date: string): LogInfo => ({
        title: "Compensation Payment Confirmed",
        description: `Confirmed ${type.toLowerCase()}, of ${date} payment`,
        module: "Compensation & Benefits",
    }),

    PAYMENT_ROLLBACK: (type: string, date: string): LogInfo => ({
        title: "Compensation Payment Rollback",
        description: `Rolled back ${type.toLowerCase()}, of ${date} payment`,
        module: "Compensation & Benefits",
    }),

    DELETED: (type: string): LogInfo => ({
        title: "Compensation Record Deleted",
        description: `Deleted ${type.toLowerCase()} record`,
        module: "Compensation & Benefits",
    }),
};
