import { DependentModel } from "@/lib/models/dependent";
import { EmployeeModel } from "@/lib/models/employee";

export type EmployeeListFilters = {
    id?: string;
    department?: string;
    uid?: string;
    companyEmail?: string;
    personalEmail?: string;
    uids?: string[];
};

export type CreateEmployeeInput = Omit<EmployeeModel, "id">;

export type UpdateEmployeeInput = Partial<EmployeeModel> & {
    id: string;
};

export type EmployeeRecordPayload = {
    employee: EmployeeModel;
};

export type EmployeeListPayload = {
    employees: EmployeeModel[];
};

export type CreateDependentInput = Omit<DependentModel, "id">;

export type UpdateDependentInput = Partial<DependentModel> & {
    id: string;
};

export type DependentRecordPayload = {
    dependent: DependentModel;
};

export type DependentListPayload = {
    dependents: DependentModel[];
};
