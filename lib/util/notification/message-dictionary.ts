// lib/notifications/message-dictionary.ts
import { NotificationPayloads } from "@/lib/notifications/messages";

type InAppTemplateData = {
    title: string;
    message: string;
    action: string | null; // A URL path for redirection on click
};

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
                `${p.employeeName}’s attendance change request for ${p.date} has been refused.`,
        },
        telegram: p =>
            `${p.employeeName}’s attendance change request for ${p.date} has been refused.`,
        inapp: p => `${p.employeeName}’s attendance change request for ${p.date} has been refused.`,
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
            subject: p => `Your Leave Rollback Request Has Been Accepted`,
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
            subject: p => `Your Leave Rollback Request Has Been Refused`,
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
            body: p => `HR approved ${p.employeeName}’s OT request for ${p.date}.`,
        },
        telegram: p => `HR approved ${p.employeeName}’s OT request for ${p.date}.`,
        inapp: p => `HR approved ${p.employeeName}’s OT request for ${p.date}.`,
    },

    OT_REQUEST_REJECTED: {
        email: {
            subject: p => `OT Request Rejected for ${p.employeeName}`,
            body: p => `HR rejected ${p.employeeName}’s OT request for ${p.date}.`,
        },
        telegram: p => `HR rejected ${p.employeeName}’s OT request for ${p.date}.`,
        inapp: p => `HR rejected ${p.employeeName}’s OT request for ${p.date}.`,
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
                `${p.employeeName}’s attendance change request for ${p.date} has been approved.`,
        },
        telegram: p =>
            `${p.employeeName}’s attendance change request for ${p.date} has been approved.`,
        inapp: p =>
            `${p.employeeName}’s attendance change request for ${p.date} has been approved.`,
    },

    TRAINING_MATERIAL_REQUESTED: {
        email: {
            subject: p => `New Training Material Request: ${p.trainingMaterialName}`,
            body: p =>
                `${p.employeeName} has requested for the training material ${p.trainingMaterialName} to be added in the training catalogue.`,
        },
        telegram: p =>
            `${p.employeeName} has requested for the training material ${p.trainingMaterialName} to be added in the training catalogue.`,
        inapp: p =>
            `${p.employeeName} has requested for the training material ${p.trainingMaterialName} to be added in the training catalogue.`,
    },

    TRAINING_MATERIAL_APPROVED: {
        email: {
            subject: p => `Training Material Approved: ${p.trainingMaterialName}`,
            body: p =>
                `${p.employeeName} has approved for the training material ${p.trainingMaterialName} to be added in the training catalogue.`,
        },
        telegram: p =>
            `${p.employeeName} has approved for the training material ${p.trainingMaterialName} to be added in the training catalogue.`,
        inapp: p =>
            `${p.employeeName} has approved for the training material ${p.trainingMaterialName} to be added in the training catalogue.`,
    },

    TRAINING_MATERIAL_PUBLISHED: {
        email: {
            subject: p => `New Training Material Published: ${p.trainingMaterialName}`,
            body: p =>
                `The training material ${p.trainingMaterialName} has been published in the training catalogue.`,
        },
        telegram: p =>
            `The training material ${p.trainingMaterialName} has been published in the training catalogue.`,
        inapp: p =>
            `The training material ${p.trainingMaterialName} has been published in the training catalogue.`,
    },

    MANDATORY_TRAINING_ASSIGNED: {
        email: {
            subject: p => `Mandatory Training Assigned: ${p.trainingMaterialName}`,
            body: p =>
                `The training material ${p.trainingMaterialName} has been assigned to you, it is a mandatory training to complete.`,
        },
        telegram: p =>
            `The training material ${p.trainingMaterialName} has been assigned to you, it is a mandatory training to complete.`,
        inapp: p =>
            `The training material ${p.trainingMaterialName} has been assigned to you, it is a mandatory training to complete.`,
    },

    HIRING_NEED_ISSUED_FOR_REVIEW: {
        email: {
            subject: p => `Hiring Need Issued by ${p.employeeName} for ${p.jobTitle}`,
            body: p =>
                `${p.employeeName} has issued a hiring need for ${p.jobTitle} and is awaiting for your review.`,
        },
        telegram: p =>
            `M: ${p.employeeName} has issued a hiring need for ${p.jobTitle} and is awaiting for your review.`,
        inapp: p =>
            `M: ${p.employeeName} has issued a hiring need for ${p.jobTitle} and is awaiting for your review.`,
    },

    HIRING_NEED_ISSUED_AWAITING_REVIEW: {
        email: {
            subject: p => `Hiring Need Issued by ${p.employeeName} for ${p.jobTitle}`,
            body: p =>
                `${p.employeeName} has issued a hiring need for ${p.jobTitle} and is awaiting manager's review.`,
        },
        telegram: p =>
            `HRM: ${p.employeeName} has issued a hiring need for ${p.jobTitle} and is awaiting manager's review.`,
        inapp: p =>
            `HRM: ${p.employeeName} has issued a hiring need for ${p.jobTitle} and is awaiting manager's review.`,
    },

    HIRING_NEED_APPROVED_FOR_MANAGER: {
        email: {
            subject: p => `Hiring Need for ${p.jobTitle} Approved by ${p.employeeName}`,
            body: p => `${p.employeeName} has approved the hiring need for ${p.jobTitle}.`,
        },
        telegram: p => `M: ${p.employeeName} has approved the hiring need for ${p.jobTitle}.`,
        inapp: p => `M: ${p.employeeName} has approved the hiring need for ${p.jobTitle}.`,
    },

    HIRING_NEED_APPROVED_FOR_HRM: {
        email: {
            subject: p => `Hiring Need for ${p.jobTitle} Approved by ${p.employeeName}`,
            body: p =>
                `${p.employeeName} has approved the hiring need for ${p.jobTitle}, please proceed to job posting.`,
        },
        telegram: p =>
            `HRM: ${p.employeeName} has approved the hiring need for ${p.jobTitle}, please proceed to job posting.`,
        inapp: p =>
            `HRM: ${p.employeeName} has approved the hiring need for ${p.jobTitle}, please proceed to job posting.`,
    },

    JOB_POST_AVAILABLE_FOR_SHARING: {
        email: {
            subject: p => `We're Hiring: ${p.jobTitle}`,
            body: p =>
                `We are looking for a ${p.jobTitle}, please share with your professional circle.`,
        },
        telegram: p =>
            `E: We are looking for a ${p.jobTitle}, please share with your professional circle.`,
        inapp: p =>
            `E: We are looking for a ${p.jobTitle}, please share with your professional circle.`,
    },

    JOB_POST_PUBLISHED: {
        email: {
            subject: p => `Job Post Published: ${p.jobTitle}`,
            body: p => `The job post for ${p.jobTitle} has been published.`,
        },
        telegram: p => `M: The job post for ${p.jobTitle} has been published.`,
        inapp: p => `M: The job post for ${p.jobTitle} has been published.`,
    },
    EVALUATION_CAMPAIGN_REMINDER: {
        email: {
            subject: function (payload: { roundName: string; endDate: string }): string {
                throw new Error("Function not implemented.");
            },
            body: function (payload: { roundName: string; endDate: string }): string {
                throw new Error("Function not implemented.");
            },
        },
        telegram: function (payload: { roundName: string; endDate: string }): string {
            throw new Error("Function not implemented.");
        },
        inapp: function (payload: { roundName: string; endDate: string }): string {
            throw new Error("Function not implemented.");
        },
    },
    OBJECTIVE_SELF_ASSESSMENT_REMINDER: {
        email: {
            subject: function (payload: { roundName: string; endDate: string }): string {
                throw new Error("Function not implemented.");
            },
            body: function (payload: { roundName: string; endDate: string }): string {
                throw new Error("Function not implemented.");
            },
        },
        telegram: function (payload: { roundName: string; endDate: string }): string {
            throw new Error("Function not implemented.");
        },
        inapp: function (payload: { roundName: string; endDate: string }): string {
            throw new Error("Function not implemented.");
        },
    },
    EMPLOYEE_OBJECTIVE_SET: {
        email: {
            subject: p => "Objective Setting",
            body: p =>
                `${p.employeeName} has set an ojbective. Please review, align and acknowledge.`,
        },
        telegram: p =>
            `${p.employeeName} has set an ojbective. Please review, align and acknowledge.`,
        inapp: p => `${p.employeeName} has set an ojbective. Please review, align and acknowledge.`,
    },
    MANAGER_OBJECTIVE_ASSIGNED: {
        email: {
            subject: p => "Objective Setting",
            body: p =>
                "You have a new objective assigned to you. Please review, align and acknowledge.",
        },
        telegram: p =>
            "You have a new objective assigned to you. Please review, align and acknowledge.",
        inapp: p =>
            "You have a new objective assigned to you. Please review, align and acknowledge.",
    },
    EMPLOYEE_OBJECTIVE_ACKNOWLEDGED: {
        email: {
            subject: function (payload: { employeeName: string; objectiveTitle: string }): string {
                throw new Error("Function not implemented.");
            },
            body: function (payload: { employeeName: string; objectiveTitle: string }): string {
                throw new Error("Function not implemented.");
            },
        },
        telegram: function (payload: { employeeName: string; objectiveTitle: string }): string {
            throw new Error("Function not implemented.");
        },
        inapp: function (payload: { employeeName: string; objectiveTitle: string }): string {
            throw new Error("Function not implemented.");
        },
    },
    EMPLOYEE_OBJECTIVE_SELF_ASSESSMENT_COMPLETED: {
        email: {
            subject: function (payload: { employeeName: string }): string {
                throw new Error("Function not implemented.");
            },
            body: function (payload: { employeeName: string }): string {
                throw new Error("Function not implemented.");
            },
        },
        telegram: function (payload: { employeeName: string }): string {
            throw new Error("Function not implemented.");
        },
        inapp: function (payload: { employeeName: string }): string {
            throw new Error("Function not implemented.");
        },
    },
    EMPLOYEE_COMPETENCY_SELF_ASSESSMENT_COMPLETED: {
        email: {
            subject: function (payload: { employeeName: string }): string {
                throw new Error("Function not implemented.");
            },
            body: function (payload: { employeeName: string }): string {
                throw new Error("Function not implemented.");
            },
        },
        telegram: function (payload: { employeeName: string }): string {
            throw new Error("Function not implemented.");
        },
        inapp: function (payload: { employeeName: string }): string {
            throw new Error("Function not implemented.");
        },
    },
    MANAGER_OBJECTIVE_APPROVED: {
        email: {
            subject: function (payload: { objectiveTitle: string }): string {
                throw new Error("Function not implemented.");
            },
            body: function (payload: { objectiveTitle: string }): string {
                throw new Error("Function not implemented.");
            },
        },
        telegram: function (payload: { objectiveTitle: string }): string {
            throw new Error("Function not implemented.");
        },
        inapp: function (payload: { objectiveTitle: string }): string {
            throw new Error("Function not implemented.");
        },
    },
    MANAGER_OBJECTIVE_WEIGHTED: {
        email: {
            subject: function (payload: { employeeName: string }): string {
                throw new Error("Function not implemented.");
            },
            body: function (payload: { employeeName: string }): string {
                throw new Error("Function not implemented.");
            },
        },
        telegram: function (payload: { employeeName: string }): string {
            throw new Error("Function not implemented.");
        },
        inapp: function (payload: { employeeName: string }): string {
            throw new Error("Function not implemented.");
        },
    },
    EMPLOYEE_ISSUE_ESCALATION: {
        email: {
            subject: function (payload: {
                employeeName: string;
                issueTitle: string;
                isAnonymous: boolean;
            }): string {
                throw new Error("Function not implemented.");
            },
            body: function (payload: {
                employeeName: string;
                issueTitle: string;
                isAnonymous: boolean;
            }): string {
                throw new Error("Function not implemented.");
            },
        },
        telegram: function (payload: {
            employeeName: string;
            issueTitle: string;
            isAnonymous: boolean;
        }): string {
            throw new Error("Function not implemented.");
        },
        inapp: function (payload: {
            employeeName: string;
            issueTitle: string;
            isAnonymous: boolean;
        }): string {
            throw new Error("Function not implemented.");
        },
    },
    EMPLOYEE_DA_ACCEPTED: {
        email: {
            subject: function (payload: { employeeName: string }): string {
                throw new Error("Function not implemented.");
            },
            body: function (payload: { employeeName: string }): string {
                throw new Error("Function not implemented.");
            },
        },
        telegram: function (payload: { employeeName: string }): string {
            throw new Error("Function not implemented.");
        },
        inapp: function (payload: { employeeName: string }): string {
            throw new Error("Function not implemented.");
        },
    },
    EMPLOYEE_DA_APPEALED: {
        email: {
            subject: function (payload: { employeeName: string }): string {
                throw new Error("Function not implemented.");
            },
            body: function (payload: { employeeName: string }): string {
                throw new Error("Function not implemented.");
            },
        },
        telegram: function (payload: { employeeName: string }): string {
            throw new Error("Function not implemented.");
        },
        inapp: function (payload: { employeeName: string }): string {
            throw new Error("Function not implemented.");
        },
    },
    MANAGER_DA_SUBMITTED: {
        email: {
            subject: function (payload: { managerName: string; employeeName: string }): string {
                throw new Error("Function not implemented.");
            },
            body: function (payload: { managerName: string; employeeName: string }): string {
                throw new Error("Function not implemented.");
            },
        },
        telegram: function (payload: { managerName: string; employeeName: string }): string {
            throw new Error("Function not implemented.");
        },
        inapp: function (payload: { managerName: string; employeeName: string }): string {
            throw new Error("Function not implemented.");
        },
    },
    HR_DA_APPROVED: {
        email: {
            subject: function (payload: { employeeName: string }): string {
                throw new Error("Function not implemented.");
            },
            body: function (payload: { employeeName: string }): string {
                throw new Error("Function not implemented.");
            },
        },
        telegram: function (payload: { employeeName: string }): string {
            throw new Error("Function not implemented.");
        },
        inapp: function (payload: { employeeName: string }): string {
            throw new Error("Function not implemented.");
        },
    },
    SURVEY_PUBLISHED: {
        email: {
            subject: function (payload: unknown): string {
                throw new Error("Function not implemented.");
            },
            body: function (payload: unknown): string {
                throw new Error("Function not implemented.");
            },
        },
        telegram: function (payload: unknown): string {
            throw new Error("Function not implemented.");
        },
        inapp: function (payload: unknown): string {
            throw new Error("Function not implemented.");
        },
    },
    LEAVE_REQUEST: {
        email: {
            subject: function (payload: {
                name: string;
                leaveId: string;
                firstDay: string;
                lastDay: string;
                type: string;
            }): string {
                throw new Error("Function not implemented.");
            },
            body: function (payload: {
                name: string;
                leaveId: string;
                firstDay: string;
                lastDay: string;
                type: string;
            }): string {
                throw new Error("Function not implemented.");
            },
        },
        telegram: function (payload: {
            name: string;
            leaveId: string;
            firstDay: string;
            lastDay: string;
            type: string;
        }): string {
            throw new Error("Function not implemented.");
        },
        inapp: function (payload: {
            name: string;
            leaveId: string;
            firstDay: string;
            lastDay: string;
            type: string;
        }): string {
            throw new Error("Function not implemented.");
        },
    },
    ANNOUNCEMENT_PUBLISHED: {
        email: {
            subject: function (payload: { announcementTitle: string }): string {
                throw new Error("Function not implemented.");
            },
            body: function (payload: { announcementTitle: string }): string {
                throw new Error("Function not implemented.");
            },
        },
        telegram: function (payload: { announcementTitle: string }): string {
            throw new Error("Function not implemented.");
        },
        inapp: function (payload: { announcementTitle: string }): string {
            throw new Error("Function not implemented.");
        },
    },
    TRANSFER_REQUESTED: {
        email: {
            subject: p => `Transfer Request Submitted by ${p.employeeName}`,
            body: p =>
                `${p.employeeName} has submitted a ${p.transferType} transfer request (${p.transferID}). Please review.`,
        },
        telegram: p =>
            `📋 ${p.employeeName} has submitted a ${p.transferType} transfer request (${p.transferID}). Please review.`,
        inapp: p =>
            `📋 ${p.employeeName} has submitted a ${p.transferType} transfer request (${p.transferID}). Please review.`,
    },
    TRANSFER_APPROVED: {
        email: {
            subject: p => `Transfer Request ${p.transferID} Approved`,
            body: p =>
                `Your ${p.transferType} transfer request (${p.transferID}) has been approved.`,
        },
        telegram: p =>
            `✅ Your ${p.transferType} transfer request (${p.transferID}) has been approved.`,
        inapp: p =>
            `✅ Your ${p.transferType} transfer request (${p.transferID}) has been approved.`,
    },
    TRANSFER_REFUSED: {
        email: {
            subject: p => `Transfer Request ${p.transferID} Refused`,
            body: p =>
                `Your ${p.transferType} transfer request (${p.transferID}) has been refused.${p.remark ? ` Reason: ${p.remark}` : ""}`,
        },
        telegram: p =>
            `❌ Your ${p.transferType} transfer request (${p.transferID}) has been refused.${p.remark ? ` Reason: ${p.remark}` : ""}`,
        inapp: p =>
            `❌ Your ${p.transferType} transfer request (${p.transferID}) has been refused.${p.remark ? ` Reason: ${p.remark}` : ""}`,
    },
    PROMOTION_OFFER: {
        email: {
            subject: p => `🎉 Promotion Offer: ${p.promotionName}`,
            body: p =>
                `Congratulations! You have received a promotion offer for the position of ${p.newPosition} (${p.newGrade}). Your new salary will be $${p.newSalary.toLocaleString()}. Please review and respond.`,
        },
        telegram: p =>
            `🎉 Congratulations! You have received a promotion offer for ${p.newPosition} (${p.newGrade}). New salary: $${p.newSalary.toLocaleString()}.`,
        inapp: p =>
            `🎉 You have received a promotion offer for ${p.newPosition} (${p.newGrade}). Please review the details and accept or reject.`,
    },
    PROMOTION_ACCEPTED: {
        email: {
            subject: p => `Promotion Accepted: ${p.promotionName}`,
            body: p =>
                `${p.employeeName} has accepted the promotion offer for ${p.promotionName}. Please review and proceed with approval.`,
        },
        telegram: p =>
            `✅ ${p.employeeName} has accepted the promotion offer for ${p.promotionName}.`,
        inapp: p =>
            `✅ ${p.employeeName} has accepted the promotion offer for ${p.promotionName}. Please review and approve.`,
    },
    PROMOTION_REFUSED: {
        email: {
            subject: p => `Promotion Refused: ${p.promotionName}`,
            body: p =>
                `${p.employeeName} has refused the promotion offer for ${p.promotionName}.${p.reason ? ` Reason: ${p.reason}` : ""}`,
        },
        telegram: p =>
            `❌ ${p.employeeName} has refused the promotion offer for ${p.promotionName}.${p.reason ? ` Reason: ${p.reason}` : ""}`,
        inapp: p =>
            `❌ ${p.employeeName} has refused the promotion offer for ${p.promotionName}.${p.reason ? ` Reason: ${p.reason}` : ""}`,
    },
    PROMOTION_APPROVED: {
        email: {
            subject: p => `🎉 Promotion Approved: ${p.promotionName}`,
            body: p =>
                `Great news! Your promotion for ${p.promotionName} has been approved! Your new position will be effective soon.`,
        },
        telegram: p => `🎉 Great news! Your promotion for ${p.promotionName} has been approved!`,
        inapp: p =>
            `🎉 Your promotion for ${p.promotionName} has been approved! The changes will be effective soon.`,
    },
    PROMOTION_REJECTED: {
        email: {
            subject: p => `Promotion Update: ${p.promotionName}`,
            body: p =>
                `Your promotion for ${p.promotionName} has been declined.${p.reason ? ` Reason: ${p.reason}` : ""} Please contact HR for more information.`,
        },
        telegram: p =>
            `Your promotion for ${p.promotionName} has been declined.${p.reason ? ` Reason: ${p.reason}` : ""}`,
        inapp: p =>
            `Your promotion for ${p.promotionName} has been declined.${p.reason ? ` Reason: ${p.reason}` : ""} Please contact HR for more information.`,
    },
    PROMOTION_FINALIZED: {
        email: {
            subject: p => `🎊 Promotion Finalized: ${p.promotionName}`,
            body: p =>
                `Your promotion has been finalized! You are now ${p.newPosition} (${p.newGrade}) with a salary of $${p.newSalary.toLocaleString()}. Congratulations!`,
        },
        telegram: p =>
            `🎊 Congratulations! Your promotion to ${p.newPosition} (${p.newGrade}) is now official! New salary: $${p.newSalary.toLocaleString()}.`,
        inapp: p =>
            `🎊 Your promotion to ${p.newPosition} (${p.newGrade}) has been finalized! New salary: $${p.newSalary.toLocaleString()}.`,
    },
    PROMOTION_REOPENED: {
        email: {
            subject: p => `Promotion Reopened: ${p.promotionName}`,
            body: p =>
                `Your promotion offer for ${p.promotionName} has been reopened. Please review and respond.`,
        },
        telegram: p =>
            `Your promotion offer for ${p.promotionName} has been reopened. Please review and respond.`,
        inapp: p =>
            `Your promotion offer for ${p.promotionName} has been reopened. Please review and respond to the offer.`,
    },

    // Delegation notifications
    DELEGATION_CREATED: {
        email: {
            subject: p => `New Delegation Request from ${p.delegatorName}`,
            body: p =>
                `You have been requested to act as a delegate for ${p.delegatorName} from ${p.periodStart} to ${p.periodEnd}. Delegation ID: ${p.delegationID}. Please acknowledge this delegation.`,
        },
        telegram: p =>
            `📋 New delegation request from ${p.delegatorName} (${p.periodStart} to ${p.periodEnd}). ID: ${p.delegationID}. Please acknowledge.`,
        inapp: p =>
            `📋 You have been requested to act as a delegate for ${p.delegatorName}. Please acknowledge this delegation.`,
    },

    DELEGATION_ACKNOWLEDGED: {
        email: {
            subject: p => `Delegation Acknowledged: ${p.delegationID}`,
            body: p =>
                `${p.delegateeName} has acknowledged the delegation from ${p.delegatorName} and is awaiting HR approval.`,
        },
        telegram: p =>
            `✅ ${p.delegateeName} has acknowledged the delegation from ${p.delegatorName}. Awaiting HR approval.`,
        inapp: p => `✅ Delegation acknowledged by ${p.delegateeName}. Awaiting HR approval.`,
    },

    DELEGATION_APPROVED: {
        email: {
            subject: p => `Delegation Approved: ${p.delegationID}`,
            body: p =>
                `Your delegation to ${p.delegateeName} has been approved and is now active from ${p.periodStart} to ${p.periodEnd}.`,
        },
        telegram: p =>
            `✅ Your delegation to ${p.delegateeName} is now active (${p.periodStart} to ${p.periodEnd}).`,
        inapp: p => `✅ Your delegation to ${p.delegateeName} has been approved and is now active.`,
    },

    DELEGATION_REFUSED: {
        email: {
            subject: p => `Delegation Refused: ${p.delegationID}`,
            body: p =>
                `${p.delegateeName} has refused the delegation from ${p.delegatorName}. The delegation request is now closed.`,
        },
        telegram: p => `❌ ${p.delegateeName} has refused the delegation from ${p.delegatorName}.`,
        inapp: p => `❌ Delegation refused by ${p.delegateeName}.`,
    },
};
