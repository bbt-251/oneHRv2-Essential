export interface LogInfo {
    title: string;
    description: string;
    module: string;
}

export const ATTENDANCE_LOGIC_LOG_MESSAGES = {
    CREATED: (data: {
        chosenLogic: 1 | 2 | 3 | 4;
        halfPresentThreshold: number | null;
        presentThreshold: number | null;
    }): LogInfo => ({
        title: "Attendance Logic Created",
        description: `Created new attendance logic configuration with chosen logic: ${data.chosenLogic}, half present threshold: ${data.halfPresentThreshold}, present threshold: ${data.presentThreshold}`,
        module: "Attendance Logic Management",
    }),

    UPDATED: (data: {
        id: string;
        chosenLogic?: 1 | 2 | 3 | 4;
        halfPresentThreshold?: number | null;
        presentThreshold?: number | null;
    }): LogInfo => ({
        title: "Attendance Logic Updated",
        description: `Updated attendance logic configuration for ID: ${data.id}${data.chosenLogic ? `, chosen logic: ${data.chosenLogic}` : ""}${data.halfPresentThreshold !== undefined ? `, half present threshold: ${data.halfPresentThreshold}` : ""}${data.presentThreshold !== undefined ? `, present threshold: ${data.presentThreshold}` : ""}`,
        module: "Attendance Logic Management",
    }),

    DELETED: (id: string): LogInfo => ({
        title: "Attendance Logic Deleted",
        description: `Deleted attendance logic configuration with ID: ${id}`,
        module: "Attendance Logic Management",
    }),

    STATUS_CHANGED: (newStatus: string): LogInfo => ({
        title: "Attendance Logic Status Changed",
        description: `Changed attendance logic status to ${newStatus}`,
        module: "Attendance Logic Management",
    }),
};

export const HOLIDAY_SETUP_LOG_MESSAGES = {
    CREATED: (data: { name: string; date: string; active: "Yes" | "No" }): LogInfo => ({
        title: "Holiday Created",
        description: `Created new holiday configuration with name: '${data.name}', date: '${data.date}', active: '${data.active}'`,
        module: "Holiday Setup Management",
    }),

    UPDATED: (data: {
        id: string;
        name?: string;
        date?: string;
        active?: "Yes" | "No";
    }): LogInfo => ({
        title: "Holiday Updated",
        description: `Updated holiday configuration for ID: ${data.id}${data.name ? `, name: '${data.name}'` : ""}${data.date ? `, date: '${data.date}'` : ""}${data.active ? `, active: '${data.active}'` : ""}`,
        module: "Holiday Setup Management",
    }),

    DELETED: (id: string): LogInfo => ({
        title: "Holiday Deleted",
        description: `Deleted holiday configuration with ID: ${id}`,
        module: "Holiday Setup Management",
    }),

    STATUS_CHANGED: (newStatus: string): LogInfo => ({
        title: "Holiday Status Changed",
        description: `Changed holiday status to ${newStatus}`,
        module: "Holiday Setup Management",
    }),
};

export const SHIFT_HOURS_LOG_MESSAGES = {
    CREATED: (data: {
        name: string;
        shiftHours: { startTime: string; endTime: string }[];
        active: "Yes" | "No";
    }): LogInfo => ({
        title: "Shift Hours Created",
        description: `Created new shift hours configuration with name: '${data.name}', shift hours: ${data.shiftHours.map(sh => `${sh.startTime}-${sh.endTime}`).join(", ")}, active: '${data.active}'`,
        module: "Shift Hours Management",
    }),

    UPDATED: (data: {
        id: string;
        name?: string;
        shiftHours?: { startTime: string; endTime: string }[];
        active?: "Yes" | "No";
    }): LogInfo => ({
        title: "Shift Hours Updated",
        description: `Updated shift hours configuration for ID: ${data.id}${data.name ? `, name: '${data.name}'` : ""}${data.shiftHours ? `, shift hours: ${data.shiftHours.map(sh => `${sh.startTime}-${sh.endTime}`).join(", ")}` : ""}${data.active ? `, active: '${data.active}'` : ""}`,
        module: "Shift Hours Management",
    }),

    DELETED: (id: string): LogInfo => ({
        title: "Shift Hours Deleted",
        description: `Deleted shift hours configuration with ID: ${id}`,
        module: "Shift Hours Management",
    }),

    STATUS_CHANGED: (newStatus: string): LogInfo => ({
        title: "Shift Hours Status Changed",
        description: `Changed shift hours status to ${newStatus}`,
        module: "Shift Hours Management",
    }),
};

