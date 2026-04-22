export interface LogInfo {
    title: string;
    description: string;
    module: string;
}

export const LEAVE_REQUEST_LOG_MESSAGES = {
    CREATED: (data: { employeeName: string; leaveType: string; createdBy: string }): LogInfo => ({
        title: "Leave Request Created",
        description: `Leave request created for ${data.employeeName}, type: ${data.leaveType}`,
        module: "Leave Management",
    }),
    UPDATED: (data: { id: string; employeeName: string; leaveType?: string }): LogInfo => ({
        title: "Leave Request Updated",
        description: `Leave request updated for ${data.employeeName}${data.leaveType ? `, type: ${data.leaveType}` : ""}`,
        module: "Leave Management",
    }),
    DELETED: (data: { id: string; employeeName: string }): LogInfo => ({
        title: "Leave Request Deleted",
        description: `Leave request deleted for ${data.employeeName}`,
        module: "Leave Management",
    }),
    VIEWED: (data: { id: string; employeeName: string; leaveType: string }): LogInfo => ({
        title: "Leave Request Viewed",
        description: `Leave request viewed for ${data.employeeName}, type: ${data.leaveType}`,
        module: "Leave Management",
    }),
    APPROVED: (data: {
        id: string;
        employeeName: string;
        approvedBy: string;
        leaveType: string;
    }): LogInfo => ({
        title: "Leave Request Approved",
        description: `Leave request approved for ${data.employeeName} (${data.leaveType}) by ${data.approvedBy}`,
        module: "Leave Management",
    }),
    REJECTED: (data: {
        id: string;
        employeeName: string;
        rejectedBy: string;
        reason?: string;
    }): LogInfo => ({
        title: "Leave Request Rejected",
        description: `Leave request rejected for ${data.employeeName} by ${data.rejectedBy}${data.reason ? `, reason: ${data.reason}` : ""}`,
        module: "Leave Management",
    }),
    COMMENT_ADDED: (data: { id: string; employeeName: string; commentBy: string }): LogInfo => ({
        title: "Leave Comment Added",
        description: `Comment added to leave request for ${data.employeeName} by ${data.commentBy}`,
        module: "Leave Management",
    }),
};

export const OVERTIME_REQUEST_LOG_MESSAGES = {
    CREATED: (data: {
        employeeUids: string[];
        overtimeType: string;
        date: string;
        requestedBy: string;
    }): LogInfo => ({
        title: "Overtime Request Created",
        description: `Overtime request created for ${data.employeeUids.length} employees, type: ${data.overtimeType}, date: ${data.date}`,
        module: "Overtime Management",
    }),
    UPDATED: (data: {
        id: string;
        employeeUids: string[];
        updatedBy: string;
        overtimeType?: string;
    }): LogInfo => ({
        title: "Overtime Request Updated",
        description: `Overtime request updated for ${data.employeeUids.length} employees by ${data.updatedBy}${data.overtimeType ? `, type: ${data.overtimeType}` : ""}`,
        module: "Overtime Management",
    }),
    DELETED: (data: { id: string; employeeUids: string[]; deletedBy: string }): LogInfo => ({
        title: "Overtime Request Deleted",
        description: `Overtime request deleted for ${data.employeeUids.length} employees by ${data.deletedBy}`,
        module: "Overtime Management",
    }),
    SUBMITTED: (data: { id: string; employeeCount: number; submittedBy: string }): LogInfo => ({
        title: "Overtime Request Submitted",
        description: `Overtime request submitted for ${data.employeeCount} employees by ${data.submittedBy}`,
        module: "Overtime Management",
    }),
    VIEWED: (data: { id: string; viewedBy: string }): LogInfo => ({
        title: "Overtime Request Viewed",
        description: `Overtime request viewed by manager ${data.viewedBy}`,
        module: "Overtime Management",
    }),
    APPROVED: (data: {
        id: string;
        employeeUids: string[];
        approvedBy: string;
        overtimeType: string;
        hours: number;
    }): LogInfo => ({
        title: "Overtime Request Approved",
        description: `Overtime request approved for ${data.employeeUids.length} employees (${data.overtimeType}, ${data.hours} hours) by ${data.approvedBy}`,
        module: "Overtime Management",
    }),
    REJECTED: (data: {
        id: string;
        employeeUids: string[];
        rejectedBy: string;
        reason?: string;
    }): LogInfo => ({
        title: "Overtime Request Rejected",
        description: `Overtime request rejected for ${data.employeeUids.length} employees by ${data.rejectedBy}${data.reason ? `, reason: ${data.reason}` : ""}`,
        module: "Overtime Management",
    }),
};
