export interface LeaveModel {
    id: string;
    timestamp: string;
    leaveRequestID: string;
    leaveState: "Requested" | "Closed";
    leaveStage: "Open" | "Approved" | "Refused" | "Cancelled";
    leaveType: string;
    standIn: string | null;
    authorizedDays: string | null;
    firstDayOfLeave: string;
    lastDayOfLeave: string;
    dateOfReturn: string;
    numberOfLeaveDaysRequested: number;
    balanceLeaveDays: number;
    comments: LeaveCommentModel[];
    employeeID: string;
    attachments: string[];
    requestedFor: string | null;
    requestedBy: string | null;
    rollbackStatus: "Requested" | "Accepted" | "Refused" | "N/A";
    reason: string | null;
    /**
     * Half Day Option - specifies whether the leave is for half day morning or afternoon
     * Values: "HDM" (Half-day Morning), "HDA" (Half-day Afternoon), or null (full day)
     */
    halfDayOption: "HDM" | "HDA" | null;
}

export interface LeaveCommentModel {
    comment: string;
    date: string;
    by: string;
}
