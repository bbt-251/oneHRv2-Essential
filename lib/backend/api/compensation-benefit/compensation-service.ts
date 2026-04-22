import { EmployeeCompensationModel } from "@/lib/models/employeeCompensation";
import {
    createCompensationWithBackend,
    deleteCompensationWithBackend,
    updateCompensationWithBackend,
} from "@/lib/backend/client/payroll-client";
import { createLog } from "../logCollection";
import { LogInfo } from "@/lib/log-descriptions/compensation";

const logFailure = async (logInfo: LogInfo | undefined, actionBy: string | undefined) => {
    if (!logInfo) {
        return;
    }

    await createLog(
        {
            ...logInfo,
            title: `${logInfo.title} Failed`,
            description: `Failed to ${logInfo.description.toLowerCase()}`,
        },
        actionBy ?? "",
        "Failure",
    );
};

export async function createCompensation(
    data: Omit<EmployeeCompensationModel, "id">,
    actionBy?: string,
    logInfo?: LogInfo,
): Promise<boolean> {
    try {
        await createCompensationWithBackend(data);

        if (logInfo) {
            await createLog(logInfo, actionBy ?? "", "Success");
        }

        return true;
    } catch (error) {
        console.log("Error", error);
        await logFailure(logInfo, actionBy);
        return false;
    }
}

export async function updateCompensation(
    data: Partial<EmployeeCompensationModel> & { id: string },
    actionBy?: string,
    logInfo?: LogInfo,
): Promise<boolean> {
    try {
        await updateCompensationWithBackend(data);

        if (logInfo) {
            await createLog(logInfo, actionBy ?? "", "Success");
        }

        return true;
    } catch (err) {
        console.error(err);
        await logFailure(logInfo, actionBy);
        return false;
    }
}

export async function deleteCompensation(
    id: string,
    actionBy?: string,
    logInfo?: LogInfo,
): Promise<boolean> {
    try {
        await deleteCompensationWithBackend(id);

        if (logInfo) {
            await createLog(logInfo, actionBy ?? "", "Success");
        }

        return true;
    } catch (err) {
        console.error(err);
        await logFailure(logInfo, actionBy);
        return false;
    }
}
