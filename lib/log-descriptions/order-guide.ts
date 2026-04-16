export interface LogInfo {
    title: string;
    description: string;
    module: string;
}

export const ORDER_GUIDE_LOG_MESSAGES = {
    ORDER_GUIDE_CREATED: (orderGuideName: string): LogInfo => ({
        title: "Order Guide Created",
        description: `Created order guide "${orderGuideName}"`,
        module: "Order Guide",
    }),

    ORDER_GUIDE_UPDATED: (orderGuideName: string): LogInfo => ({
        title: "Order Guide Updated",
        description: `Updated order guide "${orderGuideName}"`,
        module: "Order Guide",
    }),

    ORDER_GUIDE_DELETED: (orderGuideName: string): LogInfo => ({
        title: "Order Guide Deleted",
        description: `Deleted order guide "${orderGuideName}"`,
        module: "Order Guide",
    }),

    ORDER_ITEM_CREATED: (itemName: string): LogInfo => ({
        title: "Order Item Created",
        description: `Created order item "${itemName}"`,
        module: "Order Guide",
    }),

    ORDER_ITEM_UPDATED: (itemName: string): LogInfo => ({
        title: "Order Item Updated",
        description: `Updated order item "${itemName}"`,
        module: "Order Guide",
    }),

    ORDER_ITEM_DELETED: (itemName: string): LogInfo => ({
        title: "Order Item Deleted",
        description: `Deleted order item "${itemName}"`,
        module: "Order Guide",
    }),

    ORDER_GUIDE_STARTED: (orderGuideName: string, employeeName: string): LogInfo => ({
        title: "Order Guide Started",
        description: `"${employeeName}" started order guide "${orderGuideName}"`,
        module: "Order Guide",
    }),

    ORDER_GUIDE_COMPLETED: (orderGuideName: string, employeeName: string): LogInfo => ({
        title: "Order Guide Completed",
        description: `"${employeeName}" completed order guide "${orderGuideName}"`,
        module: "Order Guide",
    }),

    ORDER_GUIDE_ITEM_PROGRESS: (
        orderGuideName: string,
        itemId: string,
        status: string,
        employeeName: string,
    ): LogInfo => ({
        title: "Order Guide Item Progress Updated",
        description: `"${employeeName}" marked item "${itemId}" as "${status}" in order guide "${orderGuideName}"`,
        module: "Order Guide",
    }),

    ORDER_GUIDE_MATERIAL_PROGRESS: (
        orderGuideName: string,
        materialId: string,
        status: string,
        employeeName: string,
    ): LogInfo => ({
        title: "Order Guide Material Progress Updated",
        description: `"${employeeName}" marked material "${materialId}" as "${status}" in order guide "${orderGuideName}"`,
        module: "Order Guide",
    }),

    ORDER_GUIDE_PATH_PROGRESS: (
        orderGuideName: string,
        pathId: string,
        status: string,
        employeeName: string,
    ): LogInfo => ({
        title: "Order Guide Path Progress Updated",
        description: `"${employeeName}" marked path "${pathId}" as "${status}" in order guide "${orderGuideName}"`,
        module: "Order Guide",
    }),
};
