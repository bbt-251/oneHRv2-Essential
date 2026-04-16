import { EMPLOYEE_ATTENDANCE_LOG_MESSAGES } from "@/lib/log-descriptions/attendance-management";
import { AttendanceModel, WorkedHoursModel } from "@/lib/models/attendance";
import { AttendanceLogicModel } from "@/lib/models/attendance-logic";
import { FlexibilityParameterModel } from "@/lib/models/flexibilityParameter";
import { getUTCTimestamp } from "@/lib/util/dayjs_format";
import dayjs from "dayjs";
import { updateAttendance } from "../api/attendance/attendance-service";
import { addLateComers } from "../api/attendance/late-comers-service";
import { createLog } from "../api/logCollection";
import { ShiftHourModel, ShiftTypeModel } from "../firebase/hrSettingsService";
import calculateDailyWorkingHours from "./calculateDailyWorkingHour";
import { updateEmployee } from "../api/employee-management/employee-management-service";
import { EmployeeModel } from "@/lib/models/employee";

export const clockInOrOut = async (
    type: "Clock In" | "Clock Out", // Type of action, either "Clock In" or "Clock Out"
    attendance: AttendanceModel, // The attendance record for the employee
    shiftType: ShiftTypeModel,
    attendanceLogic: AttendanceLogicModel,
    shiftHours: ShiftHourModel[],
    flexParam: FlexibilityParameterModel | null,
    actionBy: string,
    employee: EmployeeModel,
    employeeName?: string,
    timezone?: string, // User's timezone from browser
): Promise<{ status: boolean; error?: string }> => {
    const selected = attendance;
    const newData: AttendanceModel = selected;

    // Calculate daily working hours for the current day
    const dailyWorkingHour: number = calculateDailyWorkingHours(dayjs(), shiftType, shiftHours);
    if (dailyWorkingHour == 0) {
        return {
            status: false,
            error: "Set up shift type and associate to employee",
        };
    }

    // Determine the current day's index in the `values` array (zero-based)
    const currentDayIndex =
        type == "Clock In" ? dayjs().date() - 1 : dayjs(newData.lastClockInTimestamp).date() - 1;

    // Get the existing worked hours for the day, or initialize an empty array
    const workedHours: WorkedHoursModel[] = newData.values[currentDayIndex]?.workedHours ?? [];

    if (type === "Clock In") {
        // Save clock-in timestamp
        const clockInTimestamp = getUTCTimestamp();

        // Add the clock-in entry to the worked hours array
        workedHours.push({
            id: crypto.randomUUID(), // Generate a unique ID for this clock-in entry
            timestamp: clockInTimestamp, // ISO timestamp for the clock-in
            type: "Clock In", // Mark as a clock-in
            hour: dayjs().format("h:mm A"), // Store local time for display
        });

        // Update the current day's worked hours with the clock-in entry
        newData.values[currentDayIndex] = {
            ...newData.values[currentDayIndex],
            workedHours, // Updated worked hours array
        };

        // Save the clock-in timestamp for later reference
        newData.lastClockInTimestamp = clockInTimestamp;

        // Check for late comers
        const timestamp = dayjs();
        const workingDay = shiftType?.workingDays?.find(
            (wd: { dayOfTheWeek: string }) => timestamp.format("dddd") === wd.dayOfTheWeek,
        );
        const shiftHour = shiftHours.find(sh => sh.id === workingDay?.associatedShiftHour);
        // console.log('shiftHour', shiftHour)

        const shiftHourDivision = shiftHour?.shiftHours?.find(shd => {
            const startTime = dayjs(shd.startTime, "hh:mm A");
            const endTime = dayjs(shd.endTime, "hh:mm A");

            const substractST = dayjs(startTime).subtract(
                Number(flexParam?.minute ?? 0),
                "minutes",
            );
            return (
                (timestamp.isAfter(substractST, "minutes") ||
                    timestamp.isSame(substractST, "minutes")) &&
                (timestamp.isBefore(endTime, "minutes") || timestamp.isSame(endTime, "minutes"))
            );
        });

        // console.log(shiftHourDivision?.startTime)
        const startDivision = dayjs(shiftHourDivision?.startTime ?? "", "hh:mm A").add(
            Number(flexParam?.minute ?? 0),
            "minutes",
        );
        const isLate = shiftHourDivision?.startTime
            ? timestamp.isAfter(startDivision, "minutes")
            : false;

        if (isLate) {
            await addLateComers({
                timestamp: timestamp.toISOString(),
                displayTimestamp: timestamp.format("MMMM DD, YYYY - hh:mm A"),
                employeeUID: attendance.uid,
            }).then(async res => {
                if (res) {
                    console.log("Success");
                    // Log late clock in
                    await createLog(
                        EMPLOYEE_ATTENDANCE_LOG_MESSAGES.LATE_CLOCK_IN(employeeName || "Employee"),
                        actionBy,
                        "Success",
                    );
                } else {
                    console.log("Something went wrong");
                }
            });
        }

        // Log successful clock in
        await createLog(
            EMPLOYEE_ATTENDANCE_LOG_MESSAGES.CLOCK_IN(employeeName || "Employee"),
            actionBy,
            "Success",
        );
    } else if (type === "Clock Out") {
        // Ensure there is a previous clock-in timestamp
        if (!newData.lastClockInTimestamp) {
            return { status: false, error: "Cannot clock out without a previous clock-in." };
        }

        // Use the clock-in timestamp to determine the working day
        const clockInDate = dayjs(newData.lastClockInTimestamp);
        const clockOutTimestamp = getUTCTimestamp(); // Get the current timestamp for clock-out

        // Determine the day index based on the clock-in date
        const clockInDayIndex = clockInDate.date() - 1;

        // Calculate the hours worked since the last clock-in
        const hoursWorked = dayjs().diff(dayjs(newData.lastClockInTimestamp), "hours", true);

        // Add the clock-out entry to the worked hours array
        workedHours.push({
            id: crypto.randomUUID(), // Generate a unique ID for this clock-out entry
            timestamp: clockOutTimestamp, // ISO timestamp for the clock-out
            type: "Clock Out", // Mark as a clock-out
            hour: dayjs().format("h:mm A"), // Store local time for display
        });

        // Update daily and monthly worked hours
        let dailyWorkedHours = newData.values[clockInDayIndex]?.dailyWorkedHours ?? 0;
        dailyWorkedHours += hoursWorked;

        let monthlyWorkedHours = newData?.monthlyWorkedHours ?? 0;
        monthlyWorkedHours += hoursWorked;

        // Determine attendance value based on daily worked hours and contract hours
        const attendanceValue = dailyWorkingHour
            ? dailyWorkedHours >=
              dailyWorkingHour *
                  (attendanceLogic.presentThreshold ? attendanceLogic.presentThreshold / 100 : 0)
                ? "P"
                : dailyWorkedHours >=
                    dailyWorkingHour *
                        (attendanceLogic.halfPresentThreshold
                            ? attendanceLogic.halfPresentThreshold / 100
                            : 0)
                    ? "H"
                    : "A"
            : newData.values[clockInDayIndex]?.value;

        // Update attendance data for the clock-in date
        newData.monthlyWorkedHours = monthlyWorkedHours;
        newData.values[clockInDayIndex] = {
            ...newData.values[clockInDayIndex],
            workedHours, // Updated worked hours with clock-out entry
            value: attendanceValue, // Updated attendance value
            dailyWorkedHours, // Updated daily worked hours
            status: "Submitted", // Mark the day as submitted
            timestamp: clockOutTimestamp, // Save the clock-out timestamp
        };

        // Reset the clock-in timestamp to null after clock-out
        newData.lastClockInTimestamp = null;

        // Log successful clock out
        await createLog(
            EMPLOYEE_ATTENDANCE_LOG_MESSAGES.CLOCK_OUT(employeeName || "Employee"),
            actionBy,
            "Success",
        );
    }

    // Update employee's timezone if provided
    if (timezone) {
        await updateEmployee({ id: employee.id, timezone }, actionBy);
    }

    // Save the updated attendance record in the database
    const updateResult = await updateAttendance(newData, actionBy);
    return { status: updateResult };
};
