import type {
    MigrationCounts,
    MigrationInvariantViolation,
    MigrationValidationReport,
} from "@/lib/backend/manual/migration/types";

export interface ValidationInput<TRecord> {
    sourceCount: number;
    mappedRecords: TRecord[];
    importedCount: number;
    failedLegacyIds: string[];
    getLegacyId: (record: TRecord) => string;
    invariants?: Array<{
        name: string;
        check: (record: TRecord) => boolean;
        message: string;
    }>;
    sampleSize?: number;
}

export const buildMigrationValidationReport = <TRecord>(input: ValidationInput<TRecord>): MigrationValidationReport => {
    const counts: MigrationCounts = {
        source: input.sourceCount,
        mapped: input.mappedRecords.length,
        imported: input.importedCount,
        failed: input.failedLegacyIds.length,
    };

    const sampleSize = Math.max(1, input.sampleSize ?? 10);
    const sampledLegacyIds = input.mappedRecords.slice(0, sampleSize).map((record) => input.getLegacyId(record));

    const violations: MigrationInvariantViolation[] = [];

    if (counts.mapped > counts.source) {
        violations.push({
            name: "count-overflow",
            message: "Mapped record count cannot exceed source count.",
            affectedLegacyIds: [],
        });
    }

    if (input.invariants?.length) {
        for (const invariant of input.invariants) {
            const affected = input.mappedRecords
                .filter((record) => !invariant.check(record))
                .map((record) => input.getLegacyId(record));

            if (affected.length) {
                violations.push({
                    name: invariant.name,
                    message: invariant.message,
                    affectedLegacyIds: affected,
                });
            }
        }
    }

    if (input.failedLegacyIds.length) {
        violations.push({
            name: "import-failures",
            message: "Some records failed after max retries.",
            affectedLegacyIds: input.failedLegacyIds,
        });
    }

    return {
        counts,
        sampledLegacyIds,
        violations,
    };
};

export const formatDryRunReport = (report: MigrationValidationReport): string => {
    const header = [
        "# Migration Dry Run Report",
        `- Source count: ${report.counts.source}`,
        `- Mapped count: ${report.counts.mapped}`,
        `- Imported count (simulated): ${report.counts.imported}`,
        `- Failed count: ${report.counts.failed}`,
        `- Sampled legacy IDs: ${report.sampledLegacyIds.join(", ") || "none"}`,
    ];

    const violationLines = report.violations.length
        ? report.violations.flatMap((violation) => [
              `- [${violation.name}] ${violation.message}`,
              `  - affected: ${violation.affectedLegacyIds.join(", ") || "none"}`,
          ])
        : ["- none"];

    return [...header, "", "## Violations", ...violationLines].join("\n");
};
