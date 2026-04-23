import { buildBackendUrl } from "@/lib/shared/config";
import type InAppNotificationModel from "@/lib/models/notification";
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

export class NotificationRepository {
    static async create(
        payload: Omit<InAppNotificationModel, "id">,
    ): Promise<RepositoryResult<InAppNotificationModel>> {
        try {
            const response = await fetch(buildBackendUrl("/api/notifications"), {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ payload }),
            });

            const data = (await response.json().catch(() => ({}))) as Record<string, unknown> &
                BackendErrorShape;

            if (!response.ok) {
                const error = parseError(data, "Failed to create notification.");
                return repositoryFailure(error.message, {
                    code: error.code,
                    details: error.details,
                });
            }

            const notification = data.notification as InAppNotificationModel | undefined;
            if (!notification) {
                return repositoryFailure("Notification response did not include created data.");
            }

            return repositorySuccess(
                typeof data.message === "string"
                    ? data.message
                    : "Notification created successfully.",
                notification,
            );
        } catch (error) {
            return repositoryFailure(
                error instanceof Error
                    ? error.message
                    : "Notification request failed unexpectedly.",
            );
        }
    }
}
