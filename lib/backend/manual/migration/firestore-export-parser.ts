import type { FirestoreExportBundle, FirestoreExportDocument } from "@/lib/backend/manual/migration/types";

const normalizeDocument = (raw: unknown): FirestoreExportDocument | null => {
    if (!raw || typeof raw !== "object") {
        return null;
    }

    const candidate = raw as Record<string, unknown>;
    const path = typeof candidate.path === "string" ? candidate.path : null;
    const id = typeof candidate.id === "string" ? candidate.id : null;
    const fields =
        candidate.fields && typeof candidate.fields === "object" && !Array.isArray(candidate.fields)
            ? (candidate.fields as Record<string, unknown>)
            : null;

    if (!path || !id || !fields) {
        return null;
    }

    return { path, id, fields };
};

export const parseFirestoreExport = (content: string): FirestoreExportBundle => {
    const trimmed = content.trim();

    if (!trimmed) {
        return { documents: [] };
    }

    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
        const jsonValue = JSON.parse(trimmed) as unknown;

        if (Array.isArray(jsonValue)) {
            return {
                documents: jsonValue
                    .map((entry) => normalizeDocument(entry))
                    .filter((entry): entry is FirestoreExportDocument => Boolean(entry)),
            };
        }

        const payload = jsonValue as { documents?: unknown };
        if (Array.isArray(payload.documents)) {
            return {
                documents: payload.documents
                    .map((entry) => normalizeDocument(entry))
                    .filter((entry): entry is FirestoreExportDocument => Boolean(entry)),
            };
        }
    }

    return {
        documents: trimmed
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean)
            .map((line) => normalizeDocument(JSON.parse(line) as unknown))
            .filter((entry): entry is FirestoreExportDocument => Boolean(entry)),
    };
};

export const groupDocumentsByCollection = (bundle: FirestoreExportBundle): Record<string, FirestoreExportDocument[]> => {
    return bundle.documents.reduce<Record<string, FirestoreExportDocument[]>>((accumulator, document) => {
        const [collection] = document.path.split("/");
        if (!collection) {
            return accumulator;
        }

        accumulator[collection] = accumulator[collection] ?? [];
        accumulator[collection].push(document);
        return accumulator;
    }, {});
};
