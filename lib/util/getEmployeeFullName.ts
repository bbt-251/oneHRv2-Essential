import { EmployeeModel } from "../models/employee";

const getFullName = (employee: EmployeeModel) => {
    return employee?.middleName
        ? `${employee?.firstName ?? ""} ${employee?.middleName ?? ""} ${employee?.surname ?? ""}`
        : `${employee?.firstName ?? ""} ${employee?.surname ?? ""}`;
};

export default getFullName;

export const getEmployeeInitials = (employee: EmployeeModel) => {
    return `${employee.firstName?.trim()?.at(0)?.toUpperCase() ?? ""}${employee.surname?.trim()?.at(0)?.toUpperCase() ?? ""}`;
};
