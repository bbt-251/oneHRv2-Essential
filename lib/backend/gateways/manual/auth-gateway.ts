import { AuthGateway } from "@/lib/backend/gateways/types";

interface SessionResponse {
  authenticated: boolean;
  user?: {
    uid: string;
    email: string | null;
    roles?: string[];
    tenantId?: string;
  };
}

const fetchSession = async (): Promise<SessionResponse> => {
  const response = await fetch("/api/manual/auth/session", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  if (!response.ok) {
    return { authenticated: false };
  }

  return (await response.json()) as SessionResponse;
};

export const createManualAuthGateway = (): AuthGateway => ({
  onAuthStateChanged: (callback) => {
    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const syncSession = async () => {
      if (cancelled) {
        return;
      }

      try {
        const session = await fetchSession();
        callback(session.authenticated ? (session.user ?? null) : null);
      } catch (error) {
        console.error("Failed to sync manual auth session", error);
        callback(null);
      }
    };

    syncSession();
    intervalId = setInterval(syncSession, 30000);

    return () => {
      cancelled = true;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  },
  signOut: async () => {
    await fetch("/api/manual/auth/logout", {
      method: "POST",
      credentials: "include",
    });
  },
});
