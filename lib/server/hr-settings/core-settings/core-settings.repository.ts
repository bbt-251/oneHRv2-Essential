import { Filter, ObjectId } from "mongodb";
import { getMongoCollection } from "@/lib/server/shared/db/mongo";
import {
    CoreSettingsRecord,
    CoreSettingsRecordMap,
    CoreSettingsResource,
} from "@/lib/server/hr-settings/core-settings/core-settings.types";

type MongoCoreSettingsDocument = Record<string, unknown> & { _id: string };

const stripUndefined = <T extends Record<string, unknown>>(input: T): Partial<T> =>
    Object.fromEntries(
        Object.entries(input).filter(([, value]) => value !== undefined),
    ) as Partial<T>;

const toModel = <T extends CoreSettingsRecord>(
    document: MongoCoreSettingsDocument | null,
): T | null => {
    if (!document) {
        return null;
    }

    const { _id, ...rest } = document;
    return {
        ...rest,
        id: _id,
    } as T;
};

export class CoreSettingsServerRepository {
    static async list<TResource extends CoreSettingsResource>(
        resource: TResource,
        filters?: Partial<CoreSettingsRecordMap[TResource]>,
    ): Promise<CoreSettingsRecordMap[TResource][]> {
        const collection = await getMongoCollection<MongoCoreSettingsDocument>(resource);
        const query = stripUndefined(filters ?? {}) as Filter<MongoCoreSettingsDocument>;

        if ("id" in query) {
            query._id = query.id as string;
            delete query.id;
        }

        const documents = await collection.find(query).toArray();
        return documents.map(document => toModel<CoreSettingsRecordMap[TResource]>(document)!);
    }

    static async findById<TResource extends CoreSettingsResource>(
        resource: TResource,
        id: string,
    ): Promise<CoreSettingsRecordMap[TResource] | null> {
        const collection = await getMongoCollection<MongoCoreSettingsDocument>(resource);
        const document = await collection.findOne({ _id: id });
        return toModel<CoreSettingsRecordMap[TResource]>(document);
    }

    static async create<TResource extends CoreSettingsResource>(
        resource: TResource,
        payload: Omit<CoreSettingsRecordMap[TResource], "id">,
    ): Promise<CoreSettingsRecordMap[TResource]> {
        const collection = await getMongoCollection<MongoCoreSettingsDocument>(resource);
        const payloadRecord = payload as Record<string, unknown> & { id?: string };
        const id = payloadRecord.id || new ObjectId().toHexString();
        const { id: _ignoredId, ...rest } = payloadRecord;
        const document: MongoCoreSettingsDocument = {
            _id: id,
            ...rest,
        };

        await collection.insertOne(document);
        return toModel<CoreSettingsRecordMap[TResource]>(document)!;
    }

    static async update<TResource extends CoreSettingsResource>(
        resource: TResource,
        id: string,
        payload: Partial<CoreSettingsRecordMap[TResource]>,
    ): Promise<CoreSettingsRecordMap[TResource] | null> {
        const collection = await getMongoCollection<MongoCoreSettingsDocument>(resource);
        const { id: _ignoredId, ...rest } = payload as Record<string, unknown>;
        const updateData = stripUndefined(rest);

        if (Object.keys(updateData).length > 0) {
            await collection.updateOne({ _id: id }, { $set: updateData });
        }

        return this.findById(resource, id);
    }

    static async remove(resource: CoreSettingsResource, id: string): Promise<boolean> {
        const collection = await getMongoCollection<MongoCoreSettingsDocument>(resource);
        const result = await collection.deleteOne({ _id: id });
        return result.deletedCount > 0;
    }
}
