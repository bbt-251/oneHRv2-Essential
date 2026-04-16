import crypto from "node:crypto";
import { cookies } from "next/headers";
import { manualEnv } from "@/lib/backend/manual/env";

const SESSION_COOKIE_NAME = "manual_session";
const DEFAULT_SESSION_TTL_SECONDS = 60 * 60 * 8;

interface ManualAuthPayload {
    uid: string;
    email: string | null;
}

const base64UrlEncode = (input: string): string => Buffer.from(input).toString("base64url");
const base64UrlDecode = (input: string): string => Buffer.from(input, "base64url").toString();

const createSignature = (payload: string): string =>
    crypto.createHmac("sha256", manualEnv.jwtSecret).update(payload).digest("base64url");

export const createManualSessionToken = async (payload: ManualAuthPayload): Promise<string> => {
    const nowInSeconds = Math.floor(Date.now() / 1000);
    const tokenPayload = {
        ...payload,
        iat: nowInSeconds,
        exp: nowInSeconds + DEFAULT_SESSION_TTL_SECONDS,
    };

    const serializedPayload = base64UrlEncode(JSON.stringify(tokenPayload));
    const signature = createSignature(serializedPayload);
    return `${serializedPayload}.${signature}`;
};

export const readManualSession = async (): Promise<ManualAuthPayload | null> => {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token || !manualEnv.jwtSecret) {
        return null;
    }

    try {
        const [serializedPayload, signature] = token.split(".");

        if (!serializedPayload || !signature) {
            return null;
        }

        const expectedSignature = createSignature(serializedPayload);
        if (signature !== expectedSignature) {
            return null;
        }

        const payload = JSON.parse(base64UrlDecode(serializedPayload)) as ManualAuthPayload & {
            exp: number;
        };

        if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
            return null;
        }

        return {
            uid: payload.uid,
            email: payload.email ?? null,
        };
    } catch {
        return null;
    }
};

export const clearManualSession = async (): Promise<void> => {
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
    });
};
