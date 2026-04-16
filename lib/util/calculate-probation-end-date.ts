import dayjs from "dayjs";
import { ShiftTypeModel } from "../backend/firebase/hrSettingsService";

export function calculateProbationEndDate(
    date: dayjs.Dayjs,
    shiftType: ShiftTypeModel,
    probationDays: number,
): number {
    if (!shiftType || !shiftType.workingDays || shiftType.workingDays.length === 0) {
        console.error("Invalid shift type or no working days defined.");
        return 0; // Return 0 or handle the error appropriately
    }

    let totalDays = 0;
    let workingDaysCount = 0;
    let currentDate = dayjs(date, "MMMM DD, YYYY");

    while (workingDaysCount < probationDays) {
        totalDays++;
        currentDate = currentDate.add(1, "day");

        // Check if the current day is a working day
        if (shiftType.workingDays.some(day => day.dayOfTheWeek === currentDate.format("dddd"))) {
            workingDaysCount++; // Increment working days count if it matches
        }

        // Safety check to prevent infinite loop
        if (totalDays > 365) {
            // Arbitrary limit (e.g., 1 year)
            console.error("Exceeded maximum loop iterations while calculating probation end date.");
            break;
        }
    }

    return totalDays;
}
