import { SessionClaims } from "@/lib/backend/core/types";
import { ManualApiError } from "@/lib/backend/core/errors";
import { getManualRealtimeBroker } from "@/lib/backend/realtime/subscription-broker";
import { inMemoryStore } from "@/lib/backend/persistence/in-memory-store";
import { AttendanceModel, RequestModificationModel } from "@/lib/models/attendance";
import { AttendanceLogicModel } from "@/lib/models/attendance-logic";
import { FlexibilityParameterModel } from "@/lib/models/flexibilityParameter";
import { LateComersModel } from "@/lib/models/late-comers";
import { OvertimeRequestModel } from "@/lib/models/overtime-request";
import {
    filterDocumentsForSession,
    readString,
    requirePayload,
} from "@/lib/backend/services/service-helpers";
import {
    createMongoAttendanceRecord,
    deleteMongoAttendanceRecord,
    getMongoAttendanceById,
    listMongoAttendances,
    updateMongoAttendanceRecord,
} from "@/lib/backend/persistence/attendance-mongo";

const realtimeBroker = getManualRealtimeBroker();

const readNumber = (value: unknown): number | undefined =>
    typeof value === "number" && Number.isFinite(value) ? value : undefined;

const getDocumentById = <T>(collectionPath: string, id: string): T | null => {
    const document = inMemoryStore.getDocument(`${collectionPath}/${id}`);
    return document ? ({ id: document.id, ...document.data } as T) : null;
};

const listCollection = <T>(collectionPath: string): T[] =>
    inMemoryStore.queryCollection(collectionPath).map(document => ({
        id: document.id,
        ...document.data,
    })) as T[];

const saveCollectionDocument = <T extends { id?: string }>(
    collectionPath: string,
    payload: Record<string, unknown>,
): T => {
    const document = inMemoryStore.createDocument(collectionPath, payload);
    return {
        id: document.id,
        ...payload,
    } as T;
};

const updateCollectionDocument = <T>(
    collectionPath: string,
    id: string,
    payload: Record<string, unknown>,
): T | null => {
    inMemoryStore.updateDocument(`${collectionPath}/${id}`, payload);
    return getDocumentById<T>(collectionPath, id);
};

const deleteCollectionDocument = (collectionPath: string, id: string): void => {
    inMemoryStore.deleteDocument(`${collectionPath}/${id}`);
};

const publishAttendanceRealtime = ({
    instanceKey,
    resource,
    resourceId,
    payload,
    resourceOwnerUid,
}: {
    instanceKey: string;
    resource: string;
    resourceId: string;
    payload: Record<string, unknown>;
    resourceOwnerUid?: string;
}) => {
    realtimeBroker.publish({
        operation: "modified",
        instanceKey,
        resource,
        resourceId,
        payload,
        resourceOwnerUid,
        actorUid: resourceOwnerUid,
    });
};

const publishAttendanceDelete = ({
    instanceKey,
    resource,
    resourceId,
    resourceOwnerUid,
}: {
    instanceKey: string;
    resource: string;
    resourceId: string;
    resourceOwnerUid?: string;
}) => {
    realtimeBroker.publish({
        operation: "removed",
        instanceKey,
        resource,
        resourceId,
        payload: {},
        resourceOwnerUid,
        actorUid: resourceOwnerUid,
    });
};

const listCompatAttendances = async (
    filters?: Record<string, unknown>,
): Promise<AttendanceModel[]> => {
    const uid = readString(filters?.employeeUid) ?? readString(filters?.uid);
    const month = readString(filters?.month);
    const year = readNumber(filters?.year);
    const id = readString(filters?.id);
    return listMongoAttendances({ id, uid, month, year });
};

const listCompatOvertimeRequests = async (
    filters?: Record<string, unknown>,
): Promise<OvertimeRequestModel[]> => {
    const employeeUid = readString(filters?.employeeUid) ?? readString(filters?.uid);
    const id = readString(filters?.id);

    if (id) {
        const overtimeRequest = getDocumentById<OvertimeRequestModel>("overtimeRequest", id);
        return overtimeRequest ? [overtimeRequest] : [];
    }

    return listCollection<OvertimeRequestModel>("overtimeRequest").filter(document =>
        employeeUid
            ? Array.isArray(document.employeeUids) && document.employeeUids.includes(employeeUid)
            : true,
    );
};

const listCompatRequestModifications = async (
    filters?: Record<string, unknown>,
): Promise<RequestModificationModel[]> => {
    const uid = readString(filters?.uid);
    const parentAttendanceID = readString(filters?.parentAttendanceID);
    const id = readString(filters?.id);

    if (id) {
        const requestModification = getDocumentById<RequestModificationModel>(
            "requestModifications",
            id,
        );
        return requestModification ? [requestModification] : [];
    }

    return listCollection<RequestModificationModel>("requestModifications").filter(document => {
        if (uid && document.uid !== uid) {
            return false;
        }
        if (parentAttendanceID && document.parentAttendanceID !== parentAttendanceID) {
            return false;
        }
        return true;
    });
};

