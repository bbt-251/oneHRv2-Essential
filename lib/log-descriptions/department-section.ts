export interface LogInfo {
    title: string;
    description: string;
    module: string;
}

export const DEPARTMENT_LOG_MESSAGES = {
    CREATED: (data: {
        name: string;
        code: string;
        manager?: string;
        location?: string;
        active?: boolean;
    }): LogInfo => ({
        title: "Department Created",
        description: `Created new department with name: '${data.name}', code: '${data.code}'${data.manager ? `, manager: '${data.manager}'` : ""}${data.location ? `, location: '${data.location}'` : ""}${data.active !== undefined ? `, active: '${data.active}'` : ""}`,
        module: "Department Management",
    }),

    UPDATED: (data: {
        id: string;
        name?: string;
        code?: string;
        manager?: string;
        location?: string;
        active?: boolean;
    }): LogInfo => ({
        title: "Department Updated",
        description: `Updated department for ID: ${data.id}${data.name ? `, name: '${data.name}'` : ""}${data.code ? `, code: '${data.code}'` : ""}${data.manager ? `, manager: '${data.manager}'` : ""}${data.location ? `, location: '${data.location}'` : ""}${data.active !== undefined ? `, active: '${data.active}'` : ""}`,
        module: "Department Management",
    }),

    DELETED: (id: string): LogInfo => ({
        title: "Department Deleted",
        description: `Deleted department with ID: ${id}`,
        module: "Department Management",
    }),

    STATUS_CHANGED: (newStatus: string): LogInfo => ({
        title: "Department Status Changed",
        description: `Changed department status to ${newStatus}`,
        module: "Department Management",
    }),
};

export const SECTION_LOG_MESSAGES = {
    CREATED: (data: {
        name: string;
        code: string;
        department?: string;
        supervisor?: string | null;
        active?: boolean;
    }): LogInfo => ({
        title: "Section Created",
        description: `Created new section with name: '${data.name}', code: '${data.code}'${data.department ? `, department: '${data.department}'` : ""}${data.supervisor ? `, supervisor: '${data.supervisor}'` : ""}${data.active !== undefined ? `, active: '${data.active}'` : ""}`,
        module: "Section Management",
    }),

    UPDATED: (data: {
        id: string;
        name?: string;
        code?: string;
        department?: string;
        supervisor?: string | null;
        active?: boolean;
    }): LogInfo => ({
        title: "Section Updated",
        description: `Updated section for ID: ${data.id}${data.name ? `, name: '${data.name}'` : ""}${data.code ? `, code: '${data.code}'` : ""}${data.department ? `, department: '${data.department}'` : ""}${data.supervisor ? `, supervisor: '${data.supervisor}'` : ""}${data.active !== undefined ? `, active: '${data.active}'` : ""}`,
        module: "Section Management",
    }),

    DELETED: (id: string): LogInfo => ({
        title: "Section Deleted",
        description: `Deleted section with ID: ${id}`,
        module: "Section Management",
    }),

    STATUS_CHANGED: (newStatus: string): LogInfo => ({
        title: "Section Status Changed",
        description: `Changed section status to ${newStatus}`,
        module: "Section Management",
    }),
};
