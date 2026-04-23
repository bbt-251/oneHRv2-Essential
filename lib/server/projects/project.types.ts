import { ProjectAllocationModel, ProjectModel } from "@/lib/models/project";

export type ProjectListPayload = {
    projects: ProjectModel[];
};

export type ProjectRecordPayload = {
    project: ProjectModel | null;
    projects?: ProjectModel[];
};

export type UpdateProjectAllocationInput = {
    id: string;
    uid: string;
    employeeAllocations: ProjectAllocationModel[];
};
