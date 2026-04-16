import { WorkedHoursModel } from "@/lib/models/attendance";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
dayjs.extend(customParseFormat);

export const calculateDuration = (startTime: string, endTime: string) => {
    const start = dayjs(startTime, "hh:mm A");
    const end = dayjs(endTime, "hh:mm A");

    let diff = end.diff(start, "minute");

    // Handle overnight shifts (end time is earlier than start time)
    if (diff < 0) {
        diff += 24 * 60; // Add 24 hours in minutes
    }

    const hrs = Math.floor(diff / 60);
    const mins = diff % 60;

    return `${hrs}h ${mins}m`;
};

export const calculateTotalWorkedHours = (workedHours: { hour: string; type: string }[]) => {
    // 1. Sort by hour
    const sorted = [...workedHours].sort((a, b) =>
        dayjs(a.hour, "hh:mm A").diff(dayjs(b.hour, "hh:mm A")),
    );

    let totalMinutes = 0;

    // 2. Loop in pairs
    for (let i = 0; i < sorted.length; i += 2) {
        const start = sorted[i];
        const end = sorted[i + 1];

        if (!start || !end) continue; // safety check

        // 3. Add difference in minutes
        const diff = dayjs(end.hour, "hh:mm A").diff(dayjs(start.hour, "hh:mm A"), "minute");

        totalMinutes += diff;
    }

    // 4. Convert total minutes → h m
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;

    return `${hrs}h ${mins}m`;
};
