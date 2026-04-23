import { ShiftHourModel, ShiftTypeModel } from "@/lib/models/hr-settings";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
dayjs.extend(duration);

export const days: string[] = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
];

function calculateDailyWorkingHours(
    currentDay: dayjs.Dayjs,
    shiftType: ShiftTypeModel,
    shiftHours: ShiftHourModel[],
): number {
    let totalHours = 0;

    const dayOfTheWeek = days[currentDay.day()];
    const workingDay = shiftType?.workingDays?.find(day => day.dayOfTheWeek === dayOfTheWeek);

    if (workingDay) {
        const shiftHour = shiftHours.find(sh => sh.id === workingDay.associatedShiftHour);
        if (shiftHour) {
            shiftHour.shiftHours.forEach(shift => {
                let startTime = dayjs(shift.startTime, "hh:mm A");
                let endTime = dayjs(shift.endTime, "hh:mm A");

                // If end time is before start time, add a day to end time
                if (endTime.isBefore(startTime)) {
                    endTime = endTime.add(1, "day");
                }

                const diffInMs = endTime.diff(startTime);
                const dur = dayjs.duration(diffInMs);

                totalHours += dur.asHours();
            });
        }
    }

    return totalHours;
}

export default calculateDailyWorkingHours;
