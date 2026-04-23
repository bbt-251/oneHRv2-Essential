import { filterReadableDocuments } from "@/lib/server/shared/auth/database-rules";
import { SessionClaims } from "@/lib/server/shared/types";
import { getCurrentInstanceKey } from "@/lib/shared/config";
import { getMongoDb } from "@/lib/server/shared/db/mongo";
import { getManualRealtimeBroker } from "@/lib/server/shared/realtime/subscription-broker";
import { CompactDataResource } from "@/lib/server/shared/resource-types";
import { DataResourceDispatcher } from "@/lib/server/shared/data-resource-dispatcher";
import { toRecord } from "@/lib/server/shared/service-helpers";
import { CORE_SETTINGS_RESOURCES } from "@/lib/server/hr-settings/core-settings/core-settings.types";
import { MODULE_SETTINGS_RESOURCES } from "@/lib/server/hr-settings/module-settings/module-settings.types";
import { ChangeStream } from "mongodb";

export const getRealtimeBroker = () => getManualRealtimeBroker();

type MongoWatchSpec = {
    collectionName: string;
    resource: CompactDataResource;
    getResourceOwnerUid: (document: Record<string, unknown>) => string | undefined;
};

const mongoWatchSpecs: MongoWatchSpec[] = [
    {
        collectionName: "employee",
        resource: "employees",
        getResourceOwnerUid: document => document.uid as string | undefined,
    },
    {
        collectionName: "attendance",
        resource: "attendances",
        getResourceOwnerUid: document =>
            (document.uid as string | undefined) || (document.employeeUid as string | undefined),
    },
    {
        collectionName: "leaveManagements",
        resource: "leaveManagements",
        getResourceOwnerUid: document =>
            (document.requestedFor as string | undefined) ||
            (document.employeeID as string | undefined) ||
            (document.requestedBy as string | undefined),
    },
    {
        collectionName: "overtimeRequests",
        resource: "overtimeRequests",
        getResourceOwnerUid: document =>
            Array.isArray(document.employeeUids)
                ? (document.employeeUids[0] as string | undefined)
                : undefined,
    },
    {
        collectionName: "requestModifications",
        resource: "requestModifications",
        getResourceOwnerUid: document => document.uid as string | undefined,
    },
    {
        collectionName: "lateComers",
        resource: "lateComers",
        getResourceOwnerUid: document => document.employeeUID as string | undefined,
    },
    {
        collectionName: "notifications",
        resource: "notifications",
        getResourceOwnerUid: document => document.uid as string | undefined,
    },
    {
        collectionName: "projects",
        resource: "projects",
        getResourceOwnerUid: document =>
            Array.isArray(document.employeeAllocations) &&
            document.employeeAllocations.length > 0 &&
            typeof document.employeeAllocations[0] === "object" &&
            document.employeeAllocations[0] !== null
                ? ((document.employeeAllocations[0] as Record<string, unknown>).uid as
                      | string
                      | undefined)
                : Array.isArray(document.assignedMembers)
                    ? (document.assignedMembers[0] as string | undefined)
                    : undefined,
    },
    {
        collectionName: "headerDocuments",
        resource: "headerDocuments",
        getResourceOwnerUid: () => undefined,
    },
    {
        collectionName: "footerDocuments",
        resource: "footerDocuments",
        getResourceOwnerUid: () => undefined,
    },
    {
        collectionName: "signatureDocuments",
        resource: "signatureDocuments",
        getResourceOwnerUid: () => undefined,
    },
    {
        collectionName: "stampDocuments",
        resource: "stampDocuments",
        getResourceOwnerUid: () => undefined,
    },
    {
        collectionName: "initialDocuments",
        resource: "initialDocuments",
        getResourceOwnerUid: () => undefined,
    },
    ...CORE_SETTINGS_RESOURCES.map(
        resource =>
            ({
                collectionName: resource,
                resource,
                getResourceOwnerUid: () => undefined,
            }) satisfies MongoWatchSpec,
    ),
    ...MODULE_SETTINGS_RESOURCES.filter(
        resource =>
            ![
                "headerDocuments",
                "footerDocuments",
                "signatureDocuments",
                "stampDocuments",
                "initialDocuments",
            ].includes(resource),
    ).map(
        resource =>
            ({
                collectionName: resource,
                resource,
                getResourceOwnerUid: () => undefined,
            }) satisfies MongoWatchSpec,
    ),
];

let mongoWatchersStarted = false;
let mongoWatchersStarting: Promise<void> | null = null;
const activeMongoStreams: ChangeStream[] = [];

const normalizeMongoDocument = (document: Record<string, unknown>) => ({
    ...document,
    id: typeof document._id === "string" ? document._id : (document._id?.toString?.() ?? undefined),
});

