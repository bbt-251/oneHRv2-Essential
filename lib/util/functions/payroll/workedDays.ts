import { AttendanceModel } from "@/lib/models/attendance";

export function calculateWorkedDays(attendanceData: AttendanceModel) {
    let workedDays: number = 0;

    attendanceData.values.forEach(doc => {
        if (doc.value === "P" || doc.value === "H") workedDays++;
    });

    return workedDays;
}

//? Use case
/*
 *   the input is attendance data for an employee
 *   from the attendanceData, the function extracts the attendance values and calculates the number of days the user was present
 */

export function calculateWorkedDaysIncludingLeaveDays(attendance: AttendanceModel) {
    let present: number = 0;
    let halfPresent: number = 0;
    let leaveDays: number = 0;
    let holidays: number = 0;

    attendance.values.forEach(doc => {
        if (doc.value === "P") present++;
        if (doc.value === "H") halfPresent++;
        if (doc.value && doc.value.length === 2) leaveDays++;
        if (doc.value && doc.value.length > 2) holidays++;
    });

    const workedDays = present + halfPresent / 2;

    return { workedDays, leaveDays, holidays };
}
