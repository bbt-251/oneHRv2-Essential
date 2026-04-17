import { buildMigrationMetadata } from "@/lib/backend/manual/migration/metadata";
import {
    persistStorageMetadata,
    buildObjectKey,
} from "@/lib/backend/manual/storage/service";
import { StorageObjectMetadata } from "@/lib/backend/manual/storage/types";

interface FirebaseStorageExportObject {
  path: string;
  name?: string;
  contentType?: string;
  size?: number;
  md5Hash?: string;
  metadata?: Record<string, unknown>;
}

const readString = (value: unknown, fallback: string): string => {
    if (typeof value === "string" && value.trim()) {
        return value;
    }

    return fallback;
};

const readNumber = (value: unknown, fallback: number): number => {
    if (typeof value === "number" && Number.isFinite(value)) {
        return value;
    }

    if (typeof value === "string" && value.trim()) {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) {
            return parsed;
        }
    }

    return fallback;
};

export const parseFirebaseStorageExport = (
    rawInput: string | unknown,
): FirebaseStorageExportObject[] => {
    const parsed = typeof rawInput === "string" ? JSON.parse(rawInput) : rawInput;

    if (Array.isArray(parsed)) {
        return parsed as FirebaseStorageExportObject[];
    }

    if (
        parsed &&
    typeof parsed === "object" &&
    "objects" in (parsed as Record<string, unknown>) &&
    Array.isArray((parsed as { objects: unknown }).objects)
    ) {
        return (parsed as { objects: FirebaseStorageExportObject[] }).objects;
    }

    return [];
};

export const migrateFirebaseStorageExport = ({
    tenantId,
    exportObjects,
    defaultOwnerUid,
}: {
  tenantId: string;
  exportObjects: FirebaseStorageExportObject[];
  defaultOwnerUid?: string;
}): StorageObjectMetadata[] => {
    const ownerUid = defaultOwnerUid ?? "migration-user";

    return exportObjects.map((object) => {
        const originalFilename =
      readString(object.name, "migrated-object") ||
      object.path.split("/").at(-1) ||
      "migrated-object";

        const metadata: StorageObjectMetadata = {
            tenantId,
            bucket: process.env.MANUAL_OBJECT_STORAGE_BUCKET ?? "onehr-manual",
            objectKey: buildObjectKey({
                tenantId,
                module: "migration",
                ownerUid,
                originalFilename,
            }),
            originalFilename,
            mimeType: readString(object.contentType, "application/octet-stream"),
            sizeBytes: readNumber(object.size, 1),
            sha256: buildMigrationMetadata(object.path, {
                md5Hash: object.md5Hash ?? null,
                metadata: object.metadata ?? null,
            }).checksum,
            ownerUid,
            linkage: {
                module: "migration",
                field: "firebase-storage",
            },
            createdAt: new Date().toISOString(),
            legacyPath: object.path,
            migration: buildMigrationMetadata(object.path, object),
        };

        persistStorageMetadata(metadata);
        return metadata;
    });
};
