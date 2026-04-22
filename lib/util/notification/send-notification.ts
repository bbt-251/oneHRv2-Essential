import { NotificationPayloads } from "@/lib/notifications/messages";
import { NotificationUser } from "@/lib/notifications/types";
import { sendEmail, sendInApp, sendTelegram } from "./channels";
import { messages } from "./message-dictionary";

const messageKeyTitles: Partial<Record<keyof typeof messages, string>> = {
    CLOCK_OUT: "Clock-Out Notification",
    LEAVE_REQUEST: "Leave Request",
    LEAVE_REQUEST_SUBMITTED_TO_MANAGER: "Leave Request Submitted",
    ATTENDANCE_CHANGE_REFUSED_FOR_EMPLOYEE: "Attendance Change Request Refused",
    ATTENDANCE_CHANGE_REFUSED_FOR_MANAGER: "Attendance Change Request Refused",
    LEAVE_REQUEST_APPROVED: "Leave Request Approved",
    LEAVE_REQUEST_REFUSED: "Leave Request Refused",
    ASSIGNED_AS_STAND_IN: "Stand-In Assignment",
    LEAVE_ROLLBACK_INITIATED: "Leave Rollback Initiated",
    LEAVE_ROLLBACK_ACCEPTED: "Leave Rollback Accepted",
    LEAVE_ROLLBACK_REFUSED: "Leave Rollback Refused",
    ON_BEHALF_LEAVE_SUBMITTED: "Leave Request Submitted On Behalf",
    OT_REQUEST_SUBMITTED: "Overtime Request Submitted",
    OT_REQUEST_APPROVED: "Overtime Request Approved",
    OT_REQUEST_REJECTED: "Overtime Request Rejected",
    ATTENDANCE_CHANGE_REQUEST_SUBMITTED: "Attendance Change Request Submitted",
    ATTENDANCE_CHANGE_REQUEST_APPROVED: "Attendance Change Request Approved",
};

export function getTitleFromMessageKey(messageKey: keyof typeof messages): string {
    return (
        messageKeyTitles[messageKey] ||
        messageKey.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())
    );
}

type Channel = "email" | "telegram" | "inapp";

interface NotificationRecipient extends NotificationUser {
    recipientType?: "hr" | "employee" | "manager";
}

interface NotificationOptions<K extends keyof NotificationPayloads> {
    users: NotificationUser[] | NotificationRecipient[];
    channels: Channel[];
    messageKey: K;
    payload: NotificationPayloads[K];
    title: string;
    action?: string | null;
    getCustomMessage?: (
        recipientType: "hr" | "employee" | "manager",
        payload: NotificationPayloads[K],
    ) => {
        telegram?: string;
        inapp?: string;
        email?: { subject: string; body: string };
    };
}

export async function sendNotification<K extends keyof NotificationPayloads>({
    users,
    channels,
    messageKey,
    payload,
    title,
    action,
    getCustomMessage,
}: NotificationOptions<K>) {
    const msg = messages[messageKey];

    console.log(
        `Sending ${messageKey} notification to ${users.length} users via ${channels.join(", ")}`,
    );

    // Group users by channel and recipient type for batch processing
    const channelStats = {
        email: { total: 0, success: 0, errors: 0 },
        telegram: { total: 0, success: 0, errors: 0 },
        inapp: { total: 0, success: 0, errors: 0 },
    };

    const tasks = users.flatMap(user => {
        const recipientType = (user as NotificationRecipient).recipientType || "hr";

        return channels.map(async ch => {
            try {
                // Get custom message if provided, otherwise use default
                let customMsg = null;
                if (getCustomMessage) {
                    customMsg = getCustomMessage(recipientType, payload);
                }

                if (ch === "email" && user.email) {
                    channelStats.email.total++;
                    const emailSubject = customMsg?.email?.subject || msg.email.subject(payload);
                    const emailBody = customMsg?.email?.body || msg.email.body(payload);

                    try {
                        await sendEmail(user.email, emailSubject, emailBody);
                        channelStats.email.success++;
                    } catch {
                        channelStats.email.errors++;
                    }
                }

                if (ch === "telegram" && user.telegramChatID) {
                    channelStats.telegram.total++;
                    const telegramMessage = customMsg?.telegram || msg.telegram(payload);
                    try {
                        await sendTelegram(user.telegramChatID, telegramMessage);
                        channelStats.telegram.success++;
                    } catch {
                        channelStats.telegram.errors++;
                    }
                }

                if (ch === "inapp") {
                    channelStats.inapp.total++;
                    const inAppMessage = customMsg?.inapp || msg.inapp(payload);
                    try {
                        await sendInApp(user.uid, inAppMessage, title, action);
                        channelStats.inapp.success++;
                    } catch {
                        channelStats.inapp.errors++;
                    }
                }
            } catch (error) {
                if (ch === "email") channelStats.email.errors++;
                if (ch === "telegram") channelStats.telegram.errors++;
                if (ch === "inapp") channelStats.inapp.errors++;

                console.error(
                    `[${ch === "telegram" ? "Telegram" : ch === "email" ? "Email" : "InApp"}] - Error: Failed to send ${ch} notification for ${messageKey} (${recipientType}):`,
                    {
                        error: error instanceof Error ? error.message : error,
                        user: {
                            uid: user.uid,
                            email: user.email,
                            telegramChatID: user.telegramChatID
                                ? `${user.telegramChatID.substring(0, 5)}...`
                                : undefined,
                        },
                        channel: ch,
                        messageKey,
                        recipientType,
                    },
                );
                // Don't throw the error to prevent breaking the entire notification process
            }
        });
    });

    try {
        await Promise.all(tasks);

        // Log summary for each channel
        Object.entries(channelStats).forEach(([channel, stats]) => {
            if (stats.total > 0) {
                if (stats.errors === 0) {
                    console.log(
                        `${channel} notifications: ${stats.success}/${stats.total} sent successfully`,
                    );
                } else {
                    console.log(
                        `${channel} notifications: ${stats.success}/${stats.total} sent, ${stats.errors} errors`,
                    );
                }
            }
        });
    } catch (error) {
        console.error(`[SendNotification] - Error: Error in Promise.all for ${messageKey}:`, {
            error: error instanceof Error ? error.message : error,
            stack: error instanceof Error ? error.stack : undefined,
            messageKey,
            userCount: users.length,
            channels,
        });
    }
}
