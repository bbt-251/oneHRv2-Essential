import { ManualApiError } from "@/lib/backend/manual/errors";
import { requirePolicy } from "@/lib/backend/manual/policy-evaluator";
import { requireTenantAccess } from "@/lib/backend/manual/tenant-guard";
import { ManualAction, ManualSessionClaims } from "@/lib/backend/manual/types";

interface AuthorizationInput {
  session: ManualSessionClaims | null;
  tenantId: string;
  resource: string;
  action: ManualAction;
  resourceOwnerUid?: string;
}

export const authorizeRequest = ({
  session,
  tenantId,
  resource,
  action,
  resourceOwnerUid,
}: AuthorizationInput): ManualSessionClaims => {
  if (!session) {
    throw new ManualApiError(
      401,
      "UNAUTHENTICATED",
      "Authentication is required.",
    );
  }

  requireTenantAccess(session, tenantId);
  requirePolicy({
    session,
    tenantId,
    resource,
    action,
    resourceOwnerUid,
  });

  return session;
};
