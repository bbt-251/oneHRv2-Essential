import { ObjectId } from "mongodb";
import { hashPassword } from "@/lib/backend/auth/credentials";
import { Role } from "@/lib/backend/core/types";
import { EmployeeModel } from "@/lib/models/employee";
import { getMongoCollection } from "@/lib/backend/persistence/mongo";

export interface AuthUserDocument {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    email: string;
    emailVerified: boolean;
    name: string;
    image?: string | null;
    uid: string;
    roles: Role[];
    firstName: string;
    surname: string;
    active: boolean;
    lastLoginAt?: Date | null;
}

interface StoredAuthUserDocument {
    _id: ObjectId;
    createdAt: Date;
    updatedAt: Date;
    email: string;
    emailVerified: boolean;
    name: string;
    image?: string | null;
    uid: string;
    roles: Role[];
    firstName: string;
    surname: string;
    active: boolean;
    lastLoginAt?: Date | null;
}

interface StoredAuthAccountDocument {
    _id: ObjectId;
    createdAt: Date;
    updatedAt: Date;
    providerId: string;
    accountId: string;
    userId: ObjectId;
    password?: string | null;
    accessToken?: string | null;
    refreshToken?: string | null;
    idToken?: string | null;
    accessTokenExpiresAt?: Date | null;
    refreshTokenExpiresAt?: Date | null;
    scope?: string | null;
}

interface StoredAuthSessionDocument {
    _id: ObjectId;
    createdAt: Date;
    updatedAt: Date;
    token: string;
    userId: ObjectId;
    expiresAt: Date;
    ipAddress?: string | null;
    userAgent?: string | null;
}

interface StoredAuthVerificationDocument {
    _id: ObjectId;
    createdAt: Date;
    updatedAt: Date;
    value: string;
    expiresAt: Date;
    identifier: string;
}

const AUTH_USERS_COLLECTION = "authUsers";
const AUTH_ACCOUNTS_COLLECTION = "authAccounts";
const AUTH_SESSIONS_COLLECTION = "authSessions";
const AUTH_VERIFICATIONS_COLLECTION = "authVerifications";

const normalizeEmail = (email: string): string => email.trim().toLowerCase();
const isPasswordHash = (value: string): boolean => {
    const [salt, hash] = value.split(":");
    return Boolean(salt && hash && /^[a-f0-9]+$/i.test(salt) && /^[a-f0-9]+$/i.test(hash));
};

const getEmployeeAuthEmail = (
    employee: Pick<EmployeeModel, "companyEmail" | "personalEmail">,
): string => normalizeEmail(employee.companyEmail || employee.personalEmail);

const getEmployeeDisplayName = (employee: Pick<EmployeeModel, "firstName" | "surname">): string =>
    `${employee.firstName} ${employee.surname}`.trim();

const isEmployeeActive = (employee: Pick<EmployeeModel, "contractStatus">): boolean =>
    employee.contractStatus?.toLowerCase() === "active";

const getAuthUsersCollection = () =>
    getMongoCollection<StoredAuthUserDocument>(AUTH_USERS_COLLECTION);
const getAuthAccountsCollection = () =>
    getMongoCollection<StoredAuthAccountDocument>(AUTH_ACCOUNTS_COLLECTION);
const getAuthSessionsCollection = () =>
    getMongoCollection<StoredAuthSessionDocument>(AUTH_SESSIONS_COLLECTION);
const getAuthVerificationsCollection = () =>
    getMongoCollection<StoredAuthVerificationDocument>(AUTH_VERIFICATIONS_COLLECTION);

const normalizeAuthUser = (document: StoredAuthUserDocument): AuthUserDocument => ({
    id: document._id.toHexString(),
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
    email: document.email,
    emailVerified: document.emailVerified,
    name: document.name,
    image: document.image ?? null,
    uid: document.uid,
    roles: document.roles,
    firstName: document.firstName,
    surname: document.surname,
    active: document.active,
    lastLoginAt: document.lastLoginAt ?? null,
});

const getStoredAuthUserByUid = async (uid: string): Promise<StoredAuthUserDocument | null> =>
    (await getAuthUsersCollection()).findOne({ uid });

const getStoredAuthUserByEmail = async (email: string): Promise<StoredAuthUserDocument | null> =>
    (await getAuthUsersCollection()).findOne({ email: normalizeEmail(email) });

const getStoredAuthUserByUidOrEmail = async ({
    uid,
    email,
}: {
    uid?: string;
    email?: string;
}): Promise<StoredAuthUserDocument | null> => {
    if (uid) {
        const byUid = await getStoredAuthUserByUid(uid);
        if (byUid) {
            return byUid;
        }
    }

    if (email) {
        return getStoredAuthUserByEmail(email);
    }

    return null;
};

export const getAuthUserByUid = async (uid: string): Promise<AuthUserDocument | null> => {
    const document = await getStoredAuthUserByUid(uid);
    return document ? normalizeAuthUser(document) : null;
};

export const getAuthUserByEmail = async (email: string): Promise<AuthUserDocument | null> => {
    const document = await getStoredAuthUserByEmail(email);
    return document ? normalizeAuthUser(document) : null;
};

export const getAuthUserByUidOrEmail = async ({
    uid,
    email,
}: {
    uid?: string;
    email?: string;
}): Promise<AuthUserDocument | null> => {
    const document = await getStoredAuthUserByUidOrEmail({ uid, email });
    return document ? normalizeAuthUser(document) : null;
};

