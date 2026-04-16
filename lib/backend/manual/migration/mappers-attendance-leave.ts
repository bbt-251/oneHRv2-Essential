import { buildMigrationMetadata } from "@/lib/backend/manual/migration/metadata";
import {
    attendanceEntrySchema,
    leaveRequestSchema,
    type AttendanceEntry,
    type FirestoreExportDocument,
    type LeaveRequest,
} from "@/lib/backend/manual/migration/types";

const attendanceStates = new Set(["present", "absent", "leave", "holiday", "remote"]);
const leaveStates = new Set(["pending", "approved", "rejected", "cancelled"]);

const asString = (value: unknown): string | undefined => (typeof value === "string" && value.trim() ? value : undefined);
const asNumber = (value: unknown): number => (typeof value === "number" && Number.isFinite(value) ? value : 0);

export const mapAttendanceDocument = (document: FirestoreExportDocument, tenantId: string): AttendanceEntry => {
    const statusCandidate = asString(document.fields.status)?.toLowerCase();
    const payload = {
        tenantId,
        employeeUid: asString(document.fields.employeeUid) ?? "unknown",
        date: asString(document.fields.date) ?? "1970-01-01",
        status: attendanceStates.has(statusCandidate ?? "") ? statusCandidate : "absent",
        workedMinutes: Math.max(0, Math.round(asNumber(document.fields.workedMinutes))),
        migration: buildMigrationMetadata(document.id, document.fields),
    };

    return attendanceEntrySchema.parse(payload);
};

export const mapLeaveDocument = (document: FirestoreExportDocument, tenantId: string): LeaveRequest => {
    const statusCandidate = asString(document.fields.status)?.toLowerCase();
    const payload = {
        tenantId,
        employeeUid: asString(document.fields.employeeUid) ?? "unknown",
        leaveType: asString(document.fields.leaveType) ?? "general",
        startDate: asString(document.fields.startDate) ?? "1970-01-01",
        endDate: asString(document.fields.endDate) ?? "1970-01-01",
        status: leaveStates.has(statusCandidate ?? "") ? statusCandidate : "pending",
        migration: buildMigrationMetadata(document.id, document.fields),
    };

    return leaveRequestSchema.parse(payload);
};
