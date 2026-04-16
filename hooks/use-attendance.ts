import { useAuth } from "@/context/authContext";
import { attendanceCollection } from "@/lib/backend/firebase/collections";
import { AttendanceModel } from "@/lib/models/attendance";
import { getCurrentMonthName } from "@/lib/util/dayjs_format";
import { onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

type Role = "HR Manager" | "Payroll Officer" | "Manager" | "Employee";

interface UseAttendanceOptions {
    role: Role;
    uid?: string; // Mandatory if role is Manager
    month?: string;
    year?: number;
}

interface UseAttendanceReturn {
    attendance: AttendanceModel[];
    loading: boolean;
    error: string | null;
}

export function useAttendance(options: UseAttendanceOptions): UseAttendanceReturn {
    const { user, userData } = useAuth();
    const [attendance, setAttendance] = useState<AttendanceModel[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { role, uid, month = getCurrentMonthName(), year = dayjs().year() } = options;

    useEffect(() => {
        if (!user) {
            setError("User not authenticated");
            setLoading(false);
            return;
        }

        // Validate required parameters
        if (role === "Manager" && !uid) {
            setError("UID is required for Manager role");
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        let unsubscribe: (() => void) | undefined;

        const setupRealtimeListener = async () => {
            try {
                // Use userData from auth context
                const currentEmployee = userData;
                if (!currentEmployee) {
                    setError("Employee data not found");
                    setLoading(false);
                    return;
                }

                // Validate role permissions
                if (role === "HR Manager" && !currentEmployee.role.includes("HR Manager")) {
                    setError("Access denied: HR privileges required");
                    setLoading(false);
                    return;
                }

                if (role === "Payroll Officer" && !currentEmployee.role.includes("Payroll")) {
                    setError("Access denied: Payroll privileges required");
                    setLoading(false);
                    return;
                }

                if (role === "Manager" && !currentEmployee.managerPosition) {
                    setError("Access denied: Manager privileges required");
                    setLoading(false);
                    return;
                }

                // Setup real-time listeners based on role
                if (role === "HR Manager" || role === "Payroll Officer") {
                    // HR & Payroll: Listen to all attendance for the specified month/year
                    const q = query(
                        attendanceCollection,
                        where("month", "==", month),
                        where("year", "==", year),
                    );

                    unsubscribe = onSnapshot(
                        q,
                        snapshot => {
                            const attendanceData = snapshot.docs.map(
                                doc =>
                                    ({
                                        id: doc.id,
                                        ...doc.data(),
                                    }) as AttendanceModel,
                            );
                            console.log("Employee attendance query result:", attendanceData);
                            setAttendance(
                                attendanceData.sort(
                                    (a, b) =>
                                        dayjs(a.month, "MMMM").month() -
                                        dayjs(b.month, "MMMM").month(),
                                ),
                            );
                            setLoading(false);
                        },
                        err => {
                            console.error("Error fetching employee attendance:", err);
                            setError(err.message);
                            setLoading(false);
                        },
                    );
                } else if (role === "Manager") {
                    // Manager: Listen to attendance for self + reportees
                    const reportees = currentEmployee?.reportees ? currentEmployee.reportees : [];
                    const uid = [user.uid, ...reportees];

                    // Single listener for all employees using 'in' operator
                    const q = query(
                        attendanceCollection,
                        where("uid", "in", uid),
                        where("month", "==", month),
                        where("year", "==", year),
                    );

                    unsubscribe = onSnapshot(
                        q,
                        snapshot => {
                            const attendanceData = snapshot.docs.map(
                                doc =>
                                    ({
                                        id: doc.id,
                                        ...doc.data(),
                                    }) as AttendanceModel,
                            );
                            setAttendance(
                                attendanceData.sort(
                                    (a, b) =>
                                        dayjs(a.month, "MMMM").month() -
                                        dayjs(b.month, "MMMM").month(),
                                ),
                            );
                            setLoading(false);
                        },
                        err => {
                            setError(err.message);
                            setLoading(false);
                        },
                    );
                } else {
                    // Employee: Listen to only their own attendance
                    console.log("Querying attendance for uid:", user.uid, "year:", year);
                    const q = query(
                        attendanceCollection,
                        where("uid", "==", user.uid),
                        // where("month", "==", month),
                        where("year", "==", year),
                    );

                    unsubscribe = onSnapshot(
                        q,
                        snapshot => {
                            const attendanceData = snapshot.docs.map(
                                doc =>
                                    ({
                                        id: doc.id,
                                        ...doc.data(),
                                    }) as AttendanceModel,
                            );
                            setAttendance(
                                attendanceData.sort(
                                    (a, b) =>
                                        dayjs(a.month, "MMMM").month() -
                                        dayjs(b.month, "MMMM").month(),
                                ),
                            );
                            setLoading(false);
                        },
                        err => {
                            setError(err.message);
                            setLoading(false);
                        },
                    );
                }
            } catch (err) {
                setError(
                    err instanceof Error ? err.message : "Failed to setup attendance listener",
                );
                setLoading(false);
            }
        };

        setupRealtimeListener();

        // Cleanup function
        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [user, userData, role, uid, month, year]);

    return {
        attendance,
        loading,
        error,
    };
}
