export interface ProjectAllocationModel {
    uid: string;
    allocation: number;
}

export interface ProjectModel {
    id: string;
    name: string;
    assignedMembers?: string[];
    employeeAllocations?: ProjectAllocationModel[];
}
