import { ManualApiError } from "@/lib/backend/core/errors";
import { getManualRealtimeBroker } from "@/lib/backend/realtime/subscription-broker";
import { inMemoryStore } from "@/lib/backend/persistence/in-memory-store";
import { readString, requirePayload, toRecord } from "@/lib/backend/services/service-helpers";

type ProjectAllocation = {
    uid: string;
    allocation: number;
};

type ProjectRecord = {
    id: string;
    name?: string;
    assignedMembers?: string[];
    employeeAllocations?: ProjectAllocation[];
};

const normalizeAllocations = (value: unknown): ProjectAllocation[] =>
    Array.isArray(value)
        ? value
            .map(entry => {
                const record = toRecord(entry);
                const uid = readString(record.uid);
                const allocation = Number(record.allocation);

                if (!uid || !Number.isFinite(allocation)) {
                    return null;
                }

                return {
                    uid,
                    allocation,
                };
            })
            .filter((entry): entry is ProjectAllocation => entry !== null)
        : [];

const getProjectById = async (projectId: string): Promise<ProjectRecord | null> => {
    const document = inMemoryStore.getDocument(`projects/${projectId}`);
    return document ? ({ id: document.id, ...document.data } as ProjectRecord) : null;
};

const listProjects = async (): Promise<ProjectRecord[]> => {
    return inMemoryStore.queryCollection("projects").map(document => ({
        id: document.id,
        ...document.data,
    })) as ProjectRecord[];
};

export const updateProjectAllocations = async ({
    instanceKey,
    payload,
    targetId,
}: {
    instanceKey: string;
    payload?: Record<string, unknown>;
    targetId?: string;
}): Promise<Record<string, unknown>> => {
    if (!targetId) {
        throw new ManualApiError(400, "TARGET_ID_REQUIRED", "targetId is required.");
    }

    const project = await getProjectById(targetId);
    if (!project) {
        throw new ManualApiError(404, "PROJECT_NOT_FOUND", "Project not found.");
    }

    const input = requirePayload(payload);
    const payloadUid = readString(input.uid);
    if (!payloadUid) {
        throw new ManualApiError(
            400,
            "PROJECT_ALLOCATION_UID_REQUIRED",
            "Project allocation updates must include the current user uid.",
        );
    }

    const nextAllocations = normalizeAllocations(input.employeeAllocations);
    const touchedAllocation = nextAllocations.find(allocation => allocation.uid === payloadUid);

    if (!touchedAllocation) {
        throw new ManualApiError(
            400,
            "PROJECT_ALLOCATION_REQUIRED",
            "Updated project allocations must include the current user.",
        );
    }

    const existingAllocations = Array.isArray(project.employeeAllocations)
        ? project.employeeAllocations.filter(allocation => allocation.uid !== payloadUid)
        : [];

    const updatedProject = {
        ...project,
        employeeAllocations: [...existingAllocations, touchedAllocation],
    };

    inMemoryStore.updateDocument(`projects/${targetId}`, {
        employeeAllocations: updatedProject.employeeAllocations,
    });

    getManualRealtimeBroker().publish({
        operation: "modified",
        instanceKey,
        resource: "projects",
        resourceId: targetId,
        payload: updatedProject,
        resourceOwnerUid: payloadUid,
        actorUid: payloadUid,
    });

    return {
        project: await getProjectById(targetId),
        projects: await listProjects(),
    };
};

export const resolveProjectOwnerUid = (payload?: Record<string, unknown>): string | undefined =>
    readString(payload?.uid);
