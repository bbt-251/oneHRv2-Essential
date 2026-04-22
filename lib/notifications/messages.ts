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
}
