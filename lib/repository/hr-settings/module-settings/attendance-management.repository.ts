import { ATTENDANCE_LOGIC_LOG_MESSAGES } from "@/lib/log-descriptions/attendance-management";
import { LogRepository } from "@/lib/repository/logs/log.repository";
import { AttendanceLogicModel } from "@/lib/models/attendance-logic";
import { FlexibilityParameterModel } from "@/lib/models/flexibilityParameter";
import { ModuleSettingsRepository } from "./module-settings.repository";

export async function createAttendanceLogic(
    data: Omit<AttendanceLogicModel, "id">,
    actionBy?: string,
): Promise<boolean> {
    const created = await ModuleSettingsRepository.create("attendanceLogic", data);
    if (created && actionBy) {
        await LogRepository.create(
            ATTENDANCE_LOGIC_LOG_MESSAGES.CREATED({
                chosenLogic: data.chosenLogic,
                halfPresentThreshold: data.halfPresentThreshold,
                presentThreshold: data.presentThreshold,
            }),
            actionBy,
            "Success",
        );
    }
    return Boolean(created);
}

export async function updateAttendanceLogic(
    data: Partial<AttendanceLogicModel> & { id: string },
    actionBy?: string,
): Promise<boolean> {
    const updated = await ModuleSettingsRepository.update("attendanceLogic", data.id, data);
    if (updated && actionBy) {
        await LogRepository.create(
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
    return updated;
}

export async function deleteAttendanceLogic(id: string): Promise<boolean> {
    return ModuleSettingsRepository.remove("attendanceLogic", id);
}

export async function createParameter(
    data: Omit<FlexibilityParameterModel, "id">,
): Promise<boolean> {
    return Boolean(await ModuleSettingsRepository.create("flexibilityParameter", data));
}

export async function updateParameter(
    data: Partial<FlexibilityParameterModel> & { id: string },
): Promise<boolean> {
    return ModuleSettingsRepository.update("flexibilityParameter", data.id, data);
}

export async function deleteDocument(id: string): Promise<boolean> {
    return ModuleSettingsRepository.remove("flexibilityParameter", id);
}
