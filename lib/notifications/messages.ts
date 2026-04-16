// lib/notifications/messages.ts
export interface NotificationPayloads {
    CLOCK_OUT: { name: string; date: string };
    LEAVE_REQUEST: {
        name: string;
        leaveId: string;
        firstDay: string;
        lastDay: string;
        type: string;
    };

    LEAVE_REQUEST_SUBMITTED_TO_MANAGER: {
        employeeName: string;
        leaveType: string;
        startDate: string;
        endDate: string;
    };

    ATTENDANCE_CHANGE_REFUSED_FOR_EMPLOYEE: {
        date: string;
    };
    ATTENDANCE_CHANGE_REFUSED_FOR_MANAGER: {
        employeeName: string;
        date: string;
    };

    LEAVE_REQUEST_APPROVED: {
        leaveType: string;
        startDate: string;
        endDate: string;
    };

    LEAVE_REQUEST_REFUSED: {
        leaveType: string;
        startDate: string;
        endDate: string;
    };

    ASSIGNED_AS_STAND_IN: {
        colleagueName: string;
        startDate: string;
        endDate: string;
    };

    LEAVE_ROLLBACK_INITIATED: {
        employeeName: string;
        leaveType: string;
        startDate: string;
        endDate: string;
    };

    LEAVE_ROLLBACK_ACCEPTED: {
        leaveType: string;
        startDate: string;
        endDate: string;
    };

    LEAVE_ROLLBACK_REFUSED: {
        leaveType: string;
        startDate: string;
        endDate: string;
    };

    ON_BEHALF_LEAVE_SUBMITTED: {
        leaveType: string;
        startDate: string;
        endDate: string;
    };

    OT_REQUEST_SUBMITTED: {
        managerName: string;
        position: string;
        department: string;
        employeeName: string;
    };

    OT_REQUEST_APPROVED: {
        employeeName: string;
        date: string;
    };

    OT_REQUEST_REJECTED: {
        employeeName: string;
        date: string;
    };

    ATTENDANCE_CHANGE_REQUEST_SUBMITTED: {
        employeeName: string;
        date: string;
    };

    ATTENDANCE_CHANGE_REQUEST_APPROVED: {
        employeeName: string;
        date: string;
    };

    EVALUATION_CAMPAIGN_REMINDER: {
        roundName: string;
        endDate: string;
    };

    OBJECTIVE_SELF_ASSESSMENT_REMINDER: {
        roundName: string;
        endDate: string;
    };

    EMPLOYEE_OBJECTIVE_SET: {
        employeeName: string;
    };

    MANAGER_OBJECTIVE_ASSIGNED: {
        employeeName: string;
    };

    EMPLOYEE_OBJECTIVE_ACKNOWLEDGED: {
        employeeName: string;
        objectiveTitle: string;
    };

    EMPLOYEE_OBJECTIVE_SELF_ASSESSMENT_COMPLETED: {
        employeeName: string;
    };

    EMPLOYEE_COMPETENCY_SELF_ASSESSMENT_COMPLETED: {
        employeeName: string;
    };

    MANAGER_OBJECTIVE_APPROVED: {
        objectiveTitle: string;
    };

    MANAGER_OBJECTIVE_WEIGHTED: {
        employeeName: string;
    };

    EMPLOYEE_ISSUE_ESCALATION: {
        employeeName: string;
        issueTitle: string;
        isAnonymous: boolean;
    };

    EMPLOYEE_DA_ACCEPTED: {
        employeeName: string;
    };

    EMPLOYEE_DA_APPEALED: {
        employeeName: string;
    };

    MANAGER_DA_SUBMITTED: {
        managerName: string;
        employeeName: string;
    };

    HR_DA_APPROVED: {
        employeeName: string;
    };
    SURVEY_PUBLISHED: {
        surveyTitle: string;
    };
    ANNOUNCEMENT_PUBLISHED: {
        announcementTitle: string;
    };
    TRAINING_MATERIAL_REQUESTED: {
        employeeName: string;
        trainingMaterialName: string;
    };
    TRAINING_MATERIAL_APPROVED: {
        employeeName: string;
        trainingMaterialName: string;
    };
    TRAINING_MATERIAL_PUBLISHED: {
        trainingMaterialName: string;
    };
    MANDATORY_TRAINING_ASSIGNED: {
        trainingMaterialName: string;
    };
    HIRING_NEED_ISSUED_FOR_REVIEW: {
        employeeName: string;
        jobTitle: string;
    };
    HIRING_NEED_ISSUED_AWAITING_REVIEW: {
        employeeName: string;
        jobTitle: string;
    };
    HIRING_NEED_APPROVED_FOR_MANAGER: {
        employeeName: string;
        jobTitle: string;
    };
    HIRING_NEED_APPROVED_FOR_HRM: {
        employeeName: string;
        jobTitle: string;
    };
    JOB_POST_AVAILABLE_FOR_SHARING: {
        jobTitle: string;
    };
    JOB_POST_PUBLISHED: {
        jobTitle: string;
    };
    TRANSFER_REQUESTED: {
        employeeName: string;
        transferID: string;
        transferType: string;
    };
    TRANSFER_APPROVED: {
        transferID: string;
        transferType: string;
    };
    TRANSFER_REFUSED: {
        transferID: string;
        transferType: string;
        remark?: string;
    };

    // Promotion notifications
    PROMOTION_OFFER: {
        promotionID: string;
        promotionName: string;
        newPosition: string;
        newGrade: string;
        newSalary: number;
    };
    PROMOTION_ACCEPTED: {
        promotionID: string;
        promotionName: string;
        employeeName: string;
    };
    PROMOTION_REFUSED: {
        promotionID: string;
        promotionName: string;
        employeeName: string;
        reason?: string;
    };
    PROMOTION_APPROVED: {
        promotionID: string;
        promotionName: string;
        employeeName: string;
    };
    PROMOTION_REJECTED: {
        promotionID: string;
        promotionName: string;
        employeeName: string;
        reason?: string;
    };
    PROMOTION_FINALIZED: {
        promotionID: string;
        promotionName: string;
        employeeName: string;
        newPosition: string;
        newGrade: string;
        newSalary: number;
    };
    PROMOTION_REOPENED: {
        promotionID: string;
        promotionName: string;
        employeeName: string;
    };

    // Delegation notifications
    DELEGATION_CREATED: {
        delegationID: string;
        delegatorName: string;
        delegateeName: string;
        periodStart: string;
        periodEnd: string;
    };
    DELEGATION_ACKNOWLEDGED: {
        delegationID: string;
        delegatorName: string;
        delegateeName: string;
    };
    DELEGATION_APPROVED: {
        delegationID: string;
        delegatorName: string;
        delegateeName: string;
        periodStart: string;
        periodEnd: string;
    };
    DELEGATION_REFUSED: {
        delegationID: string;
        delegatorName: string;
        delegateeName: string;
    };
}
