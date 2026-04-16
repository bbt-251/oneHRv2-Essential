// Unified models for disciplinary actions across HR, Manager, and Employee contexts

export interface ViolationModel {
    id: string;
    violationTypeId: string;
    details: string;
}

export interface DActionsModel {
    id: string;
    disciplinaryActionId: string;
    details: string;
}

export interface CommentModel {
    id: string;
    author: string;
    content: string;
    timestamp: string;
}

export interface DisciplinaryActionModel {
    id?: string;
    createdBy?: string;
    actionID?: string;
    timestamp: string;
    employeeUid: string;
    reportedDateAndTime: string;
    violationDateAndTime: string;
    violationLocationId: string;
    occurrenceLevel: "First Occurrence" | "Second Occurrence" | "Third Occurrence";
    violations: ViolationModel[];
    disciplinaryActions?: DActionsModel[];
    employeeComments: CommentModel[];
    stage: "Open" | "Closed";
    status:
        | "Waiting HR Approval"
        | "Raised"
        | "Accepted By Employee"
        | "Appealed"
        | "Appeal Approved"
        | "Appeal Refused"
        | "Under Review"
        | "Approved"
        | "Rejected";
    approved: boolean;
}
