export type DualRunEntity =
  | "employee"
  | "attendance"
  | "leave"
  | "payroll"
  | "compensation";

export type SourceSystem = "firebase" | "manual";

export interface DiffEntry {
  path: string;
  legacyValue: unknown;
  manualValue: unknown;
}

export interface ShadowReadComparison {
  matched: boolean;
  mismatchCount: number;
  mismatches: DiffEntry[];
}

export interface ShadowReadResult<T> {
  entity: DualRunEntity;
  legacy: T;
  manual: T;
  comparison: ShadowReadComparison;
}

export interface ShadowReadOptions<T> {
  entity: DualRunEntity;
  readLegacy: () => Promise<T>;
  readManual: () => Promise<T>;
  normalize?: (payload: T) => unknown;
  maxMismatchEntries?: number;
  onComparison?: (result: ShadowReadResult<T>) => void;
}

const isPrimitive = (value: unknown): boolean =>
    value === null || (typeof value !== "object" && typeof value !== "function");

const toComparable = <T>(payload: T, normalize?: (payload: T) => unknown): unknown =>
    normalize ? normalize(payload) : payload;

const joinPath = (parentPath: string, key: string): string =>
    parentPath ? `${parentPath}.${key}` : key;

const compareValues = (
    legacyValue: unknown,
    manualValue: unknown,
    path: string,
    collector: DiffEntry[],
    maxMismatchEntries: number,
): void => {
    if (collector.length >= maxMismatchEntries) {
        return;
    }

    if (Object.is(legacyValue, manualValue)) {
        return;
    }

    if (isPrimitive(legacyValue) || isPrimitive(manualValue)) {
        collector.push({ path, legacyValue, manualValue });
        return;
    }

    if (Array.isArray(legacyValue) || Array.isArray(manualValue)) {
        if (!Array.isArray(legacyValue) || !Array.isArray(manualValue)) {
            collector.push({ path, legacyValue, manualValue });
            return;
        }

        const maxLength = Math.max(legacyValue.length, manualValue.length);
        for (let index = 0; index < maxLength; index += 1) {
            compareValues(
                legacyValue[index],
                manualValue[index],
                `${path}[${index}]`,
                collector,
                maxMismatchEntries,
            );
        }

        return;
    }

    const legacyRecord = legacyValue as Record<string, unknown>;
    const manualRecord = manualValue as Record<string, unknown>;
    const mergedKeys = new Set([
        ...Object.keys(legacyRecord),
        ...Object.keys(manualRecord),
    ]);

    for (const key of mergedKeys) {
        compareValues(
            legacyRecord[key],
            manualRecord[key],
            joinPath(path, key),
            collector,
            maxMismatchEntries,
        );
    }
};

export const runShadowRead = async <T>(
    options: ShadowReadOptions<T>,
): Promise<ShadowReadResult<T>> => {
    const maxMismatchEntries = options.maxMismatchEntries ?? 100;
    const [legacy, manual] = await Promise.all([
        options.readLegacy(),
        options.readManual(),
    ]);

    const mismatches: DiffEntry[] = [];
    compareValues(
        toComparable(legacy, options.normalize),
        toComparable(manual, options.normalize),
        "",
        mismatches,
        maxMismatchEntries,
    );

    const result: ShadowReadResult<T> = {
        entity: options.entity,
        legacy,
        manual,
        comparison: {
            matched: mismatches.length === 0,
            mismatchCount: mismatches.length,
            mismatches,
        },
    };

    options.onComparison?.(result);
    return result;
};

export type DualWriteMode =
  | "disabled"
  | "legacy-primary"
  | "manual-primary"
  | "mirror";

export interface DualWriteOperation<TPayload, TResult> {
  entity: DualRunEntity;
  payload: TPayload;
  mode: DualWriteMode;
  writeLegacy: (payload: TPayload) => Promise<TResult>;
  writeManual: (payload: TPayload) => Promise<TResult>;
}

