"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { AuthSessionProvider, useAuthSession } from "@/context/auth-session-context";
import { subscribeEmployeeByUidWithBackend } from "@/lib/backend/client/employee-client";
import { EmployeeModel } from "@/lib/models/employee";

interface AuthContextType {
    user: ReturnType<typeof useAuthSession>["user"];
    authLoading: boolean;
    signout: () => Promise<void>;
    signingOut: boolean;
    userData: EmployeeModel | null;
    employeeNotFound: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    authLoading: true,
    userData: null,
    signout: async () => {},
    signingOut: false,
    employeeNotFound: false,
});

const useCurrentEmployeeState = () => {
    const { user, authLoading } = useAuthSession();
    const [userData, setUserData] = useState<EmployeeModel | null>(null);
    const [employeeNotFound, setEmployeeNotFound] = useState<boolean>(false);
    const [resolvedEmployeeUid, setResolvedEmployeeUid] = useState<string | null>(null);

    const subscribeToCurrentEmployee = useCallback(
        (uid: string, email: string | null) =>
            subscribeEmployeeByUidWithBackend(
                uid,
                (employees, hasPendingWrites) => {
                    if (hasPendingWrites) {
                        return;
                    }

                    const employee = employees.find(
                        entry =>
                            entry.uid === uid ||
                            entry.companyEmail === email ||
                            entry.personalEmail === email,
                    );

                    if (employee) {
                        setUserData(employee);
                        setEmployeeNotFound(false);
                    } else {
                        setUserData(null);
                        setEmployeeNotFound(employees.length === 0);
                    }

                    setResolvedEmployeeUid(uid);
                },
                error => {
                    console.error("[auth-context] employee subscription error", {
                        uid,
                        email,
                        error: error.message,
                    });
                    setUserData(null);
                    setEmployeeNotFound(true);
                    setResolvedEmployeeUid(uid);
                },
            ),
        [],
    );

    useEffect(() => {
        if (authLoading) {
            return;
        }

        if (!user) {
            return;
        }

        const unsubscribeEmployee = subscribeToCurrentEmployee(user.uid, user.email);

        return () => {
            unsubscribeEmployee?.();
        };
    }, [authLoading, subscribeToCurrentEmployee, user]);

    const employeeLoading = Boolean(user) && resolvedEmployeeUid !== user.uid;

    return {
        userData: resolvedEmployeeUid === user?.uid ? userData : null,
        employeeNotFound: resolvedEmployeeUid === user?.uid ? employeeNotFound : false,
        employeeLoading,
    };
};

const CombinedAuthProvider = ({ children }: { children: React.ReactNode }) => {
    const authSession = useAuthSession();
    const currentEmployee = useCurrentEmployeeState();
    const combinedAuthLoading =
        authSession.authLoading || (Boolean(authSession.user) && currentEmployee.employeeLoading);

    return (
        <AuthContext.Provider
            value={{
                user: authSession.user,
                authLoading: combinedAuthLoading,
                signout: authSession.signout,
                signingOut: authSession.signingOut,
                userData: currentEmployee.userData,
                employeeNotFound: currentEmployee.employeeNotFound,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    return (
        <AuthSessionProvider>
            <CombinedAuthProvider>{children}</CombinedAuthProvider>
        </AuthSessionProvider>
    );
};

export const useAuth = () => useContext(AuthContext);
