import crypto from "node:crypto";
import { cookies } from "next/headers";
import { manualEnv } from "@/lib/backend/manual/env";
import { ManualSessionClaims } from "@/lib/backend/manual/types";

const SESSION_COOKIE_NAME = "manual_session";
const REFRESH_COOKIE_NAME = "manual_refresh";
const DEFAULT_SESSION_TTL_SECONDS = 60 * 15;
const DEFAULT_REFRESH_TTL_SECONDS = 60 * 60 * 24 * 14;

const base64UrlEncode = (input: string): string =>
  Buffer.from(input).toString("base64url");
const base64UrlDecode = (input: string): string =>
  Buffer.from(input, "base64url").toString();

const createSignature = (payload: string): string =>
  crypto
    .createHmac("sha256", manualEnv.jwtSecret)
    .update(payload)
    .digest("base64url");

const cookiePolicy = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export const createManualSessionToken = async (
  payload: ManualSessionClaims,
): Promise<string> => {
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

export const createRefreshToken = (): string =>
  crypto.randomBytes(48).toString("base64url");

const decodeAndVerifyToken = (
  token: string,
): (ManualSessionClaims & { exp: number }) | null => {
  const [serializedPayload, signature] = token.split(".");

  if (!serializedPayload || !signature) {
    return null;
  }

  const expectedSignature = createSignature(serializedPayload);
  if (signature !== expectedSignature) {
    return null;
  }

  const payload = JSON.parse(
    base64UrlDecode(serializedPayload),
  ) as ManualSessionClaims & { exp: number };

  if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }

  return payload;
};

export const setManualSessionCookie = async (token: string): Promise<void> => {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    ...cookiePolicy,
    maxAge: DEFAULT_SESSION_TTL_SECONDS,
  });
};

export const setManualRefreshCookie = async (token: string): Promise<void> => {
  const cookieStore = await cookies();
  cookieStore.set(REFRESH_COOKIE_NAME, token, {
    ...cookiePolicy,
    maxAge: DEFAULT_REFRESH_TTL_SECONDS,
  });
};

export const readManualSession =
  async (): Promise<ManualSessionClaims | null> => {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token || !manualEnv.jwtSecret) {
      return null;
    }

    try {
      const payload = decodeAndVerifyToken(token);

      if (!payload) {
        return null;
      }

      return {
        uid: payload.uid,
        email: payload.email ?? null,
        roles: payload.roles ?? ["Employee"],
        tenantId: payload.tenantId ?? "default",
      };
    } catch {
      return null;
    }
  };

export const readRefreshToken = async (): Promise<string | null> => {
  const cookieStore = await cookies();
  return cookieStore.get(REFRESH_COOKIE_NAME)?.value ?? null;
};

export const clearManualSession = async (): Promise<void> => {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    ...cookiePolicy,
    maxAge: 0,
  });
  cookieStore.set(REFRESH_COOKIE_NAME, "", {
    ...cookiePolicy,
    maxAge: 0,
  });
};
