export interface DelegationModel {
    id: string;
    timestamp: string;
    delegationID: string;
    delegator: string;
    delegatorPosition: string | null;
    delegatee: string;
    delegateePosition: string | null;
    delegationStatus: "Created" | "Acknowledged" | "Approved" | "Refused";
    periodStart: string;
    periodEnd: string;

    // Acknowledgment fields (filled by delegatee)
    acknowledgedBy: string | null;
    acknowledgedAt: string | null;

    // Approval fields (filled by HR Manager)
    approvedBy: string | null;
    approvedAt: string | null;
}

// Extended interface for UI display with resolved names
export interface ExtendedDelegationModel extends DelegationModel {
    delegatorName: string;
    delegateeName: string;
    acknowledgedByName: string | null;
    approvedByName: string | null;
}
