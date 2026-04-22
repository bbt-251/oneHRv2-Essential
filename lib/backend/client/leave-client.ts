import { buildBackendUrl } from "@/lib/backend/config";
import { LeaveModel } from "@/lib/models/leave";

export const createLeaveRequestWithBackend = async (payload: Omit<LeaveModel, "id">) => {
    const response = await fetch(buildBackendUrl("/api/data/mutate"), {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            resource: "leaveManagements",
            action: "create",
            payload,
        }),
    });

    if (!response.ok) {
        throw new Error("Unable to create leave request.");
    }

    return response.json();
};

export const updateLeaveRequestWithBackend = async (
    payload: Partial<LeaveModel> & { id: string },
) => {
    const response = await fetch(buildBackendUrl("/api/data/mutate"), {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            resource: "leaveManagements",
            action: "update",
            targetId: payload.id,
            payload,
        }),
    });

    if (!response.ok) {
        throw new Error("Unable to update leave request.");
    }

    return response.json();
};

export const getLeaveRequestByIdWithBackend = async (id: string): Promise<LeaveModel | null> => {
    const response = await fetch(buildBackendUrl("/api/data/query"), {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            resource: "leaveManagements",
            filters: { id },
        }),
    });

    if (!response.ok) {
        throw new Error("Unable to load leave request.");
    }

    const payload = (await response.json()) as { leaveManagements?: LeaveModel[] };
    return payload.leaveManagements?.[0] ?? null;
};
