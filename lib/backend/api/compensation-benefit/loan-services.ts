import { EmployeeLoanModel } from "@/lib/models/employeeLoan";
import {
    createLoanWithBackend,
    deleteLoanWithBackend,
    updateLoanWithBackend,
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

export async function createLoan(
    data: Omit<EmployeeLoanModel, "id">,
    actionBy?: string,
    logInfo?: LogInfo,
): Promise<boolean> {
    try {
        await createLoanWithBackend(data);

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

export async function updateLoan(
    data: Partial<EmployeeLoanModel> & { id: string },
    actionBy?: string,
    logInfo?: LogInfo,
): Promise<boolean> {
    try {
        await updateLoanWithBackend(data);

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

export async function deleteLoan(
    id: string,
    actionBy?: string,
    logInfo?: LogInfo,
): Promise<boolean> {
    try {
        await deleteLoanWithBackend(id);

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
