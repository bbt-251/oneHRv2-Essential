import { betterAuth } from "better-auth";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { customSession } from "better-auth/plugins";
import { MongoClient } from "mongodb";
import { getApiBaseUrl, getServerConfig } from "@/lib/backend/config";
import { hashPassword, verifyPassword } from "@/lib/backend/auth/credentials";
import { Role } from "@/lib/backend/core/types";
import { touchAuthUserLastLogin } from "@/lib/backend/persistence/auth.repository";

const serverConfig = getServerConfig();

if (!serverConfig.mongoUri) {
    throw new Error("MongoDB URI is not configured for Better Auth.");
}

const betterAuthMongoClient = new MongoClient(serverConfig.mongoUri);
const betterAuthMongoDb = betterAuthMongoClient.db(serverConfig.mongoDbName);

export const auth = betterAuth({
    appName: "oneHR",
    baseURL: getApiBaseUrl(),
    secret: process.env.BETTER_AUTH_SECRET || serverConfig.authJwtSecret,
    database: mongodbAdapter(betterAuthMongoDb, {
        client: betterAuthMongoClient,
    }),
    user: {
        modelName: "authUsers",
        additionalFields: {
            uid: {
                type: "string",
                required: true,
            },
            roles: {
                type: "string[]",
                required: true,
            },
            firstName: {
                type: "string",
                required: true,
            },
            surname: {
                type: "string",
                required: true,
            },
            active: {
                type: "boolean",
                required: true,
                defaultValue: true,
            },
            lastLoginAt: {
                type: "date",
                required: false,
                input: false,
            },
        },
    },
    account: {
        modelName: "authAccounts",
    },
    session: {
        modelName: "authSessions",
    },
    verification: {
        modelName: "authVerifications",
        storeInDatabase: true,
    },
    emailAndPassword: {
        enabled: true,
        autoSignIn: false,
        sendResetPassword: async ({ user, url, token }) => {
            console.info(
                `[better-auth] Password reset requested for ${user.email}. token=${token} url=${url}`,
            );
        },
        password: {
            hash: async password => hashPassword(password),
            verify: async ({ hash, password }) => verifyPassword(password, hash),
        },
    },
    databaseHooks: {
        session: {
            create: {
                after: async session => {
                    await touchAuthUserLastLogin(session.userId);
                },
            },
        },
    },
    plugins: [
        customSession(async ({ user, session }) => ({
            user: {
                ...user,
                uid: user.uid,
                roles: user.roles as Role[],
                firstName: user.firstName,
                surname: user.surname,
                active: user.active,
            },
            session,
            uid: user.uid,
            email: user.email,
            roles: user.roles as Role[],
            active: user.active,
        })),
    ],
});

export type BetterAuthSession = typeof auth.$Infer.Session;