export const SHIFT_TYPE_LOG_MESSAGES = {
    CREATED: (data: {
        name: string;
        workingDays: { dayOfTheWeek: string; associatedShiftHour: string }[];
        startDate: string;
        endDate: string;
        active: "Yes" | "No";
    }): LogInfo => ({
        title: "Shift Type Created",
        description: `Created new shift type configuration with name: '${data.name}', working days: ${data.workingDays.map(wd => wd.dayOfTheWeek).join(", ")}, start date: '${data.startDate}', end date: '${data.endDate}', active: '${data.active}'`,
        module: "Shift Type Management",
    }),

    UPDATED: (data: {
        id: string;
        name?: string;
        workingDays?: { dayOfTheWeek: string; associatedShiftHour: string }[];
        startDate?: string;
        endDate?: string;
        active?: "Yes" | "No";
    }): LogInfo => ({
        title: "Shift Type Updated",
        description: `Updated shift type configuration for ID: ${data.id}${data.name ? `, name: '${data.name}'` : ""}${data.workingDays ? `, working days: ${data.workingDays.map(wd => wd.dayOfTheWeek).join(", ")}` : ""}${data.startDate ? `, start date: '${data.startDate}'` : ""}${data.endDate ? `, end date: '${data.endDate}'` : ""}${data.active ? `, active: '${data.active}'` : ""}`,
        module: "Shift Type Management",
    }),

    DELETED: (id: string): LogInfo => ({
        title: "Shift Type Deleted",
        description: `Deleted shift type configuration with ID: ${id}`,
        module: "Shift Type Management",
    }),

    STATUS_CHANGED: (newStatus: string): LogInfo => ({
        title: "Shift Type Status Changed",
        description: `Changed shift type status to ${newStatus}`,
        module: "Shift Type Management",
    }),
};

export const OVERTIME_CONFIGURATION_LOG_MESSAGES = {
    CREATED: (data: {
        overtimeType: string;
        overtimeRate: number;
        active: "Yes" | "No";
    }): LogInfo => ({
        title: "Overtime Configuration Created",
        description: `Created new overtime configuration with type: '${data.overtimeType}', rate: ${data.overtimeRate}, active: '${data.active}'`,
        module: "Overtime Configuration Management",
    }),

    UPDATED: (data: {
        id: string;
        overtimeType?: string;
        overtimeRate?: number;
        active?: "Yes" | "No";
    }): LogInfo => ({
        title: "Overtime Configuration Updated",
        description: `Updated overtime configuration for ID: ${data.id}${data.overtimeType ? `, type: '${data.overtimeType}'` : ""}${data.overtimeRate !== undefined ? `, rate: ${data.overtimeRate}` : ""}${data.active ? `, active: '${data.active}'` : ""}`,
        module: "Overtime Configuration Management",
    }),

    DELETED: (id: string): LogInfo => ({
        title: "Overtime Configuration Deleted",
        description: `Deleted overtime configuration with ID: ${id}`,
        module: "Overtime Configuration Management",
    }),

    STATUS_CHANGED: (newStatus: string): LogInfo => ({
        title: "Overtime Configuration Status Changed",
        description: `Changed overtime configuration status to ${newStatus}`,
        module: "Overtime Configuration Management",
    }),

    MONTHLY_WORKING_HOURS_UPDATED: (data: { monthlyWorkingHours: number }): LogInfo => ({
        title: "Standard Monthly Working Hours Updated",
        description: `Set standard monthly working hours to ${data.monthlyWorkingHours} hours`,
        module: "Overtime Configuration Management",
    }),
};

export const EMPLOYEE_ATTENDANCE_LOG_MESSAGES = {
    CLOCK_IN: (employeeName: string): LogInfo => ({
        title: "Employee Clocked In",
        description: `${employeeName} successfully clocked in for the day`,
        module: "Employee Attendance",
    }),

    CLOCK_OUT: (employeeName: string): LogInfo => ({
        title: "Employee Clocked Out",
        description: `${employeeName} successfully clocked out for the day`,
        module: "Employee Attendance",
    }),

    ATTENDANCE_UPDATED: (employeeName: string): LogInfo => ({
        title: "Employee Attendance Updated",
        description: `${employeeName}'s attendance record was updated`,
        module: "Employee Attendance",
    }),

    LATE_CLOCK_IN: (employeeName: string): LogInfo => ({
        title: "Late Clock In Recorded",
        description: `${employeeName} clocked in late and was recorded as late comer`,
        module: "Employee Attendance",
    }),
};
