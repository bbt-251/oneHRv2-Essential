export interface LogInfo {
    title: string;
    description: string;
    module: string;
}

export const DISCIPLINARY_ACTION_LOG_MESSAGES = {
    CREATED: (data: {
        employeeUid: string;
        actionID?: string;
        occurrenceLevel: string;
        status: string;
    }): LogInfo => ({
        title: "Disciplinary Action Created",
        description: `Created new disciplinary action for employee ${data.employeeUid}${data.actionID ? ` with ID: ${data.actionID}` : ""}, occurrence level: ${data.occurrenceLevel}, status: ${data.status}`,
        module: "Disciplinary Actions",
    }),

    UPDATED: (data: {
        id: string;
        employeeUid?: string;
        status?: string;
        occurrenceLevel?: string;
    }): LogInfo => ({
        title: "Disciplinary Action Updated",
        description: `Updated disciplinary action for ID: ${data.id}${data.employeeUid ? `, employee: ${data.employeeUid}` : ""}${data.status ? `, status: ${data.status}` : ""}${data.occurrenceLevel ? `, occurrence level: ${data.occurrenceLevel}` : ""}`,
        module: "Disciplinary Actions",
    }),

    APPROVED: (data: { id: string; employeeUid: string; actionID?: string }): LogInfo => ({
        title: "Disciplinary Action Approved",
        description: `Approved disciplinary action for employee ${data.employeeUid}${data.actionID ? ` with ID: ${data.actionID}` : ""} (Action ID: ${data.id})`,
        module: "Disciplinary Actions",
    }),

    REJECTED: (data: { id: string; employeeUid: string; actionID?: string }): LogInfo => ({
        title: "Disciplinary Action Rejected",
        description: `Rejected disciplinary action for employee ${data.employeeUid}${data.actionID ? ` with ID: ${data.actionID}` : ""} (Action ID: ${data.id})`,
        module: "Disciplinary Actions",
    }),

    APPEAL_APPROVED: (data: { id: string; employeeUid: string; actionID?: string }): LogInfo => ({
        title: "Disciplinary Action Appeal Approved",
        description: `Approved appeal for disciplinary action of employee ${data.employeeUid}${data.actionID ? ` with ID: ${data.actionID}` : ""} (Action ID: ${data.id})`,
        module: "Disciplinary Actions",
    }),

    APPEAL_REJECTED: (data: { id: string; employeeUid: string; actionID?: string }): LogInfo => ({
        title: "Disciplinary Action Appeal Rejected",
        description: `Rejected appeal for disciplinary action of employee ${data.employeeUid}${data.actionID ? ` with ID: ${data.actionID}` : ""} (Action ID: ${data.id})`,
        module: "Disciplinary Actions",
    }),

    COMMENT_ADDED: (data: { id: string; employeeUid: string; author: string }): LogInfo => ({
        title: "Comment Added to Disciplinary Action",
        description: `Added comment by ${data.author} to disciplinary action for employee ${data.employeeUid} (Action ID: ${data.id})`,
        module: "Disciplinary Actions",
    }),

    STATUS_CHANGED: (newStatus: string): LogInfo => ({
        title: "Disciplinary Action Status Changed",
        description: `Changed status to ${newStatus}`,
        module: "Disciplinary Actions",
    }),

    DELETED: (data: { id: string; employeeUid: string; actionID?: string }): LogInfo => ({
        title: "Disciplinary Action Deleted",
        description: `Deleted disciplinary action for employee ${data.employeeUid}${data.actionID ? ` with ID: ${data.actionID}` : ""} (Action ID: ${data.id})`,
        module: "Disciplinary Actions",
    }),
};
