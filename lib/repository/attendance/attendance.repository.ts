import { AttendanceModel, RequestModificationModel } from "@/lib/models/attendance";
import { LateComersModel } from "@/lib/models/late-comers";
import { OvertimeRequestModel } from "@/lib/models/overtime-request";
import {
    RepositoryResult,
    repositoryFailure,
    repositorySuccess,
} from "@/lib/repository/shared/result";

type BackendErrorShape = {
    error?:
        | string
        | {
              code?: string;
              message?: string;
              details?: unknown;
          };
};

type AttendanceResponse = {
    message?: string;
    attendance?: AttendanceModel | null;
    attendances?: AttendanceModel[];
    overtimeRequest?: OvertimeRequestModel | null;
    requestModification?: RequestModificationModel | null;
    lateComers?: LateComersModel[];
    deleted?: boolean;
    success?: boolean;
    records?: AttendanceModel[];
    lateComer?: LateComersModel | null;
};

const parseError = (payload: BackendErrorShape, fallback: string) => {
    if (typeof payload.error === "string" && payload.error.trim()) {
        return { message: payload.error, code: undefined, details: undefined };
    }

    if (payload.error && typeof payload.error === "object") {
        return {
            message: payload.error.message || fallback,
            code: payload.error.code,
            details: payload.error.details,
        };
    }

    return { message: fallback, code: undefined, details: undefined };
};

export class AttendanceRepository {
    private static async request<T>(
        input: RequestInfo | URL,
        init: RequestInit,
        select: (payload: AttendanceResponse) => T | null,
        fallbackError: string,
    ): Promise<RepositoryResult<T>> {
        try {
            const response = await fetch(input, {
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    ...(init.headers ?? {}),
                },
                ...init,
            });

            const payload = (await response.json().catch(() => ({}))) as AttendanceResponse &
                BackendErrorShape;

            if (!response.ok) {
                const error = parseError(payload, fallbackError);
                return repositoryFailure(error.message, {
                    code: error.code,
                    details: error.details,
                });
            }

            const data = select(payload);
            if (data === null || data === undefined) {
                return repositoryFailure("Attendance response did not include expected data.");
            }

            return repositorySuccess(
                payload.message || "Attendance request completed successfully.",
                data,
            );
        } catch (error) {
            return repositoryFailure(
                error instanceof Error ? error.message : "Attendance request failed unexpectedly.",
            );
        }
    }

    static listAttendances(filters?: Record<string, unknown>) {
        const query = new URLSearchParams();
        Object.entries(filters ?? {}).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== "") {
                query.set(key, String(value));
            }
        });

        const url = query.size ? `/api/attendance?${query.toString()}` : "/api/attendance";
        return this.request<AttendanceModel[]>(
            url,
            { method: "GET" },
            payload => payload.attendances ?? [],
            "Attendance request failed.",
        );
    }

    static async getAttendanceById(id: string) {
        const result = await this.listAttendances({ id });
        if (!result.success) {
            return result as RepositoryResult<AttendanceModel>;
        }

        const attendance = result.data[0];
        if (!attendance) {
            return repositoryFailure("Attendance was not found.", {
                code: "ATTENDANCE_NOT_FOUND",
            });
        }

        return repositorySuccess("Attendance loaded successfully.", attendance);
    }

    static createAttendance(payload: Omit<AttendanceModel, "id">) {
        return this.request<AttendanceModel>(
            "/api/attendance",
            {
                method: "POST",
                body: JSON.stringify({ payload, mode: "create" }),
            },
            response => response.attendance ?? null,
            "Create attendance request failed.",
        );
    }

    static updateAttendance(payload: Partial<AttendanceModel> & { id: string }) {
        return this.request<AttendanceModel>(
            "/api/attendance",
            {
                method: "PATCH",
                body: JSON.stringify({ id: payload.id, payload }),
            },
            response => response.attendance ?? null,
            "Update attendance request failed.",
        );
    }

    static deleteAttendance(id: string) {
        return this.request<{ deleted: true }>(
            "/api/attendance",
            {
                method: "DELETE",
                body: JSON.stringify({ id }),
            },
            payload => (payload.deleted ? { deleted: true } : null),
            "Delete attendance request failed.",
        );
    }

    static generateAttendanceForEmployee(uid: string, shiftType: string) {
        return this.request<{ success: boolean; records: AttendanceModel[] }>(
            "/api/attendance",
            {
                method: "POST",
                body: JSON.stringify({
                    mode: "generate",
                    payload: { uid, shiftType },
                }),
            },
            payload => ({
                success: Boolean(payload.success),
                records: payload.records ?? [],
            }),
            "Generate attendance request failed.",
        );
    }

    static createOvertimeRequest(payload: Omit<OvertimeRequestModel, "id">) {
        return this.request<OvertimeRequestModel>(
            "/api/attendance/overtime",
            {
                method: "POST",
                body: JSON.stringify({ payload }),
            },
            response => response.overtimeRequest ?? null,
            "Create overtime request failed.",
        );
    }

    static updateOvertimeRequest(payload: Partial<OvertimeRequestModel> & { id: string }) {
        return this.request<OvertimeRequestModel>(
            "/api/attendance/overtime",
            {
                method: "PATCH",
                body: JSON.stringify({ id: payload.id, payload }),
            },
            response => response.overtimeRequest ?? null,
            "Update overtime request failed.",
        );
    }

    static deleteOvertimeRequest(id: string, employeeUid?: string) {
        return this.request<{ deleted: true }>(
            "/api/attendance/overtime",
            {
                method: "DELETE",
                body: JSON.stringify({ id, employeeUid }),
            },
            payload => (payload.deleted ? { deleted: true } : null),
            "Delete overtime request failed.",
        );
    }

    static requestAttendanceModification(payload: Omit<RequestModificationModel, "id">) {
        return this.request<RequestModificationModel>(
            "/api/attendance/request-modification",
            {
                method: "POST",
                body: JSON.stringify({ payload }),
            },
            response => response.requestModification ?? null,
            "Create attendance modification request failed.",
        );
    }

    static approveAttendanceModification(
        payload: Partial<RequestModificationModel> & { id: string },
    ) {
        return this.request<RequestModificationModel>(
            "/api/attendance/request-modification",
            {
                method: "PATCH",
                body: JSON.stringify({ id: payload.id, payload, action: "approve" }),
            },
            response => response.requestModification ?? null,
            "Approve attendance modification request failed.",
        );
    }

    static refuseAttendanceModification(
        payload: Partial<RequestModificationModel> & { id: string },
    ) {
        return this.request<RequestModificationModel>(
            "/api/attendance/request-modification",
            {
                method: "PATCH",
                body: JSON.stringify({ id: payload.id, payload, action: "refuse" }),
            },
            response => response.requestModification ?? null,
            "Refuse attendance modification request failed.",
        );
    }

    static listLateComers(filters?: Record<string, unknown>) {
        const query = new URLSearchParams();
        Object.entries(filters ?? {}).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== "") {
                query.set(key, String(value));
            }
        });

        const url = query.size
            ? `/api/attendance/late-comers?${query.toString()}`
            : "/api/attendance/late-comers";

        return this.request<LateComersModel[]>(
            url,
            { method: "GET" },
            payload => payload.lateComers ?? [],
            "Late comers request failed.",
        );
    }

    static createLateComer(payload: Omit<LateComersModel, "id">) {
        return this.request<LateComersModel>(
            "/api/attendance/late-comers",
            {
                method: "POST",
                body: JSON.stringify({ payload }),
            },
            response => response.lateComer ?? null,
            "Create late comer request failed.",
        );
    }
}