export const createAuthUserFromEmployee = async (
    employee: Pick<
        EmployeeModel,
        | "uid"
        | "firstName"
        | "surname"
        | "companyEmail"
        | "personalEmail"
        | "role"
        | "contractStatus"
        | "password"
    >,
): Promise<AuthUserDocument> => {
    const email = getEmployeeAuthEmail(employee);
    const existing = await getStoredAuthUserByUidOrEmail({
        uid: employee.uid,
        email,
    });

    if (!existing) {
        if (isPasswordHash(employee.password)) {
            throw new Error("Auth user creation requires a raw password.");
        }

        const authUsers = await getAuthUsersCollection();
        const authAccounts = await getAuthAccountsCollection();
        const now = new Date();
        const userId = new ObjectId();

        await authUsers.insertOne({
            _id: userId,
            createdAt: now,
            updatedAt: now,
            email,
            emailVerified: false,
            name: getEmployeeDisplayName(employee),
            image: null,
            uid: employee.uid,
            roles: employee.role as Role[],
            firstName: employee.firstName,
            surname: employee.surname,
            active: isEmployeeActive(employee),
            lastLoginAt: null,
        });

        await authAccounts.insertOne({
            _id: new ObjectId(),
            createdAt: now,
            updatedAt: now,
            providerId: "credential",
            accountId: userId.toHexString(),
            userId,
            password: hashPassword(employee.password),
            accessToken: null,
            refreshToken: null,
            idToken: null,
            accessTokenExpiresAt: null,
            refreshTokenExpiresAt: null,
            scope: null,
        });
    } else {
        await syncAuthUserProfileFromEmployee(employee);
        await updateAuthUserPassword(employee.uid, employee.password);
    }

    const created = await getAuthUserByUid(employee.uid);
    if (!created) {
        throw new Error(`Failed to create auth user for employee ${employee.uid}`);
    }

    return created;
};

export const syncAuthUserProfileFromEmployee = async (
    employee: Pick<
        EmployeeModel,
        | "uid"
        | "firstName"
        | "surname"
        | "companyEmail"
        | "personalEmail"
        | "role"
        | "contractStatus"
    >,
): Promise<void> => {
    const existing = await getStoredAuthUserByUidOrEmail({
        uid: employee.uid,
        email: getEmployeeAuthEmail(employee),
    });

    if (!existing) {
        throw new Error(`Missing auth user for employee ${employee.uid}`);
    }

    const authUsers = await getAuthUsersCollection();
    const normalizedEmail = getEmployeeAuthEmail(employee);
    const now = new Date();

    await authUsers.updateOne(
        { _id: existing._id },
        {
            $set: {
                email: normalizedEmail,
                name: getEmployeeDisplayName(employee),
                uid: employee.uid,
                roles: employee.role as Role[],
                firstName: employee.firstName,
                surname: employee.surname,
                active: isEmployeeActive(employee),
                updatedAt: now,
            },
        },
    );
};

export const updateAuthUserPassword = async (uid: string, password: string): Promise<void> => {
    const authUser = await getStoredAuthUserByUid(uid);
    if (!authUser) {
        throw new Error(`Missing auth user for employee ${uid}`);
    }

    const authAccounts = await getAuthAccountsCollection();
    const now = new Date();
    const passwordHash = isPasswordHash(password) ? password : hashPassword(password);

    await authAccounts.updateOne(
        {
            userId: authUser._id,
            providerId: "credential",
        },
        {
            $set: {
                accountId: authUser._id.toHexString(),
                password: passwordHash,
                updatedAt: now,
            },
            $setOnInsert: {
                _id: new ObjectId(),
                createdAt: now,
                userId: authUser._id,
                providerId: "credential",
                accessToken: null,
                refreshToken: null,
                idToken: null,
                accessTokenExpiresAt: null,
                refreshTokenExpiresAt: null,
                scope: null,
            },
        },
        { upsert: true },
    );
};

export const deleteAuthUserByUid = async (uid: string): Promise<void> => {
    const authUser = await getStoredAuthUserByUid(uid);
    if (!authUser) {
        return;
    }

    const authUsers = await getAuthUsersCollection();
    const authAccounts = await getAuthAccountsCollection();
    const authSessions = await getAuthSessionsCollection();
    const authVerifications = await getAuthVerificationsCollection();

    await Promise.all([
        authUsers.deleteOne({ _id: authUser._id }),
        authAccounts.deleteMany({ userId: authUser._id }),
        authSessions.deleteMany({ userId: authUser._id }),
        authVerifications.deleteMany({ identifier: authUser.email }),
    ]);
};

export const touchAuthUserLastLogin = async (userId: string): Promise<void> => {
    const authUsers = await getAuthUsersCollection();
    const objectId = ObjectId.isValid(userId) ? new ObjectId(userId) : null;
    if (!objectId) {
        return;
    }

    await authUsers.updateOne(
        { _id: objectId },
        {
            $set: {
                lastLoginAt: new Date(),
                updatedAt: new Date(),
            },
        },
    );
};

export const clearAuthCollections = async (): Promise<void> => {
    await Promise.all([
        (await getAuthUsersCollection()).deleteMany({}),
        (await getAuthAccountsCollection()).deleteMany({}),
        (await getAuthSessionsCollection()).deleteMany({}),
        (await getAuthVerificationsCollection()).deleteMany({}),
    ]);
};
