import { EmployeeModel } from "@/lib/models/employee";
import {
    appendClaimedOvertimeToEmployeesWithBackend,
    batchUpdateEmployeesWithBackend,
    createEmployeeWithBackend,
    deleteEmployeeWithBackend,
    listEmployeesWithBackend,
    updateEmployeeWithBackend,
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

export async function createEmployee(
    data: Omit<EmployeeModel, "id">,
    actionBy?: string,
    logInfo?: LogInfo,
): Promise<EmployeeModel | null> {
    try {
        const result = await createEmployeeWithBackend(data);

        if (logInfo) {
            await createLog(logInfo, actionBy ?? "", "Success");
        }

        return result.employee;
    } catch (error) {
        console.log("Error", error);
        await logFailure(logInfo, actionBy);
        return null;
    }
}

export async function getEmployeesByDepartment(department: string): Promise<EmployeeModel[]> {
    const { employees } = await listEmployeesWithBackend({ department });
    return employees;
}

export async function getEmployeeById(id: string): Promise<EmployeeModel | null> {
    const { employees } = await listEmployeesWithBackend({ id });
    return employees[0] ?? null;
}

export async function getEmployeeByUid(
    uid: string,
    _dbOverride?: unknown,
): Promise<EmployeeModel | null> {
    const { employees } = await listEmployeesWithBackend({ uid });
    return employees[0] ?? null;
}

export async function getEmployeesByUid(uids: string[]): Promise<EmployeeModel[]> {
    if (!uids.length) {
        return [];
    }

    const { employees } = await listEmployeesWithBackend({ uids });
    return employees;
}

export async function updateEmployee(
    data: Partial<EmployeeModel> & { id: string },
    actionBy?: string,
    logInfo?: LogInfo,
): Promise<boolean> {
    try {
        await updateEmployeeWithBackend(data);

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

export async function deleteEmployee(
    id: string,
    actionBy?: string,
    logInfo?: LogInfo,
): Promise<boolean> {
    try {
        await deleteEmployeeWithBackend(id);

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

export async function getEmployeeByEmail(email: string): Promise<EmployeeModel | null> {
    const { employees } = await listEmployeesWithBackend({ personalEmail: email });
    return employees[0] ?? null;
}

export async function getEmployeeByCompanyEmail(email: string): Promise<EmployeeModel | null> {
    const { employees } = await listEmployeesWithBackend({ companyEmail: email });
    return employees[0] ?? null;
}

export async function getAllEmployees(): Promise<EmployeeModel[]> {
    const { employees } = await listEmployeesWithBackend();
    return employees;
}

export async function getEmployeeDocumentId(uid: string): Promise<string | null> {
    try {
        const employee = await getEmployeeByUid(uid);
        return employee?.id ?? null;
    } catch (err) {
        console.error("Error finding employee document by UID:", err);
        return null;
    }
}

export async function batchUpdateEmployee(
    employees: (Partial<EmployeeModel> & { id: string })[],
): Promise<boolean> {
    try {
        const result = await batchUpdateEmployeesWithBackend(employees);
        return result.success;
    } catch (error) {
        console.error("Batch update error:", error);
        return false;
    }
}

export async function addClaimedOvertimeToEmployees(
    employeeDocIds: string[],
    overtimeRequestId: string,
): Promise<boolean> {
    try {
        const result = await appendClaimedOvertimeToEmployeesWithBackend(
            employeeDocIds,
            overtimeRequestId,
        );
        return result.success;
    } catch (error) {
        console.error("addClaimedOvertimeToEmployees error:", error);
        return false;
    }
}
