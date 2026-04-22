import { filterReadableDocuments } from "@/lib/backend/database-rules";
import { SessionClaims } from "@/lib/backend/core/types";
import { getCurrentInstanceKey } from "@/lib/backend/config";
import { getMongoDb } from "@/lib/backend/persistence/mongo";
import { loadRealtimeSnapshot } from "@/lib/backend/realtime/resource-snapshot";
import { getManualRealtimeBroker } from "@/lib/backend/realtime/subscription-broker";
import { CompactDataResource } from "@/lib/backend/services/resource-types";
import { queryCompactResource } from "@/lib/backend/services/data-dispatcher.service";
import { toRecord } from "@/lib/backend/services/service-helpers";
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
        default:
            return () => undefined;
    }
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
    const compactResource = resource as CompactDataResource;
    try {
        const compactSnapshot = await queryCompactResource({
            resource: compactResource,
            instanceKey,
            session,
            filters: filters?.uid ? { uid: filters.uid } : {},
        });

        const compactDocuments = (compactSnapshot[resource] as unknown[]) ?? [];
        if (Array.isArray(compactDocuments)) {
            return {
                [resource]: compactDocuments,
            };
        }
    } catch {
        // Fall through to legacy snapshot loading for resources that are still backed by
        // the transitional realtime snapshot store.
    }

    const snapshot = await loadRealtimeSnapshot(resource, filters);
    const documents = (snapshot[resource] as unknown[]) ?? [];

    return {
        [resource]: filterReadableDocuments(documents, {
            session,
            instanceKey,
            resource,
            getResourceOwnerUid: getRealtimeResourceOwnerAccessor(resource),
        }),
    };
};
