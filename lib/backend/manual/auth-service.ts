import {
  hashPassword,
  verifyPassword,
} from "@/lib/backend/manual/auth-credentials";
import { ManualApiError } from "@/lib/backend/manual/errors";
import {
  assertLoginNotLocked,
  registerLoginFailure,
  resetLoginFailures,
} from "@/lib/backend/manual/rate-limit";
import { ManualRole, ManualSessionClaims } from "@/lib/backend/manual/types";

interface ManualAuthUser {
  uid: string;
  email: string;
  passwordHash: string;
  roles: ManualRole[];
  tenantId: string;
  active: boolean;
}

interface LoginInput {
  email: string;
  password: string;
  tenantId?: string;
  identifier: string;
}

const fallbackUsers: ManualAuthUser[] = [
  {
    uid: "manual-admin",
    email: "manual.admin@onehr.local",
    passwordHash: hashPassword("ChangeMe123!"),
    roles: ["HR Manager"],
    tenantId: "default",
    active: true,
  },
];

const users = new Map<string, ManualAuthUser>(
  fallbackUsers.map((user) => [user.email.toLowerCase(), user]),
);
const refreshTokenToSession = new Map<string, ManualSessionClaims>();

export const loginManualUser = async ({
  email,
  password,
  tenantId,
  identifier,
}: LoginInput): Promise<ManualSessionClaims> => {
  const rateLimitKey = `${identifier}:${email.toLowerCase()}`;
  assertLoginNotLocked(rateLimitKey);

  const user = users.get(email.toLowerCase());

  if (!user || !verifyPassword(password, user.passwordHash) || !user.active) {
    registerLoginFailure(rateLimitKey);
    throw new ManualApiError(
      401,
      "INVALID_CREDENTIALS",
      "Invalid email or password.",
    );
  }

  if (tenantId && tenantId !== user.tenantId) {
    registerLoginFailure(rateLimitKey);
    throw new ManualApiError(
      403,
      "TENANT_MISMATCH",
      "User does not belong to requested tenant.",
    );
  }

  resetLoginFailures(rateLimitKey);

  return {
    uid: user.uid,
    email: user.email,
    roles: user.roles,
    tenantId: user.tenantId,
  };
};

export const registerRefreshToken = (
  token: string,
  session: ManualSessionClaims,
): void => {
  refreshTokenToSession.set(token, session);
};

export const consumeRefreshToken = (
  token: string,
): ManualSessionClaims | null => {
  const session = refreshTokenToSession.get(token) ?? null;
  if (session) {
    refreshTokenToSession.delete(token);
  }
  return session;
};

export const revokeRefreshToken = (token: string): void => {
  refreshTokenToSession.delete(token);
};
