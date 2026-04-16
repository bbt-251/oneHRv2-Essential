import { ManualApiError } from "@/lib/backend/manual/errors";
import { policyMatrix } from "@/lib/backend/manual/policy-matrix";
import { ManualAction, ManualSessionClaims } from "@/lib/backend/manual/types";

interface PolicyCheckInput {
  session: ManualSessionClaims;
  resource: string;
  action: ManualAction;
  resourceOwnerUid?: string;
  tenantId: string;
}

export const evaluatePolicy = ({
  session,
  resource,
  action,
  resourceOwnerUid,
  tenantId,
}: PolicyCheckInput): boolean => {
  if (session.tenantId !== tenantId) {
    return false;
  }

  return session.roles.some((role) => {
    const matchedRule = policyMatrix.find(
      (rule) =>
        rule.role === role &&
        rule.resource === resource &&
        rule.actions.includes(action),
    );

    if (!matchedRule) {
      return false;
    }

    if (matchedRule.scope === "global" || matchedRule.scope === "tenant") {
      return true;
    }

    return resourceOwnerUid === session.uid;
  });
};

export const requirePolicy = (input: PolicyCheckInput): void => {
  if (!evaluatePolicy(input)) {
    throw new ManualApiError(
      403,
      "AUTHORIZATION_DENIED",
      "Insufficient permissions for requested resource/action.",
    );
  }
};
