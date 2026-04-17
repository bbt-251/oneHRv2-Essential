import { NextRequest } from "next/server";
import { readManualSession } from "@/lib/backend/manual/auth-session";
import { authorizeRequest } from "@/lib/backend/manual/authorization";
import { ManualAction, ManualSessionClaims } from "@/lib/backend/manual/types";

export const authorizeDomainRequest = async (
    request: NextRequest,
    resource: string,
    action: ManualAction,
    resourceOwnerUid?: string,
): Promise<{ session: ManualSessionClaims; tenantId: string }> => {
    const session = await readManualSession();
    const tenantId = request.nextUrl.searchParams.get("tenantId") ?? "default";

    const authorizedSession = authorizeRequest({
        session,
        tenantId,
        resource,
        action,
        resourceOwnerUid,
    });

    return { session: authorizedSession, tenantId };
};
