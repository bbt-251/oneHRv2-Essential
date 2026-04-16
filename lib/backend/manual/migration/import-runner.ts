export interface ImportRunnerOptions<TRecord> {
    batchSize?: number;
    maxRetries?: number;
    onImportBatch: (records: TRecord[]) => Promise<void>;
    getExistingLegacyIds: (legacyIds: string[]) => Promise<Set<string>>;
    getLegacyId: (record: TRecord) => string;
}

export interface ImportRunnerResult {
    attempted: number;
    skipped: number;
    imported: number;
    failedLegacyIds: string[];
}

const sleep = async (milliseconds: number): Promise<void> => {
    await new Promise((resolve) => {
        setTimeout(resolve, milliseconds);
    });
};

export const runIdempotentImport = async <TRecord>(
    records: TRecord[],
    options: ImportRunnerOptions<TRecord>,
): Promise<ImportRunnerResult> => {
    const batchSize = Math.max(1, options.batchSize ?? 100);
    const maxRetries = Math.max(0, options.maxRetries ?? 2);

    const allLegacyIds = records.map((record) => options.getLegacyId(record));
    const existingLegacyIds = await options.getExistingLegacyIds(allLegacyIds);

    const importableRecords = records.filter((record) => !existingLegacyIds.has(options.getLegacyId(record)));
    const failedLegacyIds: string[] = [];
    let imported = 0;

    for (let index = 0; index < importableRecords.length; index += batchSize) {
        const batch = importableRecords.slice(index, index + batchSize);
        let attempt = 0;
        let completed = false;

        while (attempt <= maxRetries && !completed) {
            try {
                await options.onImportBatch(batch);
                imported += batch.length;
                completed = true;
            } catch {
                attempt += 1;
                if (attempt > maxRetries) {
                    failedLegacyIds.push(...batch.map((record) => options.getLegacyId(record)));
                    break;
                }

                await sleep(150 * attempt);
            }
        }
    }

    return {
        attempted: records.length,
        skipped: records.length - importableRecords.length,
        imported,
        failedLegacyIds,
    };
};
