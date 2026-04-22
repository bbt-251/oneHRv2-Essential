const STORAGE_KEY = "__onehr_compat_storage__";

interface StoredObject {
    path: string;
    contentType?: string;
    size: number;
    uploadedAt: string;
}

export interface CompatStorage {
    name: string;
}

export interface CompatStorageReference {
    fullPath: string;
    storage: CompatStorage;
}

interface CompatUploadResult {
    ref: CompatStorageReference;
    metadata: {
        fullPath: string;
        size: number;
        contentType?: string;
    };
}

const getStorageState = (): Map<string, StoredObject> => {
    const target = globalThis as typeof globalThis & {
        [STORAGE_KEY]?: Map<string, StoredObject>;
    };

    if (!target[STORAGE_KEY]) {
        target[STORAGE_KEY] = new Map();
    }

    return target[STORAGE_KEY]!;
};

export const getStorage = (): CompatStorage => ({ name: "compat-storage" });

export const ref = (storage: CompatStorage, path: string): CompatStorageReference => ({
    storage,
    fullPath: path,
});

const persist = (reference: CompatStorageReference, file: Blob): CompatUploadResult => {
    getStorageState().set(reference.fullPath, {
        path: reference.fullPath,
        contentType: file.type || "application/octet-stream",
        size: file.size,
        uploadedAt: new Date().toISOString(),
    });

    return {
        ref: reference,
        metadata: {
            fullPath: reference.fullPath,
            size: file.size,
            contentType: file.type || "application/octet-stream",
        },
    };
};

export const uploadBytes = async (
    reference: CompatStorageReference,
    file: Blob,
): Promise<CompatUploadResult> => persist(reference, file);

export const uploadBytesResumable = (
    reference: CompatStorageReference,
    file: Blob,
): {
    snapshot: CompatUploadResult;
    on: (
        _event: string,
        _progress?: ((snapshot: CompatUploadResult) => void) | null,
        _error?: ((error: Error) => void) | null,
        complete?: (() => void) | null,
    ) => void;
} => {
    const snapshot = persist(reference, file);

    return {
        snapshot,
        on: (_event, progress, _error, complete) => {
            progress?.(snapshot);
            complete?.();
        },
    };
};

export const getDownloadURL = async (reference: CompatStorageReference): Promise<string> =>
    `manual://storage/${reference.fullPath}`;

export const deleteObject = async (reference: CompatStorageReference): Promise<void> => {
    getStorageState().delete(reference.fullPath);
};
