/**
 * Transfer Status Type
 * Represents the various stages of a transfer request in the workflow
 */
export type TransferStatus =
    | "Requested" // Initial status when employee creates request
    | "Current Manager Validated" // Manager has validated the request
    | "Current Manager Refused" // Manager has refused the request
    | "HR Assessment" // Under HR review
    | "HR Approved" // HR has approved the transfer
    | "HR Refused"; // HR has refused the transfer

// Re-export InterviewModel from interview.ts
export type { InterviewModel, InterviewType } from "./interview";

/**
 * Transfer Stage Type
 * Represents whether the transfer is still open or closed
 */
export type TransferStage = "Open" | "Closed";

/**
 * Transfer Model
 * Represents an employee transfer request in the system
 */
/**
 * Remark Model
 * Represents a remark with author information
 */
export interface RemarkModel {
    content: string; // The remark content
    authorUID: string; // UID of the person who wrote the remark
    authorName: string; // Name of the person who wrote the remark
    timestamp: string; // When the remark was written
    role: "Manager" | "HR"; // Role of the person who wrote the remark
}

export interface TransferModel {
    id: string | null; // Auto-generated document ID
    timestamp: string; // Creation timestamp (format: "MMMM DD, YYYY hh:mm A")
    transferID: string; // Unique transfer identifier (auto-generated)
    employeeUID: string; // Firebase Auth UID of employee requesting transfer
    employeeFullName: string; // Full name of employee
    transferType: string | null; // ID of transfer type (from HR Settings)
    transferTypeName: string | null; // Name of transfer type (stored for display)
    transferReason: string | null; // ID of transfer reason (from HR Settings)
    transferReasonName: string | null; // Name of transfer reason (stored for display)
    transferDescription: string; // Detailed description
    transferDesiredDate: string; // Desired transfer date (format: "MMMM DD, YYYY")
    transferStage: TransferStage; // Current stage of transfer
    transferStatus: TransferStatus; // Current status of transfer
    orderGuide: string | null; // Associated order guide ID (optional)
    managerRemark: RemarkModel | null; // Remark from manager when refusing (with author info)
    hrRemark: RemarkModel | null; // Remark from HR when refusing (with author info)
    mitigationForTransferRisk: string | null; // Risk mitigation plan filled by manager when approving (optional)
    associatedInterview: string[] | null; // Array of associated interview IDs (optional)
}

/**
 * Transfer Type Model (HR Settings)
 * Represents a type of transfer configurable in HR Settings
 */
export interface TransferTypeModel {
    id: string | null;
    timestamp: string;
    type: "Transfer Type"; // Discriminator for HR Settings
    name: string; // Display name of transfer type
    active: boolean; // Whether this type is active
}

/**
 * Transfer Reason Model (HR Settings)
 * Represents a reason for transfer configurable in HR Settings
 */
export interface TransferReasonModel {
    id: string | null;
    timestamp: string;
    type: "Transfer Reason"; // Discriminator for HR Settings
    name: string; // Display name of transfer reason
    active: boolean; // Whether this reason is active
}

/**
 * Order Guide Employees Model
 * Represents an employee associated with an order guide
 */
export interface OrderGuideEmployees {
    id: string;
    timestamp: string;
    employeeID: string;
    status: "To Do" | "In Progress" | "Done";
    rating: 1 | 2 | 3 | 4 | 5 | null;
    remark: string | null;
}

/**
 * Order Guide Model
 * Represents an onboarding/order guide that can be associated with transfers
 */
export interface OrderGuideModel {
    id: string | null;
    timestamp: string;
    orderGuideID: string;
    orderGuideName: string;
    associatedEmployees: OrderGuideEmployees[];
    associatedItems: string[];
    associatedTrainingMaterials: string[];
}

/**
 * Activity Log Model
 * Represents an activity log entry for audit trail
 */
export interface ActivityLogModel {
    timestamp: string;
    logID: string;
    actor: string; // Employee ID of the person performing the action
    moduleName: string; // e.g., "Career Development"
    action: string; // Description of the action
    changes: ChangeModel[]; // Array of field changes
}

/**
 * Change Model
 * Represents a single field change in an activity log
 */
export interface ChangeModel {
    id: string;
    fieldName: string;
    oldValue: unknown;
    newValue: unknown;
}
