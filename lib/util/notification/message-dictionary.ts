// lib/notifications/message-dictionary.ts
import { NotificationPayloads } from "@/lib/notifications/messages";

type MessageTemplate<K extends keyof NotificationPayloads> = {
    email: {
        subject: (payload: NotificationPayloads[K]) => string;
        body: (payload: NotificationPayloads[K]) => string;
    };
    telegram: (payload: NotificationPayloads[K]) => string;
    inapp: (payload: NotificationPayloads[K]) => string;
};

export const messages: { [K in keyof NotificationPayloads]: MessageTemplate<K> } = {
    CLOCK_OUT: {
        email: {
            subject: p => `Clock-Out Notification: ${p.name}`,
            body: p =>
                `Hi ${p.name}, this is to confirm you have been marked absent for ${p.date}.`,
        },
        telegram: p =>
            `Hi ${p.name}. You have been marked absent for ${p.date}. Please contact HR if this is a mistake.`,
        inapp: p =>
            `Hi ${p.name}. You have been marked absent for ${p.date}. Please contact HR if this is a mistake.`,
    },
    LEAVE_REQUEST: {
        email: {
            subject: p => `Leave Request Submitted: ${p.type}`,
            body: p =>
                `${p.name} submitted a ${p.type} leave request from ${p.firstDay} to ${p.lastDay}.`,
        },
        telegram: p =>
            `${p.name} submitted a ${p.type} leave request from ${p.firstDay} to ${p.lastDay}.`,
        inapp: p =>
            `${p.name} submitted a ${p.type} leave request from ${p.firstDay} to ${p.lastDay}.`,
    },
    LEAVE_REQUEST_SUBMITTED_TO_MANAGER: {
        email: {
            subject: p => `Leave Request Submitted by ${p.employeeName}`,
            body: p =>
                `${p.employeeName} submitted a leave request for ${p.leaveType} from ${p.startDate} to ${p.endDate}.`,
        },
        telegram: p =>
            `📝 ${p.employeeName} submitted a ${p.leaveType} leave request from ${p.startDate} to ${p.endDate}.`,
        inapp: p =>
            `📝 ${p.employeeName} submitted a ${p.leaveType} leave request from ${p.startDate} to ${p.endDate}.`,
    },
    ATTENDANCE_CHANGE_REFUSED_FOR_EMPLOYEE: {
        email: {
            subject: p => `Your Attendance Change Request for ${p.date} Refused`,
            body: p => `Your attendance change request for ${p.date} has been refused.`,
        },
        telegram: p => `Your attendance change request for ${p.date} has been refused.`,
        inapp: p => `Your attendance change request for ${p.date} has been refused.`,
    },
    ATTENDANCE_CHANGE_REFUSED_FOR_MANAGER: {
        email: {
            subject: p => `Attendance Change Request for ${p.employeeName} Refused`,
            body: p =>
                `${p.employeeName}'s attendance change request for ${p.date} has been refused.`,
        },
        telegram: p =>
            `${p.employeeName}'s attendance change request for ${p.date} has been refused.`,
        inapp: p => `${p.employeeName}'s attendance change request for ${p.date} has been refused.`,
    },
    LEAVE_REQUEST_APPROVED: {
        email: {
            subject: p => `Your ${p.leaveType} Leave Request Approved`,
            body: p =>
                `Your ${p.leaveType} leave request (${p.startDate} to ${p.endDate}) has been approved.`,
        },
        telegram: p =>
            `✅ Your ${p.leaveType} leave request (${p.startDate} to ${p.endDate}) has been approved.`,
        inapp: p =>
            `✅ Your ${p.leaveType} leave request (${p.startDate} to ${p.endDate}) has been approved.`,
    },
    LEAVE_REQUEST_REFUSED: {
        email: {
            subject: p => `Your ${p.leaveType} Leave Request Refused`,
            body: p =>
                `Your ${p.leaveType} leave request (${p.startDate} to ${p.endDate}) has been refused.`,
        },
        telegram: p =>
            `❌ Your ${p.leaveType} leave request (${p.startDate} to ${p.endDate}) has been refused.`,
        inapp: p =>
            `❌ Your ${p.leaveType} leave request (${p.startDate} to ${p.endDate}) has been refused.`,
    },
    ASSIGNED_AS_STAND_IN: {
        email: {
            subject: p => `You Have Been Assigned as Stand-In for ${p.colleagueName}`,
            body: p =>
                `You have been assigned as stand-in for ${p.colleagueName} from ${p.startDate} to ${p.endDate}.`,
        },
        telegram: p =>
            `You have been assigned as stand-in for ${p.colleagueName} from ${p.startDate} to ${p.endDate}.`,
        inapp: p =>
            `You have been assigned as stand-in for ${p.colleagueName} from ${p.startDate} to ${p.endDate}.`,
    },
    LEAVE_ROLLBACK_INITIATED: {
        email: {
            subject: p => `Leave Rollback Initiated by ${p.employeeName}`,
            body: p =>
                `${p.employeeName} initiated a rollback request for ${p.leaveType} from ${p.startDate} to ${p.endDate}.`,
        },
        telegram: p =>
            `↩️ ${p.employeeName} initiated a rollback request for their ${p.leaveType} leave (${p.startDate} to ${p.endDate}).`,
        inapp: p =>
            `↩️ ${p.employeeName} initiated a rollback request for their ${p.leaveType} leave (${p.startDate} to ${p.endDate}).`,
    },
    LEAVE_ROLLBACK_ACCEPTED: {
        email: {
            subject: _p => `Your Leave Rollback Request Has Been Accepted`,
            body: p =>
                `Your rollback request for ${p.leaveType} from ${p.startDate} to ${p.endDate} has been accepted.`,
        },
        telegram: p =>
            `Your rollback request for your ${p.leaveType} leave (${p.startDate} to ${p.endDate}) has been accepted.`,
        inapp: p =>
            `Your rollback request for your ${p.leaveType} leave (${p.startDate} to ${p.endDate}) has been accepted.`,
    },
    LEAVE_ROLLBACK_REFUSED: {
        email: {
            subject: _p => `Your Leave Rollback Request Has Been Refused`,
            body: p =>
                `Your rollback request for ${p.leaveType} from ${p.startDate} to ${p.endDate} has been refused.`,
        },
        telegram: p =>
            `Your rollback request for your ${p.leaveType} leave (${p.startDate} to ${p.endDate}) has been refused.`,
        inapp: p =>
            `Your rollback request for your ${p.leaveType} leave (${p.startDate} to ${p.endDate}) has been refused.`,
    },
    ON_BEHALF_LEAVE_SUBMITTED: {
        email: {
            subject: p => `A ${p.leaveType} Leave Request Was Submitted On Your Behalf`,
            body: p =>
                `A ${p.leaveType} leave request from ${p.startDate} to ${p.endDate} has been submitted on your behalf.`,
        },
        telegram: p =>
            `A ${p.leaveType} leave request (${p.startDate} to ${p.endDate}) has been submitted on your behalf.`,
        inapp: p =>
            `A ${p.leaveType} leave request (${p.startDate} to ${p.endDate}) has been submitted on your behalf.`,
    },
    OT_REQUEST_SUBMITTED: {
        email: {
            subject: p => `OT Request Submitted by ${p.managerName}`,
            body: p =>
                `HR Manager, ${p.managerName} (${p.position}) from ${p.department} has submitted an overtime request for ${p.employeeName} waiting your review.`,
        },
        telegram: p =>
            `HR Manager, ${p.managerName} (${p.position}) from ${p.department} has submitted an overtime request for ${p.employeeName} waiting your review.`,
        inapp: p =>
            `HR Manager, ${p.managerName} (${p.position}) from ${p.department} has submitted an overtime request for ${p.employeeName} waiting your review.`,
    },
    OT_REQUEST_APPROVED: {
        email: {
            subject: p => `OT Request Approved for ${p.employeeName}`,
            body: p => `HR approved ${p.employeeName}'s OT request for ${p.date}.`,
        },
        telegram: p => `HR approved ${p.employeeName}'s OT request for ${p.date}.`,
        inapp: p => `HR approved ${p.employeeName}'s OT request for ${p.date}.`,
    },
    OT_REQUEST_REJECTED: {
        email: {
            subject: p => `OT Request Rejected for ${p.employeeName}`,
            body: p => `HR rejected ${p.employeeName}'s OT request for ${p.date}.`,
        },
        telegram: p => `HR rejected ${p.employeeName}'s OT request for ${p.date}.`,
        inapp: p => `HR rejected ${p.employeeName}'s OT request for ${p.date}.`,
    },
    ATTENDANCE_CHANGE_REQUEST_SUBMITTED: {
        email: {
            subject: p => `Attendance Change Request Submitted by ${p.employeeName}`,
            body: p => `${p.employeeName} submitted an attendance change request for ${p.date}.`,
        },
        telegram: p => `${p.employeeName} submitted an attendance change request for ${p.date}.`,
        inapp: p => `${p.employeeName} submitted an attendance change request for ${p.date}.`,
    },
    ATTENDANCE_CHANGE_REQUEST_APPROVED: {
        email: {
            subject: p => `Attendance Change Request Approved for ${p.employeeName}`,
            body: p =>
                `${p.employeeName}'s attendance change request for ${p.date} has been approved.`,
        },
        telegram: p =>
            `${p.employeeName}'s attendance change request for ${p.date} has been approved.`,
        inapp: p =>
            `${p.employeeName}'s attendance change request for ${p.date} has been approved.`,
    },
};
