import { createHash } from "node:crypto";
import type { MigrationMetadata } from "@/lib/backend/manual/migration/types";

const stableSerialize = (value: unknown): string => {
    if (Array.isArray(value)) {
        return `[${value.map((entry) => stableSerialize(entry)).join(",")}]`;
    }

    if (value && typeof value === "object") {
        const entries = Object.entries(value as Record<string, unknown>).sort(([left], [right]) =>
            left.localeCompare(right),
        );

        return `{${entries
            .map(([key, entryValue]) => `${JSON.stringify(key)}:${stableSerialize(entryValue)}`)
            .join(",")}}`;
    }

    return JSON.stringify(value);
};

export const buildChecksum = (payload: unknown): string => {
    return createHash("sha256").update(stableSerialize(payload)).digest("hex");
};

export const buildMigrationMetadata = (legacyId: string, payload: unknown, migratedAt?: Date): MigrationMetadata => {
    return {
        legacyId,
        checksum: buildChecksum(payload),
        migratedAt: (migratedAt ?? new Date()).toISOString(),
    };
};
