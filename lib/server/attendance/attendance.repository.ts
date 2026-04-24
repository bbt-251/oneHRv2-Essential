import { SessionClaims } from "@/lib/server/shared/types";
import { AttendanceModel, RequestModificationModel } from "@/lib/models/attendance";
import { LateComersModel } from "@/lib/models/late-comers";
import { OvertimeRequestModel } from "@/lib/models/overtime-request";
import { getMongoCollection } from "@/lib/server/shared/db/mongo";
import { ObjectId, WithId } from "mongodb";
import {
    AttendanceListFilters,
    CreateAttendanceInput,
    CreateLateComerInput,
    CreateOvertimeRequestInput,
    CreateRequestModificationInput,
    UpdateAttendanceInput,
    UpdateOvertimeRequestInput,
    UpdateRequestModificationInput,
} from "@/lib/server/attendance/attendance.types";

const createMongoRecord = async <T extends { id: string }, TCreate extends Omit<T, "id">>(
    collectionName: string,
    payload: TCreate,
): Promise<T> => {
    const collection = await getMongoCollection<Record<string, unknown> & { _id: string }>(
        collectionName,
    );
    const document = {
        _id: new ObjectId().toHexString(),
        ...(payload as Record<string, unknown>),
    };
    await collection.insertOne(document);
    return {
        ...(document as unknown as T),
        id: document._id,
    };
};

interface AttendanceDocument extends Omit<AttendanceModel, "id"> {
    _id: string;
}

const attendanceCollectionName = "attendance";

const toAttendanceModel = (document: WithId<AttendanceDocument>): AttendanceModel => ({
    id: document._id,
    generatedAt: document.generatedAt,
    uid: document.uid,
    month: document.month,
    year: document.year,
    state: document.state,
    stage: document.stage,
    associatedShiftType: document.associatedShiftType,
    values: document.values,
    comments: document.comments,
    monthlyWorkedHours: document.monthlyWorkedHours,
    dailyWorkingHour: document.dailyWorkingHour,
    periodWorkingDays: document.periodWorkingDays,
    workedDays: document.workedDays,
    absentDays: document.absentDays,
    claimedOvertimes: document.claimedOvertimes,
    lastClockInTimestamp: document.lastClockInTimestamp,
});

const listAttendanceRecords = async (filters?: {
    id?: string;
    uid?: string;
    employeeUid?: string;
    month?: string;
    year?: number;
}): Promise<AttendanceModel[]> => {
    const collection = await getMongoCollection<AttendanceDocument>(attendanceCollectionName);
    const query: Record<string, unknown> = {};
    const uid = filters?.employeeUid ?? filters?.uid;

    if (filters?.id) {
        query._id = filters.id;
    }
    if (uid) {
        query.uid = uid;
    }
    if (filters?.month) {
        query.month = filters.month;
    }
    if (typeof filters?.year === "number") {
        query.year = filters.year;
    }

    return (await collection.find(query).toArray()).map(toAttendanceModel);
};

const createAttendanceRecord = async (
    data: Omit<AttendanceModel, "id">,
): Promise<AttendanceModel> => {
    const collection = await getMongoCollection<AttendanceDocument>(attendanceCollectionName);
    const document: AttendanceDocument = {
        _id: new ObjectId().toHexString(),
        ...data,
    };
    await collection.insertOne(document);
    return toAttendanceModel(document as WithId<AttendanceDocument>);
};

const updateAttendanceRecord = async (
    id: string,
    data: Partial<AttendanceModel>,
): Promise<AttendanceModel | null> => {
    const collection = await getMongoCollection<AttendanceDocument>(attendanceCollectionName);
    const updateData = Object.fromEntries(
        Object.entries(data).filter(([key, value]) => key !== "id" && value !== undefined),
    );

    if (Object.keys(updateData).length > 0) {
        await collection.updateOne({ _id: id }, { $set: updateData });
    }

    return (await listAttendanceRecords({ id }))[0] ?? null;
};

const deleteAttendanceRecord = async (id: string): Promise<void> => {
    const collection = await getMongoCollection<AttendanceDocument>(attendanceCollectionName);
    await collection.deleteOne({ _id: id });
};

const listMongoRecords = async <T extends { id: string }>(
    collectionName: string,
    filters?: Record<string, unknown>,
): Promise<T[]> => {
    const collection = await getMongoCollection<Record<string, unknown> & { _id: string }>(
        collectionName,
    );
    const query = Object.fromEntries(
        Object.entries(filters ?? {}).filter(([, value]) => value !== undefined && value !== null),
    );

    if ("id" in query) {
        query._id = query.id as string;
        delete query.id;
    }

    const documents = await collection.find(query).toArray();
    return documents.map(document => ({
        ...(document as unknown as T),
        id: document._id,
    }));
};

