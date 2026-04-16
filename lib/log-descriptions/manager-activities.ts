export interface LogInfo {
    title: string;
    description: string;
    module: string;
}

// Learning Management
export const TRAINING_MATERIAL_LOG_MESSAGES = {
    CREATED: (data: {
        name: string;
        category: string[];
        format: string;
        createdBy: string;
    }): LogInfo => ({
        title: "Training Material Requested",
        description: `Training material '${data.name}' requested in categories: ${data.category.join(", ")}, format: ${data.format}`,
        module: "Learning Management",
    }),
    UPDATED: (data: {
        id: string;
        name?: string;
        category?: string[];
        format?: string;
    }): LogInfo => ({
        title: "Training Material Updated",
        description: `Training material updated for ID: ${data.id}${data.name ? `, name: '${data.name}'` : ""}`,
        module: "Learning Management",
    }),
    DELETED: (id: string): LogInfo => ({
        title: "Training Material Deleted",
        description: `Training material request deleted with ID: ${id}`,
        module: "Learning Management",
    }),
    APPROVED: (data: { id: string; name: string; approvedBy: string }): LogInfo => ({
        title: "Training Material Approved",
        description: `Training material '${data.name}' approved by manager ${data.approvedBy}`,
        module: "Learning Management",
    }),
    REJECTED: (data: {
        id: string;
        name: string;
        rejectedBy: string;
        reason?: string;
    }): LogInfo => ({
        title: "Training Material Rejected",
        description: `Training material '${data.name}' rejected by manager ${data.rejectedBy}${data.reason ? `, reason: ${data.reason}` : ""}`,
        module: "Learning Management",
    }),
};

// Talent Acquisition
export const HIRING_NEED_LOG_MESSAGES = {
    CREATED: (data: {
        jobTitle: string;
        department: string;
        hiringNeedType: string;
        createdBy: string;
    }): LogInfo => ({
        title: "Hiring Need Created",
        description: `Hiring need created for job title: ${data.jobTitle}, department: ${data.department}, type: ${data.hiringNeedType}`,
        module: "Talent Acquisition",
    }),
    UPDATED: (data: { id: string; jobTitle?: string; status?: string }): LogInfo => ({
        title: "Hiring Need Updated",
        description: `Hiring need updated for ID: ${data.id}${data.jobTitle ? `, job title: ${data.jobTitle}` : ""}${data.status ? `, status: ${data.status}` : ""}`,
        module: "Talent Acquisition",
    }),
    DELETED: (id: string): LogInfo => ({
        title: "Hiring Need Deleted",
        description: `Hiring need deleted with ID: ${id}`,
        module: "Talent Acquisition",
    }),
    APPROVED: (data: { id: string; approvedBy: string }): LogInfo => ({
        title: "Hiring Need Approved",
        description: `Hiring need approved by manager ${data.approvedBy}`,
        module: "Talent Acquisition",
    }),
    REJECTED: (data: { id: string; rejectedBy: string; reason?: string }): LogInfo => ({
        title: "Hiring Need Rejected",
        description: `Hiring need rejected by manager ${data.rejectedBy}${data.reason ? `, reason: ${data.reason}` : ""}`,
        module: "Talent Acquisition",
    }),
};

// Leave Management
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

// Overtime Management
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

// Project Management
export const PROJECT_LOG_MESSAGES = {
    CREATED: (data: {
        name: string;
        deadline: string;
        memberCount: number;
        createdBy: string;
    }): LogInfo => ({
        title: "Project Created",
        description: `Project '${data.name}' created with ${data.memberCount} members, deadline: ${data.deadline}`,
        module: "Project Management",
    }),
    UPDATED: (data: { id: string; name?: string; status?: string }): LogInfo => ({
        title: "Project Updated",
        description: `Project updated for ID: ${data.id}${data.name ? `, name: '${data.name}'` : ""}${data.status ? `, status: ${data.status}` : ""}`,
        module: "Project Management",
    }),
    DELETED: (id: string): LogInfo => ({
        title: "Project Deleted",
        description: `Project deleted with ID: ${id}`,
        module: "Project Management",
    }),
    PARTICIPANTS_UPDATED: (data: { id: string; name: string; updatedBy: string }): LogInfo => ({
        title: "Project Participants Updated",
        description: `Project '${data.name}' participants updated by ${data.updatedBy}`,
        module: "Project Management",
    }),
};

