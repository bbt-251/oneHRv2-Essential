import type { LogInfo } from "./department-section";

const buildLog = (title: string, description: string): LogInfo => ({
    title,
    description,
    module: "Marital Status Management",
});

export const MARITAL_STATUS_LOG_MESSAGES = {
    CREATED: (data: { name?: string }) =>
        buildLog("Marital Status Created", `Created marital status '${data.name ?? ""}'`),
    UPDATED: (data: { id: string; name?: string }) =>
        buildLog(
            "Marital Status Updated",
            `Updated marital status '${data.id}' to '${data.name ?? ""}'`,
        ),
    DELETED: (id: string) => buildLog("Marital Status Deleted", `Deleted marital status '${id}'`),
};
