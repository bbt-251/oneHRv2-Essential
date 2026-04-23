import { Filter, ObjectId } from "mongodb";
import { getMongoCollection } from "@/lib/server/shared/db/mongo";
import {
    ModuleSettingsRecord,
    ModuleSettingsRecordMap,
    ModuleSettingsResource,
} from "@/lib/server/hr-settings/module-settings/module-settings.types";

type MongoModuleSettingsDocument = Record<string, unknown> & { _id: string };

const stripUndefined = <T extends Record<string, unknown>>(input: T): Partial<T> =>
    Object.fromEntries(
        Object.entries(input).filter(([, value]) => value !== undefined),
    ) as Partial<T>;

const toModel = <T extends ModuleSettingsRecord>(
    document: MongoModuleSettingsDocument | null,
): T | null => {
    if (!document) {
        return null;
    }

    const { _id, ...rest } = document;
    return { ...rest, id: _id } as T;
};

export class ModuleSettingsServerRepository {
    static async list<TResource extends ModuleSettingsResource>(
        resource: TResource,
        filters?: Partial<ModuleSettingsRecordMap[TResource]>,
    ): Promise<ModuleSettingsRecordMap[TResource][]> {
        const collection = await getMongoCollection<MongoModuleSettingsDocument>(resource);
        const query = stripUndefined(filters ?? {}) as Filter<MongoModuleSettingsDocument>;

        if ("id" in query) {
            query._id = query.id as string;
            delete query.id;
        }

        const documents = await collection.find(query).toArray();
        return documents.map(document => toModel<ModuleSettingsRecordMap[TResource]>(document)!);
    }

    static async findById<TResource extends ModuleSettingsResource>(
        resource: TResource,
        id: string,
    ): Promise<ModuleSettingsRecordMap[TResource] | null> {
        const collection = await getMongoCollection<MongoModuleSettingsDocument>(resource);
        const document = await collection.findOne({ _id: id });
        return toModel<ModuleSettingsRecordMap[TResource]>(document);
    }

    static async create<TResource extends ModuleSettingsResource>(
        resource: TResource,
        payload: Omit<ModuleSettingsRecordMap[TResource], "id">,
    ): Promise<ModuleSettingsRecordMap[TResource]> {
        const collection = await getMongoCollection<MongoModuleSettingsDocument>(resource);
        const payloadRecord = payload as Record<string, unknown> & { id?: string };
        const id = payloadRecord.id || new ObjectId().toHexString();
        const { id: _ignoredId, ...rest } = payloadRecord;
        const document: MongoModuleSettingsDocument = {
            _id: id,
            ...rest,
        };
        await collection.insertOne(document);
        return toModel<ModuleSettingsRecordMap[TResource]>(document)!;
    }

    static async update<TResource extends ModuleSettingsResource>(
        resource: TResource,
        id: string,
        payload: Partial<ModuleSettingsRecordMap[TResource]>,
    ): Promise<ModuleSettingsRecordMap[TResource] | null> {
        const collection = await getMongoCollection<MongoModuleSettingsDocument>(resource);
        const { id: _ignoredId, ...rest } = payload as Record<string, unknown>;
        const updateData = stripUndefined(rest);

        if (Object.keys(updateData).length > 0) {
            await collection.updateOne({ _id: id }, { $set: updateData });
        }

        return this.findById(resource, id);
    }

    static async remove(resource: ModuleSettingsResource, id: string): Promise<boolean> {
        const collection = await getMongoCollection<MongoModuleSettingsDocument>(resource);
        const result = await collection.deleteOne({ _id: id });
        return result.deletedCount > 0;
    }
}
