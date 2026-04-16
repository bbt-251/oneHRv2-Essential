import { ManualApiError } from "@/lib/backend/manual/errors";
import { ManualSessionClaims } from "@/lib/backend/manual/types";

export const requireTenantAccess = (
  session: ManualSessionClaims,
  tenantId: string,
): void => {
  if (!tenantId || session.tenantId !== tenantId) {
    throw new ManualApiError(
      403,
      "TENANT_SCOPE_VIOLATION",
      "Tenant-scoped access validation failed.",
    );
  }
};
