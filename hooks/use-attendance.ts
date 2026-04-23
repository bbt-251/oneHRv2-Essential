"use client";

import { useMemo } from "react";
import { useAuth } from "@/context/authContext";
import { useData } from "@/context/app-data-context";

interface UseAttendanceOptions {
    role?: string;
}

export function useAttendance(_options?: UseAttendanceOptions) {
    const { userData } = useAuth();
    const { attendances } = useData();
    const attendance = useMemo(
        () => (userData?.uid ? attendances.filter(record => record.uid === userData.uid) : []),
        [attendances, userData?.uid],
    );

    return { attendance };
}
