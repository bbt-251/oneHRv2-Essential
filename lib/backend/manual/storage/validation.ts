import { z } from "zod";
import { ManualApiError } from "@/lib/backend/manual/errors";

const allowedMimeTypes = new Set([
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
    "text/csv",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

const sha256Pattern = /^[a-fA-F0-9]{64}$/;

export const uploadPayloadSchema = z.object({
    tenantId: z.string().min(1),
    ownerUid: z.string().min(1).optional(),
    originalFilename: z.string().min(1),
    mimeType: z.string().min(1),
    sizeBytes: z.number().int().positive().max(50 * 1024 * 1024),
    sha256: z.string().regex(sha256Pattern, "sha256 must be 64 hex characters"),
    linkage: z.object({
        module: z.string().min(1),
        entityId: z.string().min(1).optional(),
        field: z.string().min(1).optional(),
    }),
});

export const downloadPayloadSchema = z.object({
    tenantId: z.string().min(1),
    objectKey: z.string().min(1),
});

export const validateMimeType = (mimeType: string): void => {
    if (!allowedMimeTypes.has(mimeType.toLowerCase())) {
        throw new ManualApiError(
            415,
            "UNSUPPORTED_MEDIA_TYPE",
            "File MIME type is not allowed.",
            {
                mimeType,
                allowedMimeTypes: Array.from(allowedMimeTypes),
            },
        );
    }
};

export const validateFileIntegrityHints = ({
    sha256,
    sizeBytes,
}: {
  sha256: string;
  sizeBytes: number;
}): void => {
    if (!sha256Pattern.test(sha256)) {
        throw new ManualApiError(
            400,
            "INVALID_CHECKSUM",
            "Expected a SHA-256 checksum in hex format.",
        );
    }

    if (!Number.isInteger(sizeBytes) || sizeBytes <= 0) {
        throw new ManualApiError(
            400,
            "INVALID_FILE_SIZE",
            "File size must be a positive integer in bytes.",
        );
    }
};
