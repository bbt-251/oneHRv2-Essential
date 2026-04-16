import type { OvertimeRequestModel } from "@/lib/models/overtime-request";
import type { EmployeeModel } from "@/lib/models/employee";
import getFullName from "@/lib/util/getEmployeeFullName";

/**
 * Calculates the overtime cost based on duration, overtime rate, and hourly wage.
 * Formula: duration * (overtimeRate / 100) * hourlyWage
 */
export function calculateOvertimeCost(
    duration: number,
    overtimeRate: number,
    hourlyWage: number,
): number {
    if (!duration || !overtimeRate || !hourlyWage) {
        return 0;
    }

    const result = duration * (overtimeRate / 100) * hourlyWage;

    return result;
}

/** First worker listed on the request (stable order from `employeeUids`). */
export function getPrimaryOvertimeEmployee(
    request: OvertimeRequestModel,
    employees: EmployeeModel[],
): EmployeeModel | undefined {
    const uid = request.employeeUids[0];
    return uid ? employees.find(e => e.uid === uid) : undefined;
}

/**
 * Line manager shown for OT: primary worker's `reportingLineManager`.
 * If that is missing, falls back to `requestedBy` only when the submitter is not the worker
 * (e.g. manager filed on behalf). Self-submitted requests use the worker's line manager only.
 */
export function getOvertimeManagerDisplayName(
    request: OvertimeRequestModel,
    employees: EmployeeModel[],
): string {
    const primary = getPrimaryOvertimeEmployee(request, employees);
    const lineUid = primary?.reportingLineManager?.trim();
    if (lineUid) {
        const mgr = employees.find(e => e.uid === lineUid);
        if (mgr) return getFullName(mgr).trim() || "—";
    }
    if (request.requestedBy && primary && request.requestedBy !== primary.uid) {
        const submitter = employees.find(e => e.uid === request.requestedBy);
        if (submitter) return getFullName(submitter).trim() || "—";
    }
    return "—";
}
