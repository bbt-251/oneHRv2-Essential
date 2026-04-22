import { AttendanceLogicModel } from "@/lib/models/attendance-logic";
import { mutateCompactData } from "@/lib/backend/client/data-client";
import { createLog } from "../logCollection";
import { ATTENDANCE_LOGIC_LOG_MESSAGES } from "@/lib/log-descriptions/attendance-management";

export async function createAttendanceLogic(
    data: Omit<AttendanceLogicModel, "id">,
    actionBy?: string,
): Promise<boolean> {
    try {
        await mutateCompactData({
            resource: "attendanceLogic",
            action: "create",
            payload: data as Record<string, unknown>,
        });

        // Log the creation if actionBy is provided
        if (actionBy) {
            await createLog(
                ATTENDANCE_LOGIC_LOG_MESSAGES.CREATED({
                    chosenLogic: data.chosenLogic,
                    halfPresentThreshold: data.halfPresentThreshold,
                    presentThreshold: data.presentThreshold,
                }),
                actionBy,
                "Success",
            );
        }

        return true;
    } catch (error) {
        console.log("Error", error);

        // Log the failure if actionBy is provided
        if (actionBy) {
            const createdLog = ATTENDANCE_LOGIC_LOG_MESSAGES.CREATED({
                chosenLogic: data.chosenLogic,
                halfPresentThreshold: data.halfPresentThreshold,
                presentThreshold: data.presentThreshold,
            });
            await createLog(
                {
                    ...createdLog,
                    title: `${createdLog.title} Failed`,
                    description: `Failed to ${createdLog.description.toLowerCase()}`,
                },
                actionBy,
                "Failure",
            );
        }

        return false;
    }
}

export async function updateAttendanceLogic(
    data: Partial<AttendanceLogicModel> & { id: string },
    actionBy?: string,
): Promise<boolean> {
    try {
        await mutateCompactData({
            resource: "attendanceLogic",
            action: "update",
            targetId: data.id,
            payload: data as Record<string, unknown>,
        });

        // Log the update if actionBy is provided
        if (actionBy) {
            await createLog(
                ATTENDANCE_LOGIC_LOG_MESSAGES.UPDATED({
                    id: data.id,
                    chosenLogic: data.chosenLogic,
                    halfPresentThreshold: data.halfPresentThreshold,
                    presentThreshold: data.presentThreshold,
                }),
                actionBy,
                "Success",
            );
        }

        return true;
    } catch (err) {
        console.error(err);

        // Log the failure if actionBy is provided
        if (actionBy) {
            const updatedLog = ATTENDANCE_LOGIC_LOG_MESSAGES.UPDATED({
                id: data.id,
                chosenLogic: data.chosenLogic,
                halfPresentThreshold: data.halfPresentThreshold,
                presentThreshold: data.presentThreshold,
            });
            await createLog(
                {
                    ...updatedLog,
                    title: `${updatedLog.title} Failed`,
                    description: `Failed to ${updatedLog.description.toLowerCase()}`,
                },
                actionBy,
                "Failure",
            );
        }

        return false;
    }
}

export async function deleteAttendanceLogic(id: string): Promise<boolean> {
    try {
        await mutateCompactData({
            resource: "attendanceLogic",
            action: "delete",
            targetId: id,
        });
        return true;
    } catch (err) {
        console.error(err);
        return false;
    }
}
