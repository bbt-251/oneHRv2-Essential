import { Db, MongoClient } from "mongodb";
import { getServerConfig } from "@/lib/backend/config";

const MONGO_CLIENT_KEY = "__onehr_mongo_client__";
const MONGO_DB_KEY = "__onehr_mongo_db__";
const MONGO_DB_NAME_KEY = "__onehr_mongo_db_name__";

type GlobalMongoState = typeof globalThis & {
    [MONGO_CLIENT_KEY]?: MongoClient;
    [MONGO_DB_KEY]?: Db;
    [MONGO_DB_NAME_KEY]?: string;
};

const getGlobalMongoState = (): GlobalMongoState => globalThis as GlobalMongoState;

export const getMongoClient = async (): Promise<MongoClient> => {
    const { mongoUri } = getServerConfig();

    if (!mongoUri) {
        throw new Error("MongoDB URI is not configured.");
    }

    const globalState = getGlobalMongoState();
    if (!globalState[MONGO_CLIENT_KEY]) {
        const client = new MongoClient(mongoUri);
        await client.connect();
        globalState[MONGO_CLIENT_KEY] = client;
    }

    return globalState[MONGO_CLIENT_KEY]!;
};

export const getMongoDb = async (): Promise<Db> => {
    const { mongoDbName } = getServerConfig();

    if (!mongoDbName) {
        throw new Error("MongoDB database name is not configured.");
    }

    const globalState = getGlobalMongoState();
    if (!globalState[MONGO_DB_KEY] || globalState[MONGO_DB_NAME_KEY] !== mongoDbName) {
        const client = await getMongoClient();
        globalState[MONGO_DB_KEY] = client.db(mongoDbName);
        globalState[MONGO_DB_NAME_KEY] = mongoDbName;
    }

    return globalState[MONGO_DB_KEY]!;
};

export const getMongoCollection = async <T extends { _id?: unknown }>(name: string) =>
    (await getMongoDb()).collection<T>(name);
