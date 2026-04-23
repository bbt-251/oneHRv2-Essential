import type InAppNotificationModel from "@/lib/models/notification";

export type NotificationListPayload = {
    notifications: InAppNotificationModel[];
};

export type NotificationRecordPayload = {
    notification: InAppNotificationModel | null;
    notifications?: InAppNotificationModel[];
};
