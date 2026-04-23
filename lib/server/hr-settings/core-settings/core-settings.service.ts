import { authorizeRequest } from "@/lib/server/shared/auth/authorization";
import { ManualApiError } from "@/lib/server/shared/errors";
import { SessionClaims } from "@/lib/server/shared/types";
import { getManualRealtimeBroker } from "@/lib/server/shared/realtime/subscription-broker";
import { getCurrentInstanceKey } from "@/lib/server/shared/config";
import { serviceSuccess } from "@/lib/server/shared/result";
import { CoreSettingsServerRepository } from "@/lib/server/hr-settings/core-settings/core-settings.repository";
import {
    CoreSettingsRecordMap,
    CoreSettingsResource,
} from "@/lib/server/hr-settings/core-settings/core-settings.types";

const publishRealtimeEvent = async <TResource extends CoreSettingsResource>({
    resource,
    operation,
    record,
}: {
    resource: TResource;
    operation: "added" | "modified" | "removed";
    record: { id: string } & Partial<CoreSettingsRecordMap[TResource]>;
}) => {
    const broker = getManualRealtimeBroker();
    broker.publish({
        operation,
        instanceKey: getCurrentInstanceKey(),
        resource,
        resourceId: record.id,
        payload: record,
    });
};

export class CoreSettingsService {
    static async listResource<TResource extends CoreSettingsResource>(
        resource: TResource,
        session: SessionClaims | null,
        filters?: Partial<CoreSettingsRecordMap[TResource]>,
    ) {
        const instanceKey = getCurrentInstanceKey();
        authorizeRequest({
            session,
            instanceKey,
            resource,
            action: "read",
        });

        const records = await CoreSettingsServerRepository.list(resource, filters);
        return serviceSuccess(`${resource} loaded successfully.`, {
            [resource]: records,
        });
    }

    static async getResourceById<TResource extends CoreSettingsResource>(
        resource: TResource,
        id: string,
        session: SessionClaims | null,
    ) {
        const instanceKey = getCurrentInstanceKey();
        authorizeRequest({
            session,
            instanceKey,
            resource,
            action: "read",
        });

        const record = await CoreSettingsServerRepository.findById(resource, id);
        if (!record) {
            throw new ManualApiError(404, "CORE_SETTINGS_NOT_FOUND", `${resource} was not found.`);
        }

        return serviceSuccess(`${resource} loaded successfully.`, {
            [resource]: [record],
        });
    }

    static async createResource<TResource extends CoreSettingsResource>(
        resource: TResource,
        payload: Omit<CoreSettingsRecordMap[TResource], "id">,
        session: SessionClaims | null,
    ) {
        const instanceKey = getCurrentInstanceKey();
        authorizeRequest({
            session,
            instanceKey,
            resource,
            action: "create",
        });

        const record = await CoreSettingsServerRepository.create(resource, payload);
        await publishRealtimeEvent({
            resource,
            operation: "added",
            record,
        });

        return serviceSuccess(`${resource} created successfully.`, {
            [resource]: [record],
        });
    }

    static async updateResource<TResource extends CoreSettingsResource>(
        resource: TResource,
        id: string,
        payload: Partial<CoreSettingsRecordMap[TResource]>,
        session: SessionClaims | null,
    ) {
        const instanceKey = getCurrentInstanceKey();
        authorizeRequest({
            session,
            instanceKey,
            resource,
            action: "update",
        });

        const record = await CoreSettingsServerRepository.update(resource, id, payload);
        if (!record) {
            throw new ManualApiError(
                404,
                "CORE_SETTINGS_NOT_FOUND",
                `${resource} could not be updated.`,
            );
        }

        await publishRealtimeEvent({
            resource,
            operation: "modified",
            record,
        });

        return serviceSuccess(`${resource} updated successfully.`, {
            [resource]: [record],
        });
    }

    static async deleteResource(
        resource: CoreSettingsResource,
        id: string,
        session: SessionClaims | null,
    ) {
        const instanceKey = getCurrentInstanceKey();
        authorizeRequest({
            session,
            instanceKey,
            resource,
            action: "delete",
        });

        const existing = await CoreSettingsServerRepository.findById(resource, id);
        if (!existing) {
            throw new ManualApiError(404, "CORE_SETTINGS_NOT_FOUND", `${resource} was not found.`);
        }

        await CoreSettingsServerRepository.remove(resource, id);
        await publishRealtimeEvent({
            resource,
            operation: "removed",
            record: { ...existing, id },
        });

        return serviceSuccess(`${resource} deleted successfully.`, {
            deleted: true,
        });
    }
}
