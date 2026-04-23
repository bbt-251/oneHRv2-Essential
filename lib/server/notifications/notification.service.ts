import { authorizeRequest } from "@/lib/server/shared/auth/authorization";
import { ManualApiError } from "@/lib/server/shared/errors";
import { SessionClaims } from "@/lib/server/shared/types";
import { getCurrentInstanceKey } from "@/lib/server/shared/config";
import { serviceSuccess } from "@/lib/server/shared/result";
import { NotificationServerRepository } from "@/lib/server/notifications/notification.repository";
import {
    NotificationListPayload,
    NotificationRecordPayload,
} from "@/lib/server/notifications/notification.types";

export class NotificationService {
    static async list(filters: Record<string, unknown>, session: SessionClaims | null) {
        const instanceKey = getCurrentInstanceKey();
        const authorizedSession = authorizeRequest({
            session,
            instanceKey,
            resource: "notifications",
            action: "read",
        });

        const data = await NotificationServerRepository.list(
            filters,
            instanceKey,
            authorizedSession,
        );
        return serviceSuccess<NotificationListPayload>(
            "Notifications loaded successfully.",
            data as NotificationListPayload,
        );
    }

    static async create(payload: Record<string, unknown>, session: SessionClaims | null) {
        const instanceKey = getCurrentInstanceKey();
        authorizeRequest({
            session,
            instanceKey,
            resource: "notifications",
            action: "create",
        });

        const uid = NotificationServerRepository.resolveOwnerUid(payload);
        if (!uid) {
            throw new ManualApiError(
                400,
                "NOTIFICATION_UID_REQUIRED",
                "Notification uid is required.",
            );
        }

        const data = await NotificationServerRepository.create(payload, instanceKey);
        return serviceSuccess<NotificationRecordPayload>(
            "Notification created successfully.",
            data as NotificationRecordPayload,
        );
    }
}
