import { authorizeRequest } from "@/lib/server/shared/auth/authorization";
import { ManualApiError } from "@/lib/server/shared/errors";
import { SessionClaims } from "@/lib/server/shared/types";
import { getManualRealtimeBroker } from "@/lib/server/shared/realtime/subscription-broker";
import { getCurrentInstanceKey } from "@/lib/server/shared/config";
import { serviceSuccess } from "@/lib/server/shared/result";
import { ModuleSettingsServerRepository } from "@/lib/server/hr-settings/module-settings/module-settings.repository";
import {
    ModuleSettingsRecordMap,
    ModuleSettingsResource,
} from "@/lib/server/hr-settings/module-settings/module-settings.types";

const publishRealtimeEvent = async <TResource extends ModuleSettingsResource>({
    resource,
    operation,
    record,
}: {
    resource: TResource;
    operation: "added" | "modified" | "removed";
    record: { id: string } & Partial<ModuleSettingsRecordMap[TResource]>;
}) => {
    getManualRealtimeBroker().publish({
        operation,
        instanceKey: getCurrentInstanceKey(),
        resource,
        resourceId: record.id,
        payload: record,
    });
};

export class ModuleSettingsService {
    static async listResource<TResource extends ModuleSettingsResource>(
        resource: TResource,
        session: SessionClaims | null,
        filters?: Partial<ModuleSettingsRecordMap[TResource]>,
    ) {
        const instanceKey = getCurrentInstanceKey();
        authorizeRequest({ session, instanceKey, resource, action: "read" });
        const records = await ModuleSettingsServerRepository.list(resource, filters);
        return serviceSuccess(`${resource} loaded successfully.`, { [resource]: records });
    }

    static async getResourceById<TResource extends ModuleSettingsResource>(
        resource: TResource,
        id: string,
        session: SessionClaims | null,
    ) {
        const instanceKey = getCurrentInstanceKey();
        authorizeRequest({ session, instanceKey, resource, action: "read" });
        const record = await ModuleSettingsServerRepository.findById(resource, id);
        if (!record) {
            throw new ManualApiError(
                404,
                "MODULE_SETTINGS_NOT_FOUND",
                `${resource} was not found.`,
            );
        }
        return serviceSuccess(`${resource} loaded successfully.`, { [resource]: [record] });
    }

    static async createResource<TResource extends ModuleSettingsResource>(
        resource: TResource,
        payload: Omit<ModuleSettingsRecordMap[TResource], "id">,
        session: SessionClaims | null,
    ) {
        const instanceKey = getCurrentInstanceKey();
        authorizeRequest({ session, instanceKey, resource, action: "create" });
        const record = await ModuleSettingsServerRepository.create(resource, payload);
        await publishRealtimeEvent({ resource, operation: "added", record });
        return serviceSuccess(`${resource} created successfully.`, { [resource]: [record] });
    }

    static async updateResource<TResource extends ModuleSettingsResource>(
        resource: TResource,
        id: string,
        payload: Partial<ModuleSettingsRecordMap[TResource]>,
        session: SessionClaims | null,
    ) {
        const instanceKey = getCurrentInstanceKey();
        authorizeRequest({ session, instanceKey, resource, action: "update" });
        const record = await ModuleSettingsServerRepository.update(resource, id, payload);
        if (!record) {
            throw new ManualApiError(
                404,
                "MODULE_SETTINGS_NOT_FOUND",
                `${resource} could not be updated.`,
            );
        }
        await publishRealtimeEvent({ resource, operation: "modified", record });
        return serviceSuccess(`${resource} updated successfully.`, { [resource]: [record] });
    }

    static async deleteResource(
        resource: ModuleSettingsResource,
        id: string,
        session: SessionClaims | null,
    ) {
        const instanceKey = getCurrentInstanceKey();
        authorizeRequest({ session, instanceKey, resource, action: "delete" });
        const existing = await ModuleSettingsServerRepository.findById(resource, id);
        if (!existing) {
            throw new ManualApiError(
                404,
                "MODULE_SETTINGS_NOT_FOUND",
                `${resource} was not found.`,
            );
        }
        await ModuleSettingsServerRepository.remove(resource, id);
        await publishRealtimeEvent({ resource, operation: "removed", record: { ...existing, id } });
        return serviceSuccess(`${resource} deleted successfully.`, { deleted: true });
    }
}
