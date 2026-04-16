import { ApprovalState } from "./signature-workflow";

export interface DocumentDefinitionModel {
    id: string;
    timestamp: string;
    name: string;
    subject: string;
    header: string;
    footer: string;
    signature: string | null; // signature workflow
    initial: string | null;
    stamp: string | null; // stamp document
    startDate: string;
    endDate: string;
    active: "Yes" | "No";
    content: string[]; // Each is in HTML format
    initialNeeded: "Yes" | "No";
    employeeSignatureNeeded: "Yes" | "No";
    status: "Published" | "Unpublished";
    visibility: "Open" | "Restricted";
    // Approval workflow - can be a specific workflow ID, "manager", or empty
    approvalWorkflowID: string | null;
    // Approval state tracking
    approvalState: ApprovalState;
}
