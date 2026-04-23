import { ManualApiError } from "@/lib/server/shared/errors";
import { getManualRealtimeBroker } from "@/lib/server/shared/realtime/subscription-broker";
import { CompactDataResource, COMPACT_DATA_RESOURCES } from "@/lib/server/shared/resource-types";
import { requirePayload, toRecord } from "@/lib/server/shared/service-helpers";
import { CoreSettingsServerRepository } from "@/lib/server/hr-settings/core-settings/core-settings.repository";
import { isCoreSettingsResource } from "@/lib/server/hr-settings/core-settings/core-settings.types";
import { isModuleSettingsResource } from "@/lib/server/hr-settings/module-settings/module-settings.types";
import { ModuleSettingsServerRepository } from "@/lib/server/hr-settings/module-settings/module-settings.repository";

const HR_SETTINGS_RESOURCES = new Set<CompactDataResource>([
    "companyInfo",
    "leaveSettings",
    "attendanceLogic",
    "flexibilityParameter",
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
    "headerDocuments",
    "footerDocuments",
    "signatureDocuments",
    "stampDocuments",
    "initialDocuments",
]);

export const isSettingsResource = (resource: CompactDataResource): boolean =>
    HR_SETTINGS_RESOURCES.has(resource);

export const listSettingsResourceForSession = async ({
    resource,
    filters,
}: {
    resource: CompactDataResource;
    instanceKey: string;
    session: unknown;
    filters?: Record<string, unknown>;
}): Promise<Record<string, unknown>> => {
    if (!isSettingsResource(resource)) {
        throw new ManualApiError(
            400,
            "UNKNOWN_RESOURCE",
            `Unsupported HR settings resource ${resource}.`,
        );
    }

    if (isCoreSettingsResource(resource)) {
        const documents = await CoreSettingsServerRepository.list(resource, filters as never);

        return {
            [resource]: documents,
        };
    }

    if (isModuleSettingsResource(resource)) {
        const documents = await ModuleSettingsServerRepository.list(resource, filters as never);

        return {
            [resource]: documents,
        };
    }

    throw new ManualApiError(
        400,
        "UNKNOWN_HR_SETTINGS_RESOURCE",
        `Unsupported HR settings resource ${resource}.`,
    );
};

export const mutateSettingsResource = async ({
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
    if (!isSettingsResource(resource)) {
        throw new ManualApiError(
            400,
            "UNKNOWN_RESOURCE",
            `Unsupported HR settings resource ${resource}.`,
        );
    }

    const broker = getManualRealtimeBroker();

    if (isCoreSettingsResource(resource)) {
        if (action === "create") {
            const input = toRecord(requirePayload(payload));
            const createdRecord = await CoreSettingsServerRepository.create(
                resource,
                input as never,
            );
            broker.publish({
                operation: "added",
                instanceKey,
                resource,
                resourceId: createdRecord.id,
                payload: createdRecord,
            });
            return {
                [resource]: [createdRecord],
            };
        }

        if (!targetId) {
            throw new ManualApiError(400, "TARGET_ID_REQUIRED", "targetId is required.");
        }

        const currentRecord = await CoreSettingsServerRepository.findById(resource, targetId);

        if (action === "update") {
            const input = toRecord(requirePayload(payload));
            const updatedRecord = await CoreSettingsServerRepository.update(
                resource,
                targetId,
                input as never,
            );

            broker.publish({
                operation: "modified",
                instanceKey,
                resource,
                resourceId: targetId,
                payload: updatedRecord ?? {
                    ...currentRecord,
                    ...input,
                    id: targetId,
                },
            });
            return {
                [resource]: updatedRecord ? [updatedRecord] : [],
            };
        }

        await CoreSettingsServerRepository.remove(resource, targetId);
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
    }

    if (isModuleSettingsResource(resource)) {
        if (action === "create") {
            const input = toRecord(requirePayload(payload));
            const createdRecord = await ModuleSettingsServerRepository.create(
                resource,
                input as never,
            );
            broker.publish({
                operation: "added",
                instanceKey,
                resource,
                resourceId: createdRecord.id,
                payload: createdRecord,
            });
            return { [resource]: [createdRecord] };
        }

        if (!targetId) {
            throw new ManualApiError(400, "TARGET_ID_REQUIRED", "targetId is required.");
        }

        const currentRecord = await ModuleSettingsServerRepository.findById(resource, targetId);

        if (action === "update") {
            const input = toRecord(requirePayload(payload));
            const updatedRecord = await ModuleSettingsServerRepository.update(
                resource,
                targetId,
                input as never,
            );
            broker.publish({
                operation: "modified",
                instanceKey,
                resource,
                resourceId: targetId,
                payload: updatedRecord ?? {
                    ...currentRecord,
                    ...input,
                    id: targetId,
                },
            });
            return { [resource]: updatedRecord ? [updatedRecord] : [] };
        }

        await ModuleSettingsServerRepository.remove(resource, targetId);
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
    }

    throw new ManualApiError(
        400,
        "UNKNOWN_HR_SETTINGS_RESOURCE",
        `Unsupported HR settings resource ${resource}.`,
    );
};

export const compactDataResources = COMPACT_DATA_RESOURCES;
