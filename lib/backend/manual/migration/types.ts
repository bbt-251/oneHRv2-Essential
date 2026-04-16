import { z } from "zod";

export const migrationMetadataSchema = z.object({
    legacyId: z.string().min(1),
    checksum: z.string().min(1),
    migratedAt: z.string().datetime(),
});

export const coreEmployeeSchema = z.object({
    tenantId: z.string().min(1),
    uid: z.string().min(1),
    firstName: z.string().min(1),
    surname: z.string().min(1),
    personalEmail: z.string().email().optional(),
    managerUid: z.string().optional(),
    roles: z.array(z.string().min(1)).default([]),
    migration: migrationMetadataSchema,
});

export const coreRoleAssignmentSchema = z.object({
    tenantId: z.string().min(1),
    uid: z.string().min(1),
    roles: z.array(z.string().min(1)).min(1),
    migration: migrationMetadataSchema,
});

export const attendanceEntrySchema = z.object({
    tenantId: z.string().min(1),
    employeeUid: z.string().min(1),
    date: z.string().min(1),
    status: z.enum(["present", "absent", "leave", "holiday", "remote"]),
    workedMinutes: z.number().int().nonnegative(),
    migration: migrationMetadataSchema,
});

export const leaveRequestSchema = z.object({
    tenantId: z.string().min(1),
    employeeUid: z.string().min(1),
    leaveType: z.string().min(1),
    startDate: z.string().min(1),
    endDate: z.string().min(1),
    status: z.enum(["pending", "approved", "rejected", "cancelled"]),
    migration: migrationMetadataSchema,
});

export const payrollRecordSchema = z.object({
    tenantId: z.string().min(1),
    employeeUid: z.string().min(1),
    payrollMonth: z.string().min(1),
    baseSalary: z.number().nonnegative(),
    allowances: z.number().default(0),
    deductions: z.number().default(0),
    netPay: z.number(),
    migration: migrationMetadataSchema,
});

export type MigrationMetadata = z.infer<typeof migrationMetadataSchema>;
export type CoreEmployee = z.infer<typeof coreEmployeeSchema>;
export type CoreRoleAssignment = z.infer<typeof coreRoleAssignmentSchema>;
export type AttendanceEntry = z.infer<typeof attendanceEntrySchema>;
export type LeaveRequest = z.infer<typeof leaveRequestSchema>;
export type PayrollRecord = z.infer<typeof payrollRecordSchema>;

export interface FirestoreExportDocument {
    path: string;
    id: string;
    fields: Record<string, unknown>;
}

export interface FirestoreExportBundle {
    documents: FirestoreExportDocument[];
}

export interface MigrationCounts {
    source: number;
    mapped: number;
    imported: number;
    failed: number;
}

export interface MigrationInvariantViolation {
    name: string;
    message: string;
    affectedLegacyIds: string[];
}

export interface MigrationValidationReport {
    counts: MigrationCounts;
    sampledLegacyIds: string[];
    violations: MigrationInvariantViolation[];
}
