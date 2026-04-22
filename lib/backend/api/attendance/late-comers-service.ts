import { LateComersModel } from "@/lib/models/late-comers";
import { mutateCompactData, queryCompactData } from "@/lib/backend/client/data-client";
import dayjs from "dayjs";

export async function addLateComers(data: Omit<LateComersModel, "id">): Promise<boolean> {
    try {
        await mutateCompactData({
            resource: "lateComers",
            action: "create",
            payload: data as Record<string, unknown>,
        });
        return true;
    } catch (error) {
        console.error("Error adding late comer:", error);
        return false;
    }
}

export async function getLateComersByMonth(
    month: string,
    year: number,
): Promise<LateComersModel[]> {
    try {
        const payload = await queryCompactData<{ lateComers: LateComersModel[] }>({
            resource: "lateComers",
            filters: { month: dayjs(`${year}-${month}-01`).format("MMMM"), year },
        });
        return payload.lateComers;
    } catch (error) {
        console.error("Error getting late comers:", error);
        return [];
    }
}
