import type { LogInfo } from "./department-section";

const buildLog = (title: string, description: string): LogInfo => ({
    title,
    description,
    module: "Location Management",
});

export const LOCATION_LOG_MESSAGES = {
    CREATED: (data: { name?: string; type?: string; parentId?: string | null }) =>
        buildLog(
            "Location Created",
            `Created location '${data.name ?? ""}' of type '${data.type ?? ""}'${data.parentId ? ` under '${data.parentId}'` : ""}`,
        ),
    UPDATED: (data: { id: string; name?: string; type?: string; parentId?: string | null }) =>
        buildLog(
            "Location Updated",
            `Updated location '${data.id}'${data.name ? ` to '${data.name}'` : ""}${data.type ? ` with type '${data.type}'` : ""}${data.parentId ? ` under '${data.parentId}'` : ""}`,
        ),
    MOVED: (data: { id: string; parentId?: string | null }) =>
        buildLog(
            "Location Moved",
            `Moved location '${data.id}'${data.parentId ? ` under '${data.parentId}'` : ""}`,
        ),
};
