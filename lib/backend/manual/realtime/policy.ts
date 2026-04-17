import { ManualApiError } from "@/lib/backend/manual/errors";
import { evaluatePolicy } from "@/lib/backend/manual/policy-evaluator";
import { requireTenantAccess } from "@/lib/backend/manual/tenant-guard";
import {
  RealtimeEventContract,
  RealtimePolicyContext,
  RealtimeSubscriptionRequest,
} from "@/lib/backend/manual/realtime/types";

export const assertRealtimeSubscriptionPolicy = (
  request: RealtimeSubscriptionRequest,
): void => {
  requireTenantAccess(request.session, request.tenantId);

  const allowed = evaluatePolicy({
    session: request.session,
    tenantId: request.tenantId,
    resource: request.resource,
    action: request.action ?? "read",
    resourceOwnerUid: request.resourceOwnerUid,
  });

  if (!allowed) {
    throw new ManualApiError(
      403,
      "REALTIME_SUBSCRIPTION_DENIED",
      "Realtime subscription denied by policy matrix.",
    );
  }
};

export const canReceiveRealtimeEvent = (
  context: RealtimePolicyContext,
  event: RealtimeEventContract,
): boolean => {
  if (context.tenantId !== event.tenantId) {
    return false;
  }

  if (context.resource !== event.resource) {
    return false;
  }

  return evaluatePolicy({
    session: context.session,
    tenantId: context.tenantId,
    resource: context.resource,
    action: context.action,
    resourceOwnerUid: event.resourceOwnerUid,
  });
};
