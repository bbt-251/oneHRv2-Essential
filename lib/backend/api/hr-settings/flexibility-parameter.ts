import { FlexibilityParameterModel } from "@/lib/models/flexibilityParameter";
import { mutateCompactData } from "@/lib/backend/client/data-client";

export async function createParameter(
    data: Omit<FlexibilityParameterModel, "id">,
): Promise<boolean> {
    try {
        await mutateCompactData({
            resource: "flexibilityParameter",
            action: "create",
            payload: data as Record<string, unknown>,
        });

        return true;
    } catch (error) {
        console.log("Error", error);
        return false;
    }
}

export async function updateParameter(
    data: Partial<FlexibilityParameterModel> & { id: string },
): Promise<boolean> {
    try {
        await mutateCompactData({
            resource: "flexibilityParameter",
            action: "update",
            targetId: data.id,
            payload: data as Record<string, unknown>,
        });
        return true;
    } catch (err) {
        console.error(err);
        return false;
    }
}

export async function deleteDocument(id: string): Promise<boolean> {
    try {
        await mutateCompactData({
            resource: "flexibilityParameter",
            action: "delete",
            targetId: id,
        });
        return true;
    } catch (err) {
        console.error(err);
        return false;
    }
}
