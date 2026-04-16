export interface LogInfo {
    title: string;
    description: string;
    module: string;
}

export const MARITAL_STATUS_LOG_MESSAGES = {
    CREATED: (data: { name: string; active: boolean }): LogInfo => ({
        title: "Marital Status Created",
        description: `Created new marital status with name: '${data.name}', active: '${data.active}'`,
        module: "Marital Status Management",
    }),

    UPDATED: (data: { id: string; name?: string; active?: boolean }): LogInfo => ({
        title: "Marital Status Updated",
        description: `Updated marital status for ID: ${data.id}${data.name ? `, name: '${data.name}'` : ""}${data.active !== undefined ? `, active: '${data.active}'` : ""}`,
        module: "Marital Status Management",
    }),

    DELETED: (id: string): LogInfo => ({
        title: "Marital Status Deleted",
        description: `Deleted marital status with ID: ${id}`,
        module: "Marital Status Management",
    }),

    STATUS_CHANGED: (newStatus: string): LogInfo => ({
        title: "Marital Status Status Changed",
        description: `Changed marital status to ${newStatus}`,
        module: "Marital Status Management",
    }),
};

export const DOCUMENT_TEMPLATE_LOG_MESSAGES = {
    CREATED: (data: { name: string; active: boolean }): LogInfo => ({
        title: "Document Template Created",
        description: `Created new document template with name: '${data.name}', active: '${data.active}'`,
        module: "Document Template Management",
    }),

    UPDATED: (data: { id: string; name?: string; active?: boolean }): LogInfo => ({
        title: "Document Template Updated",
        description: `Updated document template for ID: ${data.id}${data.name ? `, name: '${data.name}'` : ""}${data.active !== undefined ? `, active: '${data.active}'` : ""}`,
        module: "Document Template Management",
    }),

    DELETED: (id: string): LogInfo => ({
        title: "Document Template Deleted",
        description: `Deleted document template with ID: ${id}`,
        module: "Document Template Management",
    }),

    STATUS_CHANGED: (newStatus: string): LogInfo => ({
        title: "Document Template Status Changed",
        description: `Changed document template status to ${newStatus}`,
        module: "Document Template Management",
    }),
};