const mapMongoOperation = (operationType: string): "added" | "modified" | "removed" | null => {
    switch (operationType) {
        case "insert":
            return "added";
        case "replace":
        case "update":
            return "modified";
        case "delete":
            return "removed";
        default:
            return null;
    }
};

const getRealtimeResourceOwnerAccessor = (
    resource: string,
): ((document: unknown) => string | undefined) => {
    switch (resource as CompactDataResource | "requestModifications" | "notifications") {
        case "employees":
            return document => toRecord(document).uid as string | undefined;
        case "dependents":
            return document => toRecord(document).relatedTo as string | undefined;
        case "attendances":
            return document => {
                const record = toRecord(document);
                return (
                    (record.employeeUid as string | undefined) ||
                    (record.uid as string | undefined) ||
                    (Array.isArray(record.employeeUids)
                        ? (record.employeeUids[0] as string | undefined)
                        : undefined) ||
                    (Array.isArray(record.employees)
                        ? (record.employees[0] as string | undefined)
                        : undefined)
                );
            };
        case "leaveManagements":
            return document => {
                const record = toRecord(document);
                return (
                    (record.requestedFor as string | undefined) ||
                    (record.employeeID as string | undefined) ||
                    (record.requestedBy as string | undefined) ||
                    (record.employeeUid as string | undefined) ||
                    (Array.isArray(record.employees)
                        ? (record.employees[0] as string | undefined)
                        : undefined)
                );
            };
        case "employeeLoans":
        case "compensations":
            return document => {
                const record = toRecord(document);
                return (
                    (record.employeeUid as string | undefined) ||
                    (Array.isArray(record.employees)
                        ? (record.employees[0] as string | undefined)
                        : undefined)
                );
            };
        case "requestModifications":
        case "notifications":
            return document => toRecord(document).uid as string | undefined;
        case "projects":
            return document => {
                const record = toRecord(document);
                if (
                    Array.isArray(record.employeeAllocations) &&
                    record.employeeAllocations.length > 0
                ) {
                    const firstAllocation = toRecord(record.employeeAllocations[0]);
                    return firstAllocation.uid as string | undefined;
                }

                return Array.isArray(record.assignedMembers)
                    ? (record.assignedMembers[0] as string | undefined)
                    : undefined;
            };
        default:
            return () => undefined;
    }
};

export const ensureMongoRealtimeWatchers = async (): Promise<void> => {
    if (mongoWatchersStarted) {
        return;
    }

    if (mongoWatchersStarting) {
        await mongoWatchersStarting;
        return;
    }

    mongoWatchersStarting = (async () => {
        try {
            const db = await getMongoDb();
            const broker = getRealtimeBroker();

            mongoWatchSpecs.forEach(spec => {
                const stream = db.collection(spec.collectionName).watch([], {
                    fullDocument: "updateLookup",
                });

                stream.on("change", change => {
                    const operation = mapMongoOperation(change.operationType);
                    if (!operation) {
                        return;
                    }

                    const resourceId = change.documentKey?._id?.toString?.();
                    if (!resourceId) {
                        return;
                    }

                    const fullDocument =
                        change.fullDocument && typeof change.fullDocument === "object"
                            ? normalizeMongoDocument(change.fullDocument as Record<string, unknown>)
                            : undefined;

                    broker.publish({
                        operation,
                        instanceKey: getCurrentInstanceKey(),
                        resource: spec.resource,
                        resourceId,
                        payload: fullDocument ?? {},
                        resourceOwnerUid: fullDocument
                            ? spec.getResourceOwnerUid(fullDocument)
                            : undefined,
                    });
                });

                stream.on("error", error => {
                    console.error("[stream-service] mongo change stream error", {
                        collectionName: spec.collectionName,
                        error: error instanceof Error ? error.message : error,
                    });
                });

                activeMongoStreams.push(stream);
            });

            mongoWatchersStarted = true;
        } catch (error) {
            console.error("[stream-service] failed to start mongo realtime watchers", {
                error: error instanceof Error ? error.message : error,
            });
        } finally {
            mongoWatchersStarting = null;
        }
    })();

    await mongoWatchersStarting;
};

export const loadInitialRealtimeSnapshot = async ({
    resource,
    session,
    instanceKey,
    filters,
}: {
    resource: string;
    session: SessionClaims;
    instanceKey: string;
    filters?: {
        uid?: string;
    };
}): Promise<Record<string, unknown[]>> => {
    const compactSnapshot = await DataResourceDispatcher.query({
        resource: resource as CompactDataResource,
        instanceKey,
        session,
        filters: filters?.uid ? { uid: filters.uid } : {},
    });

    const documents = (compactSnapshot[resource] as unknown[]) ?? [];

    return {
        [resource]: filterReadableDocuments(documents, {
            session,
            instanceKey,
            resource,
            getResourceOwnerUid: getRealtimeResourceOwnerAccessor(resource),
        }),
    };
};