export interface DualWriteResult<TResult> {
  mode: DualWriteMode;
  primarySource: SourceSystem | null;
  primaryResult: TResult | null;
  secondarySource: SourceSystem | null;
  secondaryResult: TResult | null;
  secondaryError: Error | null;
}

export const runDualWrite = async <TPayload, TResult>(
    operation: DualWriteOperation<TPayload, TResult>,
): Promise<DualWriteResult<TResult>> => {
    if (operation.mode === "disabled") {
        return {
            mode: "disabled",
            primarySource: null,
            primaryResult: null,
            secondarySource: null,
            secondaryResult: null,
            secondaryError: null,
        };
    }

    const primarySource: SourceSystem =
    operation.mode === "manual-primary" ? "manual" : "firebase";
    const secondarySource: SourceSystem =
    primarySource === "manual" ? "firebase" : "manual";

    const primaryWriter =
    primarySource === "manual" ? operation.writeManual : operation.writeLegacy;
    const secondaryWriter =
    secondarySource === "manual" ? operation.writeManual : operation.writeLegacy;

    const primaryResult = await primaryWriter(operation.payload);

    let secondaryResult: TResult | null = null;
    let secondaryError: Error | null = null;

    try {
        secondaryResult = await secondaryWriter(operation.payload);
    } catch (error) {
        secondaryError =
      error instanceof Error ? error : new Error("Unknown dual-write failure");

        if (operation.mode === "mirror") {
            throw secondaryError;
        }
    }

    return {
        mode: operation.mode,
        primarySource,
        primaryResult,
        secondarySource,
        secondaryResult,
        secondaryError,
    };
};

export interface DriftObservation {
  entity: DualRunEntity;
  operation: "read" | "write";
  timestamp: string;
  matched: boolean;
  mismatchCount: number;
  mismatchPaths: string[];
}

export interface DriftSummaryEntry {
  entity: DualRunEntity;
  totalObservations: number;
  matchedObservations: number;
  mismatchedObservations: number;
  mismatchRate: number;
  averageMismatchCount: number;
}

const cloneObservation = (observation: DriftObservation): DriftObservation => ({
    entity: observation.entity,
    operation: observation.operation,
    timestamp: observation.timestamp,
    matched: observation.matched,
    mismatchCount: observation.mismatchCount,
    mismatchPaths: [...observation.mismatchPaths],
});

export const createDriftTracker = () => {
    const observations: DriftObservation[] = [];

    return {
        record: (observation: DriftObservation): void => {
            observations.push(cloneObservation(observation));
        },
        getRecent: (limit = 100): DriftObservation[] => {
            return observations.slice(-Math.max(1, limit)).map(cloneObservation);
        },
        getSummary: (): DriftSummaryEntry[] => {
            const grouped = new Map<DualRunEntity, DriftObservation[]>();

            observations.forEach(observation => {
                const entityObservations = grouped.get(observation.entity) ?? [];
                entityObservations.push(observation);
                grouped.set(observation.entity, entityObservations);
            });

            return Array.from(grouped.entries()).map(([entity, entityObservations]) => {
                const totalObservations = entityObservations.length;
                const mismatchedObservations = entityObservations.filter(
                    observation => !observation.matched,
                ).length;
                const matchedObservations = totalObservations - mismatchedObservations;
                const mismatchCountTotal = entityObservations.reduce(
                    (sum, observation) => sum + observation.mismatchCount,
                    0,
                );

                return {
                    entity,
                    totalObservations,
                    matchedObservations,
                    mismatchedObservations,
                    mismatchRate:
            totalObservations === 0
                ? 0
                : mismatchedObservations / totalObservations,
                    averageMismatchCount:
            totalObservations === 0 ? 0 : mismatchCountTotal / totalObservations,
                };
            });
        },
        clear: (): void => {
            observations.length = 0;
        },
    };
};

export interface ReadinessCheck {
  id: string;
  description: string;
  required: boolean;
  passed: boolean;
  notes?: string;
}

export interface ReadinessReport {
  generatedAt: string;
  ready: boolean;
  failedRequiredChecks: ReadinessCheck[];
  checks: ReadinessCheck[];
}

