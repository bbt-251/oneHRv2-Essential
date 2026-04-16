import assert from "node:assert/strict";
import {
  consumeRefreshToken,
  loginManualUser,
  registerRefreshToken,
} from "@/lib/backend/manual/auth-service";
import { evaluatePolicy } from "@/lib/backend/manual/policy-evaluator";
import { ManualApiError } from "@/lib/backend/manual/errors";

const run = async (): Promise<void> => {
  const session = await loginManualUser({
    email: "manual.admin@onehr.local",
    password: "ChangeMe123!",
    identifier: "phase2-tests",
  });

  assert.equal(
    session.uid,
    "manual-admin",
    "Expected fallback bootstrap admin user to authenticate",
  );
  assert.ok(
    session.roles.includes("HR Manager"),
    "Expected HR Manager role on bootstrap admin",
  );

  const refreshToken = "phase2-token";
  registerRefreshToken(refreshToken, session);

  const consumedSession = consumeRefreshToken(refreshToken);
  assert.equal(
    consumedSession?.uid,
    session.uid,
    "Expected refresh token to map back to session",
  );
  assert.equal(
    consumeRefreshToken(refreshToken),
    null,
    "Expected refresh token to be one-time use",
  );

  const canReadTenantEmployee = evaluatePolicy({
    session,
    resource: "employee",
    action: "read",
    tenantId: "default",
  });
  assert.equal(
    canReadTenantEmployee,
    true,
    "Expected HR Manager to read employee resource in tenant",
  );

  const blockedByTenantScope = evaluatePolicy({
    session,
    resource: "employee",
    action: "read",
    tenantId: "other-tenant",
  });
  assert.equal(
    blockedByTenantScope,
    false,
    "Expected tenant mismatch to deny access",
  );

  let capturedError: unknown;
  for (let i = 0; i < 6; i += 1) {
    try {
      await loginManualUser({
        email: "manual.admin@onehr.local",
        password: "WrongPassword123!",
        identifier: "abuse-case",
      });
    } catch (error) {
      capturedError = error;
    }
  }

  assert.ok(
    capturedError instanceof ManualApiError,
    "Expected failed login to throw ManualApiError",
  );
  assert.equal(
    (capturedError as ManualApiError).status,
    429,
    "Expected lockout status after repeated failures",
  );

  console.log("Manual backend Phase 2 tests passed.");
};

run();
