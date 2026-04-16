export interface AttendanceModel {
    id: string;
    generatedAt: string;
    uid: string;

    month:
        | "January"
        | "February"
        | "March"
        | "April"
        | "May"
        | "June"
        | "July"
        | "August"
        | "September"
        | "October"
        | "November"
        | "December";
    year: number;
    state:
        | "N/A"
        | "Draft"
        | "In Progress"
        | "Validated"
        | "Approved"
        | "Refused (LM)"
        | "Refused (HR)";
    stage: "N/A" | "Closed" | "Open" | "Incoming";
    associatedShiftType: string;

    values: DailyAttendance[];

    comments: AttendanceCommentModel[];

    monthlyWorkedHours: number;
    dailyWorkingHour: number;
    periodWorkingDays: number;
    workedDays: number;
    absentDays: number;

    claimedOvertimes: string[];

    lastClockInTimestamp: string | null; // this value will be used to determine clock out date
}

export interface DailyAttendance {
    id: string;
    day: number;
    value: "P" | "H" | "A" | null | string;
    timestamp: string;
    from: string | null;
    to: string | null;
    status: "Submitted" | "Verified" | "Refused" | "N/A";
    dailyWorkedHours: number;
    workedHours: WorkedHoursModel[];
}

export interface AttendanceCommentModel {
    id: string;
    commentBy: string;
    timestamp: string;
    text: string;
}

export interface RequestModificationModel {
    id: string;
    timestamp: string;
    requestId: string;
    parentAttendanceID: string; // AttendanceModel id(doc ID)
    uid: string;
    status: "Requested" | "Approved" | "Refused";
    date: string;
    day: number;
    oldValue: "P" | "H" | "A" | null | string;
    newValue: "P" | "H" | "A" | null;
    oldWorkedHours: WorkedHoursModel[];
    workedHours: WorkedHoursModel[];
    comment: AttendanceCommentModel | null;
    reviewedBy: string | null;
    reviewedDate: string | null;
    hrComments: string | null;
}

export interface WorkedHoursModel {
    id: string;
    timestamp: string;
    type: "Clock In" | "Clock Out";
    hour: string;
}
