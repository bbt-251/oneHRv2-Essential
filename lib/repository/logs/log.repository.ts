import { buildBackendUrl } from "@/lib/shared/config";

export interface LogInfo {
    title: string;
    description: string;
    module: string;
}

export class LogRepository {
    static async create(
        logInfo: LogInfo,
        actionBy: string,
        status: "Success" | "Failure",
    ): Promise<boolean> {
        const response = await fetch(buildBackendUrl("/api/logs"), {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                logInfo,
                actionBy,
                status,
            }),
        });

        if (!response.ok) {
            return false;
        }

        const payload = (await response.json().catch(() => ({ success: false }))) as {
            success?: boolean;
        };
        return Boolean(payload.success);
    }
}
