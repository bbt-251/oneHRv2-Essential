import { ManualApiError } from "@/lib/backend/manual/errors";

export interface ManualEmployeeRecord {
  uid: string;
  tenantId: string;
  email: string;
  firstName: string;
  lastName: string;
  roles: string[];
  managerUid?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ManualAttendanceRecord {
  id: string;
  tenantId: string;
  employeeUid: string;
  date: string;
  status: "present" | "absent" | "late" | "leave";
  workedMinutes: number;
  adjusted: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ManualOvertimeRequest {
  id: string;
  tenantId: string;
  employeeUid: string;
  date: string;
  minutes: number;
  reason: string;
  status: "pending" | "approved" | "rejected";
  decidedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ManualLeaveRequest {
  id: string;
  tenantId: string;
  employeeUid: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  reason?: string;
  status: "pending" | "approved" | "rejected";
  decidedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ManualPayrollSettings {
  tenantId: string;
  currency: string;
  paySchedule: "monthly" | "biweekly";
  overtimeMultiplier: number;
  updatedAt: string;
}

export interface ManualCompensationRecord {
  id: string;
  tenantId: string;
  employeeUid: string;
  baseSalary: number;
  allowances: number;
  deductions: number;
  effectiveDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface ManualLoanRecord {
  id: string;
  tenantId: string;
  employeeUid: string;
  principal: number;
  monthlyDeduction: number;
  remainingBalance: number;
  status: "active" | "closed";
  createdAt: string;
  updatedAt: string;
}

const tenantEmployees = new Map<string, Map<string, ManualEmployeeRecord>>();
const tenantAttendance = new Map<string, Map<string, ManualAttendanceRecord>>();
const tenantOvertime = new Map<string, Map<string, ManualOvertimeRequest>>();
const tenantLeave = new Map<string, Map<string, ManualLeaveRequest>>();
const tenantCompensation = new Map<string, Map<string, ManualCompensationRecord>>();
const tenantLoan = new Map<string, Map<string, ManualLoanRecord>>();
const tenantPayrollSettings = new Map<string, ManualPayrollSettings>();
const leaveBalances = new Map<string, number>();

const nowIso = (): string => new Date().toISOString();

const getTenantMap = <T>(
    root: Map<string, Map<string, T>>,
    tenantId: string,
): Map<string, T> => {
    const existing = root.get(tenantId);
    if (existing) {
        return existing;
    }

    const created = new Map<string, T>();
    root.set(tenantId, created);
    return created;
};

const ensureEmployee = (tenantId: string, employeeUid: string): ManualEmployeeRecord => {
    const employees = getTenantMap(tenantEmployees, tenantId);
    const employee = employees.get(employeeUid);

    if (!employee) {
        throw new ManualApiError(404, "EMPLOYEE_NOT_FOUND", "Employee not found.");
    }

    return employee;
};

const daysBetweenInclusive = (startDate: string, endDate: string): number => {
    const start = new Date(`${startDate}T00:00:00.000Z`);
    const end = new Date(`${endDate}T00:00:00.000Z`);
    const milliseconds = end.getTime() - start.getTime();
    const dayCount = Math.floor(milliseconds / (24 * 60 * 60 * 1000)) + 1;

    if (dayCount <= 0) {
        throw new ManualApiError(400, "INVALID_DATE_RANGE", "endDate must be on or after startDate.");
    }

    return dayCount;
};

const ensureLeaveBalance = (
    tenantId: string,
    employeeUid: string,
    requiredDays: number,
): void => {
    const key = `${tenantId}:${employeeUid}`;
    const balance = leaveBalances.get(key) ?? 24;

    if (balance < requiredDays) {
        throw new ManualApiError(
            409,
            "LEAVE_BALANCE_INSUFFICIENT",
            "Leave balance is insufficient for this request.",
            { balance, requiredDays },
        );
    }
};

const consumeLeaveBalance = (tenantId: string, employeeUid: string, consumedDays: number): void => {
    const key = `${tenantId}:${employeeUid}`;
    const current = leaveBalances.get(key) ?? 24;
    leaveBalances.set(key, current - consumedDays);
};

export const listEmployees = (tenantId: string): ManualEmployeeRecord[] => {
    return Array.from(getTenantMap(tenantEmployees, tenantId).values());
};

export const createEmployee = (
    tenantId: string,
    payload: Omit<ManualEmployeeRecord, "tenantId" | "createdAt" | "updatedAt">,
): ManualEmployeeRecord => {
    const employees = getTenantMap(tenantEmployees, tenantId);

    if (employees.has(payload.uid)) {
        throw new ManualApiError(409, "EMPLOYEE_ALREADY_EXISTS", "Employee already exists.");
    }

    const timestamp = nowIso();
    const created: ManualEmployeeRecord = {
        ...payload,
        tenantId,
        createdAt: timestamp,
        updatedAt: timestamp,
    };

    employees.set(created.uid, created);
    return created;
};

export const updateEmployee = (
    tenantId: string,
    employeeUid: string,
    payload: Partial<Omit<ManualEmployeeRecord, "uid" | "tenantId" | "createdAt" | "updatedAt">>,
): ManualEmployeeRecord => {
    const employees = getTenantMap(tenantEmployees, tenantId);
    const existing = ensureEmployee(tenantId, employeeUid);
    const updated: ManualEmployeeRecord = {
        ...existing,
        ...payload,
        updatedAt: nowIso(),
    };

    employees.set(employeeUid, updated);
    return updated;
};

export const deleteEmployee = (tenantId: string, employeeUid: string): void => {
    const employees = getTenantMap(tenantEmployees, tenantId);
    ensureEmployee(tenantId, employeeUid);
    employees.delete(employeeUid);
};

export const getEmployeeProfile = (tenantId: string, employeeUid: string): ManualEmployeeRecord => {
    return ensureEmployee(tenantId, employeeUid);
};

export const listAttendance = (tenantId: string, employeeUid?: string): ManualAttendanceRecord[] => {
    const attendance = Array.from(getTenantMap(tenantAttendance, tenantId).values());

    if (!employeeUid) {
        return attendance;
    }

    return attendance.filter((entry) => entry.employeeUid === employeeUid);
};

export const createAttendance = (
    tenantId: string,
    payload: Omit<ManualAttendanceRecord, "tenantId" | "createdAt" | "updatedAt" | "adjusted">,
): ManualAttendanceRecord => {
    ensureEmployee(tenantId, payload.employeeUid);
    const attendance = getTenantMap(tenantAttendance, tenantId);

    if (attendance.has(payload.id)) {
        throw new ManualApiError(409, "ATTENDANCE_ALREADY_EXISTS", "Attendance record already exists.");
    }

    const timestamp = nowIso();
    const created: ManualAttendanceRecord = {
        ...payload,
        tenantId,
        adjusted: false,
        createdAt: timestamp,
        updatedAt: timestamp,
    };

    attendance.set(created.id, created);
    return created;
};

export const adjustAttendance = (
    tenantId: string,
    attendanceId: string,
    patch: Pick<ManualAttendanceRecord, "status" | "workedMinutes"> & { notes?: string },
): ManualAttendanceRecord => {
    const attendance = getTenantMap(tenantAttendance, tenantId);
    const existing = attendance.get(attendanceId);

    if (!existing) {
        throw new ManualApiError(404, "ATTENDANCE_NOT_FOUND", "Attendance record not found.");
    }

    const adjusted: ManualAttendanceRecord = {
        ...existing,
        status: patch.status,
        workedMinutes: patch.workedMinutes,
        notes: patch.notes,
        adjusted: true,
        updatedAt: nowIso(),
    };

    attendance.set(attendanceId, adjusted);
    return adjusted;
};

export const createOvertimeRequest = (
    tenantId: string,
    payload: Omit<ManualOvertimeRequest, "tenantId" | "status" | "decidedBy" | "createdAt" | "updatedAt">,
): ManualOvertimeRequest => {
    ensureEmployee(tenantId, payload.employeeUid);
    const overtime = getTenantMap(tenantOvertime, tenantId);

    if (overtime.has(payload.id)) {
        throw new ManualApiError(409, "OVERTIME_ALREADY_EXISTS", "Overtime request already exists.");
    }

    const timestamp = nowIso();
    const created: ManualOvertimeRequest = {
        ...payload,
        tenantId,
        status: "pending",
        createdAt: timestamp,
        updatedAt: timestamp,
    };

    overtime.set(created.id, created);
    return created;
};

export const decideOvertimeRequest = (
    tenantId: string,
    requestId: string,
    decision: "approved" | "rejected",
    decidedBy: string,
): ManualOvertimeRequest => {
    const overtime = getTenantMap(tenantOvertime, tenantId);
    const existing = overtime.get(requestId);

    if (!existing) {
        throw new ManualApiError(404, "OVERTIME_NOT_FOUND", "Overtime request not found.");
    }

    const updated: ManualOvertimeRequest = {
        ...existing,
        status: decision,
        decidedBy,
        updatedAt: nowIso(),
    };

    overtime.set(requestId, updated);
    return updated;
};

export const listLeaveRequests = (tenantId: string, employeeUid?: string): ManualLeaveRequest[] => {
    const all = Array.from(getTenantMap(tenantLeave, tenantId).values());
    if (!employeeUid) {
        return all;
    }

    return all.filter((request) => request.employeeUid === employeeUid);
};

export const createLeaveRequest = (
    tenantId: string,
    payload: Omit<ManualLeaveRequest, "tenantId" | "status" | "decidedBy" | "days" | "createdAt" | "updatedAt">,
): ManualLeaveRequest => {
    ensureEmployee(tenantId, payload.employeeUid);
    const leave = getTenantMap(tenantLeave, tenantId);

    if (leave.has(payload.id)) {
        throw new ManualApiError(409, "LEAVE_ALREADY_EXISTS", "Leave request already exists.");
    }

    const days = daysBetweenInclusive(payload.startDate, payload.endDate);
    ensureLeaveBalance(tenantId, payload.employeeUid, days);

    const timestamp = nowIso();
    const created: ManualLeaveRequest = {
        ...payload,
        days,
        tenantId,
        status: "pending",
        createdAt: timestamp,
        updatedAt: timestamp,
    };

    leave.set(created.id, created);
    return created;
};

export const updateLeaveRequest = (
    tenantId: string,
    leaveId: string,
    patch: { status?: "approved" | "rejected"; decidedBy?: string; reason?: string },
): ManualLeaveRequest => {
    const leave = getTenantMap(tenantLeave, tenantId);
    const existing = leave.get(leaveId);

    if (!existing) {
        throw new ManualApiError(404, "LEAVE_NOT_FOUND", "Leave request not found.");
    }

    if (patch.status === "approved" && existing.status !== "approved") {
        consumeLeaveBalance(tenantId, existing.employeeUid, existing.days);
    }

    const updated: ManualLeaveRequest = {
        ...existing,
        ...patch,
        updatedAt: nowIso(),
    };

    leave.set(leaveId, updated);
    return updated;
};

export const getLeaveBalance = (tenantId: string, employeeUid: string): number => {
    ensureEmployee(tenantId, employeeUid);
    return leaveBalances.get(`${tenantId}:${employeeUid}`) ?? 24;
};

export const getPayrollSettings = (tenantId: string): ManualPayrollSettings => {
    const settings = tenantPayrollSettings.get(tenantId);
    if (settings) {
        return settings;
    }

    const fallback: ManualPayrollSettings = {
        tenantId,
        currency: "USD",
        paySchedule: "monthly",
        overtimeMultiplier: 1.5,
        updatedAt: nowIso(),
    };
    tenantPayrollSettings.set(tenantId, fallback);
    return fallback;
};

export const upsertPayrollSettings = (
    tenantId: string,
    patch: Pick<ManualPayrollSettings, "currency" | "paySchedule" | "overtimeMultiplier">,
): ManualPayrollSettings => {
    const updated: ManualPayrollSettings = {
        tenantId,
        ...patch,
        updatedAt: nowIso(),
    };
    tenantPayrollSettings.set(tenantId, updated);
    return updated;
};

export const listCompensation = (tenantId: string, employeeUid?: string): ManualCompensationRecord[] => {
    const all = Array.from(getTenantMap(tenantCompensation, tenantId).values());
    if (!employeeUid) {
        return all;
    }

    return all.filter((record) => record.employeeUid === employeeUid);
};

export const createCompensation = (
    tenantId: string,
    payload: Omit<ManualCompensationRecord, "tenantId" | "createdAt" | "updatedAt">,
): ManualCompensationRecord => {
    ensureEmployee(tenantId, payload.employeeUid);
    const compensation = getTenantMap(tenantCompensation, tenantId);

    if (compensation.has(payload.id)) {
        throw new ManualApiError(409, "COMPENSATION_ALREADY_EXISTS", "Compensation already exists.");
    }

    const timestamp = nowIso();
    const created: ManualCompensationRecord = {
        ...payload,
        tenantId,
        createdAt: timestamp,
        updatedAt: timestamp,
    };

    compensation.set(created.id, created);
    return created;
};

export const listLoans = (tenantId: string, employeeUid?: string): ManualLoanRecord[] => {
    const all = Array.from(getTenantMap(tenantLoan, tenantId).values());
    if (!employeeUid) {
        return all;
    }

    return all.filter((record) => record.employeeUid === employeeUid);
};

export const createLoan = (
    tenantId: string,
    payload: Omit<ManualLoanRecord, "tenantId" | "remainingBalance" | "status" | "createdAt" | "updatedAt">,
): ManualLoanRecord => {
    ensureEmployee(tenantId, payload.employeeUid);
    const loans = getTenantMap(tenantLoan, tenantId);

    if (loans.has(payload.id)) {
        throw new ManualApiError(409, "LOAN_ALREADY_EXISTS", "Loan already exists.");
    }

    const timestamp = nowIso();
    const created: ManualLoanRecord = {
        ...payload,
        tenantId,
        remainingBalance: payload.principal,
        status: "active",
        createdAt: timestamp,
        updatedAt: timestamp,
    };

    loans.set(created.id, created);
    return created;
};

export const applyLoanPayment = (
    tenantId: string,
    loanId: string,
    amount: number,
): ManualLoanRecord => {
    const loans = getTenantMap(tenantLoan, tenantId);
    const existing = loans.get(loanId);

    if (!existing) {
        throw new ManualApiError(404, "LOAN_NOT_FOUND", "Loan not found.");
    }

    const remainingBalance = Math.max(existing.remainingBalance - amount, 0);
    const updated: ManualLoanRecord = {
        ...existing,
        remainingBalance,
        status: remainingBalance === 0 ? "closed" : "active",
        updatedAt: nowIso(),
    };
    loans.set(loanId, updated);

    return updated;
};

export const __resetPhase6StoreForTests = (): void => {
    tenantEmployees.clear();
    tenantAttendance.clear();
    tenantOvertime.clear();
    tenantLeave.clear();
    tenantCompensation.clear();
    tenantLoan.clear();
    tenantPayrollSettings.clear();
    leaveBalances.clear();
};
