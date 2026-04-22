import { inMemoryStore } from "@/lib/backend/persistence/in-memory-store";
import { getManualRealtimeBroker } from "@/lib/backend/realtime/subscription-broker";
import { requirePayload, toRecord } from "@/lib/backend/services/service-helpers";

export const mutateNotification = async ({
    action,
    payload,
    instanceKey,
}: {
    action: "create" | "update" | "delete";
    payload?: Record<string, unknown>;
    targetId?: string;
    instanceKey: string;
}): Promise<Record<string, unknown>> => {
    if (action !== "create") {
        throw new Error(`Unsupported ${action} operation for notifications.`);
    }

    const input = toRecord(requirePayload(payload));
    const uid = typeof input.uid === "string" ? input.uid : "";

    if (!uid) {
        throw new Error("Notification uid is required.");
    }

    const notification = {
        ...input,
        uid,
        instanceKey,
    };

    const document = inMemoryStore.createDocument("notifications", notification);
    const createdNotification = {
        ...notification,
        id: document.id,
    };

    getManualRealtimeBroker().publish({
        operation: "added",
        instanceKey,
        resource: "notifications",
        resourceId: document.id,
        payload: createdNotification,
        resourceOwnerUid: uid,
        actorUid: uid,
    });

    return {
        notification: createdNotification,
        notifications: [createdNotification],
    };
};
