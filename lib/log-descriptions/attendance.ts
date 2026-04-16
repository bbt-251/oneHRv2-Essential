export interface LogInfo {
    title: string;
    description: string;
    module: string;
}

export const ATTENDANCE_LOG_MESSAGES = {
    GENERATED: (employeeName: string): LogInfo => ({
        title: "Attendance Generated",
        description: `Generated attendance records for "${employeeName}"`,
        module: "Attendance Management",
    }),
};
