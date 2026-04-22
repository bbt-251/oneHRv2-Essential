import { DependentModel } from "@/lib/models/dependent";
import {
    createDependentWithBackend,
    deleteDependentWithBackend,
    listDependentsForEmployeeWithBackend,
    updateDependentWithBackend,
} from "@/lib/backend/client/employee-client";
import { createLog } from "../logCollection";
import { LogInfo } from "@/lib/log-descriptions/employee-management";

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

export async function addDependent(
    data: Omit<DependentModel, "id">,
    actionBy?: string,
    logInfo?: LogInfo,
): Promise<boolean> {
    try {
        await createDependentWithBackend(data);

        if (logInfo) {
            await createLog(logInfo, actionBy ?? "", "Success");
        }

        return true;
    } catch (error) {
        console.error("Error adding dependent:", error);
        await logFailure(logInfo, actionBy);
        return false;
    }
}

export async function getDependentsByEmployee(employeeId: string): Promise<DependentModel[]> {
    try {
        const { dependents } = await listDependentsForEmployeeWithBackend(employeeId);
        return dependents;
    } catch (error) {
        console.error("Error getting dependents:", error);
        return [];
    }
}

export async function getDependentById(_id: string): Promise<DependentModel | null> {
    try {
        return null;
    } catch (error) {
        console.error("Error getting dependent:", error);
        return null;
    }
}

export async function updateDependent(
    data: DependentModel,
    actionBy?: string,
    logInfo?: LogInfo,
): Promise<boolean> {
    if (!data.id) {
        console.error("Dependent ID is required for update");
        return false;
    }

    try {
        await updateDependentWithBackend({
            firstName: data.firstName,
            middleName: data.middleName,
            lastName: data.lastName,
            gender: data.gender,
            dateOfBirth: data.dateOfBirth,
            phoneNumber: data.phoneNumber,
            relationship: data.relationship,
            relatedTo: data.relatedTo,
            id: data.id,
        });

        if (logInfo) {
            await createLog(logInfo, actionBy ?? "", "Success");
        }

        return true;
    } catch (error) {
        console.error("Error updating dependent:", error);
        await logFailure(logInfo, actionBy);
        return false;
    }
}

export async function deleteDependent(
    id: string,
    actionBy?: string,
    logInfo?: LogInfo,
): Promise<boolean> {
    try {
        await deleteDependentWithBackend(id);

        if (logInfo) {
            await createLog(logInfo, actionBy ?? "", "Success");
        }

        return true;
    } catch (error) {
        console.error("Error deleting dependent:", error);
        await logFailure(logInfo, actionBy);
        return false;
    }
}

export function listenToDependents(
    _employeeId: string,
    _callback: (dependents: DependentModel[]) => void,
) {
    console.warn("listenToDependents is deprecated in the migrated manual store path.");
    return () => {};
}
