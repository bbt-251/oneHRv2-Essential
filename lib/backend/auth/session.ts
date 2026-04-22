import { headers } from "next/headers";
import { auth } from "@/lib/backend/auth/better-auth";
import { SessionClaims } from "@/lib/backend/core/types";

export const readSessionClaims = async (): Promise<SessionClaims | null> => {
    const requestHeaders = await headers();
    const session = await auth.api.getSession({
        headers: requestHeaders,
    });

    if (!session?.user?.uid) {
        return null;
    }

    return {
        uid: session.user.uid,
        email: session.user.email ?? null,
        roles: session.user.roles ?? [],
    };
};
