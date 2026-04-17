import { useRouter } from "next/navigation";
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import { useToast } from "./toastContext";
import {
    createAuthGateway,
    createEmployeeDataGateway,
} from "@/lib/backend/gateways/factory";
import { AuthIdentity, Unsubscribe } from "@/lib/backend/gateways/types";
import { EmployeeModel } from "@/lib/models/employee";

interface AuthContextType {
    user: AuthIdentity | null;
    authLoading: boolean;
    userData: EmployeeModel | null;
    signout: () => Promise<void>;
    signingOut: boolean;
    employeeNotFound: boolean; // Track if employee record was searched but not found
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    authLoading: true,
    userData: null,
    signout: async () => {},
    signingOut: false,
    employeeNotFound: false,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<AuthIdentity | null>(null);
    const [authLoading, setAuthLoading] = useState<boolean>(true);
    const [userData, setUserData] = useState<EmployeeModel | null>(null);
    const [signingOut, setSigningOut] = useState<boolean>(false);
    const [employeeNotFound, setEmployeeNotFound] = useState<boolean>(false);
    const { showToast } = useToast();
    const authGateway = useMemo(() => createAuthGateway(), []);
    const dataGateway = useMemo(() => createEmployeeDataGateway(), []);

    const router = useRouter();
    const signout = async () => {
        setSigningOut(true);
        try {
            showToast("Signing out ...", "👋🏻", "default");
            // Sign out from Firebase first, then clear state, then redirect
            await authGateway.signOut();
            setUser(null); // Clear user state
            setUserData(null); // Clear user data
            router.push("/signin");
        } catch (error) {
            console.error("Error signing out:", error);
        } finally {
            setTimeout(() => {
                setSigningOut(false);
            }, 2000);
        }
    };

    const fetchUserData = useCallback(
        async (currentUser: AuthIdentity, showErrorToast: boolean = true) => {
            try {
                let unsubscribeUser: Unsubscribe | null = null;

                // Reset employeeNotFound when starting a new fetch
                setEmployeeNotFound(false);

                unsubscribeUser = dataGateway.subscribeEmployeeByUid(
                    currentUser.uid,
                    (employees, hasPendingWrites) => {
                        // Only process when we have final data (not pending writes)
                        if (hasPendingWrites) {
                            return; // Wait for pending writes to complete
                        }

                        console.log({
                            uid: currentUser.uid,
                            email: currentUser.email,
                            employees,
                            found: employees.length > 0,
                        });

                        // Match by Firebase UID or email (prioritize companyEmail)
                        const employee = employees.find(
                            (u) =>
                                u.uid === currentUser.uid ||
                                u.companyEmail === currentUser.email ||
                                u.personalEmail === currentUser.email,
                        );

                        if (employee) {
                            setUserData(employee);
                            setEmployeeNotFound(false);
                        } else {
                            // Employee not found - if snapshot is empty after all data loaded, employee doesn't exist
                            if (employees.length === 0) {
                                setEmployeeNotFound(true);
                                console.warn("Employee record not found for user:", {
                                    uid: currentUser.uid,
                                    email: currentUser.email,
                                });

                                // Show error toast only if requested (after login)
                                if (showErrorToast) {
                                    showToast(
                                        "Employee record not found. Please contact your HR administrator.",
                                        "⚠️",
                                        "error",
                                    );
                                }
                            }
                        }
                    },
                );

                return () => {
                    unsubscribeUser?.();
                };
            } catch (err) {
                console.error("Error fetching user data:", err);
                setEmployeeNotFound(true);

                // Show error toast only if requested (after login)
                if (showErrorToast) {
                    showToast(
                        "Error loading employee data. Please try again or contact support.",
                        "⚠️",
                        "error",
                    );
                }

                return () => {};
            }
        },
        [dataGateway, showToast],
    );

    useEffect(() => {
        let shortTimeout: NodeJS.Timeout | null = null;
        let longTimeout: NodeJS.Timeout | null = null;
        let unsubscribed = false;

        const unsubscribeAuth = authGateway.onAuthStateChanged(
            async (currentUser) => {
                setUser(currentUser);

                if (currentUser) {
                    await fetchUserData(currentUser);
                } else {
                    setUserData(null);
                }
            },
        );

        // Short timeout (2.5s)
        shortTimeout = setTimeout(() => {
            if (!userData) {
                // If no userData, extend loading to 8.5s total
                longTimeout = setTimeout(() => {
                    if (!unsubscribed) setAuthLoading(false);
                }, 6000); // 2.5s + 6s = 8.5s
            } else {
                if (!unsubscribed) setAuthLoading(false);
            }
        }, 2500);

        return () => {
            unsubscribed = true;
            unsubscribeAuth();
            if (shortTimeout) clearTimeout(shortTimeout);
            if (longTimeout) clearTimeout(longTimeout);
        };
    }, [authGateway, fetchUserData]);

    // Watch userData: if it becomes non-null, end loading immediately
    useEffect(() => {
        if (userData && authLoading) {
            setAuthLoading(false);
        }
    }, [userData, authLoading]);

    // useEffect(() => {
    //     console.log("userData: ", userData);
    // }, [userData]);

    // useEffect(() => {
    //     console.log("auth loading: ", authLoading);
    // }, [authLoading]);

    useEffect(() => {
        // Only apply auto-logout if user is authenticated
        if (!user) return;

        let timer: NodeJS.Timeout;

        // Pages where auto-logout should not apply
        const excludedPaths = ["/", "/signin"];

        const resetTimer = () => {
            if (timer) clearTimeout(timer);

            // Check if current path is excluded
            const currentPath = window.location.pathname;
            if (excludedPaths.some((path) => currentPath.startsWith(path))) {
                return; // Don't set timer for excluded paths
            }

            // 5 minutes = 300000 ms
            timer = setTimeout(
                () => {
                    authGateway.signOut();
                    router.push("/logged-out");
                },
                5 * 60 * 1000,
            );
        };

        // List of events that indicate user activity
        const events = ["mousemove", "keydown", "mousedown", "touchstart"];

        events.forEach((event) => window.addEventListener(event, resetTimer));

        // Start the timer initially
        resetTimer();

        return () => {
            if (timer) clearTimeout(timer);
            events.forEach((event) => window.removeEventListener(event, resetTimer));
        };
    }, [authGateway, router, user]); // Add user as dependency

    return (
        <AuthContext.Provider
            value={{
                user,
                authLoading,
                userData,
                signout,
                signingOut,
                employeeNotFound,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
