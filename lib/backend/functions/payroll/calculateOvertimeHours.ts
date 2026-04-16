import { OvertimeRequestModel } from "@/lib/models/overtime-request";
import dayjs from "dayjs";
import { groupBy } from "../groupBy";
import camelize from "../camelize";

export default function calculateOvertimeHours(overtime: OvertimeRequestModel[]) {
    // getting overtime data
    const groupedByOvertimeType: any = groupBy("overtimeType", overtime);

    // creating an object to store aggregated overtime worked hours for the employee
    let overtimeTypeWorkedHours: any = {};

    // getting defined overtime types inside the attendance
    const keys: string[] = Object.keys(groupedByOvertimeType);
    keys.forEach(key => {
        const current: OvertimeRequestModel[] = groupedByOvertimeType[key];
        let forThisType: number = 0;

        // looping through the overtime array and calculating how many hours they worked overtime
        current.forEach(doc => {
            const ft = dayjs(`1-1-2023 ${doc.overtimeStartTime}`);
            const tt = dayjs(`1-1-2023 ${doc.overtimeEndTime}`);

            // Handle overnight shifts (end time is earlier than start time)
            let mins = tt.diff(ft, "minutes", true);
            if (mins < 0) {
                mins += 24 * 60; // Add 24 hours in minutes for overnight shifts
            }

            const totalHours = mins / 60;

            forThisType += totalHours;
        });

        // saving the aggregated overtime hours
        overtimeTypeWorkedHours[camelize(key)] = forThisType;
    });

    return overtimeTypeWorkedHours;
}