const listCompatLateComers = async (
    filters?: Record<string, unknown>,
): Promise<LateComersModel[]> => {
    const employeeUID = readString(filters?.employeeUID) ?? readString(filters?.uid);
    const month = readString(filters?.month);
    const year = readNumber(filters?.year);
    const id = readString(filters?.id);

    if (id) {
        const lateComer = getDocumentById<LateComersModel>("lateComers", id);
        return lateComer ? [lateComer] : [];
    }

    return listCollection<LateComersModel>("lateComers").filter(document => {
        if (employeeUID && document.employeeUID !== employeeUID) {
            return false;
        }

        if (month || typeof year === "number") {
            const timestamp = new Date(document.timestamp);
            const documentMonth = timestamp.toLocaleString("en-US", { month: "long" });
            const documentYear = timestamp.getUTCFullYear();

            if (month && documentMonth !== month) {
                return false;
            }
            if (typeof year === "number" && documentYear !== year) {
                return false;
            }
        }

        return true;
    }) as LateComersModel[];
};

const listCompatAttendanceLogic = async (): Promise<AttendanceLogicModel[]> => {
    return listCollection<AttendanceLogicModel>("attendanceLogic");
};

const listCompatFlexibilityParameters = async (): Promise<FlexibilityParameterModel[]> => {
    return listCollection<FlexibilityParameterModel>("flexibilityParameter");
};

export const listAttendancesForSession = async ({
    instanceKey,
    session,
    filters,
}: {
    instanceKey: string;
    session: SessionClaims;
    filters?: Record<string, unknown>;
}): Promise<Record<string, unknown>> => {
    const attendances = await listCompatAttendances(filters);
    return {
        attendances: filterDocumentsForSession(attendances, "attendances", instanceKey, session),
    };
};

export const listOvertimeRequestsForSession = async ({
    instanceKey,
    session,
    filters,
}: {
    instanceKey: string;
    session: SessionClaims;
    filters?: Record<string, unknown>;
}): Promise<Record<string, unknown>> => {
    const overtimeRequests = await listCompatOvertimeRequests(filters);
    return {
        overtimeRequests: filterDocumentsForSession(
            overtimeRequests,
            "overtimeRequests",
            instanceKey,
            session,
        ),
    };
};

export const listRequestModificationsForSession = async ({
    instanceKey,
    session,
    filters,
}: {
    instanceKey: string;
    session: SessionClaims;
    filters?: Record<string, unknown>;
}): Promise<Record<string, unknown>> => {
    const requestModifications = await listCompatRequestModifications(filters);
    return {
        requestModifications: filterDocumentsForSession(
            requestModifications,
            "requestModifications",
            instanceKey,
            session,
        ),
    };
};

export const listLateComersForSession = async ({
    instanceKey,
    session,
    filters,
}: {
    instanceKey: string;
    session: SessionClaims;
    filters?: Record<string, unknown>;
}): Promise<Record<string, unknown>> => {
    const lateComers = await listCompatLateComers(filters);
    return {
        lateComers: filterDocumentsForSession(lateComers, "lateComers", instanceKey, session),
    };
};

export const listAttendanceLogicForSession = async ({
    instanceKey,
    session,
}: {
    instanceKey: string;
    session: SessionClaims;
}): Promise<Record<string, unknown>> => ({
    attendanceLogic: filterDocumentsForSession(
        await listCompatAttendanceLogic(),
        "attendanceLogic",
        instanceKey,
        session,
    ),
});

export const listFlexibilityParametersForSession = async ({
    instanceKey,
    session,
}: {
    instanceKey: string;
    session: SessionClaims;
}): Promise<Record<string, unknown>> => ({
    flexibilityParameter: filterDocumentsForSession(
        await listCompatFlexibilityParameters(),
        "flexibilityParameter",
        instanceKey,
        session,
    ),
});

