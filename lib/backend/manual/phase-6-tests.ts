import assert from "node:assert/strict";
import {
    __resetPhase6StoreForTests,
    adjustAttendance,
    applyLoanPayment,
    createAttendance,
    createCompensation,
    createEmployee,
    createLeaveRequest,
    createLoan,
    createOvertimeRequest,
    decideOvertimeRequest,
    getLeaveBalance,
    getPayrollSettings,
    listEmployees,
    updateLeaveRequest,
    upsertPayrollSettings,
} from "@/lib/backend/manual/phase-6-domain-service";

const tenantId = "tenant-phase6";

const run = async (): Promise<void> => {
    __resetPhase6StoreForTests();

    const employee = createEmployee(tenantId, {
        uid: "employee-001",
        email: "employee-001@onehr.local",
        firstName: "Ada",
        lastName: "Lovelace",
        roles: ["Employee"],
        active: true,
    });

    assert.equal(listEmployees(tenantId).length, 1, "Expected employee CRUD to persist records");
    assert.equal(employee.firstName, "Ada", "Expected employee firstName to be mapped");

    const attendance = createAttendance(tenantId, {
        id: "att-1",
        employeeUid: employee.uid,
        date: "2026-04-15",
        status: "present",
        workedMinutes: 480,
    });

    const adjustedAttendance = adjustAttendance(tenantId, attendance.id, {
        status: "late",
        workedMinutes: 450,
        notes: "Adjusted for late arrival",
    });

    assert.equal(adjustedAttendance.adjusted, true, "Expected attendance adjustment workflow to flag adjusted records");

    const overtimeRequest = createOvertimeRequest(tenantId, {
        id: "ot-1",
        employeeUid: employee.uid,
        date: "2026-04-16",
        minutes: 120,
        reason: "Quarter close",
    });

    const approvedOvertime = decideOvertimeRequest(
        tenantId,
        overtimeRequest.id,
        "approved",
        "manager-1",
    );
    assert.equal(approvedOvertime.status, "approved", "Expected overtime approvals to update status");

    const leaveRequest = createLeaveRequest(tenantId, {
        id: "leave-1",
        employeeUid: employee.uid,
        leaveType: "annual",
        startDate: "2026-05-01",
        endDate: "2026-05-03",
    });

    updateLeaveRequest(tenantId, leaveRequest.id, {
        status: "approved",
        decidedBy: "hr-1",
    });

    assert.equal(getLeaveBalance(tenantId, employee.uid), 21, "Expected leave balance consistency checks to consume approved days");

    const defaultSettings = getPayrollSettings(tenantId);
    assert.equal(defaultSettings.currency, "USD", "Expected fallback payroll settings defaults");

    const customSettings = upsertPayrollSettings(tenantId, {
        currency: "USD",
        paySchedule: "biweekly",
        overtimeMultiplier: 2,
    });

    assert.equal(customSettings.paySchedule, "biweekly", "Expected payroll settings updates to persist");

    const compensation = createCompensation(tenantId, {
        id: "comp-1",
        employeeUid: employee.uid,
        baseSalary: 3000,
        allowances: 200,
        deductions: 50,
        effectiveDate: "2026-04-01",
    });

    assert.equal(compensation.baseSalary, 3000, "Expected compensation endpoints to store salary payload");

    const loan = createLoan(tenantId, {
        id: "loan-1",
        employeeUid: employee.uid,
        principal: 1200,
        monthlyDeduction: 200,
    });

    const paidLoan = applyLoanPayment(tenantId, loan.id, 1200);
    assert.equal(paidLoan.status, "closed", "Expected loan endpoint to close fully paid loans");

    console.log("Manual backend Phase 6 domain checks passed.");
};

void run();