const updateMongoRecord = async <T extends { id: string }>(
    collectionName: string,
    id: string,
    payload: Partial<T>,
): Promise<T | null> => {
    const collection = await getMongoCollection<Record<string, unknown> & { _id: string }>(
        collectionName,
    );
    const updateData = Object.fromEntries(
        Object.entries(payload).filter(([key, value]) => key !== "id" && value !== undefined),
    );

    if (Object.keys(updateData).length > 0) {
        await collection.updateOne({ _id: id }, { $set: updateData });
    }

    const document = await collection.findOne({ _id: id });
    return document
        ? ({
            ...(document as unknown as T),
            id: document._id,
        } as T)
        : null;
};

const deleteMongoRecord = async (collectionName: string, id: string): Promise<void> => {
    const collection = await getMongoCollection<Record<string, unknown> & { _id: string }>(
        collectionName,
    );
    await collection.deleteOne({ _id: id });
};

export class AttendanceServerRepository {
    static async list(
        filters: AttendanceListFilters,
        _instanceKey: string,
        _session: SessionClaims,
    ): Promise<AttendanceModel[]> {
        return listAttendanceRecords(filters);
    }

    static async create(
        payload: CreateAttendanceInput,
        _instanceKey: string,
    ): Promise<AttendanceModel> {
        return createAttendanceRecord(payload);
    }

    static async update(
        payload: UpdateAttendanceInput,
        _instanceKey: string,
    ): Promise<AttendanceModel | null> {
        return updateAttendanceRecord(payload.id, payload);
    }

    static async delete(id: string, _instanceKey: string): Promise<void> {
        await deleteAttendanceRecord(id);
    }

    static async listOvertimeRequests(
        filters: Record<string, unknown>,
        _instanceKey: string,
        _session: SessionClaims,
    ): Promise<OvertimeRequestModel[]> {
        return listMongoRecords<OvertimeRequestModel>("overtimeRequests", filters);
    }

    static async createOvertimeRequest(
        payload: CreateOvertimeRequestInput,
        _instanceKey: string,
    ): Promise<OvertimeRequestModel> {
        return createMongoRecord<OvertimeRequestModel, CreateOvertimeRequestInput>(
            "overtimeRequests",
            payload,
        );
    }

    static async updateOvertimeRequest(
        payload: UpdateOvertimeRequestInput,
        _instanceKey: string,
    ): Promise<OvertimeRequestModel | null> {
        return updateMongoRecord<OvertimeRequestModel>("overtimeRequests", payload.id, payload);
    }

    static async deleteOvertimeRequest(id: string, _instanceKey: string): Promise<void> {
        await deleteMongoRecord("overtimeRequests", id);
    }

    static async createRequestModification(
        payload: CreateRequestModificationInput,
        _instanceKey: string,
    ): Promise<RequestModificationModel> {
        return createMongoRecord<RequestModificationModel, CreateRequestModificationInput>(
            "requestModifications",
            payload,
        );
    }

    static async updateRequestModification(
        payload: UpdateRequestModificationInput,
        _instanceKey: string,
    ): Promise<RequestModificationModel | null> {
        return updateMongoRecord<RequestModificationModel>(
            "requestModifications",
            payload.id,
            payload,
        );
    }

    static async listRequestModifications(
        filters: Record<string, unknown>,
        _instanceKey: string,
        _session: SessionClaims,
    ): Promise<RequestModificationModel[]> {
        return listMongoRecords<RequestModificationModel>("requestModifications", filters);
    }

    static async listLateComers(
        filters: Record<string, unknown>,
        _instanceKey: string,
        _session: SessionClaims,
    ): Promise<LateComersModel[]> {
        return listMongoRecords<LateComersModel>("lateComers", filters);
    }

    static async createLateComer(
        payload: CreateLateComerInput,
        _instanceKey: string,
    ): Promise<LateComersModel> {
        return createMongoRecord<LateComersModel, CreateLateComerInput>("lateComers", payload);
    }

    static resolveOwnerUid(payload?: Record<string, unknown>): string | undefined {
        return (
            (typeof payload?.employeeUid === "string" ? payload.employeeUid : undefined) ||
            (typeof payload?.employeeUID === "string" ? payload.employeeUID : undefined) ||
            (typeof payload?.uid === "string" ? payload.uid : undefined) ||
            (Array.isArray(payload?.employeeUids) && typeof payload.employeeUids[0] === "string"
                ? payload.employeeUids[0]
                : undefined)
        );
    }
}