// Performance Management
export const PERFORMANCE_LOG_MESSAGES = {
    OBJECTIVE_CREATED: (data: {
        title: string;
        employeeName: string;
        createdBy: string;
        dueDate: string;
    }): LogInfo => ({
        title: "Objective Created & Assigned",
        description: `Objective '${data.title}' created and assigned to ${data.employeeName} by ${data.createdBy}, due: ${data.dueDate}`,
        module: "Performance Management",
    }),
    OBJECTIVE_UPDATED: (data: {
        id: string;
        title?: string;
        employeeName: string;
        updatedBy: string;
    }): LogInfo => ({
        title: "Objective Updated",
        description: `Objective updated for ${data.employeeName} by ${data.updatedBy}${data.title ? `, title: '${data.title}'` : ""}`,
        module: "Performance Management",
    }),
    OBJECTIVE_DELETED: (data: {
        title: string;
        employeeName: string;
        deletedBy: string;
    }): LogInfo => ({
        title: "Objective Deleted",
        description: `Objective '${data.title}' deleted for ${data.employeeName} by ${data.deletedBy}`,
        module: "Performance Management",
    }),
    OBJECTIVE_APPROVED: (data: {
        employeeName: string;
        objectiveTitle: string;
        approvedBy: string;
    }): LogInfo => ({
        title: "Objective Approved",
        description: `Objective '${data.objectiveTitle}' approved for ${data.employeeName} by ${data.approvedBy}`,
        module: "Performance Management",
    }),
    OBJECTIVE_REJECTED: (data: {
        employeeName: string;
        objectiveTitle: string;
        rejectedBy: string;
        reason?: string;
    }): LogInfo => ({
        title: "Objective Rejected",
        description: `Objective '${data.objectiveTitle}' rejected for ${data.employeeName} by ${data.rejectedBy}${data.reason ? `, reason: ${data.reason}` : ""}`,
        module: "Performance Management",
    }),
    COMPETENCY_WEIGHTS_SET: (data: { employeeName: string; setBy: string }): LogInfo => ({
        title: "Competency Weights Set",
        description: `Competency weights set for ${data.employeeName} by ${data.setBy}`,
        module: "Performance Management",
    }),
    PERFORMANCE_REVIEW_COMPLETED: (data: {
        employeeName: string;
        completedBy: string;
        rating?: string;
    }): LogInfo => ({
        title: "Performance Review Completed",
        description: `Performance review completed for ${data.employeeName} by ${data.completedBy}${data.rating ? `, rating: ${data.rating}` : ""}`,
        module: "Performance Management",
    }),
    PERFORMANCE_EVALUATION_CREATED: (data: {
        employeeUID: string;
        campaignID: string;
        createdBy: string;
    }): LogInfo => ({
        title: "Performance Evaluation Created",
        description: `Performance evaluation created for employee ${data.employeeUID} in campaign ${data.campaignID}`,
        module: "Performance Management",
    }),
    PERFORMANCE_EVALUATION_UPDATED: (data: {
        id: string;
        employeeUID: string;
        updatedBy: string;
    }): LogInfo => ({
        title: "Performance Evaluation Updated",
        description: `Performance evaluation updated for employee ${data.employeeUID} by ${data.updatedBy}`,
        module: "Performance Management",
    }),
    PERFORMANCE_EVALUATION_DELETED: (data: {
        id: string;
        employeeUID: string;
        deletedBy: string;
    }): LogInfo => ({
        title: "Performance Evaluation Deleted",
        description: `Performance evaluation deleted for employee ${data.employeeUID} by ${data.deletedBy}`,
        module: "Performance Management",
    }),
};

