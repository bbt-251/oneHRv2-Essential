"use client";

import { useAuth } from "@/context/authContext";
import { useAppData } from "@/context/app-data-context";

interface UseAttendanceOptions {
    role?: string;
}

export function useAttendance(_options?: UseAttendanceOptions) {
    const { userData } = useAuth();
    const { attendances } = useAppData();
    const attendance = userData?.uid
        ? attendances.filter(record => record.uid === userData.uid)
        : [];

    return { attendance };
}
