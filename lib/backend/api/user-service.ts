import {
    fetchBackendSession,
    loginWithBackend,
    type AuthSessionResponse,
} from "@/lib/backend/client/auth-client";

const getAuthenticatedEmail = async (): Promise<string> => {
    const session = await fetchBackendSession();
    if (!session.authenticated || !session.user?.email) {
        throw new Error("No logged-in user found");
    }

    return session.user.email;
};

const isSuccessfulAuth = (session: AuthSessionResponse): boolean => {
    if (!session.authenticated) {
        return false;
    }

    return Boolean(session.user?.uid);
};

export async function confirmPassword(password: string) {
    try {
        const email = await getAuthenticatedEmail();
        const session = await loginWithBackend({ email, password });
        return isSuccessfulAuth(session);
    } catch {
        return false;
    }
}
