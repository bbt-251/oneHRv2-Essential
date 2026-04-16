import { ManualSessionClaims } from "@/lib/backend/manual/types";

interface AuditRecord {
  actorUid: string;
  actorRoles: string[];
  tenantId: string;
  endpoint: string;
  action: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export const writeAuditRecord = (
  session: ManualSessionClaims,
  endpoint: string,
  action: string,
  metadata?: Record<string, unknown>,
): void => {
  const record: AuditRecord = {
    actorUid: session.uid,
    actorRoles: session.roles,
    tenantId: session.tenantId,
    endpoint,
    action,
    timestamp: new Date().toISOString(),
    metadata,
  };

  // Phase 2 baseline: stdout sink; replace with centralized sink in later phases.
  console.info("[manual-audit]", JSON.stringify(record));
};
