import {
    buildMigrationValidationReport,
    formatDryRunReport,
    mapAttendanceDocument,
    mapEmployeeDocument,
    mapLeaveDocument,
    mapPayrollDocument,
    parseFirestoreExport,
    runIdempotentImport,
} from "@/lib/backend/manual/migration";

const assert = (condition: unknown, message: string): void => {
    if (!condition) {
        throw new Error(`Assertion failed: ${message}`);
    }
};

const main = async (): Promise<void> => {
    const bundle = parseFirestoreExport(
        JSON.stringify({
            documents: [
                {
                    path: "employees/emp-1",
                    id: "emp-1",
                    fields: {
                        uid: "employee-001",
                        firstName: "Ada",
                        surname: "Lovelace",
                        personalEmail: "ada@example.com",
                        managerUid: "manager-001",
                        roles: ["Employee"],
                    },
                },
            ],
        }),
    );

    assert(bundle.documents.length === 1, "parser should parse bundled json export");

    const employee = mapEmployeeDocument(bundle.documents[0], "tenant-alpha");
    assert(employee.uid === "employee-001", "employee mapper should preserve uid");

    const attendance = mapAttendanceDocument(
        {
            path: "attendance/at-1",
            id: "at-1",
            fields: {
                employeeUid: "employee-001",
                date: "2026-03-14",
                status: "present",
                workedMinutes: 480,
            },
        },
        "tenant-alpha",
    );
    assert(attendance.status === "present", "attendance mapper should map status");

    const leave = mapLeaveDocument(
        {
            path: "leave/lv-1",
            id: "lv-1",
            fields: {
                employeeUid: "employee-001",
                leaveType: "annual",
                startDate: "2026-03-15",
                endDate: "2026-03-16",
                status: "approved",
            },
        },
        "tenant-alpha",
    );
    assert(leave.status === "approved", "leave mapper should map status");

    const payroll = mapPayrollDocument(
        {
            path: "payroll/pr-1",
            id: "pr-1",
            fields: {
                employeeUid: "employee-001",
                payrollMonth: "2026-03",
                baseSalary: 1500,
                allowances: 200,
                deductions: 100,
            },
        },
        "tenant-alpha",
    );
    assert(payroll.netPay === 1600, "payroll mapper should compute net pay");

    const importedLegacyIds = new Set<string>();
    const importResult = await runIdempotentImport([employee], {
        batchSize: 1,
        maxRetries: 1,
        getLegacyId: (record) => record.migration.legacyId,
        getExistingLegacyIds: async (legacyIds) => {
            return new Set(legacyIds.filter((legacyId) => importedLegacyIds.has(legacyId)));
        },
        onImportBatch: async (records) => {
            records.forEach((record) => {
                importedLegacyIds.add(record.migration.legacyId);
            });
        },
    });

    assert(importResult.imported === 1, "import runner should import non-existing record");

    const report = buildMigrationValidationReport({
        sourceCount: 1,
        mappedRecords: [employee],
        importedCount: importResult.imported,
        failedLegacyIds: importResult.failedLegacyIds,
        getLegacyId: (record) => record.migration.legacyId,
        invariants: [
            {
                name: "employee-name",
                message: "Employee first name is required",
                check: (record) => Boolean(record.firstName),
            },
        ],
    });

    const dryRun = formatDryRunReport(report);
    assert(dryRun.includes("Migration Dry Run Report"), "dry run report should be generated");

    console.log("Phase 3 migration tooling checks passed.");
};

void main();