export const mutateAttendance = async ({
    action,
    instanceKey: _instanceKey,
    payload,
    targetId,
}: {
    action: "create" | "update" | "delete";
    instanceKey: string;
    payload?: Record<string, unknown>;
    targetId?: string;
}): Promise<Record<string, unknown>> => {
    if (action === "create") {
        const attendance = await createMongoAttendanceRecord(
            requirePayload(payload) as Omit<AttendanceModel, "id">,
        );
        publishAttendanceRealtime({
            instanceKey: _instanceKey,
            resource: "attendances",
            resourceId: attendance.id,
            payload: { attendances: await listCompatAttendances() },
            resourceOwnerUid: attendance.uid ?? attendance.employeeUid,
        });
        return { attendance };
    }

    if (!targetId) {
        throw new ManualApiError(400, "TARGET_ID_REQUIRED", "targetId is required.");
    }

    if (action === "update") {
        const updated = await updateMongoAttendanceRecord(
            targetId,
            requirePayload(payload) as Partial<AttendanceModel>,
        );
        if (updated) {
            publishAttendanceRealtime({
                instanceKey: _instanceKey,
                resource: "attendances",
                resourceId: targetId,
                payload: { attendances: await listCompatAttendances() },
                resourceOwnerUid: updated.uid ?? updated.employeeUid,
            });
        }
        return {
            attendance: updated,
        };
    }

    const existing = await getMongoAttendanceById(targetId);
    await deleteMongoAttendanceRecord(targetId);
    publishAttendanceDelete({
        instanceKey: _instanceKey,
        resource: "attendances",
        resourceId: targetId,
        resourceOwnerUid: existing?.uid ?? existing?.employeeUid,
    });
    return { deleted: true };
};

export const mutateOvertimeRequest = async ({
    action,
    instanceKey: _instanceKey,
    payload,
    targetId,
}: {
    action: "create" | "update" | "delete";
    instanceKey: string;
    payload?: Record<string, unknown>;
    targetId?: string;
}): Promise<Record<string, unknown>> => {
    if (action === "create") {
        const overtimeRequest = saveCollectionDocument<OvertimeRequestModel>(
            "overtimeRequest",
            requirePayload(payload),
        );
        publishAttendanceRealtime({
            instanceKey: _instanceKey,
            resource: "overtimeRequests",
            resourceId: overtimeRequest.id,
            payload: { overtimeRequests: await listCompatOvertimeRequests() },
            resourceOwnerUid: Array.isArray(overtimeRequest.employeeUids)
                ? overtimeRequest.employeeUids[0]
                : overtimeRequest.employeeUid,
        });
        return { overtimeRequest };
    }

    if (!targetId) {
        throw new ManualApiError(400, "TARGET_ID_REQUIRED", "targetId is required.");
    }

    if (action === "update") {
        const updated = updateCollectionDocument<OvertimeRequestModel>(
            "overtimeRequest",
            targetId,
            requirePayload(payload),
        );
        if (updated) {
            publishAttendanceRealtime({
                instanceKey: _instanceKey,
                resource: "overtimeRequests",
                resourceId: targetId,
                payload: { overtimeRequests: await listCompatOvertimeRequests() },
                resourceOwnerUid: Array.isArray(updated.employeeUids)
                    ? updated.employeeUids[0]
                    : updated.employeeUid,
            });
        }
        return {
            overtimeRequest: updated,
        };
    }

    const existing = getDocumentById<OvertimeRequestModel>("overtimeRequest", targetId);
    deleteCollectionDocument("overtimeRequest", targetId);
    publishAttendanceDelete({
        instanceKey: _instanceKey,
        resource: "overtimeRequests",
        resourceId: targetId,
        resourceOwnerUid: existing?.employeeUid,
    });
    return { deleted: true };
};

export const mutateRequestModification = async ({
    action,
    payload,
    targetId,
}: {
    action: "create" | "update" | "delete";
    payload?: Record<string, unknown>;
    targetId?: string;
}): Promise<Record<string, unknown>> => {
    if (action === "create") {
        const requestModification = saveCollectionDocument<RequestModificationModel>(
            "requestModifications",
            requirePayload(payload),
        );
        publishAttendanceRealtime({
            instanceKey: "default",
            resource: "requestModifications",
            resourceId: requestModification.id,
            payload: { requestModifications: await listCompatRequestModifications() },
            resourceOwnerUid: requestModification.uid,
        });
        return { requestModification };
    }

    if (!targetId) {
        throw new ManualApiError(400, "TARGET_ID_REQUIRED", "targetId is required.");
    }

    if (action === "update") {
        const updated = updateCollectionDocument<RequestModificationModel>(
            "requestModifications",
            targetId,
            requirePayload(payload),
        );
        if (updated) {
            publishAttendanceRealtime({
                instanceKey: "default",
                resource: "requestModifications",
                resourceId: targetId,
                payload: { requestModifications: await listCompatRequestModifications() },
                resourceOwnerUid: updated.uid,
            });
        }
        return {
            requestModification: updated,
        };
    }

    const existing = getDocumentById<RequestModificationModel>("requestModifications", targetId);
    deleteCollectionDocument("requestModifications", targetId);
    publishAttendanceDelete({
        instanceKey: "default",
        resource: "requestModifications",
        resourceId: targetId,
        resourceOwnerUid: existing?.uid,
    });
    return { deleted: true };
};

