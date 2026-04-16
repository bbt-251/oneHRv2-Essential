export interface LogInfo {
    title: string;
    description: string;
    module: string;
}

export const MANAGER_SWAP_LOG_MESSAGES = {
    CREATED: (currentManager: string, newManager: string): LogInfo => ({
        title: "Manager Swap Created",
        description: `Swapped reportees from ${currentManager} to ${newManager}`,
        module: "Manager Swap",
    }),
    UPDATED: (currentManager: string, newManager: string): LogInfo => ({
        title: "Manager Swap Updated",
        description: `Updated manager swap from ${currentManager} to ${newManager}`,
        module: "Manager Swap",
    }),
    DELETED: (currentManager: string, newManager: string): LogInfo => ({
        title: "Manager Swap Deleted",
        description: `Deleted manager swap from ${currentManager} to ${newManager}`,
        module: "Manager Swap",
    }),
};
