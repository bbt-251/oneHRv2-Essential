import assert from "node:assert/strict";
import {
    buildReadinessReport,
    createDriftTracker,
    runCutoverRunbook,
    runDualWrite,
    runFinalBackfill,
    runShadowRead,
} from "@/lib/backend/manual/phase-8";

const run = async (): Promise<void> => {
    const shadowRead = await runShadowRead({
        entity: "employee",
        readLegacy: async () => ({ id: "e-1", firstName: "Ada", salary: 1000 }),
        readManual: async () => ({ id: "e-1", firstName: "Ada", salary: 1050 }),
        normalize: payload => ({ ...payload, salary: undefined }),
    });

    assert.equal(shadowRead.comparison.matched, true, "Expected normalized payloads to match");

    const dualWrite = await runDualWrite({
        entity: "leave",
        payload: { id: "l-1" },
        mode: "legacy-primary",
        writeLegacy: async payload => ({ source: "firebase", payload }),
        writeManual: async payload => ({ source: "manual", payload }),
    });

    assert.equal(dualWrite.primarySource, "firebase", "Expected firebase primary source");
    assert.equal(dualWrite.secondarySource, "manual", "Expected manual secondary source");

    const tracker = createDriftTracker();
    tracker.record({
        entity: "payroll",
        operation: "read",
        timestamp: new Date().toISOString(),
        matched: false,
        mismatchCount: 2,
        mismatchPaths: ["salary.base", "salary.bonus"],
    });

    const summary = tracker.getSummary();
    assert.equal(summary.length, 1, "Expected a single summary entry");
    assert.equal(summary[0].mismatchedObservations, 1, "Expected mismatch count to be tracked");

    const readiness = buildReadinessReport([
        {
            id: "shadow-read-drift-threshold",
            description: "Shadow read drift below threshold",
            required: true,
            passed: true,
        },
        {
            id: "runbook-review",
            description: "Incident runbook reviewed",
            required: true,
            passed: true,
        },
    ]);

    assert.equal(readiness.ready, true, "Expected readiness checks to pass");

    const backfill = await runFinalBackfill({
        freezeWrites: async () => undefined,
        runBackfill: async () => ({ recordsProcessed: 10, recordsSkipped: 1 }),
        verifyConsistency: async () => [
            { name: "employee-count", passed: true },
            { name: "payroll-netpay", passed: true },
        ],
        unfreezeWrites: async () => undefined,
    });

    assert.equal(backfill.successful, true, "Expected final backfill consistency checks to pass");

    let currentTime = 0;
    const cutover = await runCutoverRunbook({
        rollbackWindowMs: 1000,
        now: () => {
            currentTime += 100;
            return currentTime;
        },
        steps: [
            {
                id: "switch-read-traffic",
                description: "Route reads to manual backend",
                execute: async () => undefined,
            },
            {
                id: "switch-write-traffic",
                description: "Route writes to manual backend",
                execute: async () => undefined,
            },
        ],
        onRollback: async () => undefined,
    });

    assert.equal(cutover.status, "completed", "Expected cutover runbook to complete");

    console.log("Manual backend Phase 8 checks passed.");
};

void run();