export const mutateLateComer = async ({
    action,
    payload,
    targetId,
}: {
    action: "create" | "update" | "delete";
    payload?: Record<string, unknown>;
    targetId?: string;
}): Promise<Record<string, unknown>> => {
    if (action === "create") {
        const lateComer = saveCollectionDocument<LateComersModel>(
            "lateComers",
            requirePayload(payload),
        );
        publishAttendanceRealtime({
            instanceKey: "default",
            resource: "lateComers",
            resourceId: lateComer.id,
            payload: { lateComers: await listCompatLateComers() },
            resourceOwnerUid: lateComer.employeeUID,
        });
        return { lateComer };
    }

    if (!targetId) {
        throw new ManualApiError(400, "TARGET_ID_REQUIRED", "targetId is required.");
    }

    if (action === "update") {
        const updated = updateCollectionDocument<LateComersModel>(
            "lateComers",
            targetId,
            requirePayload(payload),
        );
        if (updated) {
            publishAttendanceRealtime({
                instanceKey: "default",
                resource: "lateComers",
                resourceId: targetId,
                payload: { lateComers: await listCompatLateComers() },
                resourceOwnerUid: updated.employeeUID,
            });
        }
        return {
            lateComer: updated,
        };
    }

    const existing = getDocumentById<LateComersModel>("lateComers", targetId);
    deleteCollectionDocument("lateComers", targetId);
    publishAttendanceDelete({
        instanceKey: "default",
        resource: "lateComers",
        resourceId: targetId,
        resourceOwnerUid: existing?.employeeUID,
    });
    return { deleted: true };
};

export const mutateAttendanceLogic = async ({
    action,
    payload,
    targetId,
}: {
    action: "create" | "update" | "delete";
    payload?: Record<string, unknown>;
    targetId?: string;
}): Promise<Record<string, unknown>> => {
    if (action === "create") {
        const attendanceLogic = saveCollectionDocument<AttendanceLogicModel>(
            "attendanceLogic",
            requirePayload(payload),
        );
        publishAttendanceRealtime({
            instanceKey: "default",
            resource: "attendanceLogic",
            resourceId: attendanceLogic.id,
            payload: { attendanceLogic: await listCompatAttendanceLogic() },
        });
        return { attendanceLogic };
    }

    if (!targetId) {
        throw new ManualApiError(400, "TARGET_ID_REQUIRED", "targetId is required.");
    }

    if (action === "update") {
        const updated = updateCollectionDocument<AttendanceLogicModel>(
            "attendanceLogic",
            targetId,
            requirePayload(payload),
        );
        if (updated) {
            publishAttendanceRealtime({
                instanceKey: "default",
                resource: "attendanceLogic",
                resourceId: targetId,
                payload: { attendanceLogic: await listCompatAttendanceLogic() },
            });
        }
        return {
            attendanceLogic: updated,
        };
    }

    deleteCollectionDocument("attendanceLogic", targetId);
    publishAttendanceDelete({
        instanceKey: "default",
        resource: "attendanceLogic",
        resourceId: targetId,
    });
    return { deleted: true };
};

export const mutateFlexibilityParameter = async ({
    action,
    payload,
    targetId,
}: {
    action: "create" | "update" | "delete";
    payload?: Record<string, unknown>;
    targetId?: string;
}): Promise<Record<string, unknown>> => {
    if (action === "create") {
        const flexibilityParameter = saveCollectionDocument<FlexibilityParameterModel>(
            "flexibilityParameter",
            requirePayload(payload),
        );
        publishAttendanceRealtime({
            instanceKey: "default",
            resource: "flexibilityParameter",
            resourceId: flexibilityParameter.id,
            payload: { flexibilityParameter: await listCompatFlexibilityParameters() },
        });
        return { flexibilityParameter };
    }

    if (!targetId) {
        throw new ManualApiError(400, "TARGET_ID_REQUIRED", "targetId is required.");
    }

    if (action === "update") {
        const updated = updateCollectionDocument<FlexibilityParameterModel>(
            "flexibilityParameter",
            targetId,
            requirePayload(payload),
        );
        if (updated) {
            publishAttendanceRealtime({
                instanceKey: "default",
                resource: "flexibilityParameter",
                resourceId: targetId,
                payload: { flexibilityParameter: await listCompatFlexibilityParameters() },
            });
        }
        return {
            flexibilityParameter: updated,
        };
    }

    deleteCollectionDocument("flexibilityParameter", targetId);
    publishAttendanceDelete({
        instanceKey: "default",
        resource: "flexibilityParameter",
        resourceId: targetId,
    });
    return { deleted: true };
};

export const resolveAttendanceOwnerUid = (payload?: Record<string, unknown>): string | undefined =>
    readString(payload?.employeeUid) ||
    readString(payload?.employeeUID) ||
    readString(payload?.uid) ||
    (Array.isArray(payload?.employeeUids) ? readString(payload.employeeUids[0]) : undefined);
