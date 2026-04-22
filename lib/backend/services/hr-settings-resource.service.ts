import { ManualApiError } from "@/lib/backend/core/errors";
import { inMemoryStore } from "@/lib/backend/persistence/in-memory-store";
import { getManualRealtimeBroker } from "@/lib/backend/realtime/subscription-broker";
import { CompactDataResource, COMPACT_DATA_RESOURCES } from "@/lib/backend/services/resource-types";
import { requirePayload, toRecord } from "@/lib/backend/services/service-helpers";

const HR_SETTINGS_RESOURCES = new Set<CompactDataResource>([
    "companyInfo",
    "leaveSettings",
    "departmentSettings",
    "sectionSettings",
    "notificationTypes",
    "locations",
    "maritalStatuses",
    "contractTypes",
    "contractHours",
    "reasonOfLeaving",
    "probationDays",
    "salaryScales",
    "leaveTypes",
    "eligibleLeaveDays",
    "backdateCapabilities",
    "accrualConfigurations",
    "holidays",
    "shiftHours",
    "shiftTypes",
    "overtimeTypes",
    "grades",
    "positions",
    "levelOfEducations",
    "yearsOfExperiences",
    "announcementTypes",
    "paymentTypes",
    "deductionTypes",
    "loanTypes",
    "taxes",
    "currencies",
    "pension",
]);

const matchesFilters = (record: Record<string, unknown>, filters?: Record<string, unknown>) => {
    if (!filters) {
        return true;
    }

    return Object.entries(filters).every(([key, value]) => {
        if (value === undefined) {
            return true;
        }

        return record[key] === value;
    });
};

export const isHrSettingsResource = (resource: CompactDataResource): boolean =>
    HR_SETTINGS_RESOURCES.has(resource);

export const listHrSettingsResourceForSession = async ({
    resource,
    filters,
}: {
    resource: CompactDataResource;
    instanceKey: string;
    session: unknown;
    filters?: Record<string, unknown>;
}): Promise<Record<string, unknown>> => {
    if (!isHrSettingsResource(resource)) {
        throw new ManualApiError(
            400,
            "UNKNOWN_RESOURCE",
            `Unsupported HR settings resource ${resource}.`,
        );
    }

    const documents = inMemoryStore
        .queryCollection(resource)
        .map(entry => toRecord(entry.data))
        .filter(entry => matchesFilters(entry, filters));

    return {
        [resource]: documents,
    };
};

export const mutateHrSettingsResource = async ({
    resource,
    action,
    instanceKey,
    payload,
    targetId,
}: {
    resource: CompactDataResource;
    action: "create" | "update" | "delete";
    instanceKey: string;
    payload?: Record<string, unknown>;
    targetId?: string;
}): Promise<Record<string, unknown>> => {
    if (!isHrSettingsResource(resource)) {
        throw new ManualApiError(
            400,
            "UNKNOWN_RESOURCE",
            `Unsupported HR settings resource ${resource}.`,
        );
    }

    const broker = getManualRealtimeBroker();

    if (action === "create") {
        const input = toRecord(requirePayload(payload));
        const createdDocument = inMemoryStore.createDocument(resource, input);
        const createdRecord = {
            ...input,
            id: createdDocument.id,
        };
        inMemoryStore.setDocument(`${resource}/${createdDocument.id}`, createdRecord);
        broker.publish({
            operation: "added",
            instanceKey,
            resource,
            resourceId: createdDocument.id,
            payload: createdRecord,
        });
        return {
            [resource]: [createdRecord],
        };
    }

    if (!targetId) {
        throw new ManualApiError(400, "TARGET_ID_REQUIRED", "targetId is required.");
    }

    const targetPath = `${resource}/${targetId}`;
    const currentRecord = toRecord(inMemoryStore.getDocument(targetPath)?.data);

    if (action === "update") {
        const input = toRecord(requirePayload(payload));
        inMemoryStore.updateDocument(targetPath, input);
        const updatedRecord = {
            ...currentRecord,
            ...input,
            id: targetId,
        };
        broker.publish({
            operation: "modified",
            instanceKey,
            resource,
            resourceId: targetId,
            payload: updatedRecord,
        });
        return {
            [resource]: [updatedRecord],
        };
    }

    inMemoryStore.deleteDocument(targetPath);
    broker.publish({
        operation: "removed",
        instanceKey,
        resource,
        resourceId: targetId,
        payload: {
            ...currentRecord,
            id: targetId,
        },
    });
    return { deleted: true };
};

export const compactDataResources = COMPACT_DATA_RESOURCES;
