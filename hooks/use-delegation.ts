import { useEffect, useMemo, useState } from "react";
import { useFirestore } from "@/context/firestore-context";
import { useAuth } from "@/context/authContext";
import { DelegationModel } from "@/lib/models/delegation";
import { EmployeeModel } from "@/lib/models/employee";
import dayjs from "dayjs";

interface UseDelegationReturn {
    // Delegations where current user is the delegatee
    pendingDelegations: DelegationModel[];
    acknowledgedDelegations: DelegationModel[];

    // Delegations where current user is the delegator
    myDelegations: DelegationModel[];

    // All active delegations (approved and within date range)
    activeDelegations: DelegationModel[];

    // Reportees that have been delegated to current user
    delegatedReportees: string[];

    // Merged reportees (own + delegated)
    allReportees: string[];

    // Loading state
    loading: boolean;

    // Helper functions
    isDelegatedReportee: (employeeUid: string) => boolean;
    getDelegatorForReportee: (employeeUid: string) => string | null;
}

export function useDelegation(): UseDelegationReturn {
    const { delegations, employees } = useFirestore();
    const { userData } = useAuth();

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Loading is complete when delegations data is available
        if (delegations !== undefined) {
            setLoading(false);
        }
    }, [delegations]);

    const currentUserUid = userData?.uid || "";

    // Delegations where current user is the delegatee
    const myReceivedDelegations = useMemo(() => {
        return delegations.filter(d => d.delegatee === currentUserUid);
    }, [delegations, currentUserUid]);

    // Pending delegations (need acknowledgment)
    const pendingDelegations = useMemo(() => {
        return myReceivedDelegations.filter(d => d.delegationStatus === "Created");
    }, [myReceivedDelegations]);

    // Acknowledged delegations (waiting for HR approval)
    const acknowledgedDelegations = useMemo(() => {
        return myReceivedDelegations.filter(d => d.delegationStatus === "Acknowledged");
    }, [myReceivedDelegations]);

    // Delegations where current user is the delegator
    const myDelegations = useMemo(() => {
        return delegations.filter(d => d.delegator === currentUserUid);
    }, [delegations, currentUserUid]);

    // Active delegations: Approved and within date range
    const activeDelegations = useMemo(() => {
        const today = dayjs().startOf("day");

        return delegations.filter(d => {
            if (d.delegationStatus !== "Approved") return false;

            const startDate = dayjs(d.periodStart);
            const endDate = dayjs(d.periodEnd);

            return (
                today.isAfter(startDate.subtract(1, "day")) && today.isBefore(endDate.add(1, "day"))
            );
        });
    }, [delegations]);

    // Get reportees delegated to current user
    const delegatedReportees = useMemo(() => {
        const reporteeSet = new Set<string>();

        // Find active delegations where current user is the delegatee
        activeDelegations
            .filter(d => d.delegatee === currentUserUid)
            .forEach(delegation => {
                // Find the delegator and get their reportees
                const delegator = employees.find(e => e.uid === delegation.delegator);
                if (delegator?.reportees) {
                    delegator.reportees.forEach(reporteeUid => {
                        reporteeSet.add(reporteeUid);
                    });
                }
            });

        return Array.from(reporteeSet);
    }, [activeDelegations, currentUserUid, employees]);

    // Get current user's own reportees
    const ownReportees = useMemo(() => {
        return userData?.reportees || [];
    }, [userData]);

    // Merged reportees (own + delegated)
    const allReportees = useMemo(() => {
        const mergedSet = new Set([...ownReportees, ...delegatedReportees]);
        return Array.from(mergedSet);
    }, [ownReportees, delegatedReportees]);

    // Check if an employee is a delegated reportee
    const isDelegatedReportee = (employeeUid: string): boolean => {
        return delegatedReportees.includes(employeeUid);
    };

    // Get the delegator UID for a delegated reportee
    const getDelegatorForReportee = (employeeUid: string): string | null => {
        for (const delegation of activeDelegations) {
            if (delegation.delegatee === currentUserUid) {
                const delegator = employees.find(e => e.uid === delegation.delegator);
                if (delegator?.reportees?.includes(employeeUid)) {
                    return delegation.delegator;
                }
            }
        }
        return null;
    };

    return {
        pendingDelegations,
        acknowledgedDelegations,
        myDelegations,
        activeDelegations,
        delegatedReportees,
        allReportees,
        loading,
        isDelegatedReportee,
        getDelegatorForReportee,
    };
}

export default useDelegation;