// Exit Management
export const EXIT_MANAGEMENT_LOG_MESSAGES = {
    CHECKLIST_ITEM_CREATED: (data: { itemName: string; createdBy: string }): LogInfo => ({
        title: "Exit Checklist Item Created",
        description: `Exit checklist item '${data.itemName}' created by ${data.createdBy}`,
        module: "Exit Management",
    }),
    CHECKLIST_ITEM_UPDATED: (data: { itemName: string; updatedBy: string }): LogInfo => ({
        title: "Exit Checklist Item Updated",
        description: `Exit checklist item '${data.itemName}' updated by ${data.updatedBy}`,
        module: "Exit Management",
    }),
    CHECKLIST_ITEM_DELETED: (data: { itemName: string; deletedBy: string }): LogInfo => ({
        title: "Exit Checklist Item Deleted",
        description: `Exit checklist item '${data.itemName}' deleted by ${data.deletedBy}`,
        module: "Exit Management",
    }),
    CHECKLIST_ITEM_COMPLETED: (data: { itemName: string; completedBy: string }): LogInfo => ({
        title: "Exit Checklist Item Completed",
        description: `Exit checklist item '${data.itemName}' completed by ${data.completedBy}`,
        module: "Exit Management",
    }),
    CHECKLIST_REMARK_ADDED: (data: { itemName: string; remarkBy: string }): LogInfo => ({
        title: "Exit Checklist Remark Added",
        description: `Remark added to exit checklist item '${data.itemName}' by ${data.remarkBy}`,
        module: "Exit Management",
    }),
    EXIT_FORM_PROCESSED: (data: { employeeUID: string; processedBy: string }): LogInfo => ({
        title: "Exit Form Processed",
        description: `Exit form processed for employee ${data.employeeUID} by ${data.processedBy}`,
        module: "Exit Management",
    }),
};

// Delegation Management
export const DELEGATION_LOG_MESSAGES = {
    CREATED: (data: {
        delegationType: string;
        fromEmployee: string;
        toEmployee: string;
        createdBy: string;
    }): LogInfo => ({
        title: "Delegation Created",
        description: `Delegation created from ${data.fromEmployee} to ${data.toEmployee} (${data.delegationType}) by ${data.createdBy}`,
        module: "Delegation Management",
    }),
    UPDATED: (data: { id: string; updatedBy: string }): LogInfo => ({
        title: "Delegation Updated",
        description: `Delegation updated by ${data.updatedBy}`,
        module: "Delegation Management",
    }),
    DELETED: (data: {
        id: string;
        delegationId: string;
        fromEmployee: string;
        toEmployee: string;
        deletedBy: string;
    }): LogInfo => ({
        title: "Delegation Deleted",
        description: `Delegation '${data.delegationId}' from ${data.fromEmployee} to ${data.toEmployee} deleted by ${data.deletedBy}`,
        module: "Delegation Management",
    }),
    APPROVED: (data: {
        id: string;
        delegationId: string;
        fromEmployee: string;
        toEmployee: string;
        approvedBy: string;
    }): LogInfo => ({
        title: "Delegation Approved",
        description: `Delegation '${data.delegationId}' from ${data.fromEmployee} to ${data.toEmployee} approved by ${data.approvedBy}`,
        module: "Delegation Management",
    }),
    REJECTED: (data: {
        id: string;
        delegationId: string;
        fromEmployee: string;
        toEmployee: string;
        rejectedBy: string;
    }): LogInfo => ({
        title: "Delegation Rejected",
        description: `Delegation '${data.delegationId}' from ${data.fromEmployee} to ${data.toEmployee} rejected by ${data.rejectedBy}`,
        module: "Delegation Management",
    }),
    ASSIGNMENT_UPDATED: (data: { id: string; updatedBy: string }): LogInfo => ({
        title: "Delegation Assignment Updated",
        description: `Delegation assignment updated by ${data.updatedBy}`,
        module: "Delegation Management",
    }),
};
