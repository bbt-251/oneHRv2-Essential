import { NextRequest, NextResponse } from "next/server";
import { admin } from "@/lib/backend/firebase/admin";
import { AttendanceModel } from "@/lib/models/attendance";
import { getTimestamp, monthNames } from "@/lib/util/dayjs_format";
import dayjs from "dayjs";

// Helper function to get days in a month
const daysInMonth = (month: number, year: number): number => {
    return new Date(year, month + 1, 0).getDate();
};

export async function POST(req: NextRequest) {
    try {
        const { uid, shiftType }: { uid: string; shiftType: string } = await req.json();

        if (!uid || !shiftType) {
            return NextResponse.json(
                { success: false, message: "UID and shiftType are required" },
                { status: 400 },
            );
        }

        const db = admin.firestore();
        const batch = db.batch();

        const attendanceDataList: Omit<AttendanceModel, "id">[] = [];
        const currentYear = dayjs().year();
        const currentMonth = dayjs().month();

        monthNames.forEach((month, index) => {
            const att: Omit<AttendanceModel, "id"> = {
                generatedAt: getTimestamp(),
                uid: uid,
                month: month as AttendanceModel["month"],
                year: currentYear,
                state: "N/A" as AttendanceModel["state"],
                stage: "N/A" as AttendanceModel["stage"],
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

            // Stage/state determination
            if (currentMonth > index) {
                att.stage = "Closed";
            } else if (currentMonth === index) {
                att.stage = "Open";
                att.state = "In Progress";
            } else {
                att.state = "Draft";
                att.stage = "Incoming";
            }

            // Generate daily attendance
            const daysInAMonth: number = daysInMonth(index, currentYear);
            for (let i = 1; i <= daysInAMonth; i++) {
                att.values.push({
                    id: crypto.randomUUID(),
                    day: i,
                    value: null,
                    timestamp: "N/A",
                    from: null,
                    to: null,
                    status: "N/A",
                    dailyWorkedHours: 0,
                    workedHours: [],
                });
            }

            attendanceDataList.push(att);
        });

        // Batch write using admin SDK
        const createdRecords: AttendanceModel[] = [];

        attendanceDataList.forEach(attendance => {
            const docRef = db.collection("attendance").doc();
            const attendanceWithId = { ...attendance, id: docRef.id };
            batch.set(docRef, attendanceWithId);
            createdRecords.push(attendanceWithId as AttendanceModel);
        });

        await batch.commit();

        return NextResponse.json(
            {
                success: true,
                records: createdRecords,
                message: "Attendance records generated successfully",
            },
            { status: 201 },
        );
    } catch (err: any) {
        return NextResponse.json(
            { success: false, message: err.message || "Error generating attendance" },
            { status: 500 },
        );
    }
}
