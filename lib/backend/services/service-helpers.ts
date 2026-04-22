import { filterReadableDocuments } from "@/lib/backend/database-rules";
import { ManualApiError } from "@/lib/backend/core/errors";
import { SessionClaims } from "@/lib/backend/core/types";
import { CompactDataResource } from "@/lib/backend/services/resource-types";

export const toRecord = (value: unknown): Record<string, unknown> =>
    value && typeof value === "object" ? (value as Record<string, unknown>) : {};

export const readString = (value: unknown): string | undefined =>
    typeof value === "string" && value.trim() ? value : undefined;

export const requirePayload = (payload?: Record<string, unknown>): Record<string, unknown> => {
    if (!payload) {
        throw new ManualApiError(400, "PAYLOAD_REQUIRED", "payload is required.");
    }

    return payload;
};

export const getResourceOwnerAccessor = (
    resource: CompactDataResource | "requestModifications" | "lateComers",
): ((document: unknown) => string | undefined) => {
    switch (resource) {
        case "employees":
            return document => toRecord(document).uid as string | undefined;
        case "dependents":
            return document => toRecord(document).relatedTo as string | undefined;
        case "notifications":
            return document => toRecord(document).uid as string | undefined;
        case "attendances":
            return document => {
                const record = toRecord(document);
                return (
                    (record.employeeUid as string | undefined) || (record.uid as string | undefined)
                );
            };
        case "leaveManagements":
        case "employeeLoans":
            return document => toRecord(document).employeeUid as string | undefined;
        case "overtimeRequests":
            return document => {
                const record = toRecord(document);
                return (
                    (record.employeeUid as string | undefined) ||
                    (Array.isArray(record.employeeUids)
                        ? (record.employeeUids[0] as string | undefined)
                        : undefined)
                );
            };
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
            return document => toRecord(document).uid as string | undefined;
        case "lateComers":
            return document => toRecord(document).employeeUID as string | undefined;
        default:
            return () => undefined;
    }
};

export const filterDocumentsForSession = <T>(
    documents: T[],
    resource: CompactDataResource | "requestModifications" | "lateComers",
    instanceKey: string,
    session: SessionClaims,
): T[] =>
        filterReadableDocuments(documents, {
            session,
            instanceKey,
            resource,
            getResourceOwnerUid: getResourceOwnerAccessor(resource),
        });
