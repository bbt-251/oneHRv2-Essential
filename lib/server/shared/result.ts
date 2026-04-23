export type ServiceSuccess<T> = {
    ok: true;
    message: string;
    data: T;
};

export type ServiceFailure = {
    ok: false;
    message: string;
    code: string;
    status: number;
    details?: unknown;
};

export type ServiceResult<T> = ServiceSuccess<T> | ServiceFailure;

export const serviceSuccess = <T>(message: string, data: T): ServiceSuccess<T> => ({
    ok: true,
    message,
    data,
});

export const serviceFailure = (
    code: string,
    message: string,
    status: number,
    details?: unknown,
): ServiceFailure => ({
    ok: false,
    code,
    message,
    status,
    details,
});
