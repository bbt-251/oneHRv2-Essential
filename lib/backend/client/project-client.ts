import { mutateCompactData } from "@/lib/backend/client/data-client";

export interface ProjectAllocationUpdate {
    id: string;
    uid: string;
    employeeAllocations: Array<{
        uid: string;
        allocation: number;
    }>;
}

export const updateProjectAllocationsWithBackend = async (
    updates: ProjectAllocationUpdate[],
): Promise<void> => {
    await Promise.all(
        updates.map(update =>
            mutateCompactData({
                resource: "projects",
                action: "update",
                targetId: update.id,
                payload: {
                    uid: update.uid,
                    employeeAllocations: update.employeeAllocations,
                },
            }),
        ),
    );
};
