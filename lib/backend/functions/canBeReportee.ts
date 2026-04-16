import { EmployeeModel } from "@/lib/models/employee";
// A cycle will occur if the manager exists in the reportee's hierarchy of the newly added reportee
// or if the manager's section head exists in the reportee's hierarchy of the newly added reportee
const hasCycle = (emps: EmployeeModel[], managerID: string, newReporteeID: string): boolean => {
    const employeeMap = new Map(emps.map(emp => [emp.uid, emp]));
    const visited = new Set<string>();

    const dfs = (uid: string): boolean => {
        if (uid === managerID) return true;
        if (visited.has(uid)) return false;

        visited.add(uid);
        const emp = employeeMap.get(uid);
        if (!emp) return false;

        for (const repID of emp.reportees ?? []) {
            if (dfs(repID)) return true;
        }

        return false;
    };

    return dfs(newReporteeID);
};

export const canBeReportee = (
    managerID: string,
    newReporteeID: string,
    employees: EmployeeModel[],
): boolean => {
    return !hasCycle(employees, managerID, newReporteeID);
};
