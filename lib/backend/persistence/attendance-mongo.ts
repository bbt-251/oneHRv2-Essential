import { ObjectId, WithId } from "mongodb";
import { AttendanceModel } from "@/lib/models/attendance";
import { getMongoCollection } from "@/lib/backend/persistence/mongo";

interface AttendanceDocument extends Omit<AttendanceModel, "id"> {
    _id: string;
}

const collectionName = "attendance";

const toModel = (document: WithId<AttendanceDocument>): AttendanceModel => ({
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

export const listMongoAttendances = async (filters?: {
    id?: string;
    uid?: string;
    employeeUid?: string;
    month?: string;
    year?: number;
}): Promise<AttendanceModel[]> => {
    const collection = await getMongoCollection<AttendanceDocument>(collectionName);
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

    return (await collection.find(query).toArray()).map(toModel);
};

export const getMongoAttendanceById = async (id: string): Promise<AttendanceModel | null> => {
    const collection = await getMongoCollection<AttendanceDocument>(collectionName);
    const document = await collection.findOne({ _id: id });
    return document ? toModel(document) : null;
};

export const createMongoAttendanceRecord = async (
    data: Omit<AttendanceModel, "id">,
): Promise<AttendanceModel> => {
    const collection = await getMongoCollection<AttendanceDocument>(collectionName);
    const document: AttendanceDocument = {
        _id: new ObjectId().toHexString(),
        ...data,
    };
    await collection.insertOne(document);
    return toModel(document as WithId<AttendanceDocument>);
};

export const updateMongoAttendanceRecord = async (
    id: string,
    data: Partial<AttendanceModel>,
): Promise<AttendanceModel | null> => {
    const collection = await getMongoCollection<AttendanceDocument>(collectionName);
    const updateData = Object.fromEntries(
        Object.entries(data).filter(([, value]) => value !== undefined && value !== null),
    );

    if (Object.keys(updateData).length > 0) {
        await collection.updateOne({ _id: id }, { $set: updateData });
    }

    return getMongoAttendanceById(id);
};

export const deleteMongoAttendanceRecord = async (id: string): Promise<boolean> => {
    const collection = await getMongoCollection<AttendanceDocument>(collectionName);
    const result = await collection.deleteOne({ _id: id });
    return result.deletedCount > 0;
};