export const buildReadinessReport = (
    checks: ReadinessCheck[],
    generatedAt = new Date().toISOString(),
): ReadinessReport => {
    const normalizedChecks = checks.map(check => ({ ...check }));
    const failedRequiredChecks = normalizedChecks.filter(
        check => check.required && !check.passed,
    );

    return {
        generatedAt,
        ready: failedRequiredChecks.length === 0,
        failedRequiredChecks,
        checks: normalizedChecks,
    };
};

export interface ConsistencyCheckResult {
  name: string;
  passed: boolean;
  details?: string;
}

export interface FinalBackfillOptions {
  freezeWrites: () => Promise<void>;
  runBackfill: () => Promise<{ recordsProcessed: number; recordsSkipped: number }>;
  verifyConsistency: () => Promise<ConsistencyCheckResult[]>;
  unfreezeWrites: () => Promise<void>;
}

export interface FinalBackfillResult {
  startedAt: string;
  completedAt: string;
  recordsProcessed: number;
  recordsSkipped: number;
  consistencyChecks: ConsistencyCheckResult[];
  successful: boolean;
}

export const runFinalBackfill = async (
    options: FinalBackfillOptions,
): Promise<FinalBackfillResult> => {
    const startedAt = new Date().toISOString();
    await options.freezeWrites();

    try {
        const backfill = await options.runBackfill();
        const consistencyChecks = await options.verifyConsistency();
        const successful = consistencyChecks.every(check => check.passed);

        return {
            startedAt,
            completedAt: new Date().toISOString(),
            recordsProcessed: backfill.recordsProcessed,
            recordsSkipped: backfill.recordsSkipped,
            consistencyChecks,
            successful,
        };
    } finally {
        await options.unfreezeWrites();
    }
};

export interface CutoverStep {
  id: string;
  description: string;
  execute: () => Promise<void>;
}

export interface CutoverRunbookOptions {
  rollbackWindowMs: number;
  steps: CutoverStep[];
  onRollback: (reason: string) => Promise<void>;
  now?: () => number;
}

export interface CutoverStepResult {
  id: string;
  description: string;
  status: "completed" | "failed" | "skipped";
  error?: string;
}

export interface CutoverRunbookResult {
  startedAt: string;
  completedAt: string;
  status: "completed" | "rolled-back";
  rollbackReason: string | null;
  steps: CutoverStepResult[];
}

export const runCutoverRunbook = async (
    options: CutoverRunbookOptions,
): Promise<CutoverRunbookResult> => {
    const now = options.now ?? Date.now;
    const startedAtMs = now();
    const startedAt = new Date(startedAtMs).toISOString();
    const stepResults: CutoverStepResult[] = [];

    for (const step of options.steps) {
        const elapsedMs = now() - startedAtMs;
        if (elapsedMs > options.rollbackWindowMs) {
            const reason = `Rollback window exceeded (${options.rollbackWindowMs}ms)`;
            await options.onRollback(reason);
            stepResults.push({
                id: step.id,
                description: step.description,
                status: "skipped",
                error: reason,
            });

            return {
                startedAt,
                completedAt: new Date(now()).toISOString(),
                status: "rolled-back",
                rollbackReason: reason,
                steps: stepResults,
            };
        }

        try {
            await step.execute();
            stepResults.push({
                id: step.id,
                description: step.description,
                status: "completed",
            });
        } catch (error) {
            const reason =
        error instanceof Error ? error.message : "Unknown cutover step failure";
            await options.onRollback(reason);
            stepResults.push({
                id: step.id,
                description: step.description,
                status: "failed",
                error: reason,
            });

            return {
                startedAt,
                completedAt: new Date(now()).toISOString(),
                status: "rolled-back",
                rollbackReason: reason,
                steps: stepResults,
            };
        }
    }

    return {
        startedAt,
        completedAt: new Date(now()).toISOString(),
        status: "completed",
        rollbackReason: null,
        steps: stepResults,
    };
};
