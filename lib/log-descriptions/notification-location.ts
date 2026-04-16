export interface LogInfo {
    title: string;
    description: string;
    module: string;
}

export const NOTIFICATION_TYPE_LOG_MESSAGES = {
    CREATED: (data: { notificationType: string; text: string; active: string }): LogInfo => ({
        title: "Notification Type Created",
        description: `Created new notification type with type: '${data.notificationType}', text: '${data.text}', active: '${data.active}'`,
        module: "Notification Type Management",
    }),

    UPDATED: (data: {
        id: string;
        notificationType?: string;
        text?: string;
        active?: string;
    }): LogInfo => ({
        title: "Notification Type Updated",
        description: `Updated notification type for ID: ${data.id}${data.notificationType ? `, type: '${data.notificationType}'` : ""}${data.text ? `, text: '${data.text}'` : ""}${data.active ? `, active: '${data.active}'` : ""}`,
        module: "Notification Type Management",
    }),

    DELETED: (id: string): LogInfo => ({
        title: "Notification Type Deleted",
        description: `Deleted notification type with ID: ${id}`,
        module: "Notification Type Management",
    }),

    STATUS_CHANGED: (newStatus: string): LogInfo => ({
        title: "Notification Type Status Changed",
        description: `Changed notification type status to ${newStatus}`,
        module: "Notification Type Management",
    }),
};

export const LOCATION_LOG_MESSAGES = {
    CREATED: (data: {
        parentId?: string | null;
        type: string;
        name: string;
        startDate: string;
        endDate: string;
        active: string;
        description?: string;
        address?: string;
    }): LogInfo => ({
        title: "Location Created",
        description: `Created new location with name: '${data.name}', type: '${data.type}', start date: '${data.startDate}', end date: '${data.endDate}', active: '${data.active}'${data.parentId ? `, parent ID: '${data.parentId}'` : ""}`,
        module: "Location Management",
    }),

    UPDATED: (data: {
        id: string;
        parentId?: string | null;
        type?: string;
        name?: string;
        startDate?: string;
        endDate?: string;
        active?: string;
        description?: string;
        address?: string;
    }): LogInfo => ({
        title: "Location Updated",
        description: `Updated location for ID: ${data.id}${data.name ? `, name: '${data.name}'` : ""}${data.type ? `, type: '${data.type}'` : ""}${data.startDate ? `, start date: '${data.startDate}'` : ""}${data.endDate ? `, end date: '${data.endDate}'` : ""}${data.active ? `, active: '${data.active}'` : ""}${data.parentId !== undefined ? `, parent ID: '${data.parentId}'` : ""}`,
        module: "Location Management",
    }),

    DELETED: (id: string): LogInfo => ({
        title: "Location Deleted",
        description: `Deleted location with ID: ${id}`,
        module: "Location Management",
    }),

    STATUS_CHANGED: (newStatus: string): LogInfo => ({
        title: "Location Status Changed",
        description: `Changed location status to ${newStatus}`,
        module: "Location Management",
    }),

    MOVED: (data: { id: string; parentId: string }): LogInfo => ({
        title: "Location Moved",
        description: `Changed location hierarchy for ID: ${data.id}, new parent ID: '${data.parentId}'`,
        module: "Location Management",
    }),
};
