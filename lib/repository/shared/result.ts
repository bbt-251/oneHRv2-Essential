export type RepositorySuccess<T> = {
    success: true;
    message: string;
    data: T;
};

export type RepositoryFailure = {
    success: false;
    message: string;
    code?: string;
    details?: unknown;
};

export type RepositoryResult<T> = RepositorySuccess<T> | RepositoryFailure;

export const repositorySuccess = <T>(message: string, data: T): RepositorySuccess<T> => ({
    success: true,
    message,
    data,
});

export const repositoryFailure = (
    message: string,
    options?: {
        code?: string;
        details?: unknown;
    },
): RepositoryFailure => ({
    success: false,
    message,
    code: options?.code,
    details: options?.details,
});
