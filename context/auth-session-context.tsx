"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useToast } from "./toastContext";
import { AuthIdentity, AuthRepository } from "@/lib/repository/auth";

interface AuthSessionContextType {
    user: AuthIdentity | null;
    authLoading: boolean;
    signout: () => Promise<void>;
    signingOut: boolean;
}

const AuthSessionContext = createContext<AuthSessionContextType>({
    user: null,
    authLoading: true,
    signout: async () => {},
    signingOut: false,
});

export const AuthSessionProvider = ({ children }: { children: React.ReactNode }) => {
    const [signingOut, setSigningOut] = useState<boolean>(false);
    const { showToast } = useToast();
    const router = useRouter();
    const session = AuthRepository.authClient.useSession();
    const user = useMemo(
        () =>
            session.data
                ? ({
                    uid: session.data.uid,
                    email: session.data.email ?? null,
                    roles: session.data.roles ?? [],
                    active: session.data.active,
                } satisfies AuthIdentity)
                : null,
        [session.data],
    );
    const authLoading = session.isPending || (!session.data && session.isRefetching);

    const signout = useCallback(async () => {
        setSigningOut(true);
        try {
            showToast("Signing out ...", "👋🏻", "default");
            await AuthRepository.logout();
            router.push("/signin");
        } catch (error) {
            console.error("Error signing out:", error);
        } finally {
            setTimeout(() => {
                setSigningOut(false);
            }, 2000);
        }
    }, [router, showToast]);

    useEffect(() => {
        if (!user) {
            return;
        }

        let timer: NodeJS.Timeout;
        const excludedPaths = ["/", "/signin"];

        const resetTimer = () => {
            if (timer) {
                clearTimeout(timer);
            }

            const currentPath = window.location.pathname;
            if (excludedPaths.some(path => currentPath.startsWith(path))) {
                return;
            }

            timer = setTimeout(
                () => {
                    void AuthRepository.logout();
                    router.push("/logged-out");
                },
                5 * 60 * 1000,
            );
        };

        const events = ["mousemove", "keydown", "mousedown", "touchstart"];

        events.forEach(event => window.addEventListener(event, resetTimer));
        resetTimer();

        return () => {
            if (timer) {
                clearTimeout(timer);
            }
            events.forEach(event => window.removeEventListener(event, resetTimer));
        };
    }, [router, user]);

    const contextValue = useMemo(
        () => ({
            user,
            authLoading,
            signout,
            signingOut,
        }),
        [authLoading, signout, signingOut, user],
    );

    return (
        <AuthSessionContext.Provider value={contextValue}>{children}</AuthSessionContext.Provider>
    );
};

export const useAuthSession = () => useContext(AuthSessionContext);
