import { LeaveModel } from "@/lib/models/leave";
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

type LeaveResponse = {
    message?: string;
    leaveRequest?: LeaveModel | null;
};

const getErrorMessage = (payload: BackendErrorShape, fallback: string) => {
    if (typeof payload.error === "string" && payload.error.trim()) {
        return {
            message: payload.error,
            code: undefined,
            details: undefined,
        };
    }

    if (payload.error && typeof payload.error === "object") {
        return {
            message: payload.error.message || fallback,
            code: payload.error.code,
            details: payload.error.details,
        };
    }

    return {
        message: fallback,
        code: undefined,
        details: undefined,
    };
};

export class LeaveRepository {
    private static async request(
        input: RequestInfo | URL,
        init?: RequestInit,
    ): Promise<RepositoryResult<LeaveModel>> {
        try {
            const response = await fetch(input, {
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    ...(init?.headers ?? {}),
                },
                ...init,
            });

            const payload = (await response.json().catch(() => ({}))) as LeaveResponse &
                BackendErrorShape;

            if (!response.ok) {
                const error = getErrorMessage(payload, "Leave request failed.");
                return repositoryFailure(error.message, {
                    code: error.code,
                    details: error.details,
                });
            }

            if (!payload.leaveRequest) {
                return repositoryFailure("Leave request response did not include a leave record.");
            }

            return repositorySuccess(
                payload.message || "Leave request completed successfully.",
                payload.leaveRequest,
            );
        } catch (error) {
            return repositoryFailure(
                error instanceof Error ? error.message : "Leave request failed unexpectedly.",
            );
        }
    }

    static createLeaveRequest(
        payload: Omit<LeaveModel, "id">,
    ): Promise<RepositoryResult<LeaveModel>> {
        return this.request("/api/leave", {
            method: "POST",
            body: JSON.stringify({ payload }),
        });
    }

    static updateLeaveRequest(
        payload: Partial<LeaveModel> & { id: string },
    ): Promise<RepositoryResult<LeaveModel>> {
        return this.request("/api/leave", {
            method: "PATCH",
            body: JSON.stringify({ id: payload.id, payload }),
        });
    }

    static async getLeaveRequestById(id: string): Promise<RepositoryResult<LeaveModel>> {
        const query = new URLSearchParams({ id });
        return this.request(`/api/leave?${query.toString()}`, {
            method: "GET",
        });
    }
}
