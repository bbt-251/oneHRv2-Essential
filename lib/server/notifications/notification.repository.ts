import { Filter, ObjectId, WithId } from "mongodb";
import type InAppNotificationModel from "@/lib/models/notification";
import { SessionClaims } from "@/lib/server/shared/types";
import { getMongoCollection } from "@/lib/server/shared/db/mongo";
import { publishRealtimeResource } from "@/lib/server/shared/realtime/publish";
import {
    filterDocumentsForSession,
    readString,
    requirePayload,
} from "@/lib/server/shared/service-helpers";

interface NotificationDocument extends Omit<InAppNotificationModel, "id"> {
    _id: string;
    instanceKey?: string;
}

const collectionName = "notifications";

const toModel = (document: WithId<NotificationDocument>): InAppNotificationModel => ({
    id: document._id,
    timestamp: document.timestamp,
    uid: document.uid,
    title: document.title,
    message: document.message,
    action: document.action,
    isRead: document.isRead,
});

const listAllNotifications = async (): Promise<InAppNotificationModel[]> => {
    const collection = await getMongoCollection<NotificationDocument>(collectionName);
    return (await collection.find({}).toArray()).map(toModel);
};

export class NotificationServerRepository {
    static async list(
        filters: Record<string, unknown> | undefined,
        instanceKey: string,
        session: SessionClaims,
    ): Promise<Record<string, unknown>> {
        const uid = readString(filters?.uid);
        const collection = await getMongoCollection<NotificationDocument>(collectionName);
        const query: Filter<NotificationDocument> = uid ? { uid } : {};
        const notifications = (await collection.find(query).toArray()).map(toModel);

        return {
            notifications: filterDocumentsForSession(
                notifications,
                "notifications",
                instanceKey,
                session,
            ),
        };
    }

    static async create(payload: Record<string, unknown>, instanceKey: string) {
        const collection = await getMongoCollection<NotificationDocument>(collectionName);
        const input = requirePayload(payload);
        const document: NotificationDocument = {
            _id: new ObjectId().toHexString(),
            timestamp:
                typeof input.timestamp === "string" ? input.timestamp : new Date().toISOString(),
            uid: typeof input.uid === "string" ? input.uid : "",
            title: typeof input.title === "string" ? input.title : "",
            message: typeof input.message === "string" ? input.message : "",
            action: typeof input.action === "string" || input.action === null ? input.action : null,
            isRead: Boolean(input.isRead),
            instanceKey,
        };

        await collection.insertOne(document);

        const notification = toModel(document as WithId<NotificationDocument>);
        await publishRealtimeResource({
            resource: "notifications",
            resourceId: notification.id ?? document._id,
            payload: await listAllNotifications(),
            resourceOwnerUid: notification.uid,
            instanceKey,
        });

        return {
            notification,
            notifications: [notification],
        };
    }

    static resolveOwnerUid(payload?: Record<string, unknown>): string | undefined {
        return readString(payload?.uid);
    }

    static async deleteByUid(uid: string): Promise<void> {
        const collection = await getMongoCollection<NotificationDocument>(collectionName);
        await collection.deleteMany({ uid });
    }
}
