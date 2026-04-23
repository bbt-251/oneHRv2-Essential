import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentInstanceKey } from "@/lib/shared/config";
import { createEmployeeRecord, listEmployees } from "@/lib/server/employee/employee.repository";
import { monthNames, getTimestamp } from "@/lib/util/dayjs_format";
import { EmployeeModel } from "@/lib/models/employee";
import { AttendanceModel } from "@/lib/models/attendance";
import { AttendanceServerRepository } from "@/lib/server/attendance/attendance.repository";

const SETUP_CONFIRMATION_CODE = "851745";

const daysInMonth = (month: number, year: number): number => new Date(year, month + 1, 0).getDate();

const buildAttendancePayloads = (
    uid: string,
    shiftType: string,
): Array<Omit<AttendanceModel, "id">> => {
    const currentYear = new Date().getFullYear();
    const currentMonthIndex = new Date().getMonth();

    return monthNames.map((month, index) => {
        const payload: Omit<AttendanceModel, "id"> = {
            generatedAt: getTimestamp(),
            uid,
            month: month as AttendanceModel["month"],
            year: currentYear,
            state: "N/A",
            stage: "N/A",
            associatedShiftType: shiftType,
            values: [],
            comments: [],
            monthlyWorkedHours: 0,
            dailyWorkingHour: 0,
            periodWorkingDays: 0,
            workedDays: 0,
            absentDays: 0,
            claimedOvertimes: [],
            lastClockInTimestamp: null,
        };

        if (currentMonthIndex > index) {
            payload.stage = "Closed";
        } else if (currentMonthIndex === index) {
            payload.stage = "Open";
            payload.state = "In Progress";
        } else {
            payload.stage = "Incoming";
            payload.state = "Draft";
        }

        const numberOfDays = daysInMonth(index, currentYear);
        for (let day = 1; day <= numberOfDays; day += 1) {
            payload.values.push({
                id: crypto.randomUUID(),
                day,
                value: null,
                timestamp: "N/A",
                from: null,
                to: null,
                status: "N/A",
                dailyWorkedHours: 0,
                workedHours: [],
            });
        }

        return payload;
    });
};

export async function GET() {
    const employees = await listEmployees();

    return NextResponse.json({
        success: true,
        usersExist: employees.length > 0,
    });
}

export async function POST(request: NextRequest) {
    try {
        const instanceKey = getCurrentInstanceKey();
        const body = (await request.json()) as Partial<EmployeeModel> & {
            confirmationCode?: string;
        };

        if (body.confirmationCode !== SETUP_CONFIRMATION_CODE) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Invalid confirmation code.",
                },
                { status: 400 },
            );
        }

        const existingEmployees = await listEmployees();
        if (existingEmployees.length > 0) {
            return NextResponse.json(
                {
                    success: false,
                    message: "System has already been set up.",
                },
                { status: 409 },
            );
        }

        const employeePayload = body as Omit<EmployeeModel, "id">;
        const employeeRecord = await createEmployeeRecord({
            ...employeePayload,
            uid: crypto.randomUUID(),
        });

        const attendancePayloads = buildAttendancePayloads(
            employeeRecord.uid,
            employeeRecord.shiftType || "Regular",
        );
        await Promise.all(
            attendancePayloads.map(payload =>
                AttendanceServerRepository.create(payload, instanceKey),
            ),
        );

        return NextResponse.json({
            success: true,
            uid: employeeRecord.uid,
            employeeId: employeeRecord.id,
        });
    } catch (error) {
        return NextResponse.json(
            {
                success: false,
                message: error instanceof Error ? error.message : "Failed to complete setup.",
            },
            { status: 500 },
        );
    }
}
