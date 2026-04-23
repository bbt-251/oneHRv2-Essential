"use client";

import { useAuth } from "@/context/authContext";
import { useData } from "@/context/app-data-context";

interface UseAttendanceOptions {
    role?: string;
}

export function useAttendance(_options?: UseAttendanceOptions) {
    const { userData } = useAuth();
    const { attendances } = useData();
    const userId = userData?.uid;
    const attendance = userId ? attendances.filter(record => record.uid === userId) : [];

    return { attendance };
}
